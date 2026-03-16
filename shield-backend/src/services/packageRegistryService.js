const fs = require('fs');
const path = require('path');
const { getReleaseManifest } = require('./releaseManifestService');

const REGISTRY_FILE = path.resolve(__dirname, '../data/package-registry.json');
const REGISTRY_TIMEOUT_MS = parseInt(process.env.PACKAGE_REGISTRY_TIMEOUT_MS || '10000', 10);
const SEMVER_PATTERN = /^\d+\.\d+\.\d+$/;

function loadRegistryFile() {
    const raw = fs.readFileSync(REGISTRY_FILE, 'utf8');
    const parsed = JSON.parse(raw);
    const packages = Array.isArray(parsed?.packages) ? parsed.packages : [];
    return { packages };
}

function normalizeVersion(version) {
    const normalized = String(version || '').trim().toLowerCase();
    if (!normalized || normalized === 'latest') {
        return 'latest';
    }
    if (!SEMVER_PATTERN.test(normalized)) {
        throw new Error(`Неверная версия пакета: ${version}`);
    }
    return normalized;
}

async function fetchJson(url) {
    const response = await fetch(url, {
        method: 'GET',
        headers: { Accept: 'application/json' },
        signal: AbortSignal.timeout(REGISTRY_TIMEOUT_MS)
    });
    if (!response.ok) {
        throw new Error(`${url} responded with ${response.status}`);
    }
    return response.json();
}

function normalizeArtifact(item) {
    if (!item || typeof item !== 'object') {
        return null;
    }
    const platform = String(item.platform || '').trim().toLowerCase();
    if (!platform) {
        return null;
    }
    return {
        platform,
        channel: String(item.channel || '').trim() || 'main',
        version: String(item.version || '').trim() || 'pending',
        sha256: String(item.sha256 || '').trim(),
        download_url: String(item.download_url || item.downloadUrl || '').trim(),
        install_command: String(item.install_command || item.installCommand || '').trim(),
        file_name: String(item.file_name || item.fileName || '').trim(),
        notes: Array.isArray(item.notes) ? item.notes.map((entry) => String(entry)) : [],
        metadata: item.metadata && typeof item.metadata === 'object' ? item.metadata : {}
    };
}

function normalizeArtifacts(manifest) {
    const rawArtifacts = Array.isArray(manifest?.artifacts)
        ? manifest.artifacts
        : Object.values(manifest?.artifacts || {});
    return rawArtifacts.map(normalizeArtifact).filter(Boolean);
}

function rawManifestUrl(source) {
    const repo = String(source.repo || '').trim();
    const branch = String(source.branch || '').trim();
    if (!repo || !branch) {
        return null;
    }
    return `https://raw.githubusercontent.com/${repo}/${branch}/manifest.json`;
}

async function loadArtifactsForSource(source, cache) {
    const sourceType = String(source?.type || '').trim().toLowerCase();
    if (sourceType === 'release_manifest') {
        if (!cache.releaseManifest) {
            cache.releaseManifest = normalizeArtifacts(await getReleaseManifest());
        }
        return cache.releaseManifest;
    }

    let url = null;
    if (sourceType === 'manifest_url') {
        url = String(source.url || '').trim();
    } else if (sourceType === 'github-branch-manifest') {
        url = rawManifestUrl(source);
    }

    if (!url) {
        return [];
    }
    if (!cache.byUrl.has(url)) {
        cache.byUrl.set(url, normalizeArtifacts(await fetchJson(url)));
    }
    return cache.byUrl.get(url) || [];
}

function versionWeight(version) {
    const match = String(version || '').trim().match(/^(\d+)\.(\d+)\.(\d+)$/);
    if (!match) return -1;
    return Number(match[1]) * 1_000_000 + Number(match[2]) * 1_000 + Number(match[3]);
}

