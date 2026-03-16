import { getArtifact, isArtifactReady } from '../lib/manifest';
import { useReleaseManifest } from '../hooks/useReleaseManifest';

const features = [
  {
    title: 'Проверка приложений',
    text: 'Быстрый старт прямо на телефоне.'
  },
  {
    title: 'Фоновая защита',
    text: 'NeuralV остаётся рядом и реагирует на важные события.'
  },
  {
    title: 'История и аккаунт',
    text: 'Один вход для телефона и остальных версий.'
  }
];

const installSteps = [
  'Скачай APK на телефон.',
  'Разреши установку, если Android попросит.',
  'Открой NeuralV и войди в аккаунт.'
];

export function AndroidPage() {
  const manifestState = useReleaseManifest();
  const artifact = getArtifact(manifestState.manifest, 'android');
  const ready = isArtifactReady(artifact);

  return (
    <div className="page-stack">
      <section className="hero-card platform-hero">
        <div className="hero-copy">
          <h1>NeuralV для Android.</h1>
          <p>
            Проверка приложений, история и защита на телефоне без тяжёлой витрины и лишних действий.
          </p>
          <div className="hero-actions">
            {ready && artifact?.downloadUrl ? (
              <a className="nv-button" href={artifact.downloadUrl} target="_blank" rel="noreferrer">Скачать APK</a>
            ) : (
              <button className="nv-button is-disabled" type="button" disabled>APK скоро</button>
            )}
            <a className="nv-button tonal" href="#android-install">Как установить</a>
          </div>
        </div>

        <div className="hero-panel compact-panel">
          <div className="mini-stat">
            <strong>Android 10+</strong>
            <span className="hero-support-text">Подходит для современных телефонов и планшетов.</span>
          </div>
        </div>
      </section>

      <section className="section-block">
        <div className="card-grid three-up compact-grid">
          {features.map((feature) => (
            <article key={feature.title} className="content-card compact-card">
              <h3>{feature.title}</h3>
              <p>{feature.text}</p>
            </article>
          ))}
        </div>
      </section>

      <section id="android-install" className="section-block">
        <div className="section-head section-head-tight">
          <h2>Установка</h2>
        </div>

        <div className="install-layout install-layout-static">
          <article className="content-card chooser-card">
            <h3>Что нужно</h3>
            <p>Обычная установка APK. Без длинного мастера и без отдельных утилит.</p>
          </article>

          <article className="content-card install-card">
            <div className="install-card-head simple-head">
              <div>
                <h3>Три шага</h3>
              </div>
            </div>
            <div className="command-shell light-shell">
              <pre>{installSteps.map((step, index) => `${index + 1}. ${step}`).join('\n')}</pre>
            </div>
          </article>
        </div>
      </section>
    </div>
  );
}
