export type ArtifactMetadata = Record<string, unknown> & {
  available?: boolean;
  source_branch?: string;
  source_label?: string;
  daemonUrl?: string;
};

export type ReleaseArtifact = {
  platform: 'android' | 'windows' | 'linux' | 'shell' | 'site' | 'nv' | 'linux_shell' | string;
  channel?: string;
  version?: string;
  sha256?: string;
  downloadUrl?: string;
  fileName?: string;
  installCommand?: string;
  notes?: string[];
  metadata?: ArtifactMetadata;
};

export type ReleaseManifest = {
  generatedAt?: string | number;
  releaseChannel?: string;
  platform?: string;
  version?: string;
  downloadUrl?: string;
  setupUrl?: string;
  portableUrl?: string;
  installCommand?: string;
  artifacts: ReleaseArtifact[];
};

function cleanText(value: unknown): string | null {
  if (typeof value === 'string') {
    const normalized = value.trim().replace(/\s+/g, ' ');
    return normalized.length > 0 ? normalized : null;
  }

  if (typeof value === 'number') {
    return String(value);
  }

  return null;
}

function pushRequirement(lines: string[], value: unknown, label?: string) {
  const text = cleanText(value);
  if (!text) {
    return;
  }

  lines.push(label ? `${label}: ${text}` : text);
}

function readRequirementObject(value: Record<string, unknown>): string[] {
  const lines: string[] = [];
  const knownFields: Array<[string, string]> = [
    ['os', 'Система'],
    ['platform', 'Система'],
    ['minimumOs', 'Минимум'],
    ['minimum_os', 'Минимум'],
    ['minOs', 'Минимум'],
    ['min_os', 'Минимум'],
    ['minimumAndroid', 'Android'],
    ['minimum_android', 'Android'],
    ['minSdk', 'Android'],
    ['min_sdk', 'Android'],
    ['minimumWindows', 'Windows'],
    ['minimum_windows', 'Windows'],
    ['minimumLinux', 'Linux'],
    ['minimum_linux', 'Linux'],
    ['architecture', 'Архитектура'],
    ['architectures', 'Архитектура'],
    ['runtime', 'Runtime'],
    ['desktopEnvironment', 'Desktop'],
    ['desktop_environment', 'Desktop'],
    ['ram', 'RAM'],
    ['storage', 'Диск']
  ];

  for (const [field, label] of knownFields) {
    const raw = value[field];
    if (Array.isArray(raw)) {
      const parts = raw
        .map((item) => cleanText(item))
        .filter((item): item is string => Boolean(item));
      if (parts.length > 0) {
        lines.push(`${label}: ${parts.join(', ')}`);
      }
      continue;
    }

    pushRequirement(lines, raw, label);
  }

  return lines;
}

function readRequirementCandidate(value: unknown): string[] {
  if (Array.isArray(value)) {
    return value
      .flatMap((entry) => readRequirementCandidate(entry))
      .filter((entry, index, list) => list.indexOf(entry) === index);
  }

  const text = cleanText(value);
  if (text) {
    return [text];
  }

  if (value && typeof value === 'object') {
    return readRequirementObject(value as Record<string, unknown>);
  }

  return [];
}

function stableArtifactDownloadUrl(
  platform: string,
  metadata: ArtifactMetadata | undefined,
  fallbackUrl: string | undefined
): string | undefined {
  if (fallbackUrl && fallbackUrl.includes('/releases/download/')) {
    return fallbackUrl;
  }

  const branch = typeof metadata?.source_branch === 'string' ? metadata.source_branch : '';
  if (!branch) {
    return fallbackUrl;
  }

  const base = `https://raw.githubusercontent.com/Perdonus/fatalerror/${branch}`;
  const releaseTag = typeof metadata?.releaseTag === 'string' ? metadata.releaseTag : '';
  switch (platform) {
    case 'windows':
      return releaseTag
        ? `https://github.com/Perdonus/fatalerror/releases/download/${releaseTag}/neuralv-windows.zip`
        : fallbackUrl;
    case 'linux':
      return `${base}/linux/neuralv-linux.tar.gz`;
    case 'shell':
      return `${base}/shell/neuralv-shell-linux.tar.gz`;
    case 'android':
      return `${base}/android/neuralv-android-release.apk`;
    default:
      return fallbackUrl;
  }
}

