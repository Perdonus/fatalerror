import { useEffect, useMemo, useState, type CSSProperties } from 'react';
import { useReleaseManifest } from '../hooks/useReleaseManifest';
import { getArtifact } from '../lib/manifest';
import { getPackage, getPackageVariant, PackageVariant } from '../lib/packages';
import { usePackageRegistry } from '../hooks/usePackageRegistry';

type InstallMode = 'gui' | 'cli';
type DistroKey = 'ubuntu' | 'fedora' | 'arch' | 'generic';

type DistroOption = {
  key: DistroKey;
  label: string;
  title: string;
};

type PackageMetadata = {
  downloadUrl?: string;
  url?: string;
  packageType?: string;
  format?: string;
  repoCommands?: string[];
  installCommands?: string[];
};

type VariantMetadataShape = {
  packages?: Partial<Record<DistroKey, PackageMetadata>>;
};

type InstallVariant = {
  title: string;
  commandText: string;
  downloadUrl?: string;
  buttonLabel?: string;
};

const NV_INSTALL_URL = 'https://raw.githubusercontent.com/Perdonus/NV/linux-builds/nv.sh';
const REPO_ROOT = 'https://sosiskibot.ru/neuralv/repo';

const distroOptions: DistroOption[] = [
  { key: 'ubuntu', label: 'Ubuntu / Debian', title: 'Ubuntu, Debian, Pop!_OS, Mint' },
  { key: 'fedora', label: 'Fedora / RHEL', title: 'Fedora, Nobara, RHEL-совместимые' },
  { key: 'arch', label: 'Arch / Manjaro', title: 'Arch, EndeavourOS, Manjaro' },
  { key: 'generic', label: 'Другой Linux', title: 'Любой совместимый x64 Linux' }
];

const compactSegmentsStyle: CSSProperties = {
  display: 'flex',
  gap: '0.6rem',
  flexWrap: 'wrap',
  alignItems: 'center',
  padding: 0,
  background: 'transparent',
  boxShadow: 'none'
};

const compactSegmentStyle: CSSProperties = {
  flex: '0 0 auto',
  width: 'auto',
  minWidth: 'unset'
};

function getMetadata(artifact?: PackageVariant): VariantMetadataShape | undefined {
  return artifact?.metadata && typeof artifact.metadata === 'object'
    ? (artifact.metadata as VariantMetadataShape)
    : undefined;
}

function getGuiPackage(distro: DistroKey, artifact?: PackageVariant): PackageMetadata | undefined {
  return getMetadata(artifact)?.packages?.[distro];
}

function getPackageDownloadUrl(packageMeta?: PackageMetadata, artifact?: PackageVariant) {
  return packageMeta?.downloadUrl ?? packageMeta?.url ?? artifact?.download_url;
}

function buildUbuntuCommands(packageUrl?: string) {
  return [
    '# 1) Подключи репозиторий NeuralV',
    `curl -fsSL ${REPO_ROOT}/debian/neuralv.gpg | sudo gpg --dearmor -o /usr/share/keyrings/neuralv-archive-keyring.gpg`,
    `echo "deb [signed-by=/usr/share/keyrings/neuralv-archive-keyring.gpg] ${REPO_ROOT}/debian stable main" | sudo tee /etc/apt/sources.list.d/neuralv.list >/dev/null`,
    'sudo apt update',
    '',
    '# 2) Установи GUI',
    'sudo apt install neuralv',
    '',
    '# 3) Локальный пакет',
    `# ${packageUrl ?? '<deb-url>'}`
  ].join('\n');
}

function buildFedoraCommands(packageUrl?: string) {
  return [
    '# 1) Подключи репозиторий NeuralV',
    `sudo rpm --import ${REPO_ROOT}/rpm/RPM-GPG-KEY-neuralv`,
    'sudo tee /etc/yum.repos.d/neuralv.repo >/dev/null <<\'EOF\'',
    '[neuralv]',
    'name=NeuralV',
    `baseurl=${REPO_ROOT}/rpm`,
    'enabled=1',
    'gpgcheck=1',
    `gpgkey=${REPO_ROOT}/rpm/RPM-GPG-KEY-neuralv`,
    'EOF',
    '',
    '# 2) Установи GUI',
    'sudo dnf install neuralv',
    '',
    '# 3) Локальный пакет',
    `# ${packageUrl ?? '<rpm-url>'}`
  ].join('\n');
}

