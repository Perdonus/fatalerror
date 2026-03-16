import { useEffect, useMemo, useState } from 'react';
import { useReleaseManifest } from '../hooks/useReleaseManifest';
import { getArtifact } from '../lib/manifest';
import { getPackage, getPackageVariant, PackageVariant } from '../lib/packages';
import { usePackageRegistry } from '../hooks/usePackageRegistry';

type InstallMode = 'gui' | 'cli';
type DistroKey = 'ubuntu' | 'fedora' | 'arch' | 'generic';

type DistroOption = {
  key: DistroKey;
  label: string;
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
  commandText: string;
  downloadUrl?: string;
  buttonLabel?: string;
};

const REPO_ROOT = 'https://sosiskibot.ru/neuralv/repo';

const distroOptions: DistroOption[] = [
  { key: 'ubuntu', label: 'Ubuntu / Debian' },
  { key: 'fedora', label: 'Fedora / RHEL' },
  { key: 'arch', label: 'Arch / Manjaro' },
  { key: 'generic', label: 'Другой Linux' }
];

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

function hasGuiDownload(artifact?: PackageVariant) {
  if (artifact?.download_url) {
    return true;
  }

  return distroOptions.some((option) => Boolean(getPackageDownloadUrl(getGuiPackage(option.key, artifact), artifact)));
}

function buildUbuntuCommands() {
  return [
    `curl -fsSL ${REPO_ROOT}/debian/neuralv.gpg | sudo gpg --dearmor -o /usr/share/keyrings/neuralv-archive-keyring.gpg`,
    `echo "deb [signed-by=/usr/share/keyrings/neuralv-archive-keyring.gpg] ${REPO_ROOT}/debian stable main" | sudo tee /etc/apt/sources.list.d/neuralv.list >/dev/null`,
    'sudo apt update',
    'sudo apt install neuralv'
  ].join('\n');
}

function buildFedoraCommands() {
  return [
    `sudo rpm --import ${REPO_ROOT}/rpm/RPM-GPG-KEY-neuralv`,
    'sudo tee /etc/yum.repos.d/neuralv.repo >/dev/null <<\'EOF\'',
    '[neuralv]',
    'name=NeuralV',
    `baseurl=${REPO_ROOT}/rpm`,
    'enabled=1',
    'gpgcheck=1',
    `gpgkey=${REPO_ROOT}/rpm/RPM-GPG-KEY-neuralv`,
    'EOF',
    'sudo dnf install neuralv'
  ].join('\n');
}

function buildArchCommands() {
  return [
    'sudo install -d /etc/pacman.d',
    `echo "[neuralv]\nServer = ${REPO_ROOT}/arch/$arch" | sudo tee /etc/pacman.d/neuralv-mirrorlist >/dev/null`,
    'if ! grep -q "^\\[neuralv\\]" /etc/pacman.conf; then',
    '  printf "\\n[neuralv]\\nInclude = /etc/pacman.d/neuralv-mirrorlist\\n" | sudo tee -a /etc/pacman.conf >/dev/null',
    'fi',
    'sudo pacman -Sy',
    'sudo pacman -S neuralv'
  ].join('\n');
}

