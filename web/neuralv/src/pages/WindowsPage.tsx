import { useMemo } from 'react';
import { NeuralVDecor } from '../components/NeuralVDecor';
import { getArtifact, getArtifactSystemRequirements, getArtifactVersion } from '../lib/manifest';
import { useReleaseManifest } from '../hooks/useReleaseManifest';

const installModes = [
  {
    title: 'Setup',
    text: 'Обычная установка с ярлыками, launcher/updater цепочкой и привязкой к install root.',
    button: 'Скачать setup',
    key: 'setup'
  },
  {
    title: 'Portable',
    text: 'Запуск без инсталляции, если ты сам контролируешь директорию клиента и способ обновления.',
    button: 'Скачать portable',
    key: 'portable'
  },
  {
    title: 'NV',
    text: 'Установка и дальнейшее обновление через NV одним и тем же путём, без ручного обхода пакета.',
    button: 'Открыть команды',
    key: 'nv'
  }
] as const;

export function WindowsPage() {
  const manifestState = useReleaseManifest('windows');
  const artifact = useMemo(() => getArtifact(manifestState.manifest, 'windows'), [manifestState.manifest]);
  const version = getArtifactVersion(manifestState.manifest, 'windows') || 'pending';
  const requirements = getArtifactSystemRequirements(artifact, manifestState.manifest);
  const setupUrl = manifestState.manifest.setupUrl || artifact?.downloadUrl || manifestState.manifest.downloadUrl;
  const portableUrl = manifestState.manifest.portableUrl || artifact?.downloadUrl || manifestState.manifest.downloadUrl;

  return (
    <div className="page-stack platform-page-stack">
      <section className="hero-shell platform-shell platform-shell-rich">
        <div className="hero-copy hero-copy-tight platform-hero-copy">
          <h1>NeuralV для Windows</h1>
          <div className="hero-actions">
            {setupUrl ? <a className="nv-button" href={setupUrl} target="_blank" rel="noreferrer">Скачать setup</a> : null}
            <a className="shell-chip" href="#windows-install">Установка</a>
          </div>

          <div className="platform-card-grid platform-card-grid-two">
            <article className="surface-card platform-mini-card accent-card">
              <h2>Версия</h2>
              <strong>{version}</strong>
              <p>{requirements[0] || 'Требования ещё не дошли в manifest.'}</p>
            </article>
            <article className="surface-card platform-mini-card">
              <h2>Bundle</h2>
              <p>Windows-клиент живёт как нормальный desktop bundle: launcher, updater, GUI и CLI не свалены в одну случайную папку.</p>
            </article>
          </div>
        </div>

        <div className="platform-hero-side">
          <NeuralVDecor variant="windows" className="page-decor" />
        </div>
      </section>

      <section className="section-grid section-grid-platform platform-install-grid" id="windows-install">
        {installModes.map((item) => (
          <article key={item.key} className="surface-card platform-install-card platform-install-card-rich">
            <div className="card-heading">
              <h2>{item.title}</h2>
            </div>
            <p>{item.text}</p>
            {item.key === 'setup' ? (
              setupUrl ? <a className="nv-button" href={setupUrl} target="_blank" rel="noreferrer">{item.button}</a> : <button className="nv-button is-disabled" type="button" disabled>{item.button}</button>
            ) : item.key === 'portable' ? (
              portableUrl ? <a className="nv-button" href={portableUrl} target="_blank" rel="noreferrer">{item.button}</a> : <button className="nv-button is-disabled" type="button" disabled>{item.button}</button>
            ) : (
              <div className="command-card"><pre>irm https://sosiskibot.ru/neuralv/install/nv.ps1 | iex{`\n`}nv install @lvls/neuralv</pre></div>
            )}
          </article>
        ))}
      </section>
    </div>
  );
}
