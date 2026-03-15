import { useMemo } from 'react';
import { useParams } from 'react-router-dom';
import { ChecklistCard } from '../components/ChecklistCard';
import { DownloadCard } from '../components/DownloadCard';
import { InstallCard } from '../components/InstallCard';
import { ManifestBanner } from '../components/ManifestBanner';
import { platformContent } from '../content/platforms';
import { useReleaseManifest } from '../hooks/useReleaseManifest';
import { getArtifact } from '../lib/manifest';

export function PlatformPage() {
  const { platformId } = useParams();
  const manifestState = useReleaseManifest();
  const content = useMemo(
    () => platformContent.find((platform) => platform.id === platformId) ?? platformContent[0],
    [platformId]
  );

  const primaryArtifact = getArtifact(manifestState.manifest, content.manifestPlatform);
  const shellArtifact = content.id === 'linux' ? getArtifact(manifestState.manifest, 'shell') : undefined;

  return (
    <div className="stack-xl">
      <ManifestBanner {...manifestState} />
      <section className={`surface-card platform-hero accent-${content.accent}`}>
        <div className="section-heading">
          <div className="eyebrow">{content.kicker}</div>
          <h2>{content.title}</h2>
        </div>
        <p>{content.overview}</p>
        <p className="muted">{content.audience}</p>
      </section>

      <section className="platform-grid">
        <ChecklistCard title="Что проверяется локально" items={content.localChecks} />
        <ChecklistCard title="Что проверяется на сервере" items={content.serverChecks} tone="accent" />
      </section>

      <section className="download-grid compact-grid">
        <DownloadCard
          title={content.title}
          description={content.overview}
          artifact={primaryArtifact}
          secondaryLabel={content.ctaLabel}
        />
        {shellArtifact ? (
          <DownloadCard
            title="Linux shell"
            description="Терминальный клиент и installer для Linux."
            artifact={shellArtifact}
            secondaryLabel="Установить shell"
          />
        ) : null}
      </section>

      <section className="platform-grid">
        <InstallCard title="Установка" steps={content.installSteps} />
        {content.secondaryInstall?.length ? <InstallCard title="Дополнительно" steps={content.secondaryInstall} /> : null}
      </section>
    </div>
  );
}
