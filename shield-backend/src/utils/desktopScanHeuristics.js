const SUPPORTED_PLATFORMS = new Set(['WINDOWS', 'LINUX']);
const SUPPORTED_MODES = new Set(['ON_DEMAND', 'SELECTIVE', 'ARTIFACT', 'RESIDENT_EVENT', 'QUICK', 'FULL']);
const HARD_SIGNAL_TYPES = new Set([
    'virustotal',
    'publisher_untrusted',
    'suspicious_imports',
    'high_entropy',
    'script_exec_chain',
    'autorun_persistence',
    'privilege_escalation',
    'dropped_binary',
    'unsigned_binary',
    'tampered_binary'
]);

function normalizeString(value, maxLength = 255) {
    const normalized = String(value || '').trim();
    return normalized ? normalized.slice(0, maxLength) : null;
}

function normalizeStringList(value, limit = 32, maxLength = 120) {
    if (!Array.isArray(value)) {
        return [];
    }
    return Array.from(new Set(
        value
            .map((item) => normalizeString(item, maxLength))
            .filter(Boolean)
    )).slice(0, limit);
}

function normalizeObject(value) {
    return value && typeof value === 'object' && !Array.isArray(value) ? value : {};
}

function normalizeBoolean(value) {
    return value === true || value === 'true' || value === 1 || value === '1';
}

function normalizeDesktopScanPayload(payload) {
    const source = normalizeObject(payload);
    const artifactMetadata = normalizeObject(source.artifact_metadata || source.artifactMetadata);
    const localFindings = Array.isArray(source.local_findings || source.localFindings)
        ? (source.local_findings || source.localFindings)
            .slice(0, 64)
            .map((item) => {
                if (item && typeof item === 'object') {
                    return {
                        type: normalizeString(item.type, 64) || 'local_signal',
                        severity: normalizeSeverity(item.severity),
                        title: normalizeString(item.title, 160) || 'Локальный сигнал',
                        detail: normalizeString(item.detail, 500) || '',
                        source: normalizeString(item.source, 120) || 'Local Desktop Engine',
                        score: normalizeScore(item.score),
                        evidence: normalizeObject(item.evidence)
                    };
                }
                const text = normalizeString(item, 240);
                if (!text) return null;
                return {
                    type: 'local_signal',
                    severity: 'low',
                    title: 'Локальный сигнал',
                    detail: text,
                    source: 'Local Desktop Engine',
                    score: 6,
                    evidence: {}
                };
            })
            .filter(Boolean)
        : [];

    return {
        platform: normalizePlatform(source.platform),
        mode: normalizeMode(source.mode),
        artifactKind: normalizeArtifactKind(source.artifact_kind || source.artifactKind),
        artifactMetadata: {
            targetName: normalizeString(artifactMetadata.target_name || artifactMetadata.targetName || source.target_name || source.targetName),
            targetPath: normalizeString(artifactMetadata.target_path || artifactMetadata.targetPath || source.target_path || source.targetPath, 512),
            fileName: normalizeString(artifactMetadata.file_name || artifactMetadata.fileName, 255),
            mimeType: normalizeString(artifactMetadata.mime_type || artifactMetadata.mimeType, 120),
            originPath: normalizeString(artifactMetadata.origin_path || artifactMetadata.originPath, 512),
            packageManager: normalizeString(artifactMetadata.package_manager || artifactMetadata.packageManager, 64),
            publisher: normalizeString(artifactMetadata.publisher, 255),
            signer: normalizeString(artifactMetadata.signer, 255),
            signerTrusted: normalizeBoolean(artifactMetadata.signer_trusted || artifactMetadata.signerTrusted),
            executable: normalizeBoolean(artifactMetadata.executable),
            recentlyDropped: normalizeBoolean(artifactMetadata.recently_dropped || artifactMetadata.recentlyDropped),
            fromDownloads: normalizeBoolean(artifactMetadata.from_downloads || artifactMetadata.fromDownloads),
            fromTemp: normalizeBoolean(artifactMetadata.from_temp || artifactMetadata.fromTemp),
            runsAsRoot: normalizeBoolean(artifactMetadata.runs_as_root || artifactMetadata.runsAsRoot),
            hasSuid: normalizeBoolean(artifactMetadata.has_suid || artifactMetadata.hasSuid),
            writableLauncher: normalizeBoolean(artifactMetadata.writable_launcher || artifactMetadata.writableLauncher),
            autorunLocations: normalizeStringList(artifactMetadata.autorun_locations || artifactMetadata.autorunLocations, 24, 255),
            persistenceSurfaces: normalizeStringList(artifactMetadata.persistence_surfaces || artifactMetadata.persistenceSurfaces, 24, 255),
            suspiciousImports: normalizeStringList(artifactMetadata.suspicious_imports || artifactMetadata.suspiciousImports, 40, 64),
            capabilities: normalizeStringList(artifactMetadata.capabilities, 24, 64),
            packageSources: normalizeStringList(artifactMetadata.package_sources || artifactMetadata.packageSources, 24, 64),
            desktopEntries: normalizeStringList(artifactMetadata.desktop_entries || artifactMetadata.desktopEntries, 24, 255),
            uploadRequired: normalizeBoolean(artifactMetadata.upload_required || artifactMetadata.uploadRequired || source.upload_required || source.uploadRequired),
            fileSizeBytes: normalizePositiveInt(artifactMetadata.file_size_bytes || artifactMetadata.fileSizeBytes),
            entropy: normalizeEntropy(artifactMetadata.entropy),
            notes: normalizeString(artifactMetadata.notes, 500)
        },
        sha256: normalizeSha256(source.sha256 || artifactMetadata.sha256),
        localFindings,
        localSummary: normalizeObject(source.local_summary || source.localSummary),
        externalRefs: normalizeObject(source.external_refs || source.externalRefs),
        raw: source
    };
}

