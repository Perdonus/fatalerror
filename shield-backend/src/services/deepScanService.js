const fs = require('fs/promises');
const path = require('path');
const crypto = require('crypto');
const pool = require('../db/pool');
const { nowMs } = require('../utils/security');
const {
    normalizeDeepScanPayload,
    validateDeepScanPayload,
    analyzeHeuristics,
    classifyVerdict
} = require('../utils/deepScanHeuristics');
const { runAnalyzer } = require('./apkStaticAnalysis');

const VT_API_BASE = (process.env.VT_API_BASE || 'https://www.virustotal.com/api/v3').replace(/\/$/, '');
const VT_TIMEOUT_MS = parseInt(process.env.VT_TIMEOUT_MS || '8000', 10);
const UPLOAD_ROOT = process.env.DEEP_SCAN_UPLOAD_DIR || path.join(process.cwd(), 'storage', 'deep-scans');
const MAX_UPLOAD_BYTES = parseInt(process.env.DEEP_SCAN_MAX_UPLOAD_BYTES || String(256 * 1024 * 1024), 10);
const PROCESSING_QUEUE = [];
const ENQUEUED_IDS = new Set();
let queueActive = false;
let pendingResume = false;

function parseJson(value, fallback) {
    if (!value) return fallback;
    try {
        return JSON.parse(value);
    } catch (_) {
        return fallback;
    }
}

function isVirusTotalConfigured() {
    return Boolean(String(process.env.VT_API_KEY || '').trim());
}

function computeSha256(buffer) {
    return crypto.createHash('sha256').update(buffer).digest('hex');
}

function severityRank(severity) {
    switch (String(severity || '').toLowerCase()) {
        case 'critical': return 4;
        case 'high': return 3;
        case 'medium': return 2;
        default: return 1;
    }
}

function verdictRank(verdict) {
    switch (String(verdict || '').toLowerCase()) {
        case 'malicious': return 4;
        case 'suspicious': return 3;
        case 'low_risk': return 2;
        default: return 1;
    }
}

function chooseNextAction(normalized) {
    const mode = String(normalized.scanMode || 'FULL').toUpperCase();
    const wantsFullServerAnalysis = mode === 'FULL' || mode === 'SELECTIVE';
    const sensitivePermissions = normalized.permissions.filter((permission) => [
        'android.permission.BIND_ACCESSIBILITY_SERVICE',
        'android.permission.SYSTEM_ALERT_WINDOW',
        'android.permission.REQUEST_INSTALL_PACKAGES',
        'android.permission.QUERY_ALL_PACKAGES',
        'android.permission.READ_SMS',
        'android.permission.SEND_SMS'
    ].includes(permission));

    if (wantsFullServerAnalysis) {
        return {
            nextAction: 'upload_apk',
            reason: 'Полная серверная проверка требует APK для статического анализа.'
        };
    }
    if (!normalized.sha256) {
        return {
            nextAction: 'upload_apk',
            reason: 'Нет SHA-256. Для полной проверки нужен сам APK.'
        };
    }
    if ((normalized.isDebuggable || normalized.usesCleartextTraffic) && sensitivePermissions.length > 0) {
        return {
            nextAction: 'upload_apk',
            reason: 'Флаги сборки и разрешения требуют разбор APK на сервере.'
        };
    }
    return {
        nextAction: 'poll',
        reason: null
    };
}

function dedupeFindings(findings) {
    const seen = new Set();
    return findings.filter((finding) => {
        const key = [finding.source, finding.type, finding.title, finding.detail].join('::');
        if (seen.has(key)) return false;
        seen.add(key);
        return true;
    });
}

