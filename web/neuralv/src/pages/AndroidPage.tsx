import { NeuralVDecor } from '../components/NeuralVDecor';
import { getArtifact, getArtifactSystemRequirements, getArtifactVersion, isArtifactReady } from '../lib/manifest';
import { useReleaseManifest } from '../hooks/useReleaseManifest';

const androidCards = [
  {
    title: 'Установка',
    text: 'Один APK без отдельного desktop-инструмента и без длинной схемы подготовки.'
  },
  {
    title: 'Аккаунт',
    text: 'Тот же аккаунт, что и на сайте и на других клиентах. История и вход не дублируются.'
  },
  {
    title: 'Поведение',
    text: 'Мобильный клиент остаётся самостоятельным сценарием, а не уменьшенной копией desktop-версии.'
  }
] as const;

export function AndroidPage() {
  const manifestState = useReleaseManifest('android');
  const artifact = getArtifact(manifestState.manifest, 'android');
  const ready = isArtifactReady(artifact);
  const version = getArtifactVersion(manifestState.manifest, 'android') || 'pending';
  const requirements = getArtifactSystemRequirements(artifact, manifestState.manifest);

  return (
    <div className="page-stack platform-page-stack">
      <section className="hero-shell platform-shell platform-shell-rich">
        <div className="hero-copy hero-copy-tight platform-hero-copy">
          <h1>NeuralV для Android</h1>
          <div className="hero-actions">
            {ready && artifact?.downloadUrl ? (
              <a className="nv-button" href={artifact.downloadUrl} target="_blank" rel="noreferrer">Скачать APK</a>
            ) : (
              <button className="nv-button is-disabled" type="button" disabled>APK скоро</button>
            )}
          </div>

          <div className="platform-card-grid">
            {androidCards.map((item) => (
              <article key={item.title} className="surface-card platform-mini-card">
                <h2>{item.title}</h2>
                <p>{item.text}</p>
              </article>
            ))}
          </div>
        </div>

        <div className="platform-hero-side">
          <NeuralVDecor variant="android" className="page-decor" />
        </div>
      </section>

      <section className="section-grid section-grid-platform platform-detail-grid">
        <article className="surface-card platform-install-card accent-card">
          <div className="card-heading"><h2>Версия</h2></div>
          <strong>{version}</strong>
          <p>{requirements[0] || 'Требования ещё не дошли в manifest.'}</p>
        </article>

        <article className="surface-card platform-install-card">
          <div className="card-heading"><h2>Как поставить</h2></div>
          <div className="command-card"><pre>1. Скачай APK.{`\n`}2. Разреши установку на Android.{`\n`}3. Открой NeuralV и войди в аккаунт.</pre></div>
        </article>

        <article className="surface-card platform-install-card">
          <div className="card-heading"><h2>Что дальше</h2></div>
          <p>После установки приложение использует тот же аккаунт и тот же маршрутизированный auth flow, что и остальные версии продукта.</p>
        </article>
      </section>
    </div>
  );
}