function buildArchCommands(packageUrl?: string) {
  return [
    '# 1) Подключи репозиторий NeuralV',
    'sudo install -d /etc/pacman.d',
    `echo "[neuralv]\nServer = ${REPO_ROOT}/arch/$arch" | sudo tee /etc/pacman.d/neuralv-mirrorlist >/dev/null`,
    'if ! grep -q "^\[neuralv\]" /etc/pacman.conf; then',
    '  printf "\n[neuralv]\nInclude = /etc/pacman.d/neuralv-mirrorlist\n" | sudo tee -a /etc/pacman.conf >/dev/null',
    'fi',
    'sudo pacman -Sy',
    '',
    '# 2) Установи GUI',
    'sudo pacman -S neuralv',
    '',
    '# 3) Portable-файл',
    `# ${packageUrl ?? '<appimage-url>'}`
  ].join('\n');
}

function buildGenericCommands(packageUrl?: string) {
  return [
    '# 1) Скачай GUI',
    `curl -L "${packageUrl ?? '<gui-url>'}" -o NeuralV.AppImage`,
    '',
    '# 2) Дай права на запуск',
    'chmod +x NeuralV.AppImage',
    '',
    '# 3) Запусти GUI',
    './NeuralV.AppImage'
  ].join('\n');
}

function buildGuiVariant(distro: DistroOption, artifact?: PackageVariant): InstallVariant {
  const packageMeta = getGuiPackage(distro.key, artifact);
  const downloadUrl = getPackageDownloadUrl(packageMeta, artifact);
  const packageType = String(packageMeta?.packageType ?? packageMeta?.format ?? '').toLowerCase();
  const repoCommands = Array.isArray(packageMeta?.repoCommands)
    ? packageMeta.repoCommands.filter((item): item is string => typeof item === 'string' && item.trim().length > 0)
    : [];
  const installCommands = Array.isArray(packageMeta?.installCommands)
    ? packageMeta.installCommands.filter((item): item is string => typeof item === 'string' && item.trim().length > 0)
    : [];

  let commandText = '';
  if (repoCommands.length > 0 || installCommands.length > 0) {
    commandText = [
      '# 1) Подключи репозиторий NeuralV',
      ...repoCommands,
      '',
      '# 2) Установи GUI',
      ...installCommands
    ].join('\n');
  } else {
    switch (distro.key) {
      case 'ubuntu':
        commandText = buildUbuntuCommands(downloadUrl);
        break;
      case 'fedora':
        commandText = buildFedoraCommands(downloadUrl);
        break;
      case 'arch':
        commandText = buildArchCommands(downloadUrl);
        break;
      default:
        commandText = buildGenericCommands(downloadUrl);
        break;
    }
  }

  const buttonLabel = distro.key === 'ubuntu'
    ? 'Скачать .deb'
    : distro.key === 'fedora'
      ? 'Скачать .rpm'
      : distro.key === 'arch'
        ? (packageType.includes('pkg') ? 'Скачать пакет' : 'Скачать AppImage')
        : 'Скачать GUI';

  return {
    title: 'GUI',
    commandText,
    downloadUrl,
    buttonLabel
  };
}

function buildCliVariant(artifact?: PackageVariant): InstallVariant {
  return {
    title: 'CLI',
    commandText: artifact?.install_command || [
      '# 1) Установи nv',
      `curl -fsSL ${NV_INSTALL_URL} | sh`,
      '',
      '# 2) Поставь NeuralV CLI',
      'nv install neuralv@latest',
      '',
      '# 3) Запусти клиент',
      'neuralv'
    ].join('\n')
  };
}

