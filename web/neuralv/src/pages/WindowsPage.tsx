import { useMemo, useState } from 'react';
import { getPackage, getPackageVariant } from '../lib/packages';
import { usePackageRegistry } from '../hooks/usePackageRegistry';

type WindowsInstallMode = 'setup' | 'portable' | 'powershell' | 'cmd';

const nvWindowsScriptUrl = 'https://raw.githubusercontent.com/Perdonus/NV/windows-builds/nv.ps1';

function getWindowsInstallContent(mode: WindowsInstallMode, downloadUrl?: string) {
  const powershellCommand =
    `powershell -NoProfile -ExecutionPolicy Bypass -Command "irm ${nvWindowsScriptUrl} | iex; & \\\"$env:LOCALAPPDATA\\\\NV\\\\nv.exe\\\" install neuralv@latest"`;
  const cmdCommand =
    `powershell -NoProfile -ExecutionPolicy Bypass -Command "irm ${nvWindowsScriptUrl} | iex" && "%LOCALAPPDATA%\\\\NV\\\\nv.exe" install neuralv@latest`;

  switch (mode) {
    case 'setup':
      return {
        title: 'Setup',
        description: 'Полноценный установщик для Windows появится вместе с native-сборкой.',
        downloadUrl: undefined,
        buttonLabel: 'Setup скоро',
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
        description: 'Одна команда ставит `nv`, после чего ставит последнюю Windows-версию NeuralV.',
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
  const [mode, setMode] = useState<WindowsInstallMode>('portable');
  const active = getWindowsInstallContent(mode, artifact?.download_url);

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
          </article>
        </div>
      </section>
    </div>
  );
}
