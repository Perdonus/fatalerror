import { useMemo } from 'react';
import { useReleaseManifest } from '../hooks/useReleaseManifest';
import { getArtifact, getArtifactSystemRequirements, getArtifactVersion } from '../lib/manifest';

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

  return (
    <div className="page-stack">
      <section className="hero-shell platform-shell">
        <div className="hero-copy hero-copy-tight">
          <h1>NeuralV для Linux</h1>
          <div className="hero-actions">
            <a className="nv-button" href="#linux-install">Открыть установку</a>
          </div>
        </div>

        <article className="surface-card platform-summary-card accent-card">
          <strong>GUI {version}</strong>
          <span>CLI {shellVersion}</span>
          <span>{requirements[0] || 'Требования ещё не дошли в manifest.'}</span>
        </article>
      </section>

      <section className="section-block linux-install-block" id="linux-install">
        <article className="surface-card platform-install-card linux-install-card">
          <div className="card-heading"><h2>Установка через NV</h2></div>
          <div className="command-card"><pre>{'curl -fsSL https://sosiskibot.ru/neuralv/install/nv.sh | sh\nnv install @lvls/neuralv'}</pre></div>
        </article>
      </section>
    </div>
  );
}