function normalizePlatform(value) {
    const normalized = String(value || '').trim().toUpperCase();
    return SUPPORTED_PLATFORMS.has(normalized) ? normalized : null;
}

function normalizeMode(value) {
    const normalized = String(value || '').trim().toUpperCase();
    if (!SUPPORTED_MODES.has(normalized)) {
        return 'FULL';
    }
    return normalized;
}

function normalizeArtifactKind(value) {
    const normalized = String(value || '').trim().toUpperCase();
    return normalized ? normalized.slice(0, 32) : 'UNKNOWN';
}

function normalizeSeverity(value) {
    const normalized = String(value || '').trim().toLowerCase();
    if (['critical', 'high', 'medium', 'low'].includes(normalized)) {
        return normalized;
    }
    return 'low';
}

function normalizeScore(value) {
    const parsed = Number(value || 0);
    if (!Number.isFinite(parsed)) {
        return 0;
    }
    return Math.max(0, Math.min(100, Math.round(parsed)));
}

function normalizePositiveInt(value) {
    const parsed = Number(value || 0);
    if (!Number.isFinite(parsed) || parsed <= 0) {
        return null;
    }
    return Math.round(parsed);
}

function normalizeEntropy(value) {
    const parsed = Number(value);
    if (!Number.isFinite(parsed)) {
        return null;
    }
    return Math.max(0, Math.min(8, parsed));
}

function normalizeSha256(value) {
    const normalized = String(value || '').trim().toLowerCase();
    return /^[a-f0-9]{64}$/.test(normalized) ? normalized : null;
}

function validateDesktopScanPayload(normalized) {
    if (!normalized.platform) {
        return 'platform must be WINDOWS or LINUX';
    }
    if (!normalized.mode) {
        return 'mode is required';
    }
    const metadata = normalized.artifactMetadata || {};
    if (!metadata.targetName && !normalized.sha256 && normalized.mode !== 'RESIDENT_EVENT') {
        return 'artifact target_name or sha256 is required';
    }
    return null;
}

function buildFinding({ type, severity = 'low', title, detail = '', source = 'NeuralV Desktop Rules', score = 0, evidence = {} }) {
    return {
        type: normalizeString(type, 64) || 'signal',
        severity: normalizeSeverity(severity),
        title: normalizeString(title, 160) || 'Сигнал',
        detail: normalizeString(detail, 600) || '',
        source: normalizeString(source, 120) || 'NeuralV Desktop Rules',
        score: normalizeScore(score),
        evidence: normalizeObject(evidence)
    };
}

function severityWeight(severity) {
    switch (String(severity || '').toLowerCase()) {
        case 'critical': return 40;
        case 'high': return 24;
        case 'medium': return 12;
        default: return 5;
    }
}

function computeRiskScore(findings) {
    const normalized = Array.isArray(findings) ? findings : [];
    if (normalized.length === 0) {
        return 0;
    }
    const base = normalized.reduce((acc, finding) => acc + severityWeight(finding.severity) + Number(finding.score || 0), 0);
    return Math.max(0, Math.min(100, Math.round(base / Math.max(1, Math.min(normalized.length, 4)))));
}

function classifyDesktopVerdict(findings, riskScore) {
    const normalized = Array.isArray(findings) ? findings : [];
    if (normalized.some((finding) => String(finding.severity) === 'critical') || Number(riskScore) >= 85) {
        return 'malicious';
    }
    if (normalized.some((finding) => String(finding.severity) === 'high') || Number(riskScore) >= 55) {
        return 'suspicious';
    }
    if (normalized.length > 0 || Number(riskScore) >= 20) {
        return 'low_risk';
    }
    return 'clean';
}

