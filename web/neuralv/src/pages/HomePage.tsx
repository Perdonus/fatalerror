import { Link } from 'react-router-dom';
import { StoryScene } from '../components/StoryScene';
import { useReleaseManifest } from '../hooks/useReleaseManifest';
import { getArtifact, getArtifactSystemRequirements, getArtifactVersion } from '../lib/manifest';
import '../styles/story.css';

const scenes = [
  {
    title: 'Защита не должна быть догадкой',
    body: 'Сначала NeuralV проверяет быстро и спокойно. Если нужен второй уровень, система углубляет разбор без лишнего шума.',
    accent: 'Быстро в обычных случаях. Глубже там, где нужен второй взгляд.',
    visual: 'route' as const
  },
  {
    title: 'Каждая версия сделана под свою систему',
    body: 'Android, Windows и Linux не выглядят как одна и та же оболочка. У каждой версии свой ритм, но одна общая логика защиты.',
    accent: 'Один продукт. Три клиента под реальные устройства.',
    visual: 'platforms' as const
  },
  {
    title: 'Контроль важнее лишнего шума',
    body: 'Хорошая защита не должна кричать. Важнее ясный результат, понятные действия и нормальная подача без лишней технички.',
    accent: 'Чем серьёзнее проверка, тем спокойнее должна быть подача.',
    visual: 'privacy' as const
  }
] as const;

const faqItems = [
  {
    question: 'Что такое NeuralV',
    answer:
      'Это система защиты с отдельными клиентами под Android, Windows и Linux. У каждой платформы свой интерфейс, но аккаунт и общая логика остаются едиными.'
  },
  {
    question: 'Можно ли ему доверять',
    answer:
      'Доверие строится не на громких обещаниях, а на понятной модели работы. NeuralV старается объяснять проверку, защиту и повседневные действия без лишнего шума.'
  },
  {
    question: 'Как проходит проверка',
    answer:
      'Проверка начинается с локального этапа. Если нужен более строгий разбор, подключается следующий уровень.'
  },
  {
    question: 'Что остаётся локально',
    answer:
      'На устройстве сначала собирается базовая картина. Дальше объём проверки зависит от выбранного режима и самой системы.'
  },
  {
    question: 'Чем отличаются версии',
    answer:
      'Android ставится одним APK. На Windows есть setup, portable и установка через NV. На Linux основной путь идёт через NV.'
  },
  {
    question: 'Что видно на сайте',
    answer:
      'На сайте доступны вход, профиль, история действий, поддержка и страницы клиентов.'
  }
] as const;

function usePlatformSummary(platform: 'android' | 'windows' | 'linux' | 'shell') {
  const manifestState = useReleaseManifest(platform);
  const artifact = getArtifact(manifestState.manifest, platform === 'shell' ? 'shell' : platform);
  return {
    version: getArtifactVersion(manifestState.manifest, platform) || 'pending',
    requirement: getArtifactSystemRequirements(artifact, manifestState.manifest)[0] || '',
    downloadUrl: artifact?.downloadUrl || manifestState.manifest.downloadUrl
  };
}

export function HomePage() {
  const android = usePlatformSummary('android');
  const windows = usePlatformSummary('windows');
  const linux = usePlatformSummary('linux');

  return (
    <div className="page-stack story-page-shell">
      <section className="story-hero">
        <div className="story-hero-center">
          <article className="story-hero-card">
            <h1>Базовые технологии ушли в прошлое. Встречайте новый стандарт безопасности.</h1>
            <div className="story-hero-actions">
              <a className="nv-button" href="#downloads">Скачать</a>
              <Link className="shell-chip" to="/register">Аккаунт</Link>
            </div>
          </article>

          <div className="story-scroll-cue" aria-hidden="true">
            <div className="story-scroll-arrow" />
          </div>
        </div>
      </section>

      <div className="story-track">
        {scenes.map((scene) => (
          <StoryScene
            key={scene.title}
            title={scene.title}
            body={scene.body}
            accent={scene.accent}
            visual={scene.visual}
          />
        ))}
      </div>

      <section className="story-faq-section">
        <div className="story-faq-grid">
          <article className="story-faq-intro">
            <h2>Частые вопросы</h2>
          </article>
          <div className="story-faq-list">
            {faqItems.map((item) => (
              <details key={item.question} className="story-faq-item">
                <summary className="story-faq-question">{item.question}</summary>
                <div className="story-faq-answer">
                  <p>{item.answer}</p>
                </div>
              </details>
            ))}
          </div>
        </div>
      </section>

      <section className="story-download-section" id="downloads">
        <h2>Загрузки</h2>
        <div className="story-download-grid">
          <article className="story-download-card">
            <h3>Android</h3>
            <p>{android.requirement || 'Android 8.0+ (API 26)'}</p>
            <div className="story-download-actions">
              <Link className="nv-button" to="/android">Открыть страницу</Link>
            </div>
          </article>
          <article className="story-download-card">
            <h3>Windows</h3>
            <p>{windows.requirement || 'Windows 10/11 x64'}</p>
            <div className="story-download-actions">
              <Link className="nv-button" to="/windows">Открыть страницу</Link>
            </div>
          </article>
          <article className="story-download-card">
            <h3>Linux</h3>
            <p>{linux.requirement || 'x86_64 Linux'}</p>
            <div className="story-download-actions">
              <Link className="nv-button" to="/linux">Открыть страницу</Link>
            </div>
          </article>
        </div>
      </section>
    </div>
  );
}
