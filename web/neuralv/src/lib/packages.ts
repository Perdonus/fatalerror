export type PackageTarget = {
  id: string;
  os: string;
  arch: string;
  variant: string;
  version?: string;
  download_url?: string;
  file_name?: string;
  install_hint?: string;
};

export type PackageSummary = {
  name: string;
  display_name: string;
  summary: string;
  homepage_path?: string;
  latest: string;
  targets: PackageTarget[];
};

export type PackageRegistry = {
  generated_at?: string;
  packages: PackageSummary[];
};

export const fallbackRegistry: PackageRegistry = {
  generated_at: 'pending',
  packages: [
    {
      name: 'nv',
      display_name: 'NV',
      summary: 'Пакетный менеджер для установки и обновления NeuralV.',
      homepage_path: '/neuralv/nv',
      latest: 'pending',
      targets: [
        { id: 'linux-cli', os: 'linux', arch: 'amd64', variant: 'cli' },
        { id: 'windows-cli', os: 'windows', arch: 'amd64', variant: 'cli' }
      ]
    },
    {
      name: 'neuralv',
      display_name: 'NeuralV',
      summary: 'Пакет NeuralV для GUI и CLI установок.',
      homepage_path: '/neuralv/',
      latest: 'pending',
      targets: [
        { id: 'windows-gui', os: 'windows', arch: 'amd64', variant: 'gui' },
        { id: 'linux-gui', os: 'linux', arch: 'amd64', variant: 'gui' },
        { id: 'linux-cli', os: 'linux', arch: 'amd64', variant: 'cli' }
      ]
    }
  ]
};

const packagesUrl =
  (import.meta.env.VITE_PACKAGE_REGISTRY_URL as string | undefined) || '/basedata/api/packages/registry';

export async function fetchPackageRegistry(signal?: AbortSignal): Promise<PackageRegistry> {
  const response = await fetch(packagesUrl, {
    method: 'GET',
    headers: { Accept: 'application/json' },
    signal
  });

  if (!response.ok) {
    throw new Error(`Package registry request failed: ${response.status}`);
  }

  const data = (await response.json()) as Record<string, unknown>;
  const rawPackages = Array.isArray(data.packages) ? data.packages : [];

  return {
    generated_at: typeof data.generated_at === 'string' ? data.generated_at : undefined,
    packages: rawPackages
      .filter((item): item is Record<string, unknown> => typeof item === 'object' && item !== null)
      .map((item) => {
        const targets = Array.isArray(item.targets)
          ? item.targets
              .filter((target): target is Record<string, unknown> => typeof target === 'object' && target !== null)
              .map((target) => ({
                id: String(target.id ?? ''),
                os: String(target.os ?? target.host_os ?? ''),
                arch: String(target.arch ?? 'amd64'),
                variant: String(target.variant ?? target.client_kind ?? ''),
                version: typeof target.version === 'string' ? target.version : undefined,
                download_url: typeof target.download_url === 'string' ? target.download_url : undefined,
                file_name: typeof target.file_name === 'string' ? target.file_name : undefined,
                install_hint: typeof target.install_hint === 'string'
                  ? target.install_hint
                  : (typeof target.install_strategy === 'string' ? target.install_strategy : undefined)
              }))
          : [];

        const latest = targets.find((target) => typeof target.version === 'string' && target.version.trim().length > 0)?.version || 'pending';

        return {
          name: String(item.name ?? ''),
          display_name: String(item.display_name ?? item.title ?? item.name ?? ''),
          summary: String(item.summary ?? item.description ?? ''),
          homepage_path: typeof item.homepage_path === 'string'
            ? item.homepage_path
            : (typeof item.homepage === 'string' ? item.homepage : undefined),
          latest,
          targets
        };
      })
  };
}

export function getPackageEntry(registry: PackageRegistry, name: string): PackageSummary | undefined {
  return registry.packages.find((item) => item.name === name);
}
