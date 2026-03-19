import { useEffect, useMemo, useState } from 'react';
import { getArtifact, getArtifactSystemRequirements, getArtifactVersion } from '../lib/manifest';
import { useReleaseManifest } from '../hooks/useReleaseManifest';

type WindowsInstallMode = 'setup' | 'portable' | 'powershell' | 'cmd';

type WindowsInstallContent = {
  buttonLabel: string;
  downloadUrl?: string;
  command: string;
  description: string;
};

const WINDOWS_HIGHLIGHTS = [
  {
    title: 'Новый нативный клиент',
    text: 'Отдельная Windows-версия с обычной установкой, понятным стартом и аккуратным интерфейсом.'
  },
  {
    title: 'Один аккаунт',
    text: 'Вход, история и проверки работают через тот же аккаунт NeuralV, что и на других версиях.'
  }
] as const;

function getPowershellCommand() {
  return [
    '# 1. Установить NV, PATH и проверить nv -v',
    'irm https://sosiskibot.ru/neuralv/install/nv.ps1 | iex',
    '',
    '# 2. Установить NeuralV',
    'nv install @lvls/neuralv'
  ].join('\n');
}

function getCmdCommand() {
  return [
    'REM 1. Установить NV, PATH и проверить nv -v',
    'curl.exe -fsSL https://sosiskibot.ru/neuralv/install/nv.cmd -o "%TEMP%\\nv-install.cmd" && call "%TEMP%\\nv-install.cmd"',
    '',
    'REM 2. Установить NeuralV',
    'nv install @lvls/neuralv'
  ].join('\n');
}

function getWindowsInstallContent(
  mode: WindowsInstallMode,
  options: {
    setupUrl?: string;
    portableUrl?: string;
  }
): WindowsInstallContent {
  switch (mode) {
    case 'setup':
      return {
        buttonLabel: 'Скачать setup',
        downloadUrl: options.setupUrl,
        command: '',
        description: ''
      };
    case 'portable':
      return {
        buttonLabel: 'Скачать portable',
        downloadUrl: options.portableUrl,
        command: '',
        description: ''
      };
    case 'powershell':
      return {
        buttonLabel: '',
        downloadUrl: undefined,
        command: getPowershellCommand(),
        description: ''
      };
    default:
      return {
        buttonLabel: '',
        downloadUrl: undefined,
        command: getCmdCommand(),
        description: ''
      };
  }
}

export function WindowsPage() {
  const manifestState = useReleaseManifest('windows');
  const manifestArtifact = useMemo(() => getArtifact(manifestState.manifest, 'windows'), [manifestState.manifest]);
  const version = getArtifactVersion(manifestState.manifest, 'windows') || 'pending';
  const requirements = getArtifactSystemRequirements(manifestArtifact, manifestState.manifest);
  const portableUrl = manifestArtifact?.downloadUrl || manifestState.manifest.portableUrl || manifestState.manifest.downloadUrl;
  const setupUrl = manifestState.manifest.setupUrl || portableUrl;
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

  const active = getWindowsInstallContent(mode, { setupUrl, portableUrl });

  return (
    <div className="page-stack">
      <section className="hero-card platform-hero platform-hero-simple">
        <div className="hero-copy">
          <h1>NeuralV для Windows</h1>
          <div className="hero-actions">
            <a className="nv-button" href="#windows-install">
              Установить
            </a>
          </div>
          <span className="hero-support-text">Версия Windows: {version}</span>
          <span className="hero-support-text">Требования: {requirements[0] || 'пока нет в manifest.'}</span>
        </div>
      </section>

      <section className="section-block">
        <div className="card-grid three-up">
          {WINDOWS_HIGHLIGHTS.map((item) => (
            <article key={item.title} className="content-card compact-card">
              <h3>{item.title}</h3>
              <p>{item.text}</p>
            </article>
          ))}
        </div>
      </section>

      <section id="windows-install" className="section-block">
        <article className="content-card install-card install-card-wide install-card-unified">
          <div className="install-card-head simple-head">
            <div className="install-card-copy">
              <h3>Установка</h3>
              {active.description ? <p className="install-intro">{active.description}</p> : null}
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
