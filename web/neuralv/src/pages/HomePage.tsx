import { Link } from 'react-router-dom';
import { StoryScene } from '../components/StoryScene';
import { useReleaseManifest } from '../hooks/useReleaseManifest';
import { getArtifact, getArtifactSystemRequirements, getArtifactVersion } from '../lib/manifest';
import '../styles/story.css';

const scenes = [
  {
    title: 'Проверка строится по этапам',
    body: 'Сначала клиент быстро собирает локальную картину. Если этого мало, дальше подключается более глубокий маршрут, а не повтор той же кнопки под другим названием.',
    accent: 'Быстрый старт и глубокая проверка не смешиваются в один шаг.',
    visual: 'route' as const
  },
  {
    title: 'У каждой платформы свой нормальный клиент',
    body: 'Android, Windows и Linux не обязаны выглядеть одинаково. Главное другое: чтобы на каждой системе был понятный сценарий установки, входа и проверки.',
    accent: 'Один продукт, разные клиенты под реальные устройства.',
    visual: 'platforms' as const
  },
  {
    title: 'Нужна не витрина, а понятный маршрут',
    body: 'Пользователь должен понимать, что происходит с файлом, где заканчивается локальная часть и когда начинается более тяжёлый анализ. Это важнее, чем лишний декоративный экран.',
    accent: 'Чем сложнее проверка, тем важнее прозрачное описание.',
    visual: 'privacy' as const
  }
] as const;

const faqItems = [
  {
    question: 'Что такое NeuralV',
    answer:
      'Это антивирус с отдельными клиентами под Android, Windows и Linux. На каждой системе используется свой интерфейс и свой установочный путь, но аккаунт и базовая логика защиты остаются общими.'
  },
  {
    question: 'Можно ли ему доверять',
    answer:
      'Сайт и клиенты не обещают магию одной кнопкой. Проверка разбита на этапы, а способы установки и ограничения не прячутся в мелкий текст.'
  },
  {
    question: 'Как проходит проверка',
    answer:
      'Клиент начинает с более быстрой локальной части. Если этого мало, дальше подключается более глубокий маршрут. Из-за этого результаты не сводятся к одной мгновенной реакции на всё подряд.'
  },
  {
    question: 'Что остаётся локально',
    answer:
      'Локальный клиент сначала собирает и показывает базовую картину на устройстве. Дальше всё зависит от выбранного режима и платформы.'
  },
  {
    question: 'Чем отличаются версии',
    answer:
      'Android идёт как один APK. Windows поддерживает setup, portable и установку через NV. На Linux основной поддерживаемый путь сейчас идёт через NV.'
  },
  {
    question: 'Зачем нужен сайт',
    answer:
      'Через сайт удобнее пройти вход, восстановить пароль, открыть профиль и сразу увидеть актуальные версии клиентов без длинных инструкций.'
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
            <h1>NeuralV</h1>
            <p>
              Антивирус с отдельными клиентами под Android, Windows и Linux. Проверка идёт по этапам, установка
              объясняется сразу, а важные вещи не прячутся за витриной из одинаковых карточек.
            </p>
            <div className="story-hero-actions">
              <a className="nv-button" href="#downloads">Скачать</a>
              <Link className="shell-chip" to="/register">Аккаунт</Link>
            </div>
            <div className="story-meta-row">
              <div className="story-meta-chip">Android {android.version}</div>
              <div className="story-meta-chip">Windows {windows.version}</div>
              <div className="story-meta-chip">Linux {linux.version}</div>
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
            <p>
              Коротко о том, что обычно спрашивают перед установкой: как устроена проверка, что видно на сайте и
              чем отличаются клиенты на разных системах.
            </p>
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
