const fs = require('fs');
const path = require('path');

const PACKAGE_REGISTRY_PATH = path.resolve(__dirname, '../data/package-registry.json');
const PACKAGE_REGISTRY_TIMEOUT_MS = parseInt(process.env.PACKAGE_REGISTRY_TIMEOUT_MS || '10000', 10);
const PACKAGE_REGISTRY_CACHE_TTL_MS = parseInt(process.env.PACKAGE_REGISTRY_CACHE_TTL_MS || '60000', 10);
const PACKAGE_REGISTRY_REMOTE_URL = String(
    process.env.PACKAGE_REGISTRY_REMOTE_URL || 'https://raw.githubusercontent.com/Perdonus/NV/main/registry/packages.json'
).trim();

let registryCache = null;
let registryCacheExpiresAt = 0;

function loadLocalRegistryConfig() {
    const content = fs.readFileSync(PACKAGE_REGISTRY_PATH, 'utf8');
    const parsed = JSON.parse(content);
    return Array.isArray(parsed?.packages) ? parsed.packages : [];
}

function normalizeText(value) {
    return String(value || '').trim().toLowerCase();
}

function normalizeOs(value) {
    const normalized = normalizeText(value);
    if (normalized === 'win32') return 'windows';
    return normalized;
}

function semverParts(raw) {
    const matched = String(raw || '').trim().match(/^(\d+)\.(\d+)\.(\d+)$/);
    if (!matched) return null;
    return matched.slice(1).map((value) => Number(value));
}

function compareSemver(left, right) {
    const a = semverParts(left);
    const b = semverParts(right);
    if (!a || !b) return 0;
    for (let index = 0; index < 3; index += 1) {
        if (a[index] !== b[index]) return a[index] > b[index] ? 1 : -1;
    }
    return 0;
}

function manifestUrl(source) {
    return `https://raw.githubusercontent.com/${source.repo}/${source.branch}/manifest.json`;
}

async function fetchJson(url) {
    const response = await fetch(url, {
        method: 'GET',
        headers: { Accept: 'application/json' },
        signal: AbortSignal.timeout(PACKAGE_REGISTRY_TIMEOUT_MS)
    });

    if (!response.ok) {
        throw new Error(`${url} responded with ${response.status}`);
    }
    return response.json();
}

async function loadRegistryConfig() {
    if (registryCache && registryCacheExpiresAt > Date.now()) {
        return registryCache;
    }

    const localPackages = loadLocalRegistryConfig();
    let packages = localPackages;
    let source = 'local';
    let sourceUrl = null;
    let fetchedAt = new Date().toISOString();

    if (PACKAGE_REGISTRY_REMOTE_URL) {
        try {
            const remote = await fetchJson(PACKAGE_REGISTRY_REMOTE_URL);
            if (Array.isArray(remote?.packages)) {
                packages = remote.packages;
                source = 'remote';
                sourceUrl = PACKAGE_REGISTRY_REMOTE_URL;
                fetchedAt = new Date().toISOString();
            }
        } catch (error) {
            console.warn(`Package registry remote fetch failed: ${error instanceof Error ? error.message : String(error)}`);
        }
    }

    registryCache = { packages, source, sourceUrl, fetchedAt };
    registryCacheExpiresAt = Date.now() + PACKAGE_REGISTRY_CACHE_TTL_MS;
    return registryCache;
}

function normalizeArtifact(item) {
    if (!item || typeof item !== 'object') return null;
    const platform = normalizeText(item.platform || item.platform_id || item.id);
    if (!platform) return null;
    return {
        platform,
        channel: String(item.channel || '').trim() || 'main',
        version: String(item.version || '').trim() || 'pending',
        sha256: String(item.sha256 || '').trim(),
        download_url: String(item.download_url || item.downloadUrl || '').trim(),
        install_command: String(item.install_command || item.installCommand || '').trim(),
        update_command: String(item.update_command || item.updateCommand || '').trim(),
        update_policy: String(item.update_policy || item.updatePolicy || '').trim(),
        auto_update: typeof item.auto_update === 'boolean' ? item.auto_update : undefined,
        file_name: String(item.file_name || item.fileName || '').trim(),
        notes: Array.isArray(item.notes) ? item.notes.map((entry) => String(entry).trim()).filter(Boolean) : [],
        metadata: item.metadata && typeof item.metadata === 'object' ? { ...item.metadata } : {}
    };
}

async function fetchSourceArtifact(source) {
    if (!source || source.type !== 'github-branch-manifest') {
        return null;
    }
    const manifest = await fetchJson(manifestUrl(source));
    const artifacts = Array.isArray(manifest?.artifacts) ? manifest.artifacts : [];
    const platform = normalizeText(source.platform);
    const matching = artifacts
        .map(normalizeArtifact)
        .filter(Boolean)
        .filter((artifact) => artifact.platform === platform)
        .sort((left, right) => compareSemver(right.version, left.version));
    return matching[0] || null;
}

function defaultUpdatePolicy(definition) {
    if (typeof definition.update_policy === 'string' && definition.update_policy.trim()) {
        return definition.update_policy.trim();
    }
    const strategy = String(definition.install_strategy || '').trim();
    if (strategy === 'linux-cli-wrapper') return 'nv-command';
    if (strategy === 'windows-self-binary' || strategy === 'unix-self-binary') return 'nv-self';
    if (strategy === 'windows-portable-zip' || strategy === 'linux-portable-tar') return 'startup-auto';
    return 'manual';
}

