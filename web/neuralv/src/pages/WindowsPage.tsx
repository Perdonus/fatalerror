import { ManifestBanner } from '../components/ManifestBanner';
import { windowsPageContent } from '../content/windows';
import { useReleaseManifest } from '../hooks/useReleaseManifest';
import { getArtifact } from '../lib/manifest';

const windowsPageStyles = `
  .windows-page {
    --windows-ink: #18324d;
    --windows-muted: #54708a;
    --windows-primary: #0f6f9b;
    --windows-primary-soft: rgba(15, 111, 155, 0.14);
    --windows-primary-strong: #0f6f9b;
    --windows-teal: #1b8c84;
    --windows-amber: #af6b00;
    gap: 24px;
  }

  .windows-page .windows-hero {
    padding: 32px;
    display: grid;
    grid-template-columns: minmax(0, 1.2fr) minmax(320px, 0.8fr);
    gap: 24px;
    background:
      radial-gradient(circle at 0 0, rgba(102, 188, 255, 0.28), transparent 30%),
      radial-gradient(circle at 100% 20%, rgba(67, 214, 188, 0.16), transparent 22%),
      linear-gradient(135deg, rgba(236, 247, 255, 0.98), rgba(255, 255, 255, 0.9));
  }

  .windows-page .windows-hero-copy {
    display: grid;
    gap: 18px;
    min-width: 0;
  }

  .windows-page .windows-hero-copy h2,
  .windows-page .windows-section-title {
    margin: 0;
    color: var(--windows-ink);
  }

  .windows-page .windows-hero-copy h2 {
    font-size: clamp(2.8rem, 6vw, 4.8rem);
    line-height: 0.92;
    letter-spacing: -0.06em;
    max-width: 11ch;
  }

  .windows-page .windows-lead {
    margin: 0;
    color: var(--windows-muted);
    line-height: 1.7;
    max-width: 64ch;
  }

  .windows-page .windows-hero-actions {
    display: flex;
    flex-wrap: wrap;
    gap: 12px;
  }

  .windows-page .windows-hero-highlights,
  .windows-page .windows-signal-list,
  .windows-page .windows-faq,
  .windows-page .windows-note-list {
    margin: 0;
    padding-left: 20px;
    display: grid;
    gap: 10px;
    color: var(--windows-muted);
    line-height: 1.6;
  }

  .windows-page .windows-stats-grid {
    display: grid;
    grid-template-columns: repeat(3, minmax(0, 1fr));
    gap: 12px;
  }

  .windows-page .windows-stat-card {
    padding: 18px 18px 20px;
    border-radius: 24px;
    background: rgba(255, 255, 255, 0.76);
    border: 1px solid rgba(15, 111, 155, 0.14);
    box-shadow: inset 0 1px 0 rgba(255, 255, 255, 0.4);
  }

  .windows-page .windows-stat-card strong,
  .windows-page .windows-data-value,
  .windows-page .windows-stage-signal {
    display: block;
    color: var(--windows-ink);
  }

  .windows-page .windows-stat-card strong {
    margin-bottom: 8px;
    font-size: 1.18rem;
  }

  .windows-page .windows-stat-card span,
  .windows-page .windows-surface-copy,
  .windows-page .windows-surface-copy p,
  .windows-page .windows-surface-copy li,
  .windows-page .windows-mini-card p {
    color: var(--windows-muted);
    line-height: 1.6;
  }

  .windows-page .windows-command-center {
    position: relative;
    min-height: 100%;
    padding: 22px;
    border-radius: 30px;
    background:
      radial-gradient(circle at top, rgba(99, 190, 255, 0.28), transparent 34%),
      linear-gradient(180deg, rgba(15, 28, 50, 0.95), rgba(10, 40, 56, 0.96));
    color: #ebf4ff;
    overflow: hidden;
  }

  .windows-page .windows-command-center::before,
  .windows-page .windows-command-center::after {
    content: '';
    position: absolute;
    border-radius: 999px;
    filter: blur(2px);
    opacity: 0.45;
  }

  .windows-page .windows-command-center::before {
    width: 220px;
    height: 220px;
    top: -70px;
    right: -30px;
    background: rgba(90, 181, 255, 0.34);
    animation: windowsPulse 10s ease-in-out infinite;
  }

  .windows-page .windows-command-center::after {
    width: 160px;
    height: 160px;
    left: -30px;
    bottom: -40px;
    background: rgba(32, 204, 182, 0.26);
    animation: windowsPulse 12s ease-in-out infinite reverse;
  }

  .windows-page .windows-console-stack {
    position: relative;
    z-index: 1;
    display: grid;
    gap: 14px;
  }

  .windows-page .windows-console-chip-row {
    display: flex;
    flex-wrap: wrap;
    gap: 10px;
  }

  .windows-page .windows-console-chip {
    padding: 10px 14px;
    border-radius: 999px;
    background: rgba(255, 255, 255, 0.1);
    border: 1px solid rgba(173, 222, 255, 0.2);
    color: #d7ecff;
    font-size: 0.92rem;
  }

  .windows-page .windows-console-panel {
    padding: 18px;
    border-radius: 24px;
    background: rgba(255, 255, 255, 0.08);
    border: 1px solid rgba(173, 222, 255, 0.14);
    backdrop-filter: blur(16px);
  }

  .windows-page .windows-console-label,
  .windows-page .windows-stage-kicker,
  .windows-page .windows-step-tag {
    color: #a9d8ff;
    text-transform: uppercase;
    letter-spacing: 0.14em;
    font-size: 0.76rem;
  }

  .windows-page .windows-mini-kicker,
  .windows-page .windows-faq-q,
  .windows-page .windows-data-label {
    color: var(--windows-primary-strong);
    text-transform: uppercase;
    letter-spacing: 0.14em;
    font-size: 0.76rem;
  }

  .windows-page .windows-console-title,
  .windows-page .windows-step-title,
  .windows-page .windows-mini-title,
  .windows-page .windows-data-value,
  .windows-page .windows-faq-q {
    margin: 8px 0 0;
    font-weight: 700;
  }

  .windows-page .windows-console-list {
    margin: 12px 0 0;
    padding-left: 18px;
    display: grid;
    gap: 10px;
    color: #d0e6ff;
    line-height: 1.55;
  }

  .windows-page .windows-proof-grid,
  .windows-page .windows-capability-grid,
  .windows-page .windows-check-grid,
  .windows-page .windows-workflow-grid,
  .windows-page .windows-track-grid,
  .windows-page .windows-sales-grid,
  .windows-page .windows-download-grid,
  .windows-page .windows-mini-grid {
    display: grid;
    gap: 18px;
  }

  .windows-page .windows-proof-grid {
    grid-template-columns: repeat(4, minmax(0, 1fr));
  }

  .windows-page .windows-sales-grid {
    grid-template-columns: repeat(3, minmax(0, 1fr));
  }

  .windows-page .windows-capability-grid,
  .windows-page .windows-download-grid {
    grid-template-columns: repeat(3, minmax(0, 1fr));
  }

  .windows-page .windows-check-grid,
  .windows-page .windows-workflow-grid,
  .windows-page .windows-track-grid {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }

  .windows-page .windows-proof-card,
  .windows-page .windows-mini-card,
  .windows-page .windows-data-card,
  .windows-page .windows-faq-card {
    padding: 24px;
  }

  .windows-page .windows-proof-card h3,
  .windows-page .windows-surface-copy h3,
  .windows-page .windows-step-title,
  .windows-page .windows-mini-title,
  .windows-page .windows-download-primary h3,
  .windows-page .windows-data-value {
    margin: 0;
    color: var(--windows-ink);
  }

  .windows-page .windows-proof-card p,
  .windows-page .windows-faq-a {
    margin: 12px 0 0;
    color: var(--windows-muted);
    line-height: 1.6;
  }

  .windows-page .windows-capability-card,
  .windows-page .windows-check-card,
  .windows-page .windows-workflow-card,
  .windows-page .windows-track-card,
  .windows-page .windows-download-primary {
    padding: 28px;
  }

  .windows-page .windows-capability-card {
    background:
      linear-gradient(180deg, rgba(255, 255, 255, 0.9), rgba(246, 251, 255, 0.94));
  }

  .windows-page .windows-surface-copy {
    display: grid;
    gap: 12px;
  }

  .windows-page .windows-surface-copy p {
    margin: 0;
  }

  .windows-page .windows-check-card.server-side {
    background:
      linear-gradient(180deg, rgba(226, 248, 246, 0.95), rgba(255, 255, 255, 0.94));
  }

  .windows-page .windows-check-card.local-side {
    background:
      linear-gradient(180deg, rgba(235, 245, 255, 0.95), rgba(255, 255, 255, 0.94));
  }

  .windows-page .windows-cluster-list {
    display: grid;
    gap: 16px;
  }

  .windows-page .windows-cluster {
    padding: 18px;
    border-radius: 22px;
    background: rgba(255, 255, 255, 0.72);
    border: 1px solid rgba(24, 50, 77, 0.08);
  }

  .windows-page .windows-cluster h4 {
    margin: 0 0 10px;
    color: var(--windows-ink);
  }

  .windows-page .windows-cluster p {
    margin: 0 0 12px;
    color: var(--windows-muted);
    line-height: 1.6;
  }

  .windows-page .windows-bullet-list {
    margin: 0;
    padding-left: 18px;
    display: grid;
    gap: 10px;
    color: var(--windows-muted);
    line-height: 1.55;
  }

  .windows-page .windows-workflow-card {
    display: grid;
    gap: 16px;
  }

  .windows-page .windows-step-badge {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    width: 52px;
    height: 52px;
    border-radius: 18px;
    background: linear-gradient(135deg, rgba(15, 111, 155, 0.18), rgba(27, 140, 132, 0.12));
    color: var(--windows-primary-strong);
    font-weight: 700;
    font-size: 1.08rem;
  }

  .windows-page .windows-step-outcome {
    padding: 14px 16px;
    border-radius: 18px;
    background: rgba(15, 111, 155, 0.08);
    color: var(--windows-ink);
    line-height: 1.55;
  }

  .windows-page .windows-mini-grid {
    grid-template-columns: repeat(4, minmax(0, 1fr));
  }

  .windows-page .windows-mini-card {
    border-radius: 24px;
    background: rgba(255, 255, 255, 0.78);
    border: 1px solid rgba(15, 111, 155, 0.12);
  }

  .windows-page .windows-stage-signal {
    margin-top: 14px;
    font-size: 0.96rem;
  }

  .windows-page .windows-track-card {
    display: grid;
    gap: 14px;
  }

  .windows-page .windows-track-card .number-list {
    margin: 0;
    padding-left: 20px;
    color: var(--windows-muted);
    line-height: 1.6;
  }

  .windows-page .windows-download-primary {
    display: grid;
    gap: 14px;
    background:
      radial-gradient(circle at top right, rgba(112, 204, 255, 0.2), transparent 28%),
      linear-gradient(135deg, rgba(232, 247, 255, 0.98), rgba(255, 255, 255, 0.94));
  }

  .windows-page .windows-download-primary p,
  .windows-page .windows-data-card p {
    margin: 0;
    color: var(--windows-muted);
    line-height: 1.6;
  }

  .windows-page .windows-download-actions {
    display: flex;
    flex-wrap: wrap;
    gap: 12px;
    margin-top: 4px;
  }

  .windows-page .windows-download-chip-row {
    display: flex;
    flex-wrap: wrap;
    gap: 10px;
  }

  .windows-page .windows-download-chip {
    padding: 10px 14px;
    border-radius: 999px;
    background: rgba(15, 111, 155, 0.08);
    color: var(--windows-ink);
    font-size: 0.92rem;
  }

  .windows-page .windows-data-grid {
    display: grid;
    gap: 12px;
  }

  .windows-page .windows-data-card {
    border-radius: 24px;
    background: rgba(255, 255, 255, 0.84);
    border: 1px solid rgba(15, 111, 155, 0.12);
  }

  .windows-page .windows-data-value {
    margin-top: 10px;
    font-size: 1.15rem;
    line-height: 1.35;
    overflow-wrap: anywhere;
  }

  .windows-page .windows-section-head {
    display: grid;
    gap: 6px;
    max-width: 72ch;
  }

  .windows-page .windows-section-head p {
    margin: 0;
    color: var(--windows-muted);
    line-height: 1.65;
  }

  .windows-page .windows-faq-grid {
    display: grid;
    grid-template-columns: repeat(3, minmax(0, 1fr));
    gap: 18px;
  }

  .windows-page .windows-faq-card {
    display: grid;
    gap: 12px;
  }

  .windows-page .windows-faq-a {
    margin: 0;
  }

  @keyframes windowsPulse {
    0%,
    100% {
      transform: translate3d(0, 0, 0) scale(1);
    }
    50% {
      transform: translate3d(10px, -14px, 0) scale(1.05);
    }
  }

  @media (max-width: 1080px) {
    .windows-page .windows-hero,
    .windows-page .windows-proof-grid,
    .windows-page .windows-capability-grid,
    .windows-page .windows-check-grid,
    .windows-page .windows-workflow-grid,
    .windows-page .windows-track-grid,
    .windows-page .windows-sales-grid,
    .windows-page .windows-download-grid,
    .windows-page .windows-mini-grid,
    .windows-page .windows-faq-grid,
    .windows-page .windows-stats-grid {
      grid-template-columns: 1fr;
    }

    .windows-page .windows-hero-copy h2 {
      max-width: none;
    }
  }

  @media (max-width: 720px) {
    .windows-page .windows-hero,
    .windows-page .windows-capability-card,
    .windows-page .windows-check-card,
    .windows-page .windows-workflow-card,
    .windows-page .windows-track-card,
    .windows-page .windows-proof-card,
    .windows-page .windows-download-primary,
    .windows-page .windows-data-card,
    .windows-page .windows-faq-card {
      padding: 22px;
    }

    .windows-page .windows-command-center {
      padding: 18px;
    }
  }
`;

