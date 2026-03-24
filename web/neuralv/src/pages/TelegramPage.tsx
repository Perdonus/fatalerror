import '../styles/story.css';

const telegramArtifacts = [
  {
    title: 'ExteraGram',
    fileName: 'NeuralV-3.plugin',
    description: 'Готовый plugin для ExteraGram. Ставится как отдельный файл и открывает NeuralV прямо в Telegram-клиенте.',
    version: '1.0',
    minimum: 'ExteraGram 11.12.1+',
    downloadUrl: '/neuralv/telegram/NeuralV-3.plugin'
  },
  {
    title: 'Hikka',
    fileName: 'NeuralV.py',
    description: 'Отдельный модуль для Hikka. Подходит, если NeuralV нужен прямо в Telegram-окружении без отдельного desktop-клиента.',
    version: '1.0',
    minimum: 'Hikka 1.3.0+',
    downloadUrl: '/neuralv/telegram/NeuralV.py'
  }
];

export function TelegramPage() {
  return (
    <div className="page-stack platform-story-shell">
      <section className="platform-hero">
        <div className="platform-hero-center">
          <article className="platform-hero-card platform-hero-card-centered">
            <div className="platform-hero-copy platform-hero-copy-centered">
              <h1>NeuralV для Telegram</h1>
            </div>
            <div className="platform-hero-grid platform-hero-grid-centered">
              <div className="platform-main-stat">
                <strong>Два отдельных формата</strong>
                <p>Plugin и модуль под разные Telegram-клиенты.</p>
              </div>
              <div className="platform-meta-chip">ExteraGram</div>
              <div className="platform-meta-chip">Hikka</div>
              <div className="platform-meta-chip">Telegram</div>
            </div>
          </article>
        </div>
      </section>

      <section className="platform-install-shell">
        <div className="platform-install-grid platform-install-grid-centered">
          {telegramArtifacts.map((artifact) => (
            <article key={artifact.fileName} className="platform-install-card platform-install-card-centered">
              <h2>{artifact.title}</h2>
              <p>{artifact.description}</p>
              <div className="platform-main-stat">
                <strong>{artifact.version}</strong>
                <p>{artifact.minimum}</p>
              </div>
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
