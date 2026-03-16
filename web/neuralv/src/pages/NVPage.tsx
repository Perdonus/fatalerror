import { useMemo } from 'react';
import { getPackage, getPackageVariant } from '../lib/packages';
import { usePackageRegistry } from '../hooks/usePackageRegistry';

const nvLinuxScriptUrl = 'https://raw.githubusercontent.com/Perdonus/NV/linux-builds/nv.sh';
const nvWindowsScriptUrl = 'https://raw.githubusercontent.com/Perdonus/NV/windows-builds/nv.ps1';
const linuxInstallCommand = `curl -fsSL ${nvLinuxScriptUrl} | sh`;
const windowsInstallCommand = `powershell -NoProfile -ExecutionPolicy Bypass -Command "irm ${nvWindowsScriptUrl} | iex"`;

export function NVPage() {
  const { catalog, loading, error } = usePackageRegistry();
  const nvPackage = useMemo(() => getPackage(catalog, 'nv'), [catalog]);
  const linuxVariant = useMemo(() => getPackageVariant(nvPackage, 'nv-linux'), [nvPackage]);
  const windowsVariant = useMemo(() => getPackageVariant(nvPackage, 'nv-windows'), [nvPackage]);

  return (
    <div className="page-stack">
      <section className="hero-card">
        <div className="hero-copy hero-copy-wide">
          <h1>NV</h1>
          <p>Пакетный менеджер NeuralV. Эта страница берёт сам `nv` только из репозитория `Perdonus/NV` через живой registry.</p>
          <div className="hero-actions">
            <a className="nv-button" href="#nv-install">Установить NV</a>
            <a className="nv-button tonal" href="#nv-builds">Сборки</a>
          </div>
        </div>
      </section>

      <section id="nv-install" className="section-block">
        <div className="install-layout install-layout-static">
          <article className="content-card install-card">
            <div className="install-card-head simple-head">
              <div>
                <h3>Установка NV</h3>
              </div>
            </div>
            <div className="card-actions card-actions-stacked" style={{ marginBottom: 16 }}>
              <a className="nv-button" href={nvLinuxScriptUrl}>Скачать для Linux</a>
              <a className="nv-button tonal" href={nvWindowsScriptUrl}>Скачать для Windows</a>
            </div>
            <div className="command-shell light-shell">
              <pre>{`# Linux\n${linuxInstallCommand}\n\n# Windows\n${windowsInstallCommand}\n\n# Установить пакет\nnv install neuralv@latest\n\n# Обновить nv\nnv install nv@latest\n\n# Удалить пакет\nnv uninstall neuralv`}</pre>
            </div>
          </article>

          <article className="content-card install-card">
            <div className="install-card-head simple-head">
              <div>
                <h3>Текущая версия</h3>
              </div>
            </div>
            <div className="platform-meta">{nvPackage?.latest_version || 'pending'}</div>
            <p>Сам `nv` обновляется отдельно от NeuralV и публикуется из `Perdonus/NV`.</p>
          </article>
        </div>
      </section>

      <section id="nv-builds" className="section-block">
        <div className="section-head section-head-tight">
          <h2>Сборки NV</h2>
        </div>
        <div className="card-grid two-up">
          {loading && (
            <article className="content-card">
              <h3>Загружаем registry</h3>
            </article>
          )}

          {!loading && error && (
            <article className="content-card">
              <h3>Registry недоступен</h3>
              <p>{error}</p>
            </article>
          )}

          {!loading && !error && [linuxVariant, windowsVariant].filter(Boolean).map((variant) => (
            <article key={variant!.id} className="content-card platform-card">
              <div className="platform-card-head">
                <div>
                  <h3>{variant!.label}</h3>
                </div>
              </div>
              <div className="platform-meta">{variant!.version || 'pending'}</div>
              <p>{variant!.file_name || 'Актуальный файл берётся из веток публикации NV.'}</p>
              <div className="card-actions" style={{ marginTop: 12 }}>
                {variant!.download_url ? (
                  <a className="nv-button tonal" href={variant!.download_url}>Скачать</a>
                ) : (
                  <button className="nv-button tonal is-disabled" type="button" disabled>Сборка скоро</button>
                )}
              </div>
            </article>
          ))}
        </div>
      </section>
    </div>
  );
}
