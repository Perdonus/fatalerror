import { useMemo } from 'react';
import { StoryScene } from '../components/StoryScene';
import { useReleaseManifest } from '../hooks/useReleaseManifest';
import { getArtifact, getArtifactSystemRequirements, getArtifactVersion } from '../lib/manifest';
import '../styles/story.css';

export function LinuxPage() {
  const linuxState = useReleaseManifest('linux');
  const shellState = useReleaseManifest('shell');
  const linuxArtifact = useMemo(() => getArtifact(linuxState.manifest, 'linux'), [linuxState.manifest]);
  const shellArtifact = useMemo(() => getArtifact(shellState.manifest, 'shell'), [shellState.manifest]);
  const version = getArtifactVersion(linuxState.manifest, 'linux') || 'pending';
  const shellVersion = getArtifactVersion(shellState.manifest, 'shell') || 'pending';
  const requirements = [
    ...getArtifactSystemRequirements(linuxArtifact, linuxState.manifest),
    ...getArtifactSystemRequirements(shellArtifact, shellState.manifest)
  ].filter((item, index, list) => list.indexOf(item) === index);
  const requirement = requirements[0] || 'x86_64 Linux';

  return (
    <div className="page-stack platform-story-shell">
      <section className="platform-hero">
        <article className="platform-hero-card">
          <div className="platform-hero-copy">
            <h1>NeuralV для Linux</h1>
            <p>На Linux основной путь один: установка через NV. Это самый короткий и поддерживаемый сценарий.</p>
            <div className="platform-hero-actions">
              <a className="nv-button" href="#linux-install">Установка через NV</a>
            </div>
          </div>
          <div className="platform-hero-grid">
            <div className="platform-main-stat">
              <span className="story-scene-kicker">Версия и требования</span>
              <strong>{version}</strong>
              <p>{requirement}</p>
            </div>
            <div className="platform-meta-chip">GUI {version}</div>
            <div className="platform-meta-chip">CLI {shellVersion}</div>
            <div className="platform-meta-chip">Только NV</div>
          </div>
        </article>
      </section>

      <div className="story-track">
        <StoryScene
          compact
          title="Один поддерживаемый маршрут"
          body="NV ставит клиент и помогает держать установку в актуальном состоянии. Поэтому на Linux мы ведём сразу в этот сценарий."
          accent="Без лишней витрины пакетов и длинных инструкций."
          visual="linux"
        />
      </div>

      <section className="platform-install-shell" id="linux-install">
        <h2>Установка через NV</h2>
        <article className="platform-command-card">
          <h3>Команда</h3>
          <p>Подходит для обычной установки и последующих обновлений.</p>
          <div className="command-card"><pre>{'curl -fsSL https://sosiskibot.ru/neuralv/install/nv.sh | sh\nnv install @lvls/neuralv'}</pre></div>
        </article>
      </section>
    </div>
  );
}
