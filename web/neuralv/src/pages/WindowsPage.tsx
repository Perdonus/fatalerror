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
        <article className="platform-hero-card">
          <div className="platform-hero-copy">
            <h1>NeuralV для Windows</h1>
            <p>Нативный клиент для обычной установки, portable-режима и обновления через NV.</p>
            <div className="platform-hero-actions">
              {setupUrl ? <a className="nv-button" href={setupUrl} target="_blank" rel="noreferrer">Скачать setup</a> : null}
              {portableUrl ? <a className="shell-chip" href={portableUrl} target="_blank" rel="noreferrer">Скачать portable</a> : null}
            </div>
          </div>
          <div className="platform-hero-grid">
            <div className="platform-main-stat">
              <span className="story-scene-kicker">Версия и требования</span>
              <strong>{version}</strong>
              <p>{requirement}</p>
            </div>
            <div className="platform-meta-chip">Setup</div>
            <div className="platform-meta-chip">Portable</div>
            <div className="platform-meta-chip">Установка через NV</div>
          </div>
        </article>
      </section>

      <div className="story-track">
        <StoryScene
          compact
          title="Один клиент, несколько понятных путей"
          body="Setup подходит для обычной установки. Portable удобен, если директорию ты контролируешь сам. NV остаётся коротким путём для установки и обновления."
          accent="Выбирай тот способ, который подходит именно твоей машине."
          visual="windows"
        />
      </div>

      <section className="platform-install-shell" id="windows-install">
        <h2>Установка</h2>
        <div className="platform-install-grid">
          <article className="platform-install-card">
            <h3>Setup</h3>
            <p>Обычная установка с ярлыками и дальнейшими обновлениями.</p>
            {setupUrl ? <a className="nv-button" href={setupUrl} target="_blank" rel="noreferrer">Скачать setup</a> : null}
          </article>
          <article className="platform-install-card">
            <h3>Portable</h3>
            <p>Подходит, если ты сам управляешь директорией и не хочешь стандартную установку.</p>
            {portableUrl ? <a className="nv-button" href={portableUrl} target="_blank" rel="noreferrer">Скачать portable</a> : null}
          </article>
          <article className="platform-command-card">
            <h3>Через NV</h3>
            <p>Если удобно ставить и обновлять клиент одной командой.</p>
            <div className="command-card"><pre>irm https://sosiskibot.ru/neuralv/install/nv.ps1 | iex{`\n`}nv install @lvls/neuralv</pre></div>
          </article>
        </div>
      </section>
    </div>
  );
}
