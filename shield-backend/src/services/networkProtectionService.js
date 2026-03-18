const fs = require('fs');
const path = require('path');

const pool = require('../db/pool');

const STORE_PATH = path.resolve(__dirname, '../data/network-protection.json');
const PLATFORMS = new Set(['android', 'windows', 'linux']);
const DEFAULT_LIMITS = Object.freeze({
    scope: 'shared-cross-platform',
    developer_mode: false,
    enforced: false,
    limits_disabled: true
});
const DEFAULT_UNIFIED_TOGGLES = Object.freeze({
    protection_enabled: true,
    ad_block_enabled: true,
    unsafe_sites_enabled: true
});

function createHttpError(status, message, code) {
    const error = new Error(message);
    error.status = status;
    error.code = code;
    return error;
}

function nowMs() {
    return Date.now();
}

function ensureStore() {
    if (fs.existsSync(STORE_PATH)) {
        return;
    }
    fs.mkdirSync(path.dirname(STORE_PATH), { recursive: true });
    fs.writeFileSync(STORE_PATH, JSON.stringify({ users: {} }, null, 2) + '\n', 'utf8');
}

function readStore() {
    ensureStore();
    try {
        const parsed = JSON.parse(fs.readFileSync(STORE_PATH, 'utf8'));
        if (parsed && typeof parsed === 'object') {
            return parsed;
        }
    } catch (_) {
        // Keep the service writable even if the JSON file was corrupted manually.
    }
    return { users: {} };
}

function writeStore(store) {
    ensureStore();
    fs.writeFileSync(STORE_PATH, JSON.stringify(store, null, 2) + '\n', 'utf8');
}

function parseCsvSet(value, normalizer = (entry) => entry) {
    return new Set(
        String(value || '')
            .split(',')
            .map((entry) => normalizer(String(entry || '').trim()))
            .filter(Boolean)
    );
}

function isUserInDevMode(user) {
    if (!user) {
        return false;
    }
    if (String(process.env.DEEP_SCAN_DEV_MODE || '').trim() === '1') {
        return true;
    }

    const forcedIds = parseCsvSet(process.env.DEEP_SCAN_DEV_USER_IDS);
    const forcedEmails = parseCsvSet(process.env.DEEP_SCAN_DEV_USER_EMAILS, (entry) => entry.toLowerCase());
    if (forcedIds.has(String(user.id || '').trim())) {
        return true;
    }
    if (forcedEmails.has(String(user.email || '').trim().toLowerCase())) {
        return true;
    }

    return Number(user.is_dev_mode || user.is_developer_mode || 0) === 1;
}

async function getUserDevMode(userId) {
    let rows;
    try {
        [rows] = await pool.query(
            `SELECT id, email, is_dev_mode, is_developer_mode
             FROM users
             WHERE id = ?
             LIMIT 1`,
            [userId]
        );
    } catch (error) {
        if (String(error?.code || '') === 'ER_BAD_FIELD_ERROR') {
            try {
                [rows] = await pool.query(
                    `SELECT id, email, is_dev_mode
                     FROM users
                     WHERE id = ?
                     LIMIT 1`,
                    [userId]
                );
            } catch (fallbackError) {
                if (String(fallbackError?.code || '') === 'ER_BAD_FIELD_ERROR') {
                    [rows] = await pool.query(
                        `SELECT id, email
                         FROM users
                         WHERE id = ?
                         LIMIT 1`,
                        [userId]
                    );
                } else {
                    throw fallbackError;
                }
            }
        } else {
            throw error;
        }
    }

    if (!Array.isArray(rows) || rows.length === 0) {
        return {
            exists: false,
            developerMode: false
        };
    }

    return {
        exists: true,
        developerMode: isUserInDevMode(rows[0])
    };
}

function normalizePlatform(value) {
    const normalized = String(value || '').trim().toLowerCase();
    if (!normalized) {
        throw createHttpError(400, 'platform is required', 'PLATFORM_REQUIRED');
    }
    if (!PLATFORMS.has(normalized)) {
        throw createHttpError(400, 'platform must be one of android, windows, linux', 'INVALID_PLATFORM');
    }
    return normalized;
}

function normalizeCounter(value, fieldName) {
    if (value === undefined || value === null || value === '') {
        return 0;
    }
    const numeric = Number(value);
    if (!Number.isFinite(numeric) || numeric < 0) {
        throw createHttpError(400, `${fieldName} must be a non-negative number`, 'INVALID_COUNTER');
    }
    return Math.floor(numeric);
}

function createPlatformState() {
    return {
        blocked_ads: 0,
        blocked_threats: 0,
        updated_at: 0,
        last_event_at: 0
    };
}

function hasBoolean(value) {
    return typeof value === 'boolean';
}

