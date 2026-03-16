import { useEffect, useMemo, useState } from 'react';
import { getArtifact, isArtifactReady, ReleaseArtifact } from '../lib/manifest';
import { useReleaseManifest } from '../hooks/useReleaseManifest';

type InstallMode = 'gui' | 'cli';
type DistroKey = 'ubuntu' | 'fedora' | 'arch' | 'generic';

type DistroOption = {
  key: DistroKey;
  label: string;
  title: string;
  note: string;
};

type ArtifactMetadataShape = {
  packages?: Partial<Record<DistroKey, PackageMetadata>>;
};

type PackageMetadata = {
  downloadUrl?: string;
  url?: string;
  packageType?: string;
  format?: string;
  fileName?: string;
  repoCommands?: string[];
  installCommands?: string[];
  note?: string;
};

type GuiVariant = {
  packageLabel: string;
  buttonLabel: string;
  downloadUrl?: string;
  note: string;
  commands: string;
};

const NV_INSTALL_URL = 'https://sosiskibot.ru/neuralv/install/nv.sh';

const distroOptions: DistroOption[] = [
  {
    key: 'ubuntu',
    label: 'Ubuntu / Debian',
    title: 'Ubuntu, Debian, Pop!_OS, Mint',
    note: 'Через .deb и установку в привычном apt-сценарии.'
  },
  {
    key: 'fedora',
    label: 'Fedora / RHEL',
    title: 'Fedora, Nobara, RHEL-совместимые',
    note: 'Через .rpm и стандартный dnf-поток.'
  },
  {
    key: 'arch',
    label: 'Arch / Manjaro',
    title: 'Arch, EndeavourOS, Manjaro',
    note: 'Через AppImage, без лишней ручной сборки.'
  },
  {
    key: 'generic',
    label: 'Другой Linux',
    title: 'Любой совместимый x64 Linux',
    note: 'Если нужен универсальный вариант, бери AppImage.'
  }
];

function getMetadata(artifact?: ReleaseArtifact): ArtifactMetadataShape | undefined {
  return artifact?.metadata && typeof artifact.metadata === 'object'
    ? (artifact.metadata as ArtifactMetadataShape)
    : undefined;
}

function getGuiPackage(distro: DistroKey, artifact?: ReleaseArtifact): PackageMetadata | undefined {
  const packages = getMetadata(artifact)?.packages;
  return packages?.[distro];
}

function buildGuiCommands(distro: DistroOption, artifact?: ReleaseArtifact): GuiVariant {
  const packageMeta = getGuiPackage(distro.key, artifact);
  const rawPackageType = packageMeta?.packageType ?? packageMeta?.format;
  const packageType = typeof rawPackageType === 'string'
    ? rawPackageType.toLowerCase()
    : (distro.key === 'ubuntu' ? 'deb' : distro.key === 'fedora' ? 'rpm' : 'appimage');
  const downloadUrl = packageMeta?.downloadUrl ?? packageMeta?.url ?? artifact?.downloadUrl;
  const repoCommands = Array.isArray(packageMeta?.repoCommands)
    ? packageMeta?.repoCommands.filter((item): item is string => typeof item === 'string' && item.length > 0)
    : [];
  const installCommands = Array.isArray(packageMeta?.installCommands)
    ? packageMeta?.installCommands.filter((item): item is string => typeof item === 'string' && item.length > 0)
    : [];

  if (repoCommands.length > 0 || installCommands.length > 0) {
    return {
      packageLabel: packageType.startsWith('.') ? packageType : `.${packageType}`,
      buttonLabel: `Скачать ${packageType.startsWith('.') ? packageType : `.${packageType}`}`,
      downloadUrl,
      note: packageMeta?.note ?? distro.note,
      commands: [
        `# ${distro.title}`,
        '# 1) Подключи репозиторий NeuralV',
        ...repoCommands,
        '',
        '# 2) Установи GUI через системный менеджер пакетов',
        ...installCommands
      ].join('\n')
    };
  }

  if (packageType === 'deb') {
    return {
      packageLabel: '.deb',
      buttonLabel: 'Скачать .deb',
      downloadUrl,
      note: packageMeta?.note ?? distro.note,
      commands: [
        `# ${distro.title}`,
        '# 1) Скачай GUI-пакет',
        `curl -L "${downloadUrl ?? '<gui-deb-url>'}" -o neuralv.deb`,
        '',
        '# 2) Установи его через apt',
        'sudo apt install ./neuralv.deb',
        '',
        '# 3) Запусти NeuralV',
        'neuralv'
      ].join('\n')
    };
  }

  if (packageType === 'rpm') {
    return {
      packageLabel: '.rpm',
      buttonLabel: 'Скачать .rpm',
      downloadUrl,
      note: packageMeta?.note ?? distro.note,
      commands: [
        `# ${distro.title}`,
        '# 1) Скачай GUI-пакет',
        `curl -L "${downloadUrl ?? '<gui-rpm-url>'}" -o neuralv.rpm`,
        '',
        '# 2) Установи его через dnf',
        'sudo dnf install ./neuralv.rpm',
        '',
        '# 3) Запусти NeuralV',
        'neuralv'
      ].join('\n')
    };
  }

  return {
    packageLabel: 'AppImage',
    buttonLabel: 'Скачать AppImage',
    downloadUrl,
    note: packageMeta?.note ?? distro.note,
    commands: [
      `# ${distro.title}`,
      '# 1) Скачай GUI-файл',
      `curl -L "${downloadUrl ?? '<gui-appimage-url>'}" -o NeuralV.AppImage`,
      '',
      '# 2) Дай права на запуск',
      'chmod +x NeuralV.AppImage',
      '',
      '# 3) Запусти GUI',
      './NeuralV.AppImage'
    ].join('\n')
  };
}

