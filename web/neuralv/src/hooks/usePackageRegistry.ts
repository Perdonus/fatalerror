import { useEffect, useMemo, useState } from 'react';
import { fallbackRegistry, fetchPackageRegistry, PackageRegistry } from '../lib/packages';

export type PackageRegistryState = {
  registry: PackageRegistry;
  loading: boolean;
  source: 'remote' | 'fallback';
  error: string | null;
};

export function usePackageRegistry(): PackageRegistryState {
  const [state, setState] = useState<PackageRegistryState>({
    registry: fallbackRegistry,
    loading: true,
    source: 'fallback',
    error: null
  });

  useEffect(() => {
    const controller = new AbortController();

    fetchPackageRegistry(controller.signal)
      .then((registry) => {
        setState({
          registry: registry.packages.length > 0 ? registry : fallbackRegistry,
          loading: false,
          source: registry.packages.length > 0 ? 'remote' : 'fallback',
          error: registry.packages.length > 0 ? null : 'Registry пустой, используется fallback.'
        });
      })
      .catch((error: unknown) => {
        setState({
          registry: fallbackRegistry,
          loading: false,
          source: 'fallback',
          error: error instanceof Error ? error.message : 'Не удалось загрузить package registry.'
        });
      });

    return () => controller.abort();
  }, []);

  return useMemo(() => state, [state]);
}
