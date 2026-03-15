import { useEffect, useMemo, useState } from 'react';
import { fallbackManifest, fetchReleaseManifest, ReleaseManifest } from '../lib/manifest';

export type ManifestState = {
  manifest: ReleaseManifest;
  loading: boolean;
  source: 'remote' | 'fallback';
  error: string | null;
};

export function useReleaseManifest(): ManifestState {
  const [state, setState] = useState<ManifestState>({
    manifest: fallbackManifest,
    loading: true,
    source: 'fallback',
    error: null
  });

  useEffect(() => {
    const controller = new AbortController();

    fetchReleaseManifest(controller.signal)
      .then((manifest) => {
        setState({
          manifest: manifest.artifacts.length > 0 ? manifest : fallbackManifest,
          loading: false,
          source: manifest.artifacts.length > 0 ? 'remote' : 'fallback',
          error: manifest.artifacts.length > 0 ? null : 'Manifest пустой, используется fallback.'
        });
      })
      .catch((error: unknown) => {
        setState({
          manifest: fallbackManifest,
          loading: false,
          source: 'fallback',
          error: error instanceof Error ? error.message : 'Не удалось загрузить manifest.'
        });
      });

    return () => controller.abort();
  }, []);

  return useMemo(() => state, [state]);
}
