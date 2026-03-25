import '../styles/story.css';

const telegramArtifacts = [
  {
    title: 'Extera/Ayu',
    description: 'Плагин для ExteraGram и AyuGram.',
    fileName: 'NeuralV-3.plugin',
    downloadUrl: '/neuralv/telegram/NeuralV-3.plugin'
  },
  {
    title: 'Heroku',
    description: 'Модуль для Heroku.',
    fileName: 'NeuralV.py',
    downloadUrl: '/neuralv/telegram/NeuralV.py'
  }
];

export function TelegramPage() {
  return (
    <div className="page-stack platform-story-shell telegram-page">
      <section className="platform-hero">
        <div className="platform-hero-center">
          <article className="platform-hero-card platform-hero-card-centered">
            <div className="platform-hero-copy platform-hero-copy-centered">
              <h1>NeuralV для Telegram</h1>
              <p>Два отдельных формата под разные Telegram-сценарии. Плагин остаётся быстрым вариантом для клиента, а модуль для Heroku подходит серверному контуру.</p>
              <div className="platform-hero-actions">
                <a className="nv-button" href={telegramArtifacts[0].downloadUrl} download>Скачать плагин</a>
                <a className="shell-chip" href={telegramArtifacts[1].downloadUrl} download>Скачать модуль</a>
              </div>
            </div>
          </article>
        </div>
      </section>

      <section className="platform-install-shell">
        <div className="platform-section-heading platform-section-heading-centered">
          <h2>Скачать</h2>
        </div>
        <div className="platform-install-grid platform-install-grid-centered platform-install-grid-telegram">
          {telegramArtifacts.map((artifact) => (
            <article key={artifact.fileName} className="platform-install-card platform-install-card-centered">
              <h3>{artifact.title}</h3>
              <p>{artifact.description}</p>
              <div className="platform-hero-actions">
                <a className="nv-button" href={artifact.downloadUrl} download>Скачать</a>
              </div>
            </article>
          ))}
        </div>
      </section>
    </div>
  );
}
