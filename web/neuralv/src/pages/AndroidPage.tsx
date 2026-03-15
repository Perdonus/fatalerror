import { getArtifact, isArtifactReady } from '../lib/manifest';
import { useReleaseManifest } from '../hooks/useReleaseManifest';

const features = [
  {
    title: 'Быстрая проверка',
    text: 'Проверка приложений и новых установок прямо на телефоне.'
  },
  {
    title: 'Фоновая защита',
    text: 'NeuralV остаётся рядом и ловит важные события без лишнего шума.'
  },
  {
    title: 'Глубокий серверный проход',
    text: 'Тяжёлый анализ уходит на сервер, а на экране остаётся только итог.'
  }
];

const installSteps = [
  'Скачай APK и открой его на телефоне.',
  'Разреши установку, если Android это попросит.',
  'Запусти NeuralV и войди, если нужна история и серверные проверки.'
];

export function AndroidPage() {
  const manifestState = useReleaseManifest();
  const artifact = getArtifact(manifestState.manifest, 'android');
  const ready = isArtifactReady(artifact);

  return (
    <div className="page-stack">
      <section className="hero-card platform-hero">
        <div className="hero-copy">
          <span className="section-kicker">Android</span>
          <h1>Проверка приложений на телефоне без тяжёлой витрины.</h1>
          <p>
            Оставь быстрые действия на устройстве, а сложную перепроверку — серверу. Так проще и быстрее.
          </p>
          <div className="hero-actions">
            {ready && artifact?.downloadUrl ? (
              <a className="nv-button" href={artifact.downloadUrl} target="_blank" rel="noreferrer">Скачать APK</a>
            ) : (
              <button className="nv-button is-disabled" type="button" disabled>APK скоро появится</button>
            )}
            <a className="nv-button tonal" href="#android-install">Как установить</a>
          </div>
        </div>

        <div className="hero-panel">
          <div className="mini-stat">
            <span className="mini-stat-label">Подходит для</span>
            <strong>Android 10 и новее</strong>
          </div>
          <div className="mini-stat">
            <span className="mini-stat-label">Лучше всего для</span>
            <strong>Проверки установленных и новых приложений</strong>
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

      <section id="android-install" className="section-block slim-section">
        <div className="section-head">
          <span className="section-kicker">Установка</span>
          <h2>Три простых шага</h2>
        </div>

        <div className="step-row">
          {installSteps.map((step, index) => (
            <article key={step} className="content-card step-card">
              <span className="step-index">0{index + 1}</span>
              <p>{step}</p>
            </article>
          ))}
        </div>
      </section>
    </div>
  );
}