export function LinuxPage() {
  const guiManifestState = useReleaseManifest('linux');
  const cliManifestState = useReleaseManifest('shell');
  const { catalog } = usePackageRegistry();
  const neuralvPackage = useMemo(() => getPackage(catalog, 'neuralv'), [catalog]);
  const guiPackageVariant = useMemo(() => getPackageVariant(neuralvPackage, 'linux-gui'), [neuralvPackage]);
  const cliPackageVariant = useMemo(() => getPackageVariant(neuralvPackage, 'linux-cli'), [neuralvPackage]);
  const guiManifestArtifact = useMemo(() => getArtifact(guiManifestState.manifest, 'linux'), [guiManifestState.manifest]);
  const cliManifestArtifact = useMemo(() => getArtifact(cliManifestState.manifest, 'shell'), [cliManifestState.manifest]);
  const guiArtifact = useMemo(() => {
    if (!guiPackageVariant) return guiPackageVariant;
    return {
      ...guiPackageVariant,
      version: guiManifestArtifact?.version || guiPackageVariant.version,
      download_url: guiManifestArtifact?.downloadUrl || guiPackageVariant.download_url,
      file_name: guiManifestArtifact?.fileName || guiPackageVariant.file_name
    };
  }, [guiManifestArtifact?.downloadUrl, guiManifestArtifact?.fileName, guiManifestArtifact?.version, guiPackageVariant]);
  const cliArtifact = useMemo(() => {
    if (!cliPackageVariant) return cliPackageVariant;
    return {
      ...cliPackageVariant,
      version: cliManifestArtifact?.version || cliPackageVariant.version,
      file_name: cliManifestArtifact?.fileName || cliPackageVariant.file_name
    };
  }, [cliManifestArtifact?.fileName, cliManifestArtifact?.version, cliPackageVariant]);
  const guiReady = Boolean(guiArtifact?.download_url);

  const [installMode, setInstallMode] = useState<InstallMode>(() => (guiReady ? 'gui' : 'cli'));
  const [distro, setDistro] = useState<DistroKey>('ubuntu');
  const [copyState, setCopyState] = useState<'idle' | 'done'>('idle');

  useEffect(() => {
    if (installMode === 'gui' && !guiReady) {
      setInstallMode('cli');
    }
  }, [guiReady, installMode]);

  const selectedDistro = distroOptions.find((item) => item.key === distro) ?? distroOptions[0];
  const guiVariant = useMemo(() => buildGuiVariant(selectedDistro, guiArtifact), [guiArtifact, selectedDistro]);
  const cliVariant = useMemo(() => buildCliVariant(cliArtifact), [cliArtifact]);
  const activeVariant = installMode === 'gui' ? guiVariant : cliVariant;

  const handleCopy = async () => {
    if (typeof navigator === 'undefined' || !navigator.clipboard) {
      return;
    }

    try {
      await navigator.clipboard.writeText(activeVariant.commandText);
      setCopyState('done');
      window.setTimeout(() => setCopyState('idle'), 1600);
    } catch {
      setCopyState('idle');
    }
  };

  return (
    <div className="page-stack">
      <section className="hero-card platform-hero linux-hero">
        <div className="hero-copy">
          <h1>NeuralV для Linux</h1>
          <div className="hero-actions">
            <a className="nv-button" href="#linux-install">Установка</a>
            {guiReady && guiArtifact?.download_url ? (
              <a className="nv-button tonal" href={guiArtifact.download_url} target="_blank" rel="noreferrer">Скачать GUI</a>
            ) : (
              <button className="nv-button tonal is-disabled" type="button" disabled>GUI скоро</button>
            )}
          </div>
        </div>

        <div className="hero-panel hero-version-grid">
          <article className="mini-stat">
            <strong>GUI {guiArtifact?.version || 'pending'}</strong>
            <span className="hero-support-text">{guiArtifact?.file_name || 'Desktop GUI build'}</span>
          </article>
          <article className="mini-stat">
            <strong>CLI {cliArtifact?.version || 'pending'}</strong>
            <span className="hero-support-text">CLI ставится только через nv.</span>
          </article>
        </div>
      </section>

      <section id="linux-install" className="section-block">
        <div className="content-card install-card install-card-wide">
          <div className="segmented-row" style={compactSegmentsStyle}>
            <button
              type="button"
              className={`segment${installMode === 'gui' ? ' is-active' : ''}`}
              style={compactSegmentStyle}
              onClick={() => setInstallMode('gui')}
              disabled={!guiReady}
            >
              GUI
            </button>
            <button
              type="button"
              className={`segment${installMode === 'cli' ? ' is-active' : ''}`}
              style={compactSegmentStyle}
              onClick={() => setInstallMode('cli')}
            >
              CLI
            </button>
          </div>

          {installMode === 'gui' ? (
            <div className="distro-grid distro-grid-top">
              {distroOptions.map((option) => (
                <button
                  key={option.key}
                  type="button"
                  className={`distro-pill${distro === option.key ? ' is-active' : ''}`}
                  onClick={() => setDistro(option.key)}
                >
                  {option.label}
                </button>
              ))}
            </div>
          ) : null}

          <div className="install-card-head">
            <div>
              <h3>{activeVariant.title}</h3>
            </div>
            <div className="install-card-head-actions">
              {installMode === 'gui' && activeVariant.downloadUrl ? (
                <a className="nv-button tonal" href={activeVariant.downloadUrl} target="_blank" rel="noreferrer">{activeVariant.buttonLabel}</a>
              ) : installMode === 'gui' ? (
                <button className="nv-button tonal is-disabled" type="button" disabled>Пакет скоро</button>
              ) : null}
              <button className="copy-button" type="button" onClick={handleCopy}>
                {copyState === 'done' ? 'Скопировано' : 'Скопировать'}
              </button>
            </div>
          </div>

          <div className="command-shell">
            <pre>{activeVariant.commandText}</pre>
          </div>
        </div>
      </section>
    </div>
  );
}
