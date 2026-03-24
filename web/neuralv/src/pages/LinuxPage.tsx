import { useMemo } from 'react';
import { NeuralVDecor } from '../components/NeuralVDecor';
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
    <div className="page-stack platform-page-stack">
      <section className="hero-shell platform-shell platform-shell-rich">
        <div className="hero-copy hero-copy-tight platform-hero-copy">
          <h1>NeuralV для Linux</h1>
          <div className="hero-actions">
            <a className="nv-button" href="#linux-install">Установка через NV</a>
          </div>

          <div className="platform-card-grid platform-card-grid-two">
            <article className="surface-card platform-mini-card accent-card">
              <h2>GUI</h2>
              <strong>{version}</strong>
              <p>{requirements[0] || 'Требования ещё не дошли в manifest.'}</p>
            </article>
            <article className="surface-card platform-mini-card">
              <h2>CLI</h2>
              <strong>{shellVersion}</strong>
              <p>Linux-страница оставляет один поддерживаемый сценарий установки вместо витрины разрозненных пакетов.</p>
            </article>
          </div>
        </div>

        <div className="platform-hero-side">
          <NeuralVDecor variant="linux" className="page-decor" />
        </div>
      </section>

      <section className="section-block linux-install-block" id="linux-install">
        <article className="surface-card platform-install-card linux-install-card linux-install-card-rich">
          <div className="card-heading"><h2>Установка через NV</h2></div>
          <p>Это основной поддерживаемый маршрут для Linux. GUI и CLI ставятся через один и тот же install flow.</p>
          <div className="command-card"><pre>{'curl -fsSL https://sosiskibot.ru/neuralv/install/nv.sh | sh\nnv install @lvls/neuralv'}</pre></div>
        </article>
      </section>
    </div>
  );
}
