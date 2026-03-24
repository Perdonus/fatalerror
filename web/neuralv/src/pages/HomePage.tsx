import { Link } from 'react-router-dom';
import { NeuralVDecor } from '../components/NeuralVDecor';
import { useReleaseManifest } from '../hooks/useReleaseManifest';
import { getArtifact, getArtifactSystemRequirements, getArtifactVersion } from '../lib/manifest';

const signalCards = [
  {
    title: 'Не одна кнопка',
    text: 'Проверка не сводится к одному локальному вердикту. Клиент и сервер работают как разные слои.'
  },
  {
    title: 'Понятная установка',
    text: 'У каждой платформы свой install flow, а не одна и та же оболочка под разными иконками.'
  },
  {
    title: 'Нормальный продуктовый режим',
    text: 'История, аккаунт, обновления и release-маршрут привязаны к конкретной платформе, а не к рекламной витрине.'
  }
] as const;

const faqItems = [
  {
    q: 'Что такое NeuralV?',
    a: 'Это антивирус с отдельными клиентами под Android, Windows и Linux. У каждой платформы свой интерфейс, свой сценарий установки и свой маршрут проверки.'
  },
  {
    q: 'Можно ли ему доверять?',
    a: 'Да, если тебе важны прозрачная установка, понятная схема проверки и честные ограничения. Здесь нет обещания магического результата одной кнопкой.'
  },
  {
    q: 'Как проходит проверка?',
    a: 'Сначала клиент быстро собирает базовую картину. Если локального сигнала мало, дальше включается более глубокий серверный маршрут и перепроверка результата.'
  },
  {
    q: 'Что уходит на сервер?',
    a: 'Это зависит от платформы и режима. Для глубоких маршрутов часть данных и артефактов уходит на серверный анализ. Локальная быстрая часть остаётся отдельным слоем.'
  },
  {
    q: 'Чем отличаются платформы?',
    a: 'Android, Windows и Linux не сводятся в одну и ту же оболочку. Разные клиенты решают похожую задачу, но делают это по-разному.'
  },
  {
    q: 'С чего начать?',
    a: 'Выбери платформу, проверь системные требования, установи клиент и уже потом решай, нужен ли тебе аккаунт и глубокая проверка.'
  }
] as const;

function usePlatformSummary(platform: 'android' | 'windows' | 'linux' | 'shell') {
  const manifestState = useReleaseManifest(platform);
  const artifact = getArtifact(manifestState.manifest, platform === 'shell' ? 'shell' : platform);
  return {
    version: getArtifactVersion(manifestState.manifest, platform) || 'pending',
    requirement: getArtifactSystemRequirements(artifact, manifestState.manifest)[0] || 'ожидает manifest',
    downloadUrl: artifact?.downloadUrl || manifestState.manifest.downloadUrl
  };
}

export function HomePage() {
  const android = usePlatformSummary('android');
  const windows = usePlatformSummary('windows');
  const linux = usePlatformSummary('linux');

  return (
    <div className="page-stack home-stack">
      <section className="hero-shell home-hero-shell home-hero-shell-rich">
        <div className="hero-copy hero-copy-wide home-hero-copy">
          <div className="home-hero-title">
            <h1>NeuralV</h1>
            <div className="hero-actions home-hero-actions">
              <a className="nv-button" href="#downloads">Скачать</a>
              <Link className="shell-chip" to="/register">Аккаунт</Link>
            </div>
          </div>

          <div className="home-signal-grid">
            {signalCards.map((item) => (
              <article key={item.title} className="surface-card info-card info-card-compact">
                <h2>{item.title}</h2>
                <p>{item.text}</p>
              </article>
            ))}
          </div>
        </div>

        <NeuralVDecor variant="home" className="page-decor page-decor-home" />
      </section>

      <section className="section-block section-block-split">
        <div className="section-heading">
          <h2>Как это устроено</h2>
        </div>
        <div className="section-grid split-info-grid">
          <article className="surface-card stage-card stage-card-wide">
            <div className="stage-step">1</div>
            <h3>Локальный старт</h3>
            <p>Клиент быстро собирает базовую картину и даёт первичный сигнал без тяжёлой лишней нагрузки.</p>
          </article>
          <article className="surface-card stage-card stage-card-wide">
            <div className="stage-step">2</div>
            <h3>Глубокий маршрут</h3>
            <p>Если случай сложный, часть проверки уходит на сервер. Там результат перепроверяется до того, как вернуться к пользователю.</p>
          </article>
          <article className="surface-card stage-card stage-card-wide">
            <div className="stage-step">3</div>
            <h3>Итог без лишнего шума</h3>
            <p>На витрине и в интерфейсе остаётся только то, что реально помогает понять статус, угрозы и дальнейшее действие.</p>
          </article>
        </div>
      </section>

      <section className="section-block faq-section-shell">
        <div className="section-heading">
          <h2>Частые вопросы</h2>
        </div>

        <div className="faq-shell-grid">
          <div className="faq-list faq-list-expanded">
            {faqItems.map((item, index) => (
              <details key={item.q} className="faq-item" open={index === 0}>
                <summary className="faq-question">{item.q}</summary>
                <div className="faq-answer">
                  <p>{item.a}</p>
                </div>
              </details>
            ))}
          </div>

          <div className="faq-side-stack">
            <article className="surface-card info-card faq-side-card accent-card">
              <h3>Android</h3>
              <strong>{android.version}</strong>
              <p>{android.requirement}</p>
              <Link className="shell-chip" to="/android">Открыть</Link>
            </article>
            <article className="surface-card info-card faq-side-card accent-card">
              <h3>Windows</h3>
              <strong>{windows.version}</strong>
              <p>{windows.requirement}</p>
              <Link className="shell-chip" to="/windows">Открыть</Link>
            </article>
            <article className="surface-card info-card faq-side-card">
              <h3>Linux</h3>
              <strong>{linux.version}</strong>
              <p>{linux.requirement}</p>
              <Link className="shell-chip" to="/linux">Открыть</Link>
            </article>
          </div>
        </div>
      </section>

      <section className="section-block downloads-section" id="downloads">
        <div className="section-heading">
          <h2>Загрузки</h2>
        </div>
        <div className="download-grid download-grid-dense">
          <article className="surface-card download-card download-card-large">
            <div className="download-head"><h3>Android</h3><span>{android.version}</span></div>
            <p className="download-requirement">{android.requirement}</p>
            <div className="download-actions">
              <Link className="nv-button" to="/android">Перейти</Link>
            </div>
          </article>
          <article className="surface-card download-card download-card-large accent-card">
            <div className="download-head"><h3>Windows</h3><span>{windows.version}</span></div>
            <p className="download-requirement">{windows.requirement}</p>
            <div className="download-actions">
              <Link className="nv-button" to="/windows">Перейти</Link>
            </div>
          </article>
          <article className="surface-card download-card download-card-large">
            <div className="download-head"><h3>Linux</h3><span>{linux.version}</span></div>
            <p className="download-requirement">{linux.requirement}</p>
            <div className="download-actions">
              <Link className="nv-button" to="/linux">Перейти</Link>
            </div>
          </article>
        </div>
      </section>
    </div>
  );
}
