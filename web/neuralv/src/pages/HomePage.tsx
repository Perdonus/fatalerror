import { Link } from 'react-router-dom';
import { useReleaseManifest } from '../hooks/useReleaseManifest';
import { getArtifact, getArtifactSystemRequirements, getArtifactVersion } from '../lib/manifest';

const faqItems = [
  {
    q: 'Что такое NeuralV?',
    a: 'Это антивирус с отдельными клиентами под Android, Windows и Linux. Установка и сценарии проверки зависят от платформы, а не сводятся к одной и той же оболочке.'
  },
  {
    q: 'Можно ли ему доверять?',
    a: 'Да, если тебе важны прозрачная установка, понятная схема проверки и честные ограничения. NeuralV лучше воспринимать как нормальный security-продукт, а не как кнопку с магическим вердиктом.'
  },
  {
    q: 'Как проходит проверка?',
    a: 'Сначала клиент быстро собирает базовую картину. Если нужен более глубокий анализ, дальше подключается серверный маршрут и отдельная перепроверка результата.'
  },
  {
    q: 'Что происходит с файлами и данными?',
    a: 'Сценарий зависит от режима проверки и платформы. Для глубоких маршрутов часть данных и артефактов уходит на серверный анализ, и это должно быть видно пользователю.'
  },
  {
    q: 'Чем отличаются версии для платформ?',
    a: 'Android, Windows и Linux не сведены в один и тот же клиент. У каждой платформы свой install flow, свой интерфейс и свой набор проверок.'
  },
  {
    q: 'С чего начать?',
    a: 'Выбери платформу, проверь системные требования, установи клиент и войди в аккаунт. Всё основное собрано ниже, без длинных инструкций и лишнего шума.'
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
      <section className="hero-shell home-hero-shell">
        <div className="hero-copy hero-copy-wide">
          <h1>NeuralV для Android, Windows и Linux</h1>
          <div className="hero-actions">
            <a className="nv-button" href="#downloads">Скачать</a>
            <Link className="shell-chip" to="/register">Аккаунт</Link>
          </div>
        </div>
      </section>

      <section className="section-block faq-block">
        <div className="section-heading">
          <h2>Частые вопросы</h2>
        </div>
        <div className="faq-list">
          {faqItems.map((item, index) => (
            <details key={item.q} className="faq-item" open={index === 0}>
              <summary className="faq-question">{item.q}</summary>
              <div className="faq-answer">
                <p>{item.a}</p>
              </div>
            </details>
          ))}
        </div>
      </section>

      <section className="section-block" id="downloads">
        <div className="section-heading">
          <h2>Загрузки</h2>
        </div>
        <div className="download-grid">
          <article className="surface-card download-card">
            <div className="download-head"><h3>Android</h3><span>{android.version}</span></div>
            <p className="download-requirement">{android.requirement}</p>
            <div className="download-actions">
              <Link className="nv-button" to="/android">Открыть</Link>
            </div>
          </article>
          <article className="surface-card download-card accent-card">
            <div className="download-head"><h3>Windows</h3><span>{windows.version}</span></div>
            <p className="download-requirement">{windows.requirement}</p>
            <div className="download-actions">
              <Link className="nv-button" to="/windows">Открыть</Link>
            </div>
          </article>
          <article className="surface-card download-card">
            <div className="download-head"><h3>Linux</h3><span>{linux.version}</span></div>
            <p className="download-requirement">{linux.requirement}</p>
            <div className="download-actions">
              <Link className="nv-button" to="/linux">Открыть</Link>
            </div>
          </article>
        </div>
      </section>
    </div>
  );
}