function buildGenericCommands(packageUrl?: string) {
  return [
    `curl -L "${packageUrl ?? '<gui-url>'}" -o NeuralV.AppImage`,
    'chmod +x NeuralV.AppImage',
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
    commandText = [...repoCommands, ...(repoCommands.length > 0 && installCommands.length > 0 ? [''] : []), ...installCommands].join('\n');
  } else {
    switch (distro.key) {
      case 'ubuntu':
        commandText = buildUbuntuCommands();
        break;
      case 'fedora':
        commandText = buildFedoraCommands();
        break;
      case 'arch':
        commandText = buildArchCommands();
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
        : 'Скачать AppImage';

  return {
    commandText,
    downloadUrl,
    buttonLabel
  };
}

function buildCliVariant(): InstallVariant {
  return {
    commandText: 'nv install neuralv'
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
      version: guiManifestState.manifest.version || guiManifestArtifact?.version || guiPackageVariant.version,
      download_url: guiManifestState.manifest.downloadUrl || guiManifestArtifact?.downloadUrl || guiPackageVariant.download_url,
      file_name: guiManifestArtifact?.fileName || guiPackageVariant.file_name
    };
  }, [guiManifestArtifact?.downloadUrl, guiManifestArtifact?.fileName, guiManifestArtifact?.version, guiManifestState.manifest.downloadUrl, guiManifestState.manifest.version, guiPackageVariant]);
  const cliArtifact = useMemo(() => {
    if (!cliPackageVariant) return cliPackageVariant;
    return {
      ...cliPackageVariant,
      version: cliManifestState.manifest.version || cliManifestArtifact?.version || cliPackageVariant.version,
      install_command: cliManifestState.manifest.installCommand || cliPackageVariant.install_command,
      file_name: cliManifestArtifact?.fileName || cliPackageVariant.file_name
    };
  }, [cliManifestArtifact?.fileName, cliManifestArtifact?.version, cliManifestState.manifest.installCommand, cliManifestState.manifest.version, cliPackageVariant]);
  const guiReady = hasGuiDownload(guiArtifact);

  const [installModeOverride, setInstallModeOverride] = useState<InstallMode | null>(null);
  const [distro, setDistro] = useState<DistroKey>('ubuntu');
  const installMode = installModeOverride ?? (guiReady ? 'gui' : 'cli');

  useEffect(() => {
    if (installModeOverride === 'gui' && !guiReady) {
      setInstallModeOverride(null);
    }
  }, [guiReady, installModeOverride]);

  const selectedDistro = distroOptions.find((item) => item.key === distro) ?? distroOptions[0];
  const guiVariant = useMemo(() => buildGuiVariant(selectedDistro, guiArtifact), [guiArtifact, selectedDistro]);
  const cliVariant = useMemo(() => buildCliVariant(), []);
  const activeVariant = installMode === 'gui' ? guiVariant : cliVariant;
  const versionLabel = `GUI ${guiArtifact?.version || 'pending'} · CLI ${cliArtifact?.version || 'pending'}`;

  return (
    <div className="page-stack">
      <section className="hero-card platform-hero platform-hero-simple linux-hero">
        <div className="hero-copy">
          <h1>NeuralV для Linux</h1>
          <p>GUI под дистрибутив или CLI через nv.</p>
          <div className="hero-actions">
            <a className="nv-button" href="#linux-install">Установить</a>
          </div>
          <span className="hero-support-text">{versionLabel}</span>
        </div>
      </section>

      <section id="linux-install" className="section-block">
        <article className="content-card install-card install-card-wide install-card-unified">
          <div className="install-card-head simple-head">
            <div className="install-card-copy">
              <h3>Установка</h3>
              <p className="install-intro">
                {installMode === 'gui'
                  ? 'Выбери дистрибутив и поставь пакет.'
                  : 'CLI ставится одной командой через nv.'}
              </p>
            </div>
          </div>

          <div className="install-options-stack install-picker-stack">
            <div className="segmented-row install-mode-row">
              <button
                type="button"
                className={`segment${installMode === 'gui' ? ' is-active' : ''}`}
                onClick={() => setInstallModeOverride('gui')}
                disabled={!guiReady}
              >
                GUI
              </button>
              <button
                type="button"
                className={`segment${installMode === 'cli' ? ' is-active' : ''}`}
                onClick={() => setInstallModeOverride('cli')}
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
                    className={`distro-pill${option.key === distro ? ' is-active' : ''}`}
                    onClick={() => setDistro(option.key)}
                  >
                    {option.label}
                  </button>
                ))}
              </div>
            ) : null}
          </div>

          {installMode === 'gui' ? (
            <div className="install-card-footer install-download-row">
              {activeVariant.downloadUrl ? (
                <a className="nv-button" href={activeVariant.downloadUrl} target="_blank" rel="noreferrer">
                  {activeVariant.buttonLabel}
                </a>
              ) : (
                <button className="nv-button is-disabled" type="button" disabled>
                  Скачать GUI
                </button>
              )}
            </div>
          ) : null}

          <div className="command-shell light-shell install-shell">
            <pre>{activeVariant.commandText}</pre>
          </div>
        </article>
      </section>
    </div>
  );
}
