import { StoryScene } from '../components/StoryScene';
import { getArtifact, getArtifactSystemRequirements, getArtifactVersion, isArtifactReady } from '../lib/manifest';
import { useReleaseManifest } from '../hooks/useReleaseManifest';
import '../styles/story.css';

export function AndroidPage() {
  const manifestState = useReleaseManifest('android');
  const artifact = getArtifact(manifestState.manifest, 'android');
  const ready = isArtifactReady(artifact);
  const version = getArtifactVersion(manifestState.manifest, 'android') || 'pending';
  const requirement = getArtifactSystemRequirements(artifact, manifestState.manifest)[0] || 'Android 8.0+ (API 26)';

  return (
    <div className="page-stack platform-story-shell">
      <section className="platform-hero">
        <div className="platform-hero-center">
          <article className="platform-hero-card platform-hero-card-centered">
            <div className="platform-hero-copy platform-hero-copy-centered">
              <h1>NeuralV для Android</h1>
              <div className="platform-hero-actions">
                {ready && artifact?.downloadUrl ? (
                  <a className="nv-button" href={artifact.downloadUrl} target="_blank" rel="noreferrer">Скачать APK</a>
                ) : (
                  <button className="nv-button is-disabled" type="button" disabled>APK скоро</button>
                )}
              </div>
            </div>
            <div className="platform-hero-grid platform-hero-grid-centered">
              <div className="platform-main-stat">
                <strong>{version}</strong>
                <p>Требования: {requirement}</p>
              </div>
              <div className="platform-meta-chip">Телефон и планшет</div>
              <div className="platform-meta-chip">Один APK</div>
              <div className="platform-meta-chip">Общий профиль</div>
            </div>
          </article>
        </div>
      </section>

      <div className="story-track">
        <StoryScene
          compact
          title="Установка занимает один понятный шаг"
          body="Скачайте APK, установите приложение и войдите в аккаунт. Android-версия не требует лишней подготовки и быстро приводит в рабочий сценарий."
          accent="Один APK и привычный запуск без лишней подготовки."
          visual="android"
        />
        <StoryScene
          compact
          title="Мобильный клиент остаётся частью общего продукта"
          body="История, вход и основные действия остаются в том же аккаунте. Android-клиент работает как полноценная часть NeuralV, а не как отдельный продукт."
          accent="Один аккаунт на сайте и в приложениях."
          visual="shield"
        />
      </div>
    </div>
  );
}
