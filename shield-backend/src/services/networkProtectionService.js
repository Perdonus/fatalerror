const crypto = require('crypto');
const fs = require('fs');
const http = require('http');
const https = require('https');
const path = require('path');

const pool = require('../db/pool');
const { getUserDeveloperModeState } = require('./accountEntitlementsService');

const STORE_PATH = path.resolve(__dirname, '../data/network-protection.json');
const FEED_CACHE_DIR = path.resolve(__dirname, '../data/network-protection-feeds');
const FEED_MANIFEST_PATH = path.join(FEED_CACHE_DIR, 'manifest.json');
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
const FEED_REFRESH_MS = normalizePositiveInteger(
    process.env.NETWORK_PROTECTION_FEED_REFRESH_MS,
    6 * 60 * 60 * 1000
);
const FEED_FETCH_TIMEOUT_MS = normalizePositiveInteger(
    process.env.NETWORK_PROTECTION_FETCH_TIMEOUT_MS,
    15 * 1000
);
const FEED_FETCH_MAX_BYTES = normalizePositiveInteger(
    process.env.NETWORK_PROTECTION_FETCH_MAX_BYTES,
    64 * 1024 * 1024
);
const HOSTS_SINKHOLE_IP = String(process.env.NETWORK_PROTECTION_HOSTS_SINKHOLE_IP || '0.0.0.0').trim() || '0.0.0.0';
const FEED_RESPONSE_CACHE_MAX_AGE_SEC = Math.max(60, Math.floor(FEED_REFRESH_MS / 1000));
const FEED_ID_ALIASES = Object.freeze({
    ads: 'ads',
    adblock: 'ads',
    'ad-block': 'ads',
    unsafe: 'unsafe-sites',
    threats: 'unsafe-sites',
    threat: 'unsafe-sites',
    dangerous: 'unsafe-sites',
    'dangerous-sites': 'unsafe-sites',
    'unsafe-sites': 'unsafe-sites',
    combined: 'combined',
    all: 'combined'
});
const FEED_FORMATS = new Set(['domains', 'hosts']);
const PROXIED_FEEDS = Object.freeze([
    {
        id: 'ads',
        title: 'Ads and trackers',
        description: 'Domains used for ads, tracking and abusive monetization.',
        sources: Object.freeze([
            {
                id: 'adaway-default',
                title: 'AdAway default blocklist',
                provider: 'AdAway',
                homepage: 'https://github.com/AdAway/adaway.github.io/',
                url: 'https://raw.githubusercontent.com/AdAway/adaway.github.io/master/hosts.txt',
                format: 'hosts',
                license: 'CC BY 3.0'
            },
            {
                id: 'stevenblack-unified',
                title: 'StevenBlack unified hosts',
                provider: 'StevenBlack',
                homepage: 'https://github.com/StevenBlack/hosts',
                url: 'https://raw.githubusercontent.com/StevenBlack/hosts/master/hosts',
                format: 'hosts',
                license: 'MIT'
            }
        ])
    },
    {
        id: 'unsafe-sites',
        title: 'Dangerous sites',
        description: 'Domains associated with malware, phishing, ransomware and scams.',
        sources: Object.freeze([
            {
                id: 'urlhaus-hostfile',
                title: 'URLhaus hostfile',
                provider: 'abuse.ch URLhaus',
                homepage: 'https://urlhaus.abuse.ch/',
                url: 'https://urlhaus.abuse.ch/downloads/hostfile/',
                format: 'hosts',
                license: 'CC0'
            },
            {
                id: 'threatfox-hostfile',
                title: 'ThreatFox hostfile',
                provider: 'abuse.ch ThreatFox',
                homepage: 'https://threatfox.abuse.ch/',
                url: 'https://threatfox.abuse.ch/downloads/hostfile',
                format: 'hosts',
                license: 'CC0'
            },
            {
                id: 'blocklistproject-phishing',
                title: 'The Block List Project phishing',
                provider: 'The Block List Project',
                homepage: 'https://github.com/blocklistproject/Lists',
                url: 'https://blocklistproject.github.io/Lists/alt-version/phishing-nl.txt',
                format: 'domains',
                license: 'MIT'
            },
            {
                id: 'blocklistproject-ransomware',
                title: 'The Block List Project ransomware',
                provider: 'The Block List Project',
                homepage: 'https://github.com/blocklistproject/Lists',
                url: 'https://blocklistproject.github.io/Lists/alt-version/ransomware-nl.txt',
                format: 'domains',
                license: 'MIT'
            },
            {
                id: 'durablenapkin-scamblocklist',
                title: 'DurableNapkin scamblocklist',
                provider: 'DurableNapkin',
                homepage: 'https://github.com/durablenapkin/scamblocklist',
                url: 'https://raw.githubusercontent.com/durablenapkin/scamblocklist/master/hosts.txt',
                format: 'hosts',
                license: 'MIT'
            },
            {
                id: 'global-anti-scam-org',
                title: 'Global Anti Scam Org blocklist',
                provider: 'Global Anti Scam Organization',
                homepage: 'https://github.com/elliotwutingfeng/GlobalAntiScamOrg-blocklist',
                url: 'https://raw.githubusercontent.com/elliotwutingfeng/GlobalAntiScamOrg-blocklist/main/global-anti-scam-org-scam-urls-pihole.txt',
                format: 'domains',
                license: 'BSD-3-Clause'
            }
        ])
    }
]);
const RECOMMENDED_DIRECT_UPSTREAMS = Object.freeze({
    ads: Object.freeze([
        {
            id: 'hagezi-pro',
            title: "HaGeZi's Pro DNS Blocklist",
            provider: 'HaGeZi',
            homepage: 'https://github.com/hagezi/dns-blocklists',
            url: 'https://cdn.jsdelivr.net/gh/hagezi/dns-blocklists@latest/domains/pro.txt',
            format: 'domains',
            license: 'GPL-3.0',
            inclusion: 'direct-only',
            note: 'High-coverage ad and tracker feed. Kept as a direct upstream reference instead of being proxied by this backend.'
        }
    ]),
    'unsafe-sites': Object.freeze([
        {
            id: 'hagezi-tif-medium',
            title: "HaGeZi's Threat Intelligence Feeds medium",
            provider: 'HaGeZi',
            homepage: 'https://github.com/hagezi/dns-blocklists',
            url: 'https://cdn.jsdelivr.net/gh/hagezi/dns-blocklists@latest/adblock/tif.medium.txt',
            format: 'adblock',
            license: 'GPL-3.0',
            inclusion: 'direct-only',
            note: 'Curated threat feed that is well maintained, but left as a direct upstream reference to avoid redistributing GPL content from the backend.'
        },
        {
            id: 'cert-polska-malicious-domains',
            title: 'CERT Polska malicious domains',
            provider: 'CERT Polska',
            homepage: 'https://cert.pl/en/posts/2020/03/malicious_domains/',
            url: 'https://hole.cert.pl/domains/v2/domains.txt',
            format: 'domains',
            license: 'See upstream terms',
            inclusion: 'direct-only',
            note: 'Fast-moving malicious-domain feed. Review upstream redistribution terms before proxying it.'
        }
    ])
});
const PROXIED_FEED_IDS = new Set(PROXIED_FEEDS.map((feed) => feed.id).concat('combined'));

