import { useMemo } from 'react';
import { getPackageEntry } from '../lib/packages';
import { usePackageRegistry } from '../hooks/usePackageRegistry';

const linuxInstallScript = 'curl -fsSL https://sosiskibot.ru/neuralv/install/nv.sh | sh';

function packageTargets(pkg?: ReturnType<typeof getPackageEntry>) {
  if (!pkg) {
    return [];
  }
  return pkg.targets.map((target) => ({
    key: `${target.os}-${target.variant}-${target.id}`,
    label: `${target.os} ${target.variant}`.trim(),
    version: target.version || 'pending',
    downloadUrl: target.download_url
  }));
}

export function NVPage() {
  const packageState = usePackageRegistry();
  const nvPackage = useMemo(() => getPackageEntry(packageState.registry, 'nv'), [packageState.registry]);
  const neuralvPackage = useMemo(() => getPackageEntry(packageState.registry, 'neuralv'), [packageState.registry]);
  const nvTargets = packageTargets(nvPackage);
  const neuralvTargets = packageTargets(neuralvPackage);

  return (
    <div className="page-stack">
      <section className="hero-card platform-hero">
        <div className="hero-copy">
          <h1>NV</h1>
          <p>Пакетный менеджер для установки и обновления NeuralV и других пакетов из server-side registry.</p>
          <div className="hero-actions">
            <a className="nv-button" href="#nv-install">Установка</a>
            <a className="nv-button tonal" href="#nv-packages">Пакеты</a>
          </div>
        </div>

        <div className="hero-panel compact-panel">
          <article className="mini-stat">
            <strong>Версия {nvPackage?.latest || 'pending'}</strong>
            <span className="hero-support-text">
              NV запрашивает пакеты и версии с сервера, а не хранит список внутри себя.
            </span>
          </article>
        </div>
      </section>

      <section id="nv-install" className="section-block">
        <div className="card-grid two-up">
          <article className="content-card install-card">
            <div className="install-card-head simple-head">
              <h3>Установить NV</h3>
            </div>
            <div className="command-shell light-shell">
              <pre>{linuxInstallScript}</pre>
            </div>
          </article>

          <article className="content-card install-card">
            <div className="install-card-head simple-head">
              <h3>Базовые команды</h3>
            </div>
            <div className="command-shell light-shell">
              <pre>{['nv install neuralv@latest', 'nv install neuralv@1.3.1', 'nv uninstall neuralv', 'nv install nv@latest'].join('\n')}</pre>
            </div>
          </article>
        </div>
      </section>

      <section id="nv-packages" className="section-block">
        {packageState.error ? (
          <article className="content-card install-card">
            <h3>Registry недоступен</h3>
            <p>{packageState.error}</p>
          </article>
        ) : (
          <div className="card-grid two-up">
            <article className="content-card">
              <h3>{nvPackage?.display_name || 'NV'}</h3>
              <div className="platform-meta">Последняя версия: {nvPackage?.latest || 'pending'}</div>
              <p>{nvPackage?.summary}</p>
              <ul className="showcase-points">
                {nvTargets.map((target) => (
                  <li key={target.key}>
                    {target.label} · {target.version}
                  </li>
                ))}
              </ul>
            </article>

            <article className="content-card">
              <h3>{neuralvPackage?.display_name || 'NeuralV'}</h3>
              <div className="platform-meta">Последняя версия: {neuralvPackage?.latest || 'pending'}</div>
              <p>{neuralvPackage?.summary}</p>
              <ul className="showcase-points">
                {neuralvTargets.map((target) => (
                  <li key={target.key}>
                    {target.label} · {target.version}
                  </li>
                ))}
              </ul>
            </article>
          </div>
        )}
      </section>
    </div>
  );
}
