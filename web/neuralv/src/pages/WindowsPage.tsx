import { useMemo } from 'react';
import { StoryScene } from '../components/StoryScene';
import { getArtifact, getArtifactSystemRequirements, getArtifactVersion } from '../lib/manifest';
import { useReleaseManifest } from '../hooks/useReleaseManifest';
import '../styles/story.css';

export function WindowsPage() {
  const manifestState = useReleaseManifest('windows');
  const artifact = useMemo(() => getArtifact(manifestState.manifest, 'windows'), [manifestState.manifest]);
  const version = getArtifactVersion(manifestState.manifest, 'windows') || 'pending';
  const requirement = getArtifactSystemRequirements(artifact, manifestState.manifest)[0] || 'Windows 10/11 x64';
  const setupUrl = manifestState.manifest.setupUrl || artifact?.downloadUrl || manifestState.manifest.downloadUrl;
  const portableUrl = manifestState.manifest.portableUrl || artifact?.downloadUrl || manifestState.manifest.downloadUrl;

  return (
    <div className="page-stack platform-story-shell">
      <section className="platform-hero">
        <div className="platform-hero-center">
          <article className="platform-hero-card platform-hero-card-centered">
            <div className="platform-hero-copy platform-hero-copy-centered">
              <h1>NeuralV для Windows</h1>
              <div className="platform-hero-actions">
                {setupUrl ? <a className="nv-button" href={setupUrl} target="_blank" rel="noreferrer">Скачать setup</a> : null}
                {portableUrl ? <a className="shell-chip" href={portableUrl} target="_blank" rel="noreferrer">Скачать portable</a> : null}
              </div>
            </div>
            <div className="platform-hero-grid platform-hero-grid-centered">
              <div className="platform-main-stat">
                <strong>{version}</strong>
                <p>Требования: {requirement}</p>
              </div>
              <div className="platform-meta-chip">Setup</div>
              <div className="platform-meta-chip">Portable</div>
              <div className="platform-meta-chip">Через NV</div>
            </div>
          </article>
        </div>
      </section>

      <div className="story-track">
        <StoryScene
          compact
          title="Установка подстраивается под рабочий сценарий"
          body="Setup подходит для обычной установки. Portable оставляет директорию под вашим контролем. NV удобен, если клиент нужно ставить и обновлять короткой командой."
          accent="Три понятных варианта без лишней витрины."
          visual="windows"
        />
      </div>

      <section className="platform-install-shell" id="windows-install">
        <div className="platform-section-heading platform-section-heading-centered">
          <h2>Установка</h2>
        </div>
        <div className="platform-install-grid platform-install-grid-centered">
          <article className="platform-install-card platform-install-card-centered">
            <h3>Setup</h3>
            <p>Обычная установка с ярлыками и готовым запуском.</p>
            {setupUrl ? <a className="nv-button" href={setupUrl} target="_blank" rel="noreferrer">Скачать setup</a> : null}
          </article>
          <article className="platform-install-card platform-install-card-centered">
            <h3>Portable</h3>
            <p>Подходит, если директория и запуск должны оставаться под твоим контролем.</p>
            {portableUrl ? <a className="nv-button" href={portableUrl} target="_blank" rel="noreferrer">Скачать portable</a> : null}
          </article>
          <article className="platform-command-card platform-command-card-centered">
            <h3>Через NV</h3>
            <p>Короткий способ поставить клиент и держать его в актуальном состоянии.</p>
            <div className="command-card"><pre>irm https://sosiskibot.ru/neuralv/install/nv.ps1 | iex{`
`}nv install @lvls/neuralv</pre></div>
          </article>
        </div>
      </section>
    </div>
  );
}
