import { ComparisonTable } from '../components/ComparisonTable';
import { DownloadCard } from '../components/DownloadCard';
import { FeatureGrid } from '../components/FeatureGrid';
import { HeroSection } from '../components/HeroSection';
import { ManifestBanner } from '../components/ManifestBanner';
import { comparisonRows, homeHighlights } from '../content/platforms';
import { useReleaseManifest } from '../hooks/useReleaseManifest';
import { getArtifact } from '../lib/manifest';

export function HomePage() {
  const manifestState = useReleaseManifest();

  return (
    <div className="stack-xl">
      <ManifestBanner {...manifestState} />
      <HeroSection />
      <FeatureGrid items={homeHighlights} />
      <section className="download-grid">
        <DownloadCard
          title="Android"
          description="APK для мобильной версии NeuralV."
          artifact={getArtifact(manifestState.manifest, 'android')}
          secondaryLabel="Скачать APK"
        />
        <DownloadCard
          title="Windows"
          description="Compose Desktop build для Windows рабочих станций."
          artifact={getArtifact(manifestState.manifest, 'windows')}
          secondaryLabel="Скачать Windows"
        />
        <DownloadCard
          title="Linux"
          description="Desktop GUI и shell/TUI клиент для Linux."
          artifact={getArtifact(manifestState.manifest, 'linux')}
          secondaryLabel="Скачать Linux GUI"
        />
        <DownloadCard
          title="Linux shell"
          description="Установка одной командой через curl|bash installer."
          artifact={getArtifact(manifestState.manifest, 'shell')}
          secondaryLabel="Скопировать install"
        />
      </section>
      <ComparisonTable rows={comparisonRows} />
    </div>
  );
}