function normalizeUnifiedToggles(source = {}, fallbackEnabled = true) {
    const protectionValue = source.protection_enabled ?? source.network_enabled;
    const hasProtection = hasBoolean(protectionValue);
    const hasAdBlock = hasBoolean(source.ad_block_enabled);
    const hasUnsafeSites = hasBoolean(source.unsafe_sites_enabled);

    let requestedEnabled;
    if (hasProtection) {
        requestedEnabled = protectionValue;
    } else if (hasAdBlock || hasUnsafeSites) {
        requestedEnabled = Boolean(
            (hasAdBlock ? source.ad_block_enabled : false) ||
            (hasUnsafeSites ? source.unsafe_sites_enabled : false)
        );
    } else {
        requestedEnabled = Boolean(fallbackEnabled);
    }

    return {
        protection_enabled: requestedEnabled,
        ad_block_enabled: requestedEnabled,
        unsafe_sites_enabled: requestedEnabled
    };
}

function hasLegacyNeverConfiguredToggles(userState) {
    if (!userState || typeof userState !== 'object') {
        return false;
    }

    const toggles = userState.toggles || {};
    const allFalseLike = [
        toggles.protection_enabled,
        userState.network_enabled,
        toggles.ad_block_enabled,
        userState.ad_block_enabled,
        toggles.unsafe_sites_enabled,
        userState.unsafe_sites_enabled
    ].every((value) => value === false || value === undefined || value === null || value === '');

    return allFalseLike && Number(userState.updated_at || 0) <= 0;
}

function formatHumanCounter(value) {
    const safeValue = Math.max(0, Number(value || 0) || 0);
    try {
        return safeValue.toLocaleString('ru-RU');
    } catch (_) {
        return String(safeValue);
    }
}

function buildStatus(toggles) {
    const requestedEnabled = Boolean(toggles.protection_enabled);
    return {
        mode: 'unified',
        requested_enabled: requestedEnabled,
        effective_enabled: false,
        local_enforcement_available: false,
        local_enforcement_active: false,
        message: requestedEnabled
            ? 'Локальная фильтрация в этой сборке пока не активна'
            : 'Защита в сети выключена'
    };
}

function createUserState() {
    return {
        toggles: { ...DEFAULT_UNIFIED_TOGGLES },
        counters: {
            blocked_ads_total: 0,
            blocked_threats_total: 0
        },
        platforms: {
            android: createPlatformState(),
            windows: createPlatformState(),
            linux: createPlatformState()
        },
        updated_at: 0
    };
}

function migrateLegacyUserState(userState) {
    const migrated = createUserState();

    if (!userState || typeof userState !== 'object') {
        return migrated;
    }

    const sourcePlatforms = userState.platforms || userState.by_platform || {};
    const legacyNeverConfigured = hasLegacyNeverConfiguredToggles(userState);
    migrated.toggles = legacyNeverConfigured
        ? { ...DEFAULT_UNIFIED_TOGGLES }
        : normalizeUnifiedToggles({
            protection_enabled: userState.toggles?.protection_enabled,
            network_enabled: userState.network_enabled,
            ad_block_enabled: userState.toggles?.ad_block_enabled ?? userState.ad_block_enabled,
            unsafe_sites_enabled: userState.toggles?.unsafe_sites_enabled ?? userState.unsafe_sites_enabled
        }, true);
    migrated.counters.blocked_ads_total = Math.max(0, Number(
        userState.counters?.blocked_ads_total ?? userState.blocked_ads_total ?? 0
    ) || 0);
    migrated.counters.blocked_threats_total = Math.max(0, Number(
        userState.counters?.blocked_threats_total ?? userState.blocked_threats_total ?? 0
    ) || 0);
    migrated.updated_at = Math.max(0, Number(userState.updated_at || 0) || 0);

    for (const platform of PLATFORMS) {
        const source = sourcePlatforms?.[platform] || {};
        migrated.platforms[platform] = {
            blocked_ads: Math.max(0, Number(source.blocked_ads || 0) || 0),
            blocked_threats: Math.max(0, Number(source.blocked_threats || 0) || 0),
            updated_at: Math.max(0, Number(source.updated_at || 0) || 0),
            last_event_at: Math.max(0, Number(source.last_event_at || 0) || 0)
        };
    }

    return migrated;
}

function ensureUserState(store, userId) {
    const key = String(userId || '').trim();
    if (!key) {
        throw createHttpError(400, 'userId is required', 'USER_ID_REQUIRED');
    }
    if (!store.users || typeof store.users !== 'object') {
        store.users = {};
    }
    store.users[key] = migrateLegacyUserState(store.users[key]);
    return store.users[key];
}