function buildCliCommands(): string {
  return [
    '# 1) Установи nv',
    `curl -fsSL ${NV_INSTALL_URL} | sh`,
    '',
    '# 2) Поставь NeuralV CLI',
    'nv install neuralv@latest',
    '',
    '# 3) Проверь версии',
    'nv -v',
    'neuralv -v'
  ].join('\n');
}

export function LinuxPage() {
  const manifestState = useReleaseManifest();
  const guiArtifact = getArtifact(manifestState.manifest, 'linux');
  const shellArtifact = getArtifact(manifestState.manifest, 'shell');
  const nvArtifact = getArtifact(manifestState.manifest, 'nv');
  const guiReady = isArtifactReady(guiArtifact);
  const cliReady = isArtifactReady(shellArtifact) || isArtifactReady(nvArtifact);

  const [installMode, setInstallMode] = useState<InstallMode>(() => (guiReady ? 'gui' : 'cli'));
  const [distro, setDistro] = useState<DistroKey>('ubuntu');
  const [copyState, setCopyState] = useState<'idle' | 'done'>('idle');

  useEffect(() => {
    if (installMode === 'gui' && !guiReady) {
      setInstallMode('cli');
    }
  }, [guiReady, installMode]);

  const selectedDistro = distroOptions.find((item) => item.key === distro) ?? distroOptions[0];
  const guiVariant = useMemo(() => buildGuiCommands(selectedDistro, guiArtifact), [guiArtifact, selectedDistro]);
  const commandText = installMode === 'gui' ? guiVariant.commands : buildCliCommands();
  const actionUrl = installMode === 'gui'
    ? guiVariant.downloadUrl
    : (shellArtifact?.downloadUrl ?? nvArtifact?.downloadUrl);
  const actionLabel = installMode === 'gui' ? guiVariant.buttonLabel : 'Скачать CLI';
  const installLead = installMode === 'gui'
    ? `${selectedDistro.title}. ${guiVariant.note}`
    : 'CLI ставится через nv. Подходит для терминала, SSH и машин без тяжёлого интерфейса.';

  const handleCopy = async () => {
    if (typeof navigator === 'undefined' || !navigator.clipboard) {
      return;
    }

    try {
      await navigator.clipboard.writeText(commandText);
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
          <h1>Linux без длинных мануалов.</h1>
          <p>
            Если нужен рабочий стол, бери GUI. Если нужен терминал и быстрый старт, ставь CLI через nv.
          </p>
          <div className="hero-actions">
            <a className="nv-button" href="#linux-install">Как установить</a>
            {guiReady && guiArtifact?.downloadUrl ? (
              <a className="nv-button tonal" href={guiArtifact.downloadUrl} target="_blank" rel="noreferrer">Скачать GUI</a>
            ) : (
              <button className="nv-button tonal is-disabled" type="button" disabled>GUI скоро</button>
            )}
          </div>
        </div>

        <div className="hero-panel compact-panel">
          <div className="mini-stat">
            <strong>{guiReady ? 'GUI готов' : 'GUI скоро'}</strong>
            <span className="hero-support-text">Обычное окно для рабочего стола.</span>
          </div>
          <div className="mini-stat">
            <strong>{cliReady ? 'CLI готов' : 'CLI скоро'}</strong>
            <span className="hero-support-text">Терминал, SSH и серверные сценарии.</span>
          </div>
        </div>
      </section>

      <section id="linux-install" className="section-block">
        <div className="section-head section-head-tight">
          <h2>Установка</h2>
        </div>

        <div className="install-layout">
          <aside className="content-card chooser-card">
            <div className="chooser-section">
              <span className="chooser-label">Что установить</span>
              <div className="segmented-row">
                <button
                  type="button"
                  className={`segment${installMode === 'gui' ? ' is-active' : ''}`}
                  onClick={() => setInstallMode('gui')}
                  disabled={!guiReady}
                >
                  GUI
                </button>
                <button
                  type="button"
                  className={`segment${installMode === 'cli' ? ' is-active' : ''}`}
                  onClick={() => setInstallMode('cli')}
                >
                  CLI
                </button>
              </div>
            </div>

            {installMode === 'gui' ? (
              <div className="chooser-section">
                <span className="chooser-label">Дистрибутив</span>
                <div className="distro-grid">
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
                <p className="chooser-note">{selectedDistro.note}</p>
              </div>
            ) : null}
          </aside>

          <div className="content-card install-card">
            <div className="install-card-head">
              <div>
                <h3>{installMode === 'gui' ? 'GUI для Linux' : 'CLI через nv'}</h3>
                <p>{installLead}</p>
              </div>
              <div className="install-card-head-actions">
                {actionUrl ? (
                  <a className="nv-button tonal" href={actionUrl} target="_blank" rel="noreferrer">{actionLabel}</a>
                ) : (
                  <button className="nv-button tonal is-disabled" type="button" disabled>
                    {installMode === 'gui' ? 'Пакет скоро' : 'CLI скоро'}
                  </button>
                )}
                <button className="copy-button" type="button" onClick={handleCopy}>
                  {copyState === 'done' ? 'Скопировано' : 'Скопировать'}
                </button>
              </div>
            </div>

            <div className="command-shell">
              <pre>{commandText}</pre>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