function buildSourceSummaries(findings, vt) {
    const sourceMap = new Map();
    findings.forEach((finding) => {
        const source = finding.source || 'Shield Rules';
        const bucket = sourceMap.get(source) || [];
        bucket.push(finding);
        sourceMap.set(source, bucket);
    });

    const summaries = Array.from(sourceMap.entries()).map(([source, items]) => ({
        source,
        severity: items.reduce((current, item) => {
            return severityRank(item.severity) > severityRank(current) ? item.severity : current;
        }, 'low'),
        finding_count: items.length,
        summary: items.slice(0, 3).map((item) => item.title).join('; ')
    }));

    if (vt?.status === 'found') {
        summaries.push({
            source: 'VirusTotal',
            severity: vt.malicious > 0 ? 'high' : vt.suspicious > 0 ? 'medium' : 'low',
            finding_count: (vt.malicious || 0) + (vt.suspicious || 0),
            summary: vt.malicious > 0
                ? `${vt.malicious} malicious, ${vt.suspicious || 0} suspicious verdicts`
                : vt.suspicious > 0
                    ? `${vt.suspicious} suspicious verdicts`
                    : 'Hash checked, no detections'
        });
    }

    return summaries;
}

function mergeVerdicts(baseVerdict, combinedScore, vt, findings) {
    const hasCritical = findings.some((finding) => severityRank(finding.severity) >= 4);
    const strongExternalSignals = findings.filter((finding) => ['VirusTotal', 'APKiD', 'YARA'].includes(finding.source)).length;

    let verdict = classifyVerdict(combinedScore, vt);
    if (verdictRank(baseVerdict) > verdictRank(verdict)) {
        verdict = baseVerdict;
    }
    if (hasCritical || strongExternalSignals >= 2 || (vt?.malicious || 0) >= 5) {
        return 'malicious';
    }
    if (strongExternalSignals >= 1 && combinedScore >= 45 && verdictRank(verdict) < verdictRank('suspicious')) {
        return 'suspicious';
    }
    return verdict;
}

async function lookupVirusTotalByHash(sha256) {
    if (!sha256) {
        return { status: 'skipped' };
    }
    if (!isVirusTotalConfigured()) {
        return { status: 'unconfigured' };
    }

    const response = await fetch(`${VT_API_BASE}/files/${encodeURIComponent(sha256)}`, {
        method: 'GET',
        headers: {
            'x-apikey': process.env.VT_API_KEY,
            'accept': 'application/json'
        },
        signal: AbortSignal.timeout(VT_TIMEOUT_MS)
    });

    if (response.status === 404) {
        return { status: 'not_found' };
    }

    if (!response.ok) {
        const body = await response.text().catch(() => '');
        throw new Error(`VirusTotal lookup failed: ${response.status} ${body.slice(0, 160)}`);
    }

    const payload = await response.json();
    const stats = payload?.data?.attributes?.last_analysis_stats || {};
    const names = Object.entries(payload?.data?.attributes?.last_analysis_results || {})
        .filter(([, engine]) => ['malicious', 'suspicious'].includes(engine?.category))
        .slice(0, 5)
        .map(([engineName, engine]) => ({
            engine: engineName,
            category: engine.category,
            result: engine.result || null
        }));

    return {
        status: 'found',
        malicious: Number(stats.malicious || 0),
        suspicious: Number(stats.suspicious || 0),
        harmless: Number(stats.harmless || 0),
        undetected: Number(stats.undetected || 0),
        timeout: Number(stats.timeout || 0),
        reputation: Number(payload?.data?.attributes?.reputation || 0),
        names
    };
}

