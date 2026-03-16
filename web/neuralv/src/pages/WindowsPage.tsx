import { useMemo, useState } from 'react';
import { getPackage, getPackageVariant } from '../lib/packages';
import { usePackageRegistry } from '../hooks/usePackageRegistry';

type WindowsInstallMode = 'setup' | 'portable' | 'powershell' | 'cmd';

const windowsSetupUrl = '/neuralv/install/neuralv.cmd';
const windowsPowerShellUrl = 'https://sosiskibot.ru/neuralv/install/neuralv.ps1';
const windowsCmdUrl = 'https://sosiskibot.ru/neuralv/install/neuralv.cmd';

function getWindowsInstallContent(mode: WindowsInstallMode, downloadUrl?: string) {
  const powershellCommand =
    `powershell -NoProfile -ExecutionPolicy Bypass -Command "irm ${windowsPowerShellUrl} | iex"`;
  const cmdCommand =
    `curl.exe -fsSL ${windowsCmdUrl} -o "%TEMP%\\\\neuralv-install.cmd" && cmd /c "%TEMP%\\\\neuralv-install.cmd"`;

  switch (mode) {
    case 'setup':
      return {
        title: 'Setup',
        description: 'Скачай установщик-скрипт. Он подтянет последнюю Windows-сборку и разложит NeuralV по папкам Windows.',
        downloadUrl: windowsSetupUrl,
        buttonLabel: 'Скачать setup',
        command: ''
      };
    case 'portable':
      return {
        title: 'Portable',
        description: 'Портативная сборка без системной установки.',
        downloadUrl,
        buttonLabel: 'Скачать portable',
        command: ''
      };
    case 'powershell':
      return {
        title: 'PowerShell',
        description: 'Одна команда ставит последнюю Windows-версию NeuralV через PowerShell-скрипт.',
        downloadUrl: undefined,
        buttonLabel: '',
        command: powershellCommand
      };
    default:
      return {
        title: 'CMD',
        description: 'Та же установка через обычный cmd, без ручного поиска пакетов.',
        downloadUrl: undefined,
        buttonLabel: '',
        command: cmdCommand
      };
  }
}

export function WindowsPage() {
  const { catalog } = usePackageRegistry();
  const neuralvPackage = useMemo(() => getPackage(catalog, 'neuralv'), [catalog]);
  const artifact = useMemo(() => getPackageVariant(neuralvPackage, 'windows-gui'), [neuralvPackage]);
  const ready = Boolean(artifact?.download_url);
  const [mode, setMode] = useState<WindowsInstallMode>('setup');
  const [copyState, setCopyState] = useState<'idle' | 'done'>('idle');
  const active = getWindowsInstallContent(mode, artifact?.download_url);

  const handleCopy = async () => {
    if (!active.command || typeof navigator === 'undefined' || !navigator.clipboard) {
      return;
    }

    try {
      await navigator.clipboard.writeText(active.command);
      setCopyState('done');
      window.setTimeout(() => setCopyState('idle'), 1600);
    } catch {
      setCopyState('idle');
    }
  };

  return (
    <div className="page-stack">
      <section className="hero-card platform-hero">
        <div className="hero-copy">
          <h1>NeuralV для Windows.</h1>
          <p>
            Нативный настольный клиент для проверки файлов, фонового контроля и работы с тем же
            аккаунтом, что на Android и Linux.
          </p>
          <div className="hero-actions">
            {ready ? (
              <a className="nv-button" href={artifact?.download_url} target="_blank" rel="noreferrer">
                Скачать Windows
              </a>
            ) : (
              <button className="nv-button is-disabled" type="button" disabled>
                Сборка скоро
              </button>
            )}
            <a className="nv-button tonal" href="#windows-install">
              Установка
            </a>
          </div>
        </div>

        <div className="hero-panel compact-panel">
          <article className="mini-stat">
            <strong>{artifact?.version || 'Windows 10 / 11'}</strong>
            <span className="hero-support-text">
              {artifact?.file_name || 'Windows GUI-клиент с единым аккаунтом и локальной проверкой файлов.'}
            </span>
          </article>
        </div>
      </section>

      <section id="windows-install" className="section-block">
        <div className="section-head section-head-tight">
          <h2>Установка</h2>
        </div>

        <article className="content-card chooser-card">
          <div className="segmented-row" style={{ display: 'flex', gap: '0.6rem', flexWrap: 'wrap' }}>
            {(['setup', 'portable', 'powershell', 'cmd'] as WindowsInstallMode[]).map((item) => (
              <button
                key={item}
                type="button"
                className={`segment${mode === item ? ' is-active' : ''}`}
                style={{ flex: '0 0 auto', minWidth: 'unset', width: 'auto' }}
                onClick={() => setMode(item)}
              >
                {item === 'powershell' ? 'PowerShell' : item === 'cmd' ? 'CMD' : item[0].toUpperCase() + item.slice(1)}
              </button>
            ))}
          </div>
        </article>

        <div className="install-layout install-layout-static">
          <article className="content-card install-card">
            <div className="install-card-head">
              <div>
                <h3>{active.title}</h3>
                <p>{active.description}</p>
              </div>
            </div>

            {mode === 'setup' || mode === 'portable' ? (
              <div className="card-actions">
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
              <div className="command-shell light-shell">
                <pre>{active.command}</pre>
              </div>
            )}

            {mode === 'powershell' || mode === 'cmd' ? (
              <div className="card-actions">
                <button className="copy-button" type="button" onClick={handleCopy}>
                  {copyState === 'done' ? 'Скопировано' : 'Скопировать'}
                </button>
              </div>
            ) : null}
          </article>
        </div>
      </section>
    </div>
  );
}