function shapeState(userState, platform, developerMode) {
    const platformState = userState.platforms[platform] || createPlatformState();
    const status = buildStatus(userState.toggles);
    return {
        platform,
        toggles: {
            protection_enabled: Boolean(userState.toggles.protection_enabled),
            ad_block_enabled: Boolean(userState.toggles.ad_block_enabled),
            unsafe_sites_enabled: Boolean(userState.toggles.unsafe_sites_enabled)
        },
        counters: {
            total: {
                blocked_ads: Number(userState.counters.blocked_ads_total || 0),
                blocked_threats: Number(userState.counters.blocked_threats_total || 0),
                blocked_ads_human: formatHumanCounter(userState.counters.blocked_ads_total || 0),
                blocked_threats_human: formatHumanCounter(userState.counters.blocked_threats_total || 0)
            },
            platform: {
                blocked_ads: Number(platformState.blocked_ads || 0),
                blocked_threats: Number(platformState.blocked_threats || 0),
                blocked_ads_human: formatHumanCounter(platformState.blocked_ads || 0),
                blocked_threats_human: formatHumanCounter(platformState.blocked_threats || 0)
            }
        },
        capabilities: {
            unified_toggle: true,
            separate_category_toggles: false,
            local_enforcement_available: false,
            counters_only_until_local_filter_is_enabled: true
        },
        status,
        limits: {
            ...DEFAULT_LIMITS,
            developer_mode: Boolean(developerMode)
        },
        updated_at: Number(userState.updated_at || 0),
        platform_updated_at: Number(platformState.updated_at || 0),
        last_event_at: Number(platformState.last_event_at || 0)
    };
}

function extractToggles(payload = {}) {
    const toggles = payload.toggles && typeof payload.toggles === 'object' ? payload.toggles : payload;
    const providedKeys = [
        'protection_enabled',
        'network_enabled',
        'ad_block_enabled',
        'unsafe_sites_enabled'
    ].filter((key) => toggles[key] !== undefined);

    if (providedKeys.length === 0) {
        throw createHttpError(400, 'at least one toggle must be provided', 'EMPTY_TOGGLE_PATCH');
    }

    for (const key of providedKeys) {
        if (!hasBoolean(toggles[key])) {
            throw createHttpError(400, `${key} must be boolean`, 'INVALID_TOGGLE');
        }
    }

    return normalizeUnifiedToggles(toggles, true);
}

async function resolveContext(userId, platform) {
    const targetPlatform = normalizePlatform(platform);
    const devState = await getUserDevMode(userId);
    if (!devState.exists) {
        throw createHttpError(404, 'User not found', 'USER_NOT_FOUND');
    }
    return {
        platform: targetPlatform,
        developerMode: devState.developerMode
    };
}

async function getNetworkProtectionState(userId, platform) {
    const context = await resolveContext(userId, platform);
    const store = readStore();
    const userState = ensureUserState(store, userId);
    writeStore(store);
    return shapeState(userState, context.platform, context.developerMode);
}

async function updateNetworkProtectionState(userId, payload = {}) {
    const context = await resolveContext(userId, payload.platform);
    const togglePatch = extractToggles(payload);
    const store = readStore();
    const userState = ensureUserState(store, userId);

    Object.assign(userState.toggles, togglePatch);
    userState.updated_at = nowMs();

    writeStore(store);
    return shapeState(userState, context.platform, context.developerMode);
}

async function recordNetworkProtectionEvent(userId, payload = {}) {
    const context = await resolveContext(userId, payload.platform);
    const blockedAds = normalizeCounter(
        payload.blocked_ads ?? payload.blockedAds ?? payload.ads_blocked,
        'blocked_ads'
    );
    const blockedThreats = normalizeCounter(
        payload.blocked_threats ?? payload.blockedThreats ?? payload.threats_blocked,
        'blocked_threats'
    );

    if (blockedAds === 0 && blockedThreats === 0) {
        throw createHttpError(400, 'at least one counter delta must be provided', 'EMPTY_COUNTER_DELTA');
    }

    const store = readStore();
    const userState = ensureUserState(store, userId);
    const platformState = userState.platforms[context.platform];
    const timestamp = nowMs();

    platformState.blocked_ads += blockedAds;
    platformState.blocked_threats += blockedThreats;
    platformState.updated_at = timestamp;
    platformState.last_event_at = timestamp;
    userState.counters.blocked_ads_total += blockedAds;
    userState.counters.blocked_threats_total += blockedThreats;
    userState.updated_at = timestamp;

    writeStore(store);
    return {
        accepted: {
            blocked_ads: blockedAds,
            blocked_threats: blockedThreats
        },
        state: shapeState(userState, context.platform, context.developerMode)
    };
}

module.exports = {
    getNetworkProtectionState,
    updateNetworkProtectionState,
    recordNetworkProtectionEvent
};