export const fallbackManifest: ReleaseManifest = {
  generatedAt: 'pending',
  releaseChannel: 'main',
  artifacts: [
    { platform: 'android', channel: 'release', version: 'pending' },
    { platform: 'windows', channel: 'beta', version: 'pending' },
    { platform: 'linux', channel: 'beta', version: 'pending' },
    { platform: 'nv', channel: 'beta', version: 'pending' },
    { platform: 'shell', channel: 'beta', version: 'pending' }
  ]
};

const manifestUrl =
  (import.meta.env.VITE_RELEASE_MANIFEST_URL as string | undefined) || '/basedata/api/releases/manifest';

export async function fetchReleaseManifest(signal?: AbortSignal, platform?: string): Promise<ReleaseManifest> {
  const manifestRequestUrl = platform
    ? `${manifestUrl}${manifestUrl.includes('?') ? '&' : '?'}platform=${encodeURIComponent(platform)}`
    : manifestUrl;

  const response = await fetch(manifestRequestUrl, {
    method: 'GET',
    headers: { Accept: 'application/json' },
    cache: 'no-store',
    signal
  });

  if (!response.ok) {
    throw new Error(`Manifest request failed: ${response.status}`);
  }

  const data = (await response.json()) as Record<string, unknown>;
  const nestedManifest = (data.manifest as Record<string, unknown> | undefined) ?? undefined;
  const nestedArtifacts =
    nestedManifest && typeof nestedManifest === 'object' && 'artifacts' in nestedManifest
      ? (nestedManifest.artifacts as unknown)
      : undefined;

  const rawArtifacts =
    (Array.isArray(data.artifacts) ? data.artifacts : undefined) ??
    (Array.isArray(nestedArtifacts)
      ? nestedArtifacts
      : (nestedArtifacts && typeof nestedArtifacts === 'object'
          ? Object.values(nestedArtifacts as Record<string, unknown>)
          : []));

  const artifacts = rawArtifacts
    .filter((item): item is Record<string, unknown> => typeof item === 'object' && item !== null)
    .map((item) => {
      const platformRaw = String(item.platform ?? '').toLowerCase();
      const platform = platformRaw === 'linux_shell' ? 'shell' : platformRaw === 'website' ? 'site' : platformRaw;
      const metadata = item.metadata && typeof item.metadata === 'object'
        ? (item.metadata as ArtifactMetadata)
        : undefined;
      const versionedDownloadUrl =
        typeof item.downloadUrl === 'string'
          ? item.downloadUrl
          : (typeof item.download_url === 'string' ? item.download_url : undefined);
      const downloadUrl = stableArtifactDownloadUrl(platform, metadata, versionedDownloadUrl);

      return {
        platform,
        channel: typeof item.channel === 'string' ? item.channel : undefined,
        version: typeof item.version === 'string' ? item.version : undefined,
        sha256: typeof item.sha256 === 'string' ? item.sha256 : undefined,
        downloadUrl,
        fileName:
          typeof item.fileName === 'string'
            ? item.fileName
            : (typeof item.file_name === 'string'
                ? item.file_name
                : (typeof item.artifact_name === 'string' ? item.artifact_name : undefined)),
        installCommand:
          typeof item.installCommand === 'string'
            ? item.installCommand
            : (typeof item.install_command === 'string' ? item.install_command : undefined),
        notes: Array.isArray(item.notes)
          ? item.notes.filter((note): note is string => typeof note === 'string')
          : undefined,
        metadata: metadata
          ? {
              ...metadata,
              versioned_download_url: versionedDownloadUrl
            }
          : undefined
      } satisfies ReleaseArtifact;
    });

  return {
    platform: typeof data.platform === 'string' ? data.platform : undefined,
    version: typeof data.version === 'string' ? data.version : undefined,
    downloadUrl: typeof data.download_url === 'string' ? data.download_url : undefined,
    setupUrl: typeof data.setupUrl === 'string' ? data.setupUrl : undefined,
    portableUrl: typeof data.portableUrl === 'string' ? data.portableUrl : undefined,
    installCommand:
      typeof data.install_command === 'string'
        ? data.install_command
        : (typeof data.installCommand === 'string' ? data.installCommand : undefined),
    generatedAt:
      (typeof data.generatedAt === 'string' || typeof data.generatedAt === 'number')
        ? data.generatedAt
        : ((typeof data.generated_at === 'string' || typeof data.generated_at === 'number')
            ? (data.generated_at as string | number)
            : (nestedManifest?.generated_at as string | number | undefined)),
    releaseChannel:
      typeof data.releaseChannel === 'string'
        ? data.releaseChannel
        : (typeof data.release_channel === 'string' ? (data.release_channel as string) : 'main'),
    artifacts
  };
}

