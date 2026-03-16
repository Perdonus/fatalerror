import { useEffect, useMemo, useState } from 'react';
import { useReleaseManifest } from '../hooks/useReleaseManifest';
import { getArtifact } from '../lib/manifest';
import { getPackage, getPackageVariant } from '../lib/packages';
import { usePackageRegistry } from '../hooks/usePackageRegistry';

type WindowsInstallMode = 'setup' | 'portable' | 'powershell' | 'cmd';

type WindowsMetadata = {
  setupUrl?: string;
  portableUrl?: string;
  setupDownloadLabel?: string;
  wingetPackageId?: string;
  wingetInstallCommand?: string;
  wingetUpgradeCommand?: string;
  wingetUninstallCommand?: string;
  directDownloadLabel?: string;
  powershellInstallCommand?: string;
  cmdInstallCommand?: string;
};

function getWindowsMetadata(value: unknown): WindowsMetadata | undefined {
  return value && typeof value === 'object' ? (value as WindowsMetadata) : undefined;
}

function getWindowsInstallContent(mode: WindowsInstallMode, options: {
  setupUrl?: string;
  portableUrl?: string;
  metadata?: WindowsMetadata;
}) {
  const powershellCommand =
    options.metadata?.powershellInstallCommand ||
    'irm https://sosiskibot.ru/neuralv/install/neuralv.ps1 | iex';
  const cmdCommand =
    options.metadata?.cmdInstallCommand ||
    'curl.exe -fsSL https://sosiskibot.ru/neuralv/install/neuralv.cmd -o "%TEMP%\\neuralv-install.cmd" && "%TEMP%\\neuralv-install.cmd"';

  switch (mode) {
    case 'setup':
      return {
        buttonLabel: options.metadata?.setupDownloadLabel || 'Скачать установщик',
        downloadUrl: options.setupUrl,
        command: '',
        description: 'Скачай setup и запусти его.'
      };
    case 'portable':
      return {
        buttonLabel: options.metadata?.directDownloadLabel || 'Скачать portable',
        downloadUrl: options.portableUrl,
        command: '',
        description: 'Скачай portable и распакуй.'
      };
    case 'powershell':
      return {
        buttonLabel: '',
        downloadUrl: undefined,
        command: powershellCommand,
        description: 'Скопируй команду в PowerShell.'
      };
    default:
      return {
        buttonLabel: '',
        downloadUrl: undefined,
        command: cmdCommand,
        description: 'Скопируй команду в CMD.'
      };
  }
}

export function WindowsPage() {
  const manifestState = useReleaseManifest('windows');
  const { catalog } = usePackageRegistry();
  const neuralvPackage = useMemo(() => getPackage(catalog, 'neuralv'), [catalog]);
  const packageVariant = useMemo(() => getPackageVariant(neuralvPackage, 'windows-gui'), [neuralvPackage]);
  const manifestArtifact = useMemo(() => getArtifact(manifestState.manifest, 'windows'), [manifestState.manifest]);
  const metadata = useMemo(
    () => getWindowsMetadata(manifestArtifact?.metadata ?? packageVariant?.metadata),
    [manifestArtifact?.metadata, packageVariant?.metadata]
  );

  const version = manifestState.manifest.version || manifestArtifact?.version || packageVariant?.version || '';
  const portableUrl =
    manifestState.manifest.portableUrl ||
    metadata?.portableUrl ||
    manifestArtifact?.downloadUrl ||
    packageVariant?.download_url;
  const setupUrl = manifestState.manifest.setupUrl || metadata?.setupUrl || portableUrl;
  const setupReady = Boolean(setupUrl);
  const portableReady = Boolean(portableUrl);
  const [modeOverride, setModeOverride] = useState<WindowsInstallMode | null>(null);
  const mode = modeOverride ?? (setupReady ? 'setup' : portableReady ? 'portable' : 'powershell');

  useEffect(() => {
    if (modeOverride === 'setup' && !setupReady) {
      setModeOverride(null);
      return;
    }

    if (modeOverride === 'portable' && !portableReady) {
      setModeOverride(null);
    }
  }, [modeOverride, portableReady, setupReady]);

  const active = getWindowsInstallContent(mode, { setupUrl, portableUrl, metadata });
  const versionLabel = version || 'pending';

  return (
    <div className="page-stack">
      <section className="hero-card platform-hero platform-hero-simple">
        <div className="hero-copy">
          <h1>NeuralV для Windows</h1>
          <p>Setup, portable или одна команда для PowerShell и CMD.</p>
          <div className="hero-actions">
            <a className="nv-button" href="#windows-install">
              Установить
            </a>
          </div>
          <span className="hero-support-text">{versionLabel}</span>
        </div>
      </section>

      <section id="windows-install" className="section-block">
        <article className="content-card install-card install-card-wide install-card-unified">
          <div className="install-card-head simple-head">
            <div className="install-card-copy">
              <h3>Установка</h3>
              <p className="install-intro">{active.description}</p>
            </div>
          </div>

          <div className="segmented-row install-mode-row">
            {(['setup', 'portable', 'powershell', 'cmd'] as WindowsInstallMode[]).map((item) => (
              <button
                key={item}
                type="button"
                className={`segment${mode === item ? ' is-active' : ''}`}
                onClick={() => setModeOverride(item)}
                disabled={(item === 'setup' && !setupReady) || (item === 'portable' && !portableReady)}
              >
                {item === 'powershell' ? 'PowerShell' : item === 'cmd' ? 'CMD' : item[0].toUpperCase() + item.slice(1)}
              </button>
            ))}
          </div>

          {(mode === 'setup' || mode === 'portable') ? (
            <div className="install-card-footer install-download-row">
              {active.downloadUrl ? (
                <a className="nv-button" href={active.downloadUrl} target="_blank" rel="noreferrer">
                  {active.buttonLabel}
                </a>
              ) : (
                <button className="nv-button is-disabled" type="button" disabled>
                  {active.buttonLabel}
                </button>
              )}
            </div>
          ) : (
            <div className="command-shell light-shell install-shell">
              <pre>{active.command}</pre>
            </div>
          )}
        </article>
      </section>
    </div>
  );
}