function formatManifestDate(value: string | number | undefined) {
  if (!value) {
    return 'pending';
  }

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return String(value);
  }

  return new Intl.DateTimeFormat('ru-RU', {
    dateStyle: 'medium',
    timeStyle: 'short'
  }).format(date);
}

export function WindowsPage() {
  const manifestState = useReleaseManifest();
  const windowsArtifact = getArtifact(manifestState.manifest, 'windows');
  const manifestVersion = windowsArtifact?.version ?? 'pending';
  const artifactName = windowsArtifact?.fileName ?? 'pending';
  const artifactHash = windowsArtifact?.sha256 ?? 'SHA256 появится в release manifest после первой публикации.';
  const generatedAt = formatManifestDate(manifestState.manifest.generatedAt);
  const serverSummary = manifestState.source === 'remote'
    ? 'Windows build подтягивается из живого release manifest.'
    : 'Сейчас используется fallback-конфигурация. Страница уже готова к live manifest.';

  return (
    <>
      <style>{windowsPageStyles}</style>
      <div className="stack-xl windows-page">
        <ManifestBanner {...manifestState} />

        <section className="surface-card windows-hero">
          <div className="windows-hero-copy">
            <div className="eyebrow">{windowsPageContent.hero.eyebrow}</div>
            <h2>{windowsPageContent.hero.title}</h2>
            <p className="windows-lead">{windowsPageContent.hero.description}</p>

            <div className="windows-hero-actions">
              {windowsArtifact?.downloadUrl ? (
                <a href={windowsArtifact.downloadUrl} target="_blank" rel="noreferrer">
                  <md-filled-button>Скачать Windows build</md-filled-button>
                </a>
              ) : (
                <md-filled-button disabled>Windows build скоро появится</md-filled-button>
              )}
              <a href="#windows-downloads">
                <md-filled-tonal-button>Смотреть загрузки</md-filled-tonal-button>
              </a>
              <md-outlined-button href="/basedata/api/releases/manifest">Открыть manifest</md-outlined-button>
            </div>

            <ul className="windows-hero-highlights">
              {windowsPageContent.hero.highlights.map((highlight) => (
                <li key={highlight}>{highlight}</li>
              ))}
            </ul>

            <div className="windows-stats-grid">
              {windowsPageContent.hero.stats.map((stat, index) => (
                <article key={stat.label} className="windows-stat-card">
                  <div className="eyebrow">{stat.label}</div>
                  <strong>
                    {index === 0 ? manifestVersion : index === 1 ? 'always-on' : 'deep verdict'}
                  </strong>
                  <span>{stat.detail}</span>
                </article>
              ))}
            </div>
          </div>

          <div className="windows-command-center" aria-hidden="true">
            <div className="windows-console-stack">
              <div className="windows-console-chip-row">
                <span className="windows-console-chip">EXE / DLL</span>
                <span className="windows-console-chip">Resident watch</span>
                <span className="windows-console-chip">Server triage</span>
              </div>

              <section className="windows-console-panel">
                <div className="windows-console-label">Queue snapshot</div>
                <div className="windows-console-title">Файл попадает в проверку до запуска</div>
                <ul className="windows-console-list">
                  <li>Считывается PE-профиль и происхождение файла без долгого ожидания.</li>
                  <li>Подсвечиваются signer anomalies, packer hints и side-load признаки.</li>
                </ul>
              </section>

              <section className="windows-console-panel">
                <div className="windows-console-label">Resident path</div>
                <div className="windows-console-title">Downloads, Temp и autorun зоны под наблюдением</div>
                <ul className="windows-console-list">
                  {windowsPageContent.residentSignals.slice(0, 2).map((signal) => (
                    <li key={signal}>{signal}</li>
                  ))}
                </ul>
              </section>

              <section className="windows-console-panel">
                <div className="windows-console-label">Server verdict</div>
                <div className="windows-console-title">Локальный сигнал превращается в объяснимый отчёт</div>
                <ul className="windows-console-list">
                  {windowsPageContent.serverChecks[0].bullets.map((bullet) => (
                    <li key={bullet}>{bullet}</li>
                  ))}
                </ul>
              </section>
            </div>
          </div>
        </section>

        <section className="windows-proof-grid" aria-label="Причины выбрать Windows-версию">
          {windowsPageContent.proofPoints.map((point) => (
            <article key={point.title} className="surface-card windows-proof-card">
              <div className="eyebrow">Windows value</div>
              <h3>{point.title}</h3>
              <p>{point.text}</p>
            </article>
          ))}
        </section>

        <section className="stack-xl">
          <div className="windows-section-head">
            <div className="eyebrow">Почему эта версия продаёт себя сама</div>
            <h3 className="windows-section-title">GUI, resident protection и deep verdict собраны в одном пользовательском пути</h3>
            <p>
              Страница объясняет Windows-клиент как продукт, а не как набор разрозненных функций:
              сначала понятный интерфейс, затем защита до запуска, затем серверная глубина для спорных кейсов.
            </p>
          </div>

          <section className="windows-capability-grid">
            {windowsPageContent.capabilities.map((capability) => (
              <article key={capability.title} className="surface-card windows-capability-card">
                <div className="windows-surface-copy">
                  <div className="eyebrow">{capability.eyebrow}</div>
                  <h3>{capability.title}</h3>
                  <p>{capability.text}</p>
                  <ul className="windows-bullet-list">
                    {capability.bullets.map((bullet) => (
                      <li key={bullet}>{bullet}</li>
                    ))}
                  </ul>
                </div>
              </article>
            ))}
          </section>
        </section>

        <section className="stack-xl">
          <div className="windows-section-head">
            <div className="eyebrow">EXE / DLL checks</div>
            <h3 className="windows-section-title">От первых PE-сигналов до server-backed verdict</h3>
            <p>
              В центре Windows-версии два слоя: быстрый локальный анализ, который экономит время,
              и selective deep pipeline, который добирает контекст только когда это действительно нужно.
            </p>
          </div>

          <div className="windows-check-grid">
            <section className="surface-card windows-check-card local-side">
              <div className="windows-surface-copy">
                <div className="eyebrow">Local side</div>
                <h3>Что NeuralV проверяет прямо на машине</h3>
              </div>
              <div className="windows-cluster-list">
                {windowsPageContent.localChecks.map((cluster) => (
                  <article key={cluster.title} className="windows-cluster">
                    <h4>{cluster.title}</h4>
                    <p>{cluster.text}</p>
                    <ul className="windows-bullet-list">
                      {cluster.bullets.map((bullet) => (
                        <li key={bullet}>{bullet}</li>
                      ))}
                    </ul>
                  </article>
                ))}
              </div>
            </section>

            <section className="surface-card windows-check-card server-side">
              <div className="windows-surface-copy">
                <div className="eyebrow">Server side</div>
                <h3>Что добирается на backend перед финальным verdict</h3>
              </div>
              <div className="windows-cluster-list">
                {windowsPageContent.serverChecks.map((cluster) => (
                  <article key={cluster.title} className="windows-cluster">
                    <h4>{cluster.title}</h4>
                    <p>{cluster.text}</p>
                    <ul className="windows-bullet-list">
                      {cluster.bullets.map((bullet) => (
                        <li key={bullet}>{bullet}</li>
                      ))}
                    </ul>
                  </article>
                ))}
              </div>
            </section>
          </div>

          <section className="surface-card windows-proof-card">
            <div className="eyebrow">Resident protection</div>
            <h3>Фоновая защита ориентируется на реальные Windows-сценарии, а не только на ручной scan</h3>
            <ul className="windows-signal-list">
              {windowsPageContent.residentSignals.map((signal) => (
                <li key={signal}>{signal}</li>
              ))}
            </ul>
          </section>
        </section>

        <section className="stack-xl">
          <div className="windows-section-head">
            <div className="eyebrow">User workflow</div>
            <h3 className="windows-section-title">Пользовательский путь от скачивания файла до финального действия</h3>
            <p>
              Это страница не про абстрактные engine-модули, а про то, что происходит на реальном ПК:
              файл скачивается, клиент быстро реагирует, backend дотягивает глубокий verdict, история остаётся доступной.
            </p>
          </div>

          <div className="windows-workflow-grid">
            {windowsPageContent.workflow.map((step) => (
              <article key={step.step} className="surface-card windows-workflow-card">
                <div className="windows-step-badge">{step.step}</div>
                <div className="windows-step-tag">Workflow</div>
                <h3 className="windows-step-title">{step.title}</h3>
                <p className="windows-lead">{step.text}</p>
                <div className="windows-step-outcome">{step.outcome}</div>
              </article>
            ))}
          </div>

          <div className="windows-mini-grid">
            {windowsPageContent.pipeline.map((stage) => (
              <article key={stage.title} className="windows-mini-card">
                <div className="windows-mini-kicker">Pipeline stage</div>
                <h3 className="windows-mini-title">{stage.title}</h3>
                <p>{stage.text}</p>
                <span className="windows-stage-signal">{stage.signal}</span>
              </article>
            ))}
          </div>
        </section>

        <section className="stack-xl">
          <div className="windows-section-head">
            <div className="eyebrow">Install / update</div>
            <h3 className="windows-section-title">Установка и обновление не ломают пользовательский ритм</h3>
            <p>
              Страница сразу закрывает два вопроса: как быстро начать работу и как потом держать клиента в актуальном состоянии
              без повторной настройки resident protection и без поиска новых сборок по внешним каналам.
            </p>
          </div>

          <div className="windows-track-grid">
            {[windowsPageContent.installTrack, windowsPageContent.updateTrack].map((track) => (
              <section key={track.title} className="surface-card windows-track-card">
                <div className="eyebrow">{track.eyebrow}</div>
                <h3>{track.title}</h3>
                <ol className="number-list">
                  {track.steps.map((step) => (
                    <li key={step}>{step}</li>
                  ))}
                </ol>
              </section>
            ))}
          </div>
        </section>

        <section className="stack-xl" id="windows-downloads">
          <div className="windows-section-head">
            <div className="eyebrow">Downloads</div>
            <h3 className="windows-section-title">Вся Windows-загрузка и release-информация на одной странице</h3>
            <p>
              Пользователь получает не просто кнопку скачивания, а контекст: какая версия опубликована,
              когда обновлялся manifest, какой hash проверять и какие server-side notes идут вместе с релизом.
            </p>
          </div>

          <div className="windows-download-grid">
            <article className="surface-card windows-download-primary">
              <div className="eyebrow">Primary build</div>
              <h3>Windows {manifestVersion}</h3>
              <p>{serverSummary}</p>
              <div className="windows-download-chip-row">
                <span className="windows-download-chip">Artifact: {artifactName}</span>
                <span className="windows-download-chip">Manifest updated: {generatedAt}</span>
              </div>
              <div className="windows-download-actions">
                {windowsArtifact?.downloadUrl ? (
                  <a href={windowsArtifact.downloadUrl} target="_blank" rel="noreferrer">
                    <md-filled-button>Скачать Windows build</md-filled-button>
                  </a>
                ) : (
                  <md-filled-button disabled>Ожидаем публикацию build</md-filled-button>
                )}
                <md-outlined-button href="/basedata/api/releases/manifest">Открыть JSON</md-outlined-button>
              </div>
              {windowsArtifact?.notes?.length ? (
                <ul className="windows-note-list">
                  {windowsArtifact.notes.map((note) => (
                    <li key={note}>{note}</li>
                  ))}
                </ul>
              ) : (
                <ul className="windows-note-list">
                  <li>После первой публикации сюда автоматически подтянутся release notes из manifest.</li>
                  <li>Секция уже готова показывать имя файла, hash и комментарии по каналу релиза.</li>
                </ul>
              )}
            </article>

            <div className="windows-data-grid">
              <article className="surface-card windows-data-card">
                <div className="windows-data-label">SHA256</div>
                <div className="windows-data-value">{artifactHash}</div>
                <p>Подходит для ручной проверки целостности перед установкой или развёртыванием на рабочей станции.</p>
              </article>

              <article className="surface-card windows-data-card">
                <div className="windows-data-label">Release channel</div>
                <div className="windows-data-value">{manifestState.manifest.releaseChannel ?? 'stable'}</div>
                <p>Канал читается из manifest, поэтому страница не зависит от захардкоженных версий и ручных правок.</p>
              </article>
            </div>

            <div className="windows-data-grid">
              {windowsPageContent.downloadBriefs.map((brief) => (
                <article key={brief.title} className="surface-card windows-data-card">
                  <div className="windows-data-label">Download brief</div>
                  <div className="windows-data-value">{brief.title}</div>
                  <p>{brief.text}</p>
                </article>
              ))}
            </div>
          </div>
        </section>

        <section className="stack-xl">
          <div className="windows-section-head">
            <div className="eyebrow">Для кого это</div>
            <h3 className="windows-section-title">Продающий слой страницы объясняет ценность по разным Windows-сценариям</h3>
            <p>
              Один и тот же продукт должен быть убедительным и для домашнего пользователя, и для инженера,
              который часто скачивает инсталляторы, архивы и тестовые DLL на рабочую машину.
            </p>
          </div>

          <div className="windows-sales-grid">
            {windowsPageContent.salesCards.map((card) => (
              <article key={card.title} className="surface-card windows-proof-card">
                <div className="eyebrow">Audience fit</div>
                <h3>{card.title}</h3>
                <p>{card.text}</p>
              </article>
            ))}
          </div>

          <div className="windows-faq-grid">
            {windowsPageContent.faq.map((item) => (
              <article key={item.question} className="surface-card windows-faq-card">
                <div className="windows-faq-q">{item.question}</div>
                <p className="windows-faq-a">{item.answer}</p>
              </article>
            ))}
          </div>
        </section>
      </div>
    </>
  );
}
