const pool = require('../db/pool');
const { listUserDeepScans } = require('./deepScanService');
const { listUserDesktopScans } = require('./desktopScanService');
const { getNetworkProtectionProfileOverview } = require('./networkProtectionService');

function normalizeMode(value) {
    return String(value || '').trim().toLowerCase() || 'unknown';
}

function normalizeLegacyStatus(value) {
    const normalized = String(value || 'COMPLETED').trim().toUpperCase();
    return normalized || 'COMPLETED';
}

function deriveLegacyVerdict(row) {
    if (normalizeLegacyStatus(row.status) !== 'COMPLETED') {
        return null;
    }
    return Number(row.threats_found || 0) > 0 ? 'threats_found' : 'clean';
}

function mapLegacyScan(row) {
    return {
        id: `legacy:${row.id}`,
        source: 'scan_sessions',
        source_id: String(row.id),
        platform: 'android',
        client: 'android',
        mode: normalizeMode(row.scan_type),
        status: normalizeLegacyStatus(row.status),
        verdict: deriveLegacyVerdict(row),
        risk_score: null,
        threats_found: Number(row.threats_found || 0) || 0,
        total_scanned: Number(row.total_scanned || 0) || 0,
        label: 'Client scan',
        message: Number(row.threats_found || 0) > 0 ? `Найдено угроз: ${Number(row.threats_found || 0)}` : 'Угроз не обнаружено',
        started_at: Number(row.started_at || 0) || null,
        completed_at: Number(row.completed_at || 0) || null,
        created_at: Number(row.started_at || 0) || null,
        updated_at: Number(row.completed_at || row.started_at || 0) || null,
        sort_at: Number(row.completed_at || row.started_at || 0) || 0
    };
}

async function listLegacyUserScans(userId, { limit = 50, offset = 0 } = {}) {
    const safeLimit = Math.max(1, Math.min(200, Number(limit || 50) || 50));
    const safeOffset = Math.max(0, Number(offset || 0) || 0);
    const [rows] = await pool.query(
        `SELECT id, scan_type, started_at, completed_at, total_scanned, threats_found, status
         FROM scan_sessions
         WHERE user_id = ?
         ORDER BY started_at DESC
         LIMIT ? OFFSET ?`,
        [userId, safeLimit, safeOffset]
    );

    return rows.map(mapLegacyScan);
}

async function countRows(tableName, userId) {
    const [rows] = await pool.query(
        `SELECT COUNT(*) AS total FROM ${tableName} WHERE user_id = ?`,
        [userId]
    );
    return Number(rows?.[0]?.total || 0) || 0;
}

async function getUserProfileOverview(userId, { limit = 60, offset = 0 } = {}) {
    const safeLimit = Math.max(1, Math.min(200, Number(limit || 60) || 60));
    const safeOffset = Math.max(0, Number(offset || 0) || 0);

    const fetchLimit = Math.max(safeLimit, safeOffset + safeLimit);
    const [legacyScans, deepScans, desktopScans, protection, legacyTotal, deepTotal, desktopTotal] = await Promise.all([
        listLegacyUserScans(userId, { limit: fetchLimit, offset: 0 }),
        listUserDeepScans(userId, { limit: fetchLimit, offset: 0 }),
        listUserDesktopScans(userId, { limit: fetchLimit, offset: 0 }),
        getNetworkProtectionProfileOverview(userId),
        countRows('scan_sessions', userId),
        countRows('deep_scan_jobs', userId),
        countRows('desktop_scan_jobs', userId)
    ]);

    const scans = [...legacyScans, ...deepScans, ...desktopScans]
        .sort((left, right) => Number(right.sort_at || 0) - Number(left.sort_at || 0));

    return {
        scans: scans.slice(safeOffset, safeOffset + safeLimit),
        scan_sources: {
            legacy: legacyTotal,
            deep: deepTotal,
            desktop: desktopTotal
        },
        total_scans: legacyTotal + deepTotal + desktopTotal,
        protection
    };
}

module.exports = {
    getUserProfileOverview
};