function analyzeDesktopMetadata(normalized) {
    const findings = [];
    const metadata = normalizeObject(normalized?.artifactMetadata);
    const platform = normalized?.platform;

    if (platform === 'WINDOWS') {
        if (!metadata.signerTrusted && (metadata.publisher || metadata.signer)) {
            findings.push(buildFinding({
                type: 'publisher_untrusted',
                severity: 'medium',
                title: 'Подпись издателя не подтверждена',
                detail: 'Файл заявляет издателя, но подпись не помечена как доверенная.',
                score: 18,
                evidence: { publisher: metadata.publisher, signer: metadata.signer }
            }));
        }
        if (!metadata.signer && ['EXE', 'DLL', 'MSI'].includes(normalized.artifactKind)) {
            findings.push(buildFinding({
                type: 'unsigned_binary',
                severity: 'medium',
                title: 'Исполняемый файл без подписи',
                detail: 'Для PE/installer-артефакта не передана информация о кодовой подписи.',
                score: 16,
                evidence: { artifact_kind: normalized.artifactKind }
            }));
        }
        if (metadata.suspiciousImports.length > 0) {
            findings.push(buildFinding({
                type: 'suspicious_imports',
                severity: metadata.suspiciousImports.length >= 3 ? 'high' : 'medium',
                title: 'Обнаружены рискованные импорты Windows API',
                detail: `Импорты: ${metadata.suspiciousImports.slice(0, 6).join(', ')}`,
                score: 24,
                evidence: { imports: metadata.suspiciousImports }
            }));
        }
        if (metadata.persistenceSurfaces.length > 0 || metadata.autorunLocations.length > 0) {
            findings.push(buildFinding({
                type: 'autorun_persistence',
                severity: 'high',
                title: 'Есть признаки автозапуска или закрепления в системе',
                detail: 'Сигнал получен по Run keys, Startup folder, scheduled tasks или службам.',
                score: 28,
                evidence: {
                    persistence_surfaces: metadata.persistenceSurfaces,
                    autorun_locations: metadata.autorunLocations
                }
            }));
        }
    }

    if (platform === 'LINUX') {
        if (metadata.hasSuid || metadata.runsAsRoot) {
            findings.push(buildFinding({
                type: 'privilege_escalation',
                severity: 'high',
                title: 'Артефакт требует повышенных привилегий',
                detail: 'Есть признаки root execution, SUID или запуска с повышенными правами.',
                score: 30,
                evidence: { has_suid: metadata.hasSuid, runs_as_root: metadata.runsAsRoot }
            }));
        }
        if (metadata.capabilities.length > 0) {
            findings.push(buildFinding({
                type: 'linux_capabilities',
                severity: 'medium',
                title: 'Выданы расширенные Linux capabilities',
                detail: `Capabilities: ${metadata.capabilities.join(', ')}`,
                score: 16,
                evidence: { capabilities: metadata.capabilities }
            }));
        }
        if (metadata.writableLauncher || metadata.desktopEntries.length > 0) {
            findings.push(buildFinding({
                type: 'launcher_anomaly',
                severity: 'medium',
                title: 'Подозрительный launcher или .desktop entry',
                detail: 'Launcher может быть изменяемым или привязан к нестандартной автозагрузке.',
                score: 18,
                evidence: {
                    writable_launcher: metadata.writableLauncher,
                    desktop_entries: metadata.desktopEntries
                }
            }));
        }
        if (metadata.packageSources.length === 0 && metadata.executable) {
            findings.push(buildFinding({
                type: 'unknown_origin',
                severity: 'low',
                title: 'Не удалось подтвердить источник пакета',
                detail: 'Для исполняемого файла не передан provenance из dpkg/rpm/pacman/flatpak/snap.',
                score: 8,
                evidence: { executable: metadata.executable }
            }));
        }
    }

    if (metadata.recentlyDropped || metadata.fromDownloads || metadata.fromTemp) {
        findings.push(buildFinding({
            type: 'dropped_binary',
            severity: 'medium',
            title: 'Файл появился в зоне повышенного риска',
            detail: 'Артефакт отмечен как недавно появившийся или пришедший из Downloads/Temp.',
            score: 14,
            evidence: {
                recently_dropped: metadata.recentlyDropped,
                from_downloads: metadata.fromDownloads,
                from_temp: metadata.fromTemp
            }
        }));
    }

    if (Number(metadata.entropy || 0) >= 7.2) {
        findings.push(buildFinding({
            type: 'high_entropy',
            severity: 'medium',
            title: 'Высокая энтропия содержимого',
            detail: 'Это может указывать на упаковщик, шифрование или скрытие полезной нагрузки.',
            score: 22,
            evidence: { entropy: metadata.entropy }
        }));
    }

    return findings;
}

function hasHardSignals(findings, vt = null) {
    const normalized = Array.isArray(findings) ? findings : [];
    if (Number(vt?.malicious || 0) > 0) {
        return true;
    }
    return normalized.some((finding) => HARD_SIGNAL_TYPES.has(String(finding.type || '').toLowerCase()));
}

module.exports = {
    SUPPORTED_PLATFORMS,
    SUPPORTED_MODES,
    normalizeDesktopScanPayload,
    validateDesktopScanPayload,
    analyzeDesktopMetadata,
    buildFinding,
    computeRiskScore,
    classifyDesktopVerdict,
    hasHardSignals
};
