import { useMemo } from 'react';
import { useReleaseManifest } from '../hooks/useReleaseManifest';
import { getArtifact, getArtifactSystemRequirements, getArtifactVersion } from '../lib/manifest';
import { Link } from 'react-router-dom';
import { getPackage, getPackageVariant } from '../lib/packages';
import { usePackageRegistry } from '../hooks/usePackageRegistry';

const productPoints = [
  'Один вход для всех версий.',
  'Проверки для телефона, ПК и Linux.',
  'Быстрый старт без лишней возни.'
];

const baseUrl = import.meta.env.BASE_URL;
const deviceShowcaseUrl = `${baseUrl}media/neuralv-devices.svg`;

// Скрин-слоты встроены прямо в web/neuralv/public/media/neuralv-devices.svg.
// Положи файлы в web/neuralv/public/media/screenshots/ с именами:
// android-home.png, windows-home.png, linux-home.png.
export function HomePage() {
  const { catalog } = usePackageRegistry();
  const androidManifestState = useReleaseManifest('android');
  const windowsManifestState = useReleaseManifest('windows');
  const linuxManifestState = useReleaseManifest('linux');
  const shellManifestState = useReleaseManifest('shell');
  const androidArtifact = useMemo(() => getArtifact(androidManifestState.manifest, 'android'), [androidManifestState.manifest]);
  const windowsArtifact = useMemo(() => getArtifact(windowsManifestState.manifest, 'windows'), [windowsManifestState.manifest]);
  const linuxArtifact = useMemo(() => getArtifact(linuxManifestState.manifest, 'linux'), [linuxManifestState.manifest]);
  const shellArtifact = useMemo(() => getArtifact(shellManifestState.manifest, 'shell'), [shellManifestState.manifest]);
  const androidVersion = getArtifactVersion(androidManifestState.manifest, 'android') || 'pending';
  const windowsVersion = getArtifactVersion(windowsManifestState.manifest, 'windows') || 'pending';
  const linuxGuiVersion = getArtifactVersion(linuxManifestState.manifest, 'linux') || 'pending';
  const linuxCliVersion = getArtifactVersion(shellManifestState.manifest, 'shell') || 'pending';
  const androidRequirements = getArtifactSystemRequirements(androidArtifact, androidManifestState.manifest);
  const windowsRequirements = getArtifactSystemRequirements(windowsArtifact, windowsManifestState.manifest);
  const linuxRequirements = getArtifactSystemRequirements(linuxArtifact, linuxManifestState.manifest);
  const shellRequirements = getArtifactSystemRequirements(shellArtifact, shellManifestState.manifest);
  const neuralvPackage = useMemo(() => getPackage(catalog, '@lvls/neuralv'), [catalog]);
  const linuxVariant = useMemo(() => getPackageVariant(neuralvPackage, 'linux'), [neuralvPackage]);
  const linuxRequirementSummary = linuxRequirements[0] || shellRequirements[0] || '';

  return (
    <div className="page-stack">
      <section className="hero-card home-hero">
        <div className="hero-copy hero-copy-wide">
          <h1>NeuralV для Android, Windows и Linux.</h1>
          <div className="hero-actions">
            <a className="nv-button" href="#downloads">Скачать</a>
          </div>
        </div>
      </section>

      <section id="overview" className="showcase-band">
        <article className="content-card showcase-card">
          <div className="showcase-copy">
            <h2>Один продукт для всех устройств.</h2>
            <p>Телефон, настольный клиент и Linux-инструменты работают как одна система.</p>
            <ul className="showcase-points">
              {productPoints.map((point) => (
                <li key={point}>{point}</li>
              ))}
            </ul>
          </div>

          <div className="showcase-visual">
            <div className="device-glow device-glow-a" aria-hidden="true" />
            <div className="device-glow device-glow-b" aria-hidden="true" />
            <img className="device-showcase" src={deviceShowcaseUrl} alt="Устройства NeuralV со встроенными слотами под скриншоты" />
          </div>
        </article>
      </section>

      <section id="downloads" className="section-block">
        <div className="section-head section-head-tight">
          <h2>Выбери платформу</h2>
        </div>

        <div className="card-grid three-up">
          <article className="content-card platform-card">
            <div className="platform-card-head">
              <div>
                <h3>Android</h3>
              </div>
            </div>
            <div className="version-list">
              <span>Версия: {androidVersion}</span>
              <span>Требования: {androidRequirements[0] || 'пока нет в manifest.'}</span>
            </div>
            <div className="card-actions">
              <Link className="nv-button" to="/android">Открыть</Link>
            </div>
          </article>

          <article className="content-card platform-card">
            <div className="platform-card-head">
              <div>
                <h3>Windows</h3>
              </div>
            </div>
            <div className="version-list">
              <span>Версия: {windowsVersion}</span>
              <span>Требования: {windowsRequirements[0] || 'пока нет в manifest.'}</span>
            </div>
            <div className="card-actions">
              <Link className="nv-button" to="/windows">Открыть</Link>
            </div>
          </article>

          <article className="content-card platform-card linux-home-card">
            <div className="platform-card-head">
              <div>
                <h3>Linux</h3>
              </div>
            </div>
            <div className="version-list">
              <span>GUI {linuxGuiVersion || linuxVariant?.version || 'pending'} · CLI {linuxCliVersion || 'pending'}</span>
              <span>Требования: {linuxRequirementSummary || 'пока нет в manifest.'}</span>
            </div>
            <div className="card-actions" style={{ flexWrap: 'nowrap' }}>
              <Link className="nv-button tonal" to="/linux">Открыть</Link>
            </div>
          </article>
        </div>
      </section>
    </div>
  );
}