async function buildPackageResolution(definition, cache) {
    const targets = Array.isArray(definition.targets) ? definition.targets : [];
    const packageSources = Array.isArray(definition.sources) ? definition.sources : [];
    const resolvedTargets = [];
    let latest = 'pending';

    for (const target of targets) {
        const targetSources = target.source ? [target.source] : packageSources;
        let matchedArtifact = null;

        for (const source of targetSources) {
            const artifacts = await loadArtifactsForSource(source, cache);
            const artifactPlatform = String(target.artifact_platform || source.platform || '').trim().toLowerCase();
            matchedArtifact = artifacts.find((artifact) => artifact.platform === artifactPlatform) || null;
            if (matchedArtifact) {
                break;
            }
        }

        const resolvedTarget = {
            id: String(target.id || ''),
            os: String(target.host_os || target.os || ''),
            arch: String(target.arch || 'amd64'),
            variant: String(target.client_kind || target.variant || ''),
            install_hint: String(target.install_hint || ''),
            artifact: matchedArtifact
        };

        if (matchedArtifact && versionWeight(matchedArtifact.version) > versionWeight(latest)) {
            latest = matchedArtifact.version;
        }

        resolvedTargets.push(resolvedTarget);
    }

    return {
        name: String(definition.name || '').trim().toLowerCase(),
        display_name: String(definition.display_name || definition.title || definition.name || ''),
        summary: String(definition.summary || definition.description || ''),
        homepage_path: String(definition.homepage_path || definition.homepage || ''),
        latest,
        targets: resolvedTargets
    };
}

async function buildResolvedRegistry() {
    const registry = loadRegistryFile();
    const cache = {
        releaseManifest: null,
        byUrl: new Map()
    };

    const packages = [];
    for (const definition of registry.packages) {
        packages.push(await buildPackageResolution(definition, cache));
    }
    return packages;
}

async function getPackageRegistry() {
    return {
        success: true,
        generated_at: new Date().toISOString(),
        packages: await buildResolvedRegistry()
    };
}

async function getPackageDescriptor(name) {
    const packages = await buildResolvedRegistry();
    const match = packages.find((item) => item.name === String(name || '').trim().toLowerCase());
    if (!match) {
        return null;
    }
    return {
        success: true,
        package: match
    };
}

async function resolvePackage(name, options = {}) {
    const packages = await buildResolvedRegistry();
    const normalizedName = String(name || '').trim().toLowerCase();
    const requestedVersion = normalizeVersion(options.version);
    const os = String(options.os || '').trim().toLowerCase();
    const arch = String(options.arch || '').trim().toLowerCase();
    const variant = String(options.variant || '').trim().toLowerCase();

    const pkg = packages.find((item) => item.name === normalizedName);
    if (!pkg) {
        return null;
    }

    const matchedTarget = pkg.targets.find((target) => {
        if (os && String(target.os || '').toLowerCase() !== os) return false;
        if (arch && String(target.arch || '').toLowerCase() !== arch) return false;
        if (variant && String(target.variant || '').toLowerCase() !== variant) return false;
        return true;
    });

    if (!matchedTarget) {
        throw new Error(`Не найден target для пакета ${normalizedName}`);
    }
    if (!matchedTarget.artifact) {
        throw new Error(`Для ${normalizedName} пока нет опубликованного артефакта`);
    }
    if (requestedVersion !== 'latest' && matchedTarget.artifact.version !== requestedVersion) {
        throw new Error(`На сервере нет ${normalizedName}@${requestedVersion}`);
    }

    return {
        success: true,
        package: normalizedName,
        version: matchedTarget.artifact.version,
        target: {
            id: matchedTarget.id,
            os: matchedTarget.os,
            arch: matchedTarget.arch,
            variant: matchedTarget.variant,
            install_hint: matchedTarget.install_hint
        },
        artifact: matchedTarget.artifact
    };
}

module.exports = {
    getPackageRegistry,
    getPackageDescriptor,
    resolvePackage
};
