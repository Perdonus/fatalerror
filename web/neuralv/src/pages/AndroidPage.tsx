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
        <article className="platform-hero-card">
          <div className="platform-hero-copy">
            <h1>NeuralV для Android</h1>
            <p>Мобильный клиент для ежедневной проверки, истории и входа в тот же аккаунт NeuralV.</p>
            <div className="platform-hero-actions">
              {ready && artifact?.downloadUrl ? (
                <a className="nv-button" href={artifact.downloadUrl} target="_blank" rel="noreferrer">Скачать APK</a>
              ) : (
                <button className="nv-button is-disabled" type="button" disabled>APK скоро</button>
              )}
            </div>
          </div>
          <div className="platform-hero-grid">
            <div className="platform-main-stat">
              <span className="story-scene-kicker">Версия и требования</span>
              <strong>{version}</strong>
              <p>{requirement}</p>
            </div>
            <div className="platform-meta-chip">Телефон и планшет</div>
            <div className="platform-meta-chip">Один APK</div>
            <div className="platform-meta-chip">Общий аккаунт</div>
          </div>
        </article>
      </section>

      <div className="story-track">
        <StoryScene
          compact
          title="Установка без лишних шагов"
          body="Скачай APK, установи приложение и войди в аккаунт. Ничего дополнительно настраивать не нужно."
          accent="Один файл и привычный сценарий запуска."
          visual="android"
        />
        <StoryScene
          compact
          title="История остаётся рядом"
          body="Вход, история и основные действия остаются в том же аккаунте, что и в других версиях NeuralV."
          accent="Телефон не живёт отдельно от остальных клиентов."
          visual="shield"
        />
      </div>
    </div>
  );
}
