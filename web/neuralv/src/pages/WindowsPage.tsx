import { getArtifact, isArtifactReady } from '../lib/manifest';
import { useReleaseManifest } from '../hooks/useReleaseManifest';

const features = [
  {
    title: 'Проверка файлов',
    text: 'Для EXE, DLL и обычных пользовательских сценариев.'
  },
  {
    title: 'Фоновый режим',
    text: 'Контроль важных зон без перегруженного интерфейса.'
  },
  {
    title: 'Один аккаунт',
    text: 'Тот же вход, что на Android и Linux.'
  }
];

const installSteps = [
  'Скачай архив или установщик.',
  'Открой приложение и войди в аккаунт.',
  'Запусти первую проверку или включи фоновой режим.'
];

export function WindowsPage() {
  const manifestState = useReleaseManifest();
  const artifact = getArtifact(manifestState.manifest, 'windows');
  const ready = isArtifactReady(artifact);

  return (
    <div className="page-stack">
      <section className="hero-card platform-hero">
        <div className="hero-copy">
          <h1>NeuralV для Windows.</h1>
          <p>
            Обычное настольное приложение для проверки файлов и фонового контроля на ПК.
          </p>
          <div className="hero-actions">
            {ready && artifact?.downloadUrl ? (
              <a className="nv-button" href={artifact.downloadUrl} target="_blank" rel="noreferrer">Скачать Windows</a>
            ) : (
              <button className="nv-button is-disabled" type="button" disabled>Сборка скоро</button>
            )}
          </div>
        </div>

        <div className="hero-panel compact-panel">
          <div className="mini-stat">
            <strong>Windows 10 / 11</strong>
            <span className="hero-support-text">GUI-клиент для обычного рабочего стола.</span>
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

      <section className="section-block">
        <div className="section-head section-head-tight">
          <h2>Установка</h2>
        </div>

        <div className="install-layout install-layout-static">
          <article className="content-card chooser-card">
            <h3>Что внутри</h3>
            <p>Скачиваешь сборку, входишь в аккаунт и сразу переходишь к проверке.</p>
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