async function createDeepScanJob(userId, payload) {
    const normalized = normalizeDeepScanPayload(payload);
    const validationError = validateDeepScanPayload(normalized);
    if (validationError) {
        return { error: validationError };
    }

    const id = crypto.randomUUID();
    const now = nowMs();
    const decision = chooseNextAction(normalized);
    const requestJson = JSON.stringify({
        ...normalized,
        next_action: decision.nextAction,
        upload_reason: decision.reason
    });
    const status = decision.nextAction === 'upload_apk' ? 'AWAITING_UPLOAD' : 'QUEUED';

    await pool.query(
        `INSERT INTO deep_scan_jobs
         (id, user_id, package_name, app_name, sha256, status, request_json, created_at, updated_at)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [
            id,
            userId,
            normalized.packageName,
            normalized.appName,
            normalized.sha256,
            status,
            requestJson,
            now,
            now
        ]
    );

    if (status === 'QUEUED') {
        enqueueDeepScan(id);
    }

    return {
        id,
        status,
        created_at: now,
        package_name: normalized.packageName,
        app_name: normalized.appName,
        sha256: normalized.sha256,
        next_action: decision.nextAction,
        upload_reason: decision.reason
    };
}

async function getDeepScanJob(id, userId) {
    const [rows] = await pool.query(
        `SELECT id, user_id, package_name, app_name, sha256, status, verdict, risk_score,
                vt_status, vt_malicious, vt_suspicious, vt_harmless,
                request_json, summary_json, findings_json, error_message,
                created_at, started_at, completed_at, updated_at
         FROM deep_scan_jobs
         WHERE id = ? AND user_id = ?`,
        [id, userId]
    );

    if (rows.length === 0) {
        return null;
    }

    const row = rows[0];
    const request = parseJson(row.request_json, {});
    return {
        id: row.id,
        status: row.status,
        package_name: row.package_name,
        app_name: row.app_name,
        sha256: row.sha256,
        verdict: row.verdict,
        risk_score: row.risk_score,
        next_action: request.next_action || (row.status === 'AWAITING_UPLOAD' ? 'upload_apk' : 'poll'),
        upload_reason: request.upload_reason || null,
        vt: {
            status: row.vt_status,
            malicious: row.vt_malicious,
            suspicious: row.vt_suspicious,
            harmless: row.vt_harmless
        },
        request,
        summary: parseJson(row.summary_json, null),
        findings: parseJson(row.findings_json, []),
        error: row.error_message,
        created_at: row.created_at,
        started_at: row.started_at,
        completed_at: row.completed_at,
        updated_at: row.updated_at
    };
}

async function attachDeepScanApk(id, userId, buffer, originalName = 'sample.apk') {
    if (!Buffer.isBuffer(buffer) || buffer.length === 0) {
        return { error: 'APK payload is empty' };
    }
    if (buffer.length > MAX_UPLOAD_BYTES) {
        return { error: 'APK payload is too large' };
    }

    const [rows] = await pool.query(
        `SELECT request_json FROM deep_scan_jobs WHERE id = ? AND user_id = ? LIMIT 1`,
        [id, userId]
    );
    if (rows.length === 0) {
        return null;
    }

    const request = parseJson(rows[0].request_json, {});
    const dir = path.join(UPLOAD_ROOT, id);
    await fs.mkdir(dir, { recursive: true });
    const filePath = path.join(dir, 'sample.apk');
    await fs.writeFile(filePath, buffer);

    const uploadedSha256 = computeSha256(buffer);
    const updatedRequest = {
        ...request,
        uploaded_apk_path: filePath,
        uploaded_apk_name: String(originalName || 'sample.apk').slice(0, 255),
        uploaded_apk_sha256: uploadedSha256,
        uploaded_apk_size_bytes: buffer.length,
        sha256: request.sha256 || uploadedSha256,
        next_action: 'poll'
    };
    const now = nowMs();

    await pool.query(
        `UPDATE deep_scan_jobs
         SET sha256 = ?, status = 'QUEUED', request_json = ?, updated_at = ?, error_message = NULL
         WHERE id = ? AND user_id = ?`,
        [updatedRequest.sha256, JSON.stringify(updatedRequest), now, id, userId]
    );

    enqueueDeepScan(id);
    return getDeepScanJob(id, userId);
}

function enqueueDeepScan(jobId) {
    if (ENQUEUED_IDS.has(jobId)) {
        return;
    }
    ENQUEUED_IDS.add(jobId);
    PROCESSING_QUEUE.push(jobId);
    void drainQueue();
}

async function resumePendingDeepScans() {
    if (pendingResume) {
        return;
    }
    pendingResume = true;
    try {
        const [rows] = await pool.query(
            `SELECT id FROM deep_scan_jobs
             WHERE status IN ('QUEUED', 'RUNNING')
             ORDER BY created_at ASC
             LIMIT 100`
        );
        for (const row of rows) {
            enqueueDeepScan(row.id);
        }
    } catch (error) {
        console.error('Deep scan resume error:', error);
    } finally {
        pendingResume = false;
    }
}

async function drainQueue() {
    if (queueActive) {
        return;
    }
    queueActive = true;

    while (PROCESSING_QUEUE.length > 0) {
        const jobId = PROCESSING_QUEUE.shift();
        ENQUEUED_IDS.delete(jobId);
        try {
            await runDeepScanJob(jobId);
        } catch (error) {
            console.error('Deep scan execution error:', error);
        }
    }

    queueActive = false;
}

async function runDeepScanJob(jobId) {
    const [rows] = await pool.query(
        `SELECT id, user_id, request_json, status
         FROM deep_scan_jobs
         WHERE id = ? LIMIT 1`,
        [jobId]
    );

    if (rows.length === 0) {
        return;
    }

    const row = rows[0];
    if (row.status === 'COMPLETED' || row.status === 'FAILED' || row.status === 'AWAITING_UPLOAD') {
        return;
    }

    const startedAt = nowMs();
    await pool.query(
        `UPDATE deep_scan_jobs
         SET status = 'RUNNING', started_at = COALESCE(started_at, ?), updated_at = ?, error_message = NULL
         WHERE id = ?`,
        [startedAt, startedAt, jobId]
    );

    const request = parseJson(row.request_json, {});
    const normalized = normalizeDeepScanPayload(request);

    try {
        let vt = { status: normalized.sha256 ? 'pending' : 'skipped' };
        try {
            vt = await lookupVirusTotalByHash(normalized.sha256 || normalized.uploadedApkSha256);
        } catch (error) {
            vt = { status: 'error', error: error.message };
        }

        const heuristics = analyzeHeuristics(normalized, vt);
        const apkAnalysis = normalized.uploadedApkPath
            ? await runAnalyzer(normalized.uploadedApkPath)
            : { ok: false, findings: [], metadata: {}, risk_bonus: 0, sources: [] };

        const mergedFindings = dedupeFindings([
            ...heuristics.findings,
            ...(Array.isArray(apkAnalysis.findings) ? apkAnalysis.findings : [])
        ]);
        const combinedScore = Math.max(
            heuristics.riskScore,
            Math.min(100, heuristics.riskScore + Number(apkAnalysis.risk_bonus || 0))
        );
        const verdict = mergeVerdicts(heuristics.verdict, combinedScore, vt, mergedFindings);
        const sourceSummaries = buildSourceSummaries(mergedFindings, vt);
        const recommendations = Array.from(new Set([
            ...heuristics.recommendations,
            ...(apkAnalysis.ok ? ['Сверьте совпадения по источникам и удалите APK, если приложение установлено в обход магазина.'] : [])
        ])).slice(0, 6);
        const completedAt = nowMs();
        const summary = {
            scanned_at: completedAt,
            verdict,
            risk_score: combinedScore,
            recommendations,
            metadata: {
                ...heuristics.metadata,
                static_analysis: apkAnalysis.metadata || {},
                next_action: 'poll'
            },
            sources: sourceSummaries,
            virus_total: vt,
            analyzer: {
                ok: Boolean(apkAnalysis.ok),
                error: apkAnalysis.error || null
            }
        };

        await pool.query(
            `UPDATE deep_scan_jobs
             SET status = 'COMPLETED',
                 verdict = ?,
                 risk_score = ?,
                 vt_status = ?,
                 vt_malicious = ?,
                 vt_suspicious = ?,
                 vt_harmless = ?,
                 summary_json = ?,
                 findings_json = ?,
                 completed_at = ?,
                 updated_at = ?
             WHERE id = ?`,
            [
                verdict,
                combinedScore,
                vt.status || null,
                vt.malicious ?? null,
                vt.suspicious ?? null,
                vt.harmless ?? null,
                JSON.stringify(summary),
                JSON.stringify(mergedFindings),
                completedAt,
                completedAt,
                jobId
            ]
        );
    } catch (error) {
        const failedAt = nowMs();
        await pool.query(
            `UPDATE deep_scan_jobs
             SET status = 'FAILED', error_message = ?, completed_at = ?, updated_at = ?
             WHERE id = ?`,
            [String(error.message || 'Deep scan failed').slice(0, 255), failedAt, failedAt, jobId]
        );
    }
}

module.exports = {
    createDeepScanJob,
    getDeepScanJob,
    attachDeepScanApk,
    resumePendingDeepScans
};
