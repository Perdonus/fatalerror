import { getArtifact, isArtifactReady } from '../lib/manifest';
import { useReleaseManifest } from '../hooks/useReleaseManifest';

const features = [
  {
    title: 'Проверка EXE и DLL',
    text: 'Подходит для обычного ПК, где важно быстро понять, что за файл перед тобой.'
  },
  {
    title: 'Фоновый контроль',
    text: 'Следит за важными зонами и подхватывает подозрительные события без ручной рутины.'
  },
  {
    title: 'Серверный фильтр',
    text: 'Если случай спорный, сервер дочищает вывод до понятного результата.'
  }
];

const installSteps = [
  'Скачай Windows-версию и распакуй её в удобную папку.',
  'Запусти клиент и войди тем же аккаунтом, что на Android или Linux.',
  'Включи фоновую защиту, если нужен постоянный контроль.'
];

export function WindowsPage() {
  const manifestState = useReleaseManifest();
  const artifact = getArtifact(manifestState.manifest, 'windows');
  const ready = isArtifactReady(artifact);

  return (
    <div className="page-stack">
      <section className="hero-card platform-hero">
        <div className="hero-copy">
          <span className="section-kicker">Windows</span>
          <h1>Спокойная проверка файлов и автозапуска на ПК.</h1>
          <p>
            NeuralV для Windows нужен там, где хочется понятный GUI, нормальный фоновой режим и минимум лишнего текста.
          </p>
          <div className="hero-actions">
            {ready && artifact?.downloadUrl ? (
              <a className="nv-button" href={artifact.downloadUrl} target="_blank" rel="noreferrer">Скачать Windows</a>
            ) : (
              <button className="nv-button is-disabled" type="button" disabled>Windows-версия скоро появится</button>
            )}
          </div>
        </div>

        <div className="hero-panel">
          <div className="mini-stat">
            <span className="mini-stat-label">Подходит для</span>
            <strong>Windows 10 и 11</strong>
          </div>
          <div className="mini-stat">
            <span className="mini-stat-label">Лучше всего для</span>
            <strong>EXE, DLL и фонового контроля</strong>
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

      <section className="section-block slim-section">
        <div className="section-head">
          <span className="section-kicker">Старт</span>
          <h2>Как начать</h2>
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
