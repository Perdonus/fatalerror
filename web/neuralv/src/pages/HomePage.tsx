import { Link } from 'react-router-dom';
import { getArtifact, isArtifactReady } from '../lib/manifest';
import { useReleaseManifest } from '../hooks/useReleaseManifest';

type PlatformCard = {
  key: 'android' | 'windows' | 'linux';
  route: string;
  title: string;
  subtitle: string;
  hint: string;
  cta: string;
};

const platformCards: PlatformCard[] = [
  {
    key: 'android',
    route: '/android',
    title: 'Android',
    subtitle: 'Проверка приложений и фоновая защита на телефоне.',
    hint: 'Android 10+',
    cta: 'Открыть Android'
  },
  {
    key: 'windows',
    route: '/windows',
    title: 'Windows',
    subtitle: 'Проверка EXE и DLL, плюс фоновый контроль на ПК.',
    hint: 'Windows 10/11',
    cta: 'Открыть Windows'
  },
  {
    key: 'linux',
    route: '/linux',
    title: 'Linux',
    subtitle: 'GUI для рабочего стола и CLI через nv.',
    hint: 'x64 desktop',
    cta: 'Открыть Linux'
  }
];

const quickPoints = [
  {
    title: 'Один аккаунт',
    text: 'Один вход для телефона, ПК и Linux.'
  },
  {
    title: 'Локально там, где это быстро',
    text: 'Базовые проверки идут сразу на устройстве.'
  },
  {
    title: 'Сервер там, где нужен тяжёлый проход',
    text: 'Глубокие сценарии не грузят твой девайс зря.'
  }
];

const starterSteps = [
  'Выбери свою платформу.',
  'Скачай нужную версию.',
  'Войди и запусти проверку.'
];

export function HomePage() {
  const manifestState = useReleaseManifest();

  return (
    <div className="page-stack">
      <section className="hero-card home-hero">
        <div className="hero-copy">
          <span className="section-kicker">NeuralV</span>
          <h1>Спокойная защита без перегруженного сайта.</h1>
          <p>
            Тут только главное: выбрать платформу, скачать свою версию и быстро понять, что тебе подойдёт.
          </p>
          <div className="hero-actions">
            <a className="nv-button" href="#downloads">Выбрать версию</a>
            <Link className="nv-button tonal" to="/linux">Linux через nv</Link>
          </div>
        </div>

        <div className="hero-panel compact-panel">
          <div className="mini-stat">
            <span className="mini-stat-label">Сейчас на сайте</span>
            <strong>Android, Windows, Linux</strong>
          </div>
          <div className="mini-stat">
            <span className="mini-stat-label">Для кого</span>
            <strong>Телефон, ПК и терминал</strong>
          </div>
          <div className="mini-stat">
            <span className="mini-stat-label">Главный принцип</span>
            <strong>Меньше шума, больше понятных действий</strong>
          </div>
        </div>
      </section>

      <section id="downloads" className="section-block">
        <div className="section-head">
          <span className="section-kicker">Скачать</span>
          <h2>Выбери свою версию</h2>
        </div>

        <div className="card-grid three-up">
          {platformCards.map((card) => {
            const artifact = getArtifact(manifestState.manifest, card.key);
            const ready = isArtifactReady(artifact);

            return (
              <article key={card.key} className="content-card platform-card">
                <div className="platform-card-head">
                  <div>
                    <h3>{card.title}</h3>
                    <p>{card.subtitle}</p>
                  </div>
                  <span className={`status-dot${ready ? ' is-ready' : ''}`}>{ready ? 'Доступно' : 'Скоро'}</span>
                </div>
                <div className="platform-meta">{card.hint}</div>
                <div className="card-actions">
                  <Link className="nv-button tonal" to={card.route}>{card.cta}</Link>
                </div>
              </article>
            );
          })}
        </div>
      </section>

      <section className="section-block">
        <div className="card-grid three-up compact-grid">
          {quickPoints.map((point) => (
            <article key={point.title} className="content-card compact-card">
              <h3>{point.title}</h3>
              <p>{point.text}</p>
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
          {starterSteps.map((step, index) => (
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