let refreshPromise = null;

function normalizePositiveInteger(value, fallbackValue) {
    const numeric = Number(value);
    if (!Number.isFinite(numeric) || numeric <= 0) {
        return fallbackValue;
    }
    return Math.floor(numeric);
}

function createHttpError(status, message, code) {
    const error = new Error(message);
    error.status = status;
    error.code = code;
    return error;
}

function nowMs() {
    return Date.now();
}

function sha256(value) {
    return crypto.createHash('sha256').update(String(value || ''), 'utf8').digest('hex');
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

function ensureFeedCacheDir() {
    fs.mkdirSync(FEED_CACHE_DIR, { recursive: true });
}

function readFeedManifestCache() {
    try {
        const parsed = JSON.parse(fs.readFileSync(FEED_MANIFEST_PATH, 'utf8'));
        if (parsed && typeof parsed === 'object') {
            return parsed;
        }
    } catch (_) {
        // Ignore missing or corrupted cache files and rebuild on demand.
    }
    return null;
}

function writeFeedManifestCache(manifest) {
    ensureFeedCacheDir();
    fs.writeFileSync(FEED_MANIFEST_PATH, JSON.stringify(manifest, null, 2) + '\n', 'utf8');
}

function feedDomainFilePath(feedId) {
    return path.join(FEED_CACHE_DIR, `${feedId}.domains.txt`);
}

function fileExists(filePath) {
    try {
        return fs.existsSync(filePath);
    } catch (_) {
        return false;
    }
}

function readDomainFile(feedId) {
    const filePath = feedDomainFilePath(feedId);
    if (!fileExists(filePath)) {
        return [];
    }
    return fs.readFileSync(filePath, 'utf8')
        .split(/\r?\n/)
        .map((line) => line.trim())
        .filter(Boolean);
}

function writeDomainFile(feedId, domains) {
    ensureFeedCacheDir();
    fs.writeFileSync(feedDomainFilePath(feedId), renderDomains(domains), 'utf8');
}

function renderDomains(domains) {
    if (!Array.isArray(domains) || domains.length === 0) {
        return '';
    }
    return domains.join('\n') + '\n';
}

function renderHosts(domains) {
    if (!Array.isArray(domains) || domains.length === 0) {
        return '';
    }
    return domains.map((domain) => `${HOSTS_SINKHOLE_IP} ${domain}`).join('\n') + '\n';
}

function parseCsvSet(value, normalizer = (entry) => entry) {
    return new Set(
        String(value || '')
            .split(',')
            .map((entry) => normalizer(String(entry || '').trim()))
            .filter(Boolean)
    );
}

function pickHeader(headers, name) {
    const rawValue = headers?.[name];
    if (Array.isArray(rawValue)) {
        return rawValue.join(', ');
    }
    return String(rawValue || '').trim();
}

function buildRelativeFeedPaths(feedId) {
    return {
        domains: `/api/network-protection/feeds/${feedId}?format=domains`,
        hosts: `/api/network-protection/feeds/${feedId}?format=hosts`
    };
}

function buildRecommendedDirectUpstreams() {
    return Object.fromEntries(
        Object.entries(RECOMMENDED_DIRECT_UPSTREAMS).map(([category, sources]) => [
            category,
            sources.map((source) => ({
                ...source,
                update_mode: 'direct-upstream'
            }))
        ])
    );
}

function buildDefaultFeedManifest() {
    const generatedAt = 0;
    const expiresAt = 0;
    const proxyFeeds = PROXIED_FEEDS.map((definition) => ({
        id: definition.id,
        title: definition.title,
        description: definition.description,
        available: false,
        stale: false,
        derived: false,
        domain_count: 0,
        source_count: definition.sources.length,
        successful_source_count: 0,
        checksum: '',
        etag: '',
        updated_at: 0,
        expires_at: 0,
        last_error: null,
        paths: buildRelativeFeedPaths(definition.id),
        formats: Array.from(FEED_FORMATS),
        sources: definition.sources.map((source) => ({
            id: source.id,
            title: source.title,
            provider: source.provider,
            homepage: source.homepage,
            url: source.url,
            format: source.format,
            license: source.license,
            status: 'not-fetched',
            domain_count: 0,
            fetched_at: 0,
            last_modified: '',
            etag: '',
            final_url: ''
        }))
    }));

    proxyFeeds.push({
        id: 'combined',
        title: 'Combined network-protection feed',
        description: 'Union of the proxied ad/tracker and dangerous-site feeds.',
        available: false,
        stale: false,
        derived: true,
        derived_from: PROXIED_FEEDS.map((feed) => feed.id),
        domain_count: 0,
        source_count: proxyFeeds.length,
        successful_source_count: 0,
        checksum: '',
        etag: '',
        updated_at: 0,
        expires_at: 0,
        last_error: null,
        paths: buildRelativeFeedPaths('combined'),
        formats: Array.from(FEED_FORMATS),
        sources: []
    });

    return {
        version: 1,
        generated_at: generatedAt,
        expires_at: expiresAt,
        refresh_interval_ms: FEED_REFRESH_MS,
        proxy_feeds: proxyFeeds,
        recommended_direct_upstreams: buildRecommendedDirectUpstreams(),
        summary: {
            available_proxy_feed_count: 0,
            total_proxy_feed_count: proxyFeeds.length,
            total_domains: 0,
            cache_max_age_sec: FEED_RESPONSE_CACHE_MAX_AGE_SEC
        }
    };
}

function buildFeedSummary() {
    const manifest = readFeedManifestCache() || buildDefaultFeedManifest();
    return {
        manifest_path: '/api/network-protection/manifest',
        refresh_interval_ms: Number(manifest.refresh_interval_ms || FEED_REFRESH_MS),
        generated_at: Number(manifest.generated_at || 0),
        expires_at: Number(manifest.expires_at || 0),
        available_proxy_feed_count: Number(manifest.summary?.available_proxy_feed_count || 0),
        total_domains: Number(manifest.summary?.total_domains || 0),
        proxy_feeds: ensureArray(manifest.proxy_feeds).map((feed) => ({
            id: feed.id,
            title: feed.title,
            available: Boolean(feed.available),
            stale: Boolean(feed.stale),
            derived: Boolean(feed.derived),
            domain_count: Number(feed.domain_count || 0),
            paths: feed.paths || buildRelativeFeedPaths(feed.id),
            formats: Array.isArray(feed.formats) && feed.formats.length > 0 ? feed.formats : Array.from(FEED_FORMATS),
            updated_at: Number(feed.updated_at || 0)
        })),
        recommended_direct_upstreams: buildRecommendedDirectUpstreams()
    };
}

function ensureArray(value) {
    return Array.isArray(value) ? value : [];
}

function isManifestFresh(manifest) {
    if (!manifest || typeof manifest !== 'object') {
        return false;
    }
    if (Number(manifest.expires_at || 0) <= nowMs()) {
        return false;
    }
    return ensureArray(manifest.proxy_feeds)
        .filter((feed) => feed && feed.available)
        .every((feed) => fileExists(feedDomainFilePath(feed.id)));
}

function normalizeFeedId(feedId) {
    const normalized = String(feedId || '').trim().toLowerCase();
    const mapped = FEED_ID_ALIASES[normalized] || normalized;
    if (!PROXIED_FEED_IDS.has(mapped)) {
        throw createHttpError(404, 'Unknown network protection feed', 'NETWORK_PROTECTION_FEED_NOT_FOUND');
    }
    return mapped;
}

function normalizeFeedFormat(format) {
    const normalized = String(format || 'domains').trim().toLowerCase() || 'domains';
    if (!FEED_FORMATS.has(normalized)) {
        throw createHttpError(400, 'format must be one of domains or hosts', 'INVALID_NETWORK_PROTECTION_FEED_FORMAT');
    }
    return normalized;
}

async function getUserDevMode(userId) {
    const state = await getUserDeveloperModeState(userId);
    if (!state.exists) {
        return {
            exists: false,
            developerMode: false
        };
    }

    return {
        exists: true,
        developerMode: state.developerMode
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
        last_event_at: 0,
        last_seen_at: 0
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

function buildStatus(toggles, feedSummary) {
    const requestedEnabled = Boolean(toggles.protection_enabled);
    const remoteFeedsAvailable = true;
    const warmedProxyFeeds = Number(feedSummary?.available_proxy_feed_count || 0) > 0;

    let message;
    if (!requestedEnabled) {
        message = 'Защита в сети выключена';
    } else if (!warmedProxyFeeds) {
        message = 'Сервер настроен на автообновляемые списки, но кэш правил ещё не прогрет';
    } else {
        message = 'Списки блокировки доступны, но локальный движок платформы должен применять их';
    }

    return {
        mode: 'unified',
        requested_enabled: requestedEnabled,
        effective_enabled: false,
        local_enforcement_available: false,
        local_enforcement_active: false,
        remote_rule_feeds_available: remoteFeedsAvailable,
        feed_manifest_available: true,
        warmed_proxy_feeds: warmedProxyFeeds,
        message
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
            last_event_at: Math.max(0, Number(source.last_event_at || 0) || 0),
            last_seen_at: Math.max(0, Number(source.last_seen_at || source.lastSeenAt || 0) || 0)
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

function touchPlatformPresence(userState, platform, timestamp = nowMs()) {
    if (!userState?.platforms?.[platform]) {
        userState.platforms[platform] = createPlatformState();
    }
    userState.platforms[platform].last_seen_at = Math.max(
        Number(userState.platforms[platform].last_seen_at || 0) || 0,
        Number(timestamp || 0) || 0
    );
}

function buildPlatformProtectionState(userState, platform) {
    const platformState = userState.platforms[platform] || createPlatformState();
    const requestedEnabled = Boolean(userState?.toggles?.protection_enabled);
    const lastSeenAt = Number(platformState.last_seen_at || 0) || 0;
    const active = requestedEnabled && lastSeenAt > 0;
    return {
        platform,
        state: active ? 'ACTIVE' : 'INACTIVE',
        label: active ? 'Активна' : 'Не активна',
        requested_enabled: requestedEnabled,
        last_seen_at: lastSeenAt,
        last_event_at: Number(platformState.last_event_at || 0) || 0,
        blocked_ads: Number(platformState.blocked_ads || 0) || 0,
        blocked_threats: Number(platformState.blocked_threats || 0) || 0
    };
}

function shapeState(userState, platform, developerMode) {
    const platformState = userState.platforms[platform] || createPlatformState();
    const feedSummary = buildFeedSummary();
    const status = buildStatus(userState.toggles, feedSummary);
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
            counters_only_until_local_filter_is_enabled: true,
            remote_rule_feeds_available: true,
            feed_manifest_available: true,
            feed_formats: Array.from(FEED_FORMATS)
        },
        feeds: feedSummary,
        status,
        limits: {
            ...DEFAULT_LIMITS,
            developer_mode: Boolean(developerMode)
        },
        updated_at: Number(userState.updated_at || 0),
        platform_updated_at: Number(platformState.updated_at || 0),
        last_event_at: Number(platformState.last_event_at || 0),
        last_seen_at: Number(platformState.last_seen_at || 0)
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

function isIpLike(value) {
    const text = String(value || '').trim();
    if (!text) {
        return false;
    }
    if (/^(\d{1,3}\.){3}\d{1,3}$/.test(text)) {
        return true;
    }
    return text.includes(':');
}

function normalizeDomain(rawValue) {
    let value = String(rawValue || '').trim().toLowerCase();
    if (!value) {
        return '';
    }

    value = value
        .replace(/^\|\|/, '')
        .replace(/^\*+\./, '')
        .replace(/^\.+/, '')
        .replace(/\.+$/, '')
        .replace(/^https?:\/\//i, '')
        .trim();

    while (/^(?:0\.0\.0\.0|127\.0\.0\.1|localhost)\./.test(value)) {
        value = value.replace(/^(?:0\.0\.0\.0|127\.0\.0\.1|localhost)\./, '');
    }

    value = value.split(/[/?#]/)[0].trim();
    if (!value) {
        return '';
    }

    try {
        value = new URL(`http://${value}`).hostname.toLowerCase();
    } catch (_) {
        // Ignore URL parsing failures and validate the raw hostname below.
    }

    value = value
        .replace(/^\*+\./, '')
        .replace(/^\.+/, '')
        .replace(/\.+$/, '')
        .trim();

    if (!value || !value.includes('.') || value.length > 253 || isIpLike(value)) {
        return '';
    }

    const labels = value.split('.');
    if (labels.some((label) => {
        return !label ||
            label.length > 63 ||
            label.startsWith('-') ||
            label.endsWith('-') ||
            !/^(xn--)?[a-z0-9-]+$/.test(label);
    })) {
        return '';
    }

    if (value === 'localhost' || value.endsWith('.local') || value.endsWith('.localhost')) {
        return '';
    }

    return value;
}

function extractDomainFromHostsLine(line) {
    const clean = String(line || '').split('#')[0].trim();
    if (!clean) {
        return '';
    }
    const tokens = clean.split(/\s+/).filter(Boolean);
    if (tokens.length >= 2 && isIpLike(tokens[0])) {
        return normalizeDomain(tokens[1]);
    }
    if (tokens.length === 1) {
        return normalizeDomain(tokens[0]);
    }
    return '';
}

function extractDomainFromAdblockLine(line) {
    let clean = String(line || '').trim();
    if (!clean || clean.startsWith('!') || clean.startsWith('[') || clean.startsWith('@@')) {
        return '';
    }

    clean = clean.replace(/\$.*$/, '');
    clean = clean
        .replace(/^\|\|/, '')
        .replace(/^\|https?:\/\//i, '')
        .replace(/^https?:\/\//i, '')
        .replace(/^\|/, '')
        .replace(/^\*+/, '')
        .replace(/\^.*$/, '')
        .trim();

    return normalizeDomain(clean);
}

function extractDomainFromUrlLine(line) {
    const clean = String(line || '').split('#')[0].trim();
    if (!clean) {
        return '';
    }
    try {
        return normalizeDomain(new URL(clean).hostname);
    } catch (_) {
        return normalizeDomain(clean);
    }
}

function extractDomainFromLine(line, format) {
    const normalizedFormat = String(format || 'domains').trim().toLowerCase();
    const trimmed = String(line || '').trim();
    if (!trimmed) {
        return '';
    }
    if (trimmed.startsWith('#') || trimmed.startsWith(';')) {
        return '';
    }

    if (normalizedFormat === 'hosts') {
        return extractDomainFromHostsLine(trimmed);
    }
    if (normalizedFormat === 'adblock') {
        return extractDomainFromAdblockLine(trimmed);
    }
    if (normalizedFormat === 'url') {
        return extractDomainFromUrlLine(trimmed);
    }

    return normalizeDomain(trimmed.split('#')[0].trim());
}

function extractDomainsFromText(text, format) {
    const domains = new Set();
    for (const line of String(text || '').split(/\r?\n/)) {
        const domain = extractDomainFromLine(line, format);
        if (domain) {
            domains.add(domain);
        }
    }
    return domains;
}

function fetchText(url, redirectDepth = 0) {
    return new Promise((resolve, reject) => {
        const requestUrl = new URL(url);
        const transport = requestUrl.protocol === 'http:' ? http : https;
        const request = transport.get(requestUrl, {
            headers: {
                'User-Agent': 'NeuralV-NetworkProtection/1.0',
                Accept: 'text/plain, text/*;q=0.9, */*;q=0.1'
            }
        }, (response) => {
            const statusCode = Number(response.statusCode || 0);
            const location = pickHeader(response.headers, 'location');

            if ([301, 302, 307, 308].includes(statusCode) && location) {
                response.resume();
                if (redirectDepth >= 5) {
                    reject(new Error(`Too many redirects while fetching ${url}`));
                    return;
                }
                const redirectedUrl = new URL(location, requestUrl).toString();
                resolve(fetchText(redirectedUrl, redirectDepth + 1));
                return;
            }

            if (statusCode < 200 || statusCode >= 300) {
                response.resume();
                reject(new Error(`Unexpected status ${statusCode} while fetching ${url}`));
                return;
            }

            const chunks = [];
            let totalBytes = 0;
            response.setEncoding('utf8');
            response.on('data', (chunk) => {
                totalBytes += Buffer.byteLength(chunk, 'utf8');
                if (totalBytes > FEED_FETCH_MAX_BYTES) {
                    request.destroy(new Error(`Feed at ${url} exceeded ${FEED_FETCH_MAX_BYTES} bytes`));
                    return;
                }
                chunks.push(chunk);
            });
            response.on('end', () => {
                resolve({
                    text: chunks.join(''),
                    finalUrl: requestUrl.toString(),
                    headers: response.headers,
                    statusCode
                });
            });
        });

        request.setTimeout(FEED_FETCH_TIMEOUT_MS, () => {
            request.destroy(new Error(`Timed out after ${FEED_FETCH_TIMEOUT_MS}ms while fetching ${url}`));
        });
        request.on('error', reject);
    });
}

async function fetchSourceDomains(source) {
    const startedAt = nowMs();
    try {
        const response = await fetchText(source.url);
        const domains = Array.from(extractDomainsFromText(response.text, source.format)).sort();
        return {
            ok: true,
            source,
            domains,
            metadata: {
                id: source.id,
                title: source.title,
                provider: source.provider,
                homepage: source.homepage,
                url: source.url,
                format: source.format,
                license: source.license,
                status: 'ok',
                domain_count: domains.length,
                fetched_at: startedAt,
                last_modified: pickHeader(response.headers, 'last-modified'),
                etag: pickHeader(response.headers, 'etag'),
                final_url: response.finalUrl
            }
        };
    } catch (error) {
        return {
            ok: false,
            source,
            domains: [],
            metadata: {
                id: source.id,
                title: source.title,
                provider: source.provider,
                homepage: source.homepage,
                url: source.url,
                format: source.format,
                license: source.license,
                status: 'error',
                domain_count: 0,
                fetched_at: startedAt,
                last_modified: '',
                etag: '',
                final_url: '',
                error: String(error?.message || error)
            }
        };
    }
}

function getCachedFeedMetadata(previousManifest, feedId) {
    return ensureArray(previousManifest?.proxy_feeds).find((feed) => feed?.id === feedId) || null;
}

function summarizeFeedErrors(results) {
    const failed = ensureArray(results)
        .filter((result) => !result.ok)
        .map((result) => `${result.source.id}: ${result.metadata.error}`);
    return failed.length > 0 ? failed.join('; ') : null;
}

function buildDerivedCombinedFeed(feedEntries, generatedAt) {
    const combinedSet = new Set();
    const derivedFrom = [];

    for (const entry of feedEntries) {
        if (!entry?.meta?.available) {
            continue;
        }
        derivedFrom.push(entry.meta.id);
        for (const domain of ensureArray(entry.domains)) {
            combinedSet.add(domain);
        }
    }

    const domains = Array.from(combinedSet).sort();
    if (domains.length > 0) {
        writeDomainFile('combined', domains);
    }
    const checksum = sha256(renderDomains(domains));
    return {
        domains,
        meta: {
            id: 'combined',
            title: 'Combined network-protection feed',
            description: 'Union of the proxied ad/tracker and dangerous-site feeds.',
            available: domains.length > 0,
            stale: false,
            derived: true,
            derived_from: derivedFrom,
            domain_count: domains.length,
            source_count: derivedFrom.length,
            successful_source_count: derivedFrom.length,
            checksum,
            etag: checksum ? `"${checksum}"` : '',
            updated_at: generatedAt,
            expires_at: generatedAt + FEED_REFRESH_MS,
            last_error: domains.length > 0 ? null : 'No source feeds were available to build the combined feed',
            paths: buildRelativeFeedPaths('combined'),
            formats: Array.from(FEED_FORMATS),
            sources: []
        }
    };
}

async function buildProxyFeed(definition, previousManifest, generatedAt) {
    const results = await Promise.all(definition.sources.map((source) => fetchSourceDomains(source)));
    const successResults = results.filter((result) => result.ok);

    if (successResults.length === 0) {
        const cachedDomains = readDomainFile(definition.id);
        const cachedMeta = getCachedFeedMetadata(previousManifest, definition.id);
        if (cachedDomains.length > 0 && cachedMeta) {
            return {
                domains: cachedDomains,
                meta: {
                    ...cachedMeta,
                    stale: true,
                    last_error: summarizeFeedErrors(results),
                    paths: buildRelativeFeedPaths(definition.id),
                    formats: Array.from(FEED_FORMATS),
                    sources: results.map((result) => result.metadata)
                }
            };
        }

        return {
            domains: [],
            meta: {
                id: definition.id,
                title: definition.title,
                description: definition.description,
                available: false,
                stale: false,
                derived: false,
                domain_count: 0,
                source_count: definition.sources.length,
                successful_source_count: 0,
                checksum: '',
                etag: '',
                updated_at: generatedAt,
                expires_at: generatedAt + FEED_REFRESH_MS,
                last_error: summarizeFeedErrors(results),
                paths: buildRelativeFeedPaths(definition.id),
                formats: Array.from(FEED_FORMATS),
                sources: results.map((result) => result.metadata)
            }
        };
    }

    const domainSet = new Set();
    for (const result of successResults) {
        for (const domain of result.domains) {
            domainSet.add(domain);
        }
    }

    const domains = Array.from(domainSet).sort();
    writeDomainFile(definition.id, domains);

    const checksum = sha256(renderDomains(domains));
    return {
        domains,
        meta: {
            id: definition.id,
            title: definition.title,
            description: definition.description,
            available: true,
            stale: successResults.length !== results.length,
            derived: false,
            domain_count: domains.length,
            source_count: definition.sources.length,
            successful_source_count: successResults.length,
            checksum,
            etag: checksum ? `"${checksum}"` : '',
            updated_at: generatedAt,
            expires_at: generatedAt + FEED_REFRESH_MS,
            last_error: summarizeFeedErrors(results),
            paths: buildRelativeFeedPaths(definition.id),
            formats: Array.from(FEED_FORMATS),
            sources: results.map((result) => result.metadata)
        }
    };
}

async function rebuildFeedManifest() {
    const previousManifest = readFeedManifestCache();
    const generatedAt = nowMs();
    const feedEntries = [];

    for (const definition of PROXIED_FEEDS) {
        feedEntries.push(await buildProxyFeed(definition, previousManifest, generatedAt));
    }

    const combinedFeed = buildDerivedCombinedFeed(feedEntries, generatedAt);
    const proxyFeeds = feedEntries.map((entry) => entry.meta).concat(combinedFeed.meta);
    const totalDomains = proxyFeeds
        .filter((feed) => feed.id !== 'combined')
        .reduce((sum, feed) => sum + Number(feed.domain_count || 0), 0);
    const availableProxyFeedCount = proxyFeeds.filter((feed) => feed.available).length;

    const manifest = {
        version: 1,
        generated_at: generatedAt,
        expires_at: generatedAt + FEED_REFRESH_MS,
        refresh_interval_ms: FEED_REFRESH_MS,
        proxy_feeds: proxyFeeds,
        recommended_direct_upstreams: buildRecommendedDirectUpstreams(),
        summary: {
            available_proxy_feed_count: availableProxyFeedCount,
            total_proxy_feed_count: proxyFeeds.length,
            total_domains: totalDomains,
            cache_max_age_sec: FEED_RESPONSE_CACHE_MAX_AGE_SEC
        }
    };

    writeFeedManifestCache(manifest);
    return manifest;
}

async function getNetworkProtectionManifest() {
    const cachedManifest = readFeedManifestCache();
    if (isManifestFresh(cachedManifest)) {
        return cachedManifest;
    }

    if (!refreshPromise) {
        refreshPromise = rebuildFeedManifest().finally(() => {
            refreshPromise = null;
        });
    }

    try {
        return await refreshPromise;
    } catch (error) {
        if (cachedManifest) {
            return cachedManifest;
        }
        throw createHttpError(
            503,
            `Network-protection feeds are unavailable: ${String(error?.message || error)}`,
            'NETWORK_PROTECTION_FEEDS_UNAVAILABLE'
        );
    }
}

async function getNetworkProtectionFeed(feedId, format = 'domains') {
    const normalizedFeedId = normalizeFeedId(feedId);
    const normalizedFormat = normalizeFeedFormat(format);
    const manifest = await getNetworkProtectionManifest();
    const feedMetadata = ensureArray(manifest.proxy_feeds).find((feed) => feed?.id === normalizedFeedId);

    if (!feedMetadata || !feedMetadata.available) {
        throw createHttpError(404, 'Requested network-protection feed is not available', 'NETWORK_PROTECTION_FEED_UNAVAILABLE');
    }

    const domains = readDomainFile(normalizedFeedId);
    if (domains.length === 0) {
        throw createHttpError(503, 'Cached network-protection feed is empty', 'NETWORK_PROTECTION_FEED_CACHE_EMPTY');
    }

    const body = normalizedFormat === 'hosts'
        ? renderHosts(domains)
        : renderDomains(domains);
    const checksum = sha256(body);

    return {
        body,
        checksum,
        etag: checksum ? `"${checksum}"` : '',
        format: normalizedFormat,
        cacheMaxAgeSec: Number(manifest.summary?.cache_max_age_sec || FEED_RESPONSE_CACHE_MAX_AGE_SEC),
        metadata: feedMetadata
    };
}

async function getNetworkProtectionState(userId, platform) {
    const context = await resolveContext(userId, platform);
    const store = readStore();
    const userState = ensureUserState(store, userId);
    touchPlatformPresence(userState, context.platform);
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
    touchPlatformPresence(userState, context.platform, userState.updated_at);

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

    touchPlatformPresence(userState, context.platform, timestamp);
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

async function getNetworkProtectionProfileOverview(userId) {
    const devState = await getUserDevMode(userId);
    if (!devState.exists) {
        throw createHttpError(404, 'User not found', 'USER_NOT_FOUND');
    }

    const store = readStore();
    const userState = ensureUserState(store, userId);
    writeStore(store);

    return {
        toggles: {
            protection_enabled: Boolean(userState.toggles.protection_enabled),
            ad_block_enabled: Boolean(userState.toggles.ad_block_enabled),
            unsafe_sites_enabled: Boolean(userState.toggles.unsafe_sites_enabled)
        },
        updated_at: Number(userState.updated_at || 0) || 0,
        platforms: {
            android: buildPlatformProtectionState(userState, 'android'),
            windows: buildPlatformProtectionState(userState, 'windows'),
            linux: buildPlatformProtectionState(userState, 'linux')
        }
    };
}

module.exports = {
    getNetworkProtectionManifest,
    getNetworkProtectionFeed,
    getNetworkProtectionState,
    getNetworkProtectionProfileOverview,
    updateNetworkProtectionState,
    recordNetworkProtectionEvent
};
