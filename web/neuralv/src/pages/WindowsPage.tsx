import { useMemo } from 'react';
import { getPackage, getPackageVariant } from '../lib/packages';
import { usePackageRegistry } from '../hooks/usePackageRegistry';

const fallbackInstallSteps = [
  '1. Скачай сборку для Windows.',
  '2. Распакуй архив в удобную папку.',
  '3. Запусти NeuralV.exe и войди в аккаунт.'
];

export function WindowsPage() {
  const { catalog } = usePackageRegistry();
  const neuralvPackage = useMemo(() => getPackage(catalog, 'neuralv'), [catalog]);
  const artifact = useMemo(() => getPackageVariant(neuralvPackage, 'windows-gui'), [neuralvPackage]);
  const ready = Boolean(artifact?.download_url);
  const installSteps = artifact?.install_command
    ? artifact.install_command.split(/\r?\n/).filter((line) => line.trim().length > 0)
    : fallbackInstallSteps;

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
        <div className="install-layout install-layout-static">
          <article className="content-card chooser-card">
            <h3>Установка</h3>
            <p>Скачай свежую сборку и запусти клиент. Кнопка сверху всегда ведёт на последний опубликованный архив.</p>
          </article>

          <article className="content-card install-card">
            <div className="install-card-head simple-head">
              <h3>Как поставить</h3>
            </div>
            <div className="command-shell light-shell">
              <pre>{installSteps.join('\n')}</pre>
            </div>
          </article>
        </div>
      </section>
    </div>
  );
}
