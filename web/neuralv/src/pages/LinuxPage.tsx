import { useMemo } from 'react';
import { StoryScene } from '../components/StoryScene';
import { useReleaseManifest } from '../hooks/useReleaseManifest';
import { getArtifact, getArtifactSystemRequirements, getArtifactVersion } from '../lib/manifest';
import '../styles/story.css';

export function LinuxPage() {
  const linuxState = useReleaseManifest('linux');
  const linuxArtifact = useMemo(() => getArtifact(linuxState.manifest, 'linux'), [linuxState.manifest]);
  const version = getArtifactVersion(linuxState.manifest, 'linux') || 'pending';
  const requirements = getArtifactSystemRequirements(linuxArtifact, linuxState.manifest);
  const requirement = requirements[0] || 'x86_64 Linux';

  return (
    <div className="page-stack platform-story-shell">
      <section className="platform-hero">
        <div className="platform-hero-center">
          <article className="platform-hero-card platform-hero-card-centered">
            <div className="platform-hero-copy platform-hero-copy-centered">
              <h1>NeuralV для Linux</h1>
              <div className="platform-hero-actions">
                <a className="nv-button" href="#linux-install">Установка через NV</a>
              </div>
            </div>
            <div className="platform-hero-grid platform-hero-grid-centered">
              <div className="platform-main-stat">
                <strong>{version}</strong>
                <p>Требования: {requirement}</p>
              </div>
              <div className="platform-meta-chip">Только NV</div>
              <div className="platform-meta-chip">Один маршрут</div>
              <div className="platform-meta-chip">Без лишних пакетов</div>
            </div>
          </article>
        </div>
      </section>

      <div className="story-track">
        <StoryScene
          compact
          title="Один поддерживаемый способ"
          body="NV ставит клиент и помогает обновлять его дальше. Поэтому Linux-страница ведёт сразу в основной сценарий, а не в длинный список случайных вариантов."
          accent="Один путь установки вместо случайного набора пакетов."
          visual="linux"
        />
      </div>

      <section className="platform-install-shell" id="linux-install">
        <div className="platform-section-heading platform-section-heading-centered">
          <h2>Установка через NV</h2>
        </div>
        <div className="platform-install-grid platform-install-grid-single">
          <article className="platform-command-card platform-command-card-wide platform-command-card-centered">
            <h3>Команда</h3>
            <p>Подходит для новой установки и для дальнейших обновлений.</p>
            <div className="command-card"><pre>{'curl -fsSL https://sosiskibot.ru/neuralv/install/nv.sh | sh
nv install @lvls/neuralv'}</pre></div>
          </article>
        </div>
      </section>
    </div>
  );
}