function defaultAutoUpdate(definition, updatePolicy) {
    if (typeof definition.auto_update === 'boolean') {
        return definition.auto_update;
    }
    return updatePolicy === 'startup-auto';
}

function buildVariantRecord(packageDef, definition, artifact) {
    const updatePolicy = defaultUpdatePolicy(definition);
    const autoUpdate = defaultAutoUpdate(definition, updatePolicy);
    const definitionMetadata = definition.metadata && typeof definition.metadata === 'object' ? definition.metadata : {};
    const artifactMetadata = artifact?.metadata && typeof artifact.metadata === 'object' ? artifact.metadata : {};
    return {
        id: String(definition.id || '').trim(),
        label: String(definition.label || definition.id || '').trim(),
        os: normalizeOs(definition.os),
        is_default: Boolean(definition.default),
        version: artifact?.version || '',
        channel: artifact?.channel || 'main',
        file_name: artifact?.file_name || '',
        download_url: artifact?.download_url || '',
        install_command: String(definition.install_command || artifact?.install_command || '').trim(),
        update_command: String(definition.update_command || artifact?.update_command || '').trim(),
        update_policy: updatePolicy,
        auto_update: autoUpdate,
        sha256: artifact?.sha256 || '',
        install_strategy: String(definition.install_strategy || '').trim(),
        uninstall_strategy: String(definition.uninstall_strategy || '').trim(),
        install_root: String(definition.install_root || '').trim(),
        binary_name: String(definition.binary_name || '').trim(),
        wrapper_name: String(definition.wrapper_name || '').trim(),
        launcher_path: String(definition.launcher_path || '').trim(),
        notes: artifact?.notes?.length ? artifact.notes : [],
        metadata: {
            ...definitionMetadata,
            ...artifactMetadata,
            source: definition.source || null,
            package_name: String(packageDef.name || '').trim(),
            variant_id: String(definition.id || '').trim(),
            update_policy: updatePolicy,
            auto_update: autoUpdate,
            manifest_url: definition.source?.repo && definition.source?.branch ? manifestUrl(definition.source) : ''
        }
    };
}

async function materializePackage(packageDef, os = '') {
    const requestedOs = normalizeOs(os);
    const variantDefs = Array.isArray(packageDef?.variants) ? packageDef.variants : [];
    const chosenDefs = requestedOs
        ? variantDefs.filter((variant) => normalizeOs(variant.os) === requestedOs)
        : variantDefs;

    const variants = [];
    for (const definition of chosenDefs) {
        const artifact = await fetchSourceArtifact(definition.source || {});
        variants.push(buildVariantRecord(packageDef, definition, artifact));
    }

    const latestVersion = variants
        .map((variant) => variant.version)
        .filter(Boolean)
        .sort((left, right) => compareSemver(right, left))[0] || '';

    return {
        name: String(packageDef.name || '').trim(),
        title: String(packageDef.title || packageDef.name || '').trim(),
        description: String(packageDef.description || '').trim(),
        homepage: String(packageDef.homepage || '').trim(),
        latest_version: latestVersion,
        variants
    };
}

async function getPackageRegistry({ os = '' } = {}) {
    const registry = await loadRegistryConfig();
    const materialized = [];
    for (const packageDef of registry.packages) {
        materialized.push(await materializePackage(packageDef, os));
    }
    return {
        success: true,
        source: registry.source,
        source_url: registry.sourceUrl,
        fetched_at: registry.fetchedAt,
        packages: materialized
    };
}

async function getPackageDetails(name, { os = '' } = {}) {
    const registry = await loadRegistryConfig();
    const packageDef = registry.packages.find((entry) => normalizeText(entry.name) === normalizeText(name));
    if (!packageDef) {
        return null;
    }
    return {
        success: true,
        source: registry.source,
        source_url: registry.sourceUrl,
        fetched_at: registry.fetchedAt,
        package: await materializePackage(packageDef, os)
    };
}

function pickVariant(pkg, variantId, requestedVersion) {
    const normalizedVariant = normalizeText(variantId);
    let variants = pkg.variants || [];
    if (normalizedVariant) {
        variants = variants.filter((variant) => normalizeText(variant.id) === normalizedVariant);
    }
    if (!variants.length) {
        return null;
    }
    if (requestedVersion && requestedVersion !== 'latest') {
        return variants.find((variant) => variant.version === requestedVersion) || null;
    }
    return variants.find((variant) => variant.is_default && variant.version)
        || variants.find((variant) => variant.version)
        || variants[0];
}

async function resolvePackage(name, { os = '', version = 'latest', variant = '' } = {}) {
    const details = await getPackageDetails(name, { os });
    if (!details) {
        return {
            status: 404,
            payload: { error: `Пакет ${name} не найден` }
        };
    }

    const selectedVariant = pickVariant(details.package, variant, version);
    if (!selectedVariant) {
        return {
            status: 404,
            payload: { error: `Для пакета ${name} не найден подходящий вариант` }
        };
    }

    return {
        status: 200,
        payload: {
            success: true,
            source: details.source,
            source_url: details.source_url,
            fetched_at: details.fetched_at,
            package: {
                ...details.package,
                resolved_version: selectedVariant.version,
                variant: selectedVariant
            }
        }
    };
}

module.exports = {
    getPackageRegistry,
    getPackageDetails,
    resolvePackage,
    loadRegistryConfig,
    compareSemver
};