export function getArtifact(manifest: ReleaseManifest, platform: ReleaseArtifact['platform']): ReleaseArtifact | undefined {
  return manifest.artifacts.find((artifact) => artifact.platform === platform);
}

export function getArtifactVersion(manifest: ReleaseManifest, platform: ReleaseArtifact['platform']): string | null {
  const artifact = getArtifact(manifest, platform);
  const direct = cleanText(artifact?.version);
  if (direct) {
    return direct;
  }

  if (manifest.platform === platform) {
    return cleanText(manifest.version);
  }

  return null;
}

export function getArtifactSystemRequirements(
  artifact?: ReleaseArtifact,
  manifest?: ReleaseManifest
): string[] {
  const metadata = artifact?.metadata && typeof artifact.metadata === 'object'
    ? (artifact.metadata as Record<string, unknown>)
    : undefined;

  const preferredCandidates: unknown[] = [
    metadata?.system_requirements,
    metadata?.systemRequirements
  ];
  const preferred = preferredCandidates
    .flatMap((candidate) => readRequirementCandidate(candidate))
    .map((entry) => entry.trim())
    .filter((entry): entry is string => entry.length > 0);

  if (preferred.length > 0) {
    return preferred.filter((entry, index, list) => list.indexOf(entry) === index);
  }

  const candidates: unknown[] = [
    metadata?.requirements,
    metadata?.minimumRequirements,
    metadata?.minimum_requirements,
    metadata?.supportedSystems,
    metadata?.supported_systems,
    metadata?.minimumOs,
    metadata?.minimum_os,
    metadata?.minOs,
    metadata?.min_os,
    metadata?.minimumAndroid,
    metadata?.minimum_android,
    metadata?.minSdk,
    metadata?.min_sdk,
    metadata?.minimumWindows,
    metadata?.minimum_windows,
    metadata?.minimumLinux,
    metadata?.minimum_linux,
    metadata?.architecture,
    metadata?.architectures,
    metadata?.runtime,
    metadata?.desktopEnvironment,
    metadata?.desktop_environment
  ];

  if (manifest?.platform && manifest.platform === artifact?.platform) {
    candidates.push(
      (manifest as unknown as Record<string, unknown>).systemRequirements,
      (manifest as unknown as Record<string, unknown>).system_requirements,
      (manifest as unknown as Record<string, unknown>).requirements
    );
  }

  const lines = candidates
    .flatMap((candidate) => readRequirementCandidate(candidate))
    .map((entry) => entry.trim())
    .filter((entry): entry is string => entry.length > 0);

  return lines.filter((entry, index, list) => list.indexOf(entry) === index);
}

export function isArtifactReady(artifact?: ReleaseArtifact): boolean {
  if (!artifact?.downloadUrl) {
    return false;
  }

  if (artifact.metadata && typeof artifact.metadata.available === 'boolean') {
    return artifact.metadata.available;
  }

  return artifact.version !== 'pending';
}
