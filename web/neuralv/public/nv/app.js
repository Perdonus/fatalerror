const REGISTRY_URL = '/basedata/api/packages/registry';

const fallbackRegistry = {
  packages: [
    {
      name: '@lvls/nv',
      title: 'NV',
      description: 'Пакетный менеджер для Windows и Linux.',
      homepage: '/nv/',
      latest_version: '1.3.3',
      variants: [
        {
          id: 'nv-linux',
          label: 'Linux',
          os: 'linux',
          version: '1.3.3',
          download_url: 'https://raw.githubusercontent.com/Perdonus/NV/linux-builds/linux/nv-linux-1.3.3.tar.gz',
          install_command: 'curl -fsSL https://raw.githubusercontent.com/Perdonus/NV/linux-builds/nv.sh | sh'
        },
        {
          id: 'nv-windows',
          label: 'Windows',
          os: 'windows',
          version: '1.3.3',
          download_url: 'https://raw.githubusercontent.com/Perdonus/NV/windows-builds/windows/nv-1.3.3.exe',
          install_command: 'powershell -NoProfile -ExecutionPolicy Bypass -Command "irm https://raw.githubusercontent.com/Perdonus/NV/windows-builds/nv.ps1 | iex"'
        }
      ]
    },
    {
      name: '@lvls/neuralv',
      title: 'NeuralV',
      description: 'Клиент защиты NeuralV для Windows и Linux.',
      homepage: '/neuralv/',
      latest_version: '1.5.0',
      variants: [
        { id: 'windows', label: 'Windows', os: 'windows', version: '1.5.0' },
        { id: 'linux', label: 'Linux', os: 'linux', version: '1.4.0' }
      ]
    }
  ]
};

const page = document.body.dataset.page;
const state = {
  registry: fallbackRegistry,
  platformFilter: 'all',
  searchTerm: '',
  downloadPlatform: 'linux'
};

function escapeHtml(value) {
  return String(value ?? '')
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#39;');
}

function pluralizeRu(count, one, few, many) {
  const mod10 = count % 10;
  const mod100 = count % 100;
  if (mod10 === 1 && mod100 !== 11) return one;
  if (mod10 >= 2 && mod10 <= 4 && (mod100 < 12 || mod100 > 14)) return few;
  return many;
}

function parseScopedName(name) {
  const match = /^@([^/]+)\/(.+)$/.exec(name || '');
  if (!match) {
    return { creator: 'unknown', packageName: name || 'package', canonicalName: name || 'package' };
  }

  return {
    creator: match[1],
    packageName: match[2],
    canonicalName: `@${match[1]}/${match[2]}`
  };
}

function platformLabel(os) {
  if (os === 'windows') return 'Windows';
  if (os === 'linux') return 'Linux';
  return os || 'Unknown';
}

function normalizeVariant(variant) {
  return {
    id: variant.id || '',
    label: variant.label || platformLabel(variant.os),
    os: (variant.os || 'unknown').toLowerCase(),
    version: variant.version || '',
    downloadUrl: variant.download_url || '',
    installCommand:
      variant.install_command ||
      variant.metadata?.commands?.powershell?.install ||
      variant.metadata?.commands?.cmd?.install ||
      '',
    metadata: variant.metadata || {}
  };
}

function normalizePackage(pkg) {
  const identity = parseScopedName(pkg.name);
  const variants = Array.isArray(pkg.variants) ? pkg.variants.map(normalizeVariant) : [];
  const platforms = [...new Set(variants.map((variant) => variant.os).filter(Boolean))];
  return {
    creator: identity.creator,
    packageName: identity.packageName,
    name: identity.canonicalName,
    title: pkg.title || identity.packageName,
    description: pkg.description || 'Пакет для NV.',
    homepage: pkg.homepage || '',
    latestVersion: pkg.latest_version || variants[0]?.version || '—',
    variants,
    platforms
  };
}

function creatorLink(creator) {
  return `/nv/profile/?creator=${encodeURIComponent(creator)}`;
}

function packageInstallCommand(pkg) {
  return `nv install ${pkg.name}`;
}

function renderPlatformBadges(platforms) {
  return platforms
    .map((platform) => `<span class="badge">${escapeHtml(platformLabel(platform))}</span>`)
    .join('');
}

function renderPackageCard(pkg) {
  return `
    <article class="package-card">
      <div class="package-head">
        <div>
          <p class="package-title">${escapeHtml(pkg.title)}</p>
          <a class="package-name" href="${creatorLink(pkg.creator)}">@${escapeHtml(pkg.creator)}</a>
          <span class="package-slash">/</span>
          <span class="package-leaf">${escapeHtml(pkg.packageName)}</span>
        </div>
        <span class="version-pill">${escapeHtml(pkg.latestVersion)}</span>
      </div>
      <p class="package-description">${escapeHtml(pkg.description)}</p>
      <div class="badge-row">${renderPlatformBadges(pkg.platforms)}</div>
      <div class="command-inline">
        <code>${escapeHtml(packageInstallCommand(pkg))}</code>
        <button class="text-button" type="button" data-copy="${escapeHtml(packageInstallCommand(pkg))}">Копировать</button>
      </div>
      <div class="package-actions">
        <a class="ghost-button ghost-button-compact" href="${creatorLink(pkg.creator)}">Профиль</a>
        ${pkg.homepage ? `<a class="ghost-button ghost-button-compact" href="${escapeHtml(pkg.homepage)}">Сайт</a>` : ''}
      </div>
    </article>
  `;
}

function getPackages() {
  return (state.registry.packages || []).map(normalizePackage);
}

function getCreators(packages) {
  const creatorMap = new Map();
  packages.forEach((pkg) => {
    if (!creatorMap.has(pkg.creator)) {
      creatorMap.set(pkg.creator, { creator: pkg.creator, packages: [], platforms: new Set() });
    }
    const record = creatorMap.get(pkg.creator);
    record.packages.push(pkg);
    pkg.platforms.forEach((platform) => record.platforms.add(platform));
  });

  return [...creatorMap.values()]
    .map((record) => ({
      creator: record.creator,
      packageCount: record.packages.length,
      packages: record.packages,
      platforms: [...record.platforms]
    }))
    .sort((left, right) => left.creator.localeCompare(right.creator, 'ru'));
}

async function loadRegistry() {
  try {
    const response = await fetch(REGISTRY_URL, { cache: 'no-store' });
    if (!response.ok) throw new Error(`HTTP ${response.status}`);
    const json = await response.json();
    if (!Array.isArray(json.packages)) throw new Error('Invalid registry');
    state.registry = json;
  } catch (error) {
    console.warn('NV registry fallback', error);
    state.registry = fallbackRegistry;
  }
}

function renderFeaturedPackages() {
  const packagesContainer = document.getElementById('featured-packages');
  const creatorsContainer = document.getElementById('featured-creators');
  if (!packagesContainer || !creatorsContainer) return;

  const packages = getPackages();
  const creators = getCreators(packages);
  packagesContainer.innerHTML = packages.slice(0, 6).map(renderPackageCard).join('');
  creatorsContainer.innerHTML = creators
    .slice(0, 4)
    .map(
      (creator) => `
        <article class="creator-card">
          <div>
            <p class="creator-title">@${escapeHtml(creator.creator)}</p>
            <p class="creator-meta">${creator.packageCount} ${pluralizeRu(creator.packageCount, 'пакет', 'пакета', 'пакетов')} · ${escapeHtml(creator.platforms.map(platformLabel).join(', '))}</p>
          </div>
          <a class="ghost-button ghost-button-compact" href="${creatorLink(creator.creator)}">Открыть профиль</a>
        </article>
      `
    )
    .join('');
}

function resolveNvVariant(platform) {
  const nvPackage = getPackages().find((pkg) => pkg.packageName === 'nv');
  return nvPackage?.variants.find((variant) => variant.os === platform) || null;
}

function downloadButtonsForVariant(variant) {
  if (!variant) return '';
  const buttons = [];

  if (variant.downloadUrl) {
    buttons.push(`<a class="primary-button" href="${escapeHtml(variant.downloadUrl)}">Скачать бинарник</a>`);
  }

  if (platformLabel(variant.os) === 'Windows') {
    const powershell = variant.metadata?.commands?.powershell?.install || variant.installCommand;
    if (powershell) {
      buttons.push(`<button class="ghost-button" type="button" data-copy="${escapeHtml(powershell)}">Копировать PowerShell</button>`);
    }
  }

  return buttons.join('');
}

function applyDownloadPlatform(platform) {
  state.downloadPlatform = platform;
  const variant = resolveNvVariant(platform);
  const title = document.getElementById('platform-title');
  const version = document.getElementById('platform-version');
  const command = document.getElementById('install-command');
  const note = document.getElementById('download-note');
  const actions = document.getElementById('platform-actions');
  const tabs = Array.from(document.querySelectorAll('.tab-button'));

  tabs.forEach((tab) => tab.classList.toggle('is-active', tab.dataset.platform === platform));
  if (title) title.textContent = platformLabel(platform);
  if (version) version.textContent = variant?.version || '—';
  if (command) {
    command.textContent =
      platform === 'windows'
        ? variant?.metadata?.commands?.powershell?.install || variant?.installCommand || ''
        : variant?.installCommand || '';
  }
  if (actions) actions.innerHTML = downloadButtonsForVariant(variant);
  if (note) {
    note.textContent =
      platform === 'windows'
        ? 'Windows путь: ставишь NV, потом через него ставишь пакеты. Можно сразу работать из PowerShell.'
        : 'Linux путь: одна команда ставит NV в систему, дальше пакеты ставятся через nv install @creator/package.';
  }
}

function attachDownloadTabs() {
  const tabs = Array.from(document.querySelectorAll('.tab-button'));
  const copyButton = document.getElementById('copy-command');
  const command = document.getElementById('install-command');

  tabs.forEach((tab) => {
    tab.addEventListener('click', () => applyDownloadPlatform(tab.dataset.platform || 'linux'));
  });

  copyButton?.addEventListener('click', async () => {
    try {
      await navigator.clipboard.writeText(command?.textContent || '');
      copyButton.textContent = 'Скопировано';
      setTimeout(() => {
        copyButton.textContent = 'Копировать';
      }, 1400);
    } catch (error) {
      console.warn('Copy command failed', error);
    }
  });

  applyDownloadPlatform(state.downloadPlatform);
}

function packageMatchesFilters(pkg) {
  if (state.platformFilter !== 'all' && !pkg.platforms.includes(state.platformFilter)) {
    return false;
  }

  if (!state.searchTerm) return true;
  const haystack = [pkg.name, pkg.title, pkg.description, pkg.latestVersion, ...pkg.platforms].join(' ').toLowerCase();
  return haystack.includes(state.searchTerm);
}

function renderCatalog() {
  const list = document.getElementById('package-list');
  const empty = document.getElementById('package-empty');
  const meta = document.getElementById('catalog-meta');
  if (!list || !empty || !meta) return;

  const allPackages = getPackages();
  const packages = allPackages.filter(packageMatchesFilters);
  list.innerHTML = packages.map(renderPackageCard).join('');
  empty.hidden = packages.length > 0;
  const creatorsCount = getCreators(allPackages).length;
  meta.textContent = `${packages.length} ${pluralizeRu(packages.length, 'пакет', 'пакета', 'пакетов')} · ${creatorsCount} ${pluralizeRu(creatorsCount, 'автор', 'автора', 'авторов')}`;
}

function attachCatalogControls() {
  const buttons = Array.from(document.querySelectorAll('.filter-button'));
  const search = document.getElementById('package-search');

  buttons.forEach((button) => {
    button.addEventListener('click', () => {
      state.platformFilter = button.dataset.filter || 'all';
      buttons.forEach((item) => item.classList.toggle('is-active', item === button));
      renderCatalog();
    });
  });

  search?.addEventListener('input', () => {
    state.searchTerm = (search.value || '').trim().toLowerCase();
    renderCatalog();
  });

  renderCatalog();
}

function renderProfile() {
  const title = document.getElementById('profile-title');
  const summary = document.getElementById('profile-summary');
  const meta = document.getElementById('profile-meta');
  const list = document.getElementById('profile-packages');
  const empty = document.getElementById('profile-empty');
  const publishCreator = document.getElementById('publish-creator');
  const publishPackage = document.getElementById('publish-package');
  if (!title || !summary || !meta || !list || !empty) return;

  const packages = getPackages();
  const creators = getCreators(packages);
  const params = new URLSearchParams(window.location.search);
  const requestedCreator = (params.get('creator') || creators[0]?.creator || 'lvls').trim().replace(/^@/, '');
  const creator = creators.find((item) => item.creator.toLowerCase() === requestedCreator.toLowerCase());

  title.textContent = `@${requestedCreator}`;
  if (publishCreator) publishCreator.value = `@${requestedCreator}`;
  if (publishPackage) publishPackage.placeholder = `${requestedCreator}-package`;

  if (!creator) {
    summary.textContent = 'Пока в каталоге нет пакетов этого автора.';
    meta.innerHTML = '';
    list.innerHTML = '';
    empty.hidden = false;
    return;
  }

  summary.textContent = `Автор ${creator.creator} сейчас публикует ${creator.packageCount} ${pluralizeRu(creator.packageCount, 'пакет', 'пакета', 'пакетов')} для ${creator.platforms.map(platformLabel).join(' и ')}.`;
  meta.innerHTML = `
    <div class="metric-card">
      <span class="metric-value">${escapeHtml(String(creator.packageCount))}</span>
      <span class="metric-label">${pluralizeRu(creator.packageCount, 'пакет', 'пакета', 'пакетов')}</span>
    </div>
    <div class="metric-card">
      <span class="metric-value">${escapeHtml(creator.platforms.map(platformLabel).join(', '))}</span>
      <span class="metric-label">платформы</span>
    </div>
    <div class="metric-card">
      <span class="metric-value">@${escapeHtml(creator.creator)}</span>
      <span class="metric-label">slug создателя</span>
    </div>
  `;
  list.innerHTML = creator.packages.map(renderPackageCard).join('');
  empty.hidden = creator.packages.length > 0;
}

async function copyFromData(button) {
  const payload = button.dataset.copy || '';
  try {
    await navigator.clipboard.writeText(payload);
    const original = button.textContent;
    button.textContent = 'Скопировано';
    setTimeout(() => {
      button.textContent = original;
    }, 1400);
  } catch (error) {
    console.warn('Clipboard write failed', error);
  }
}

function attachCopyDelegation() {
  document.addEventListener('click', (event) => {
    const target = event.target;
    if (!(target instanceof HTMLElement)) return;
    const button = target.closest('[data-copy]');
    if (!(button instanceof HTMLButtonElement)) return;
    copyFromData(button);
  });
}

async function init() {
  attachCopyDelegation();
  await loadRegistry();

  if (page === 'home') {
    renderFeaturedPackages();
    return;
  }

  if (page === 'downloads') {
    attachDownloadTabs();
    return;
  }

  if (page === 'packages') {
    attachCatalogControls();
    return;
  }

  if (page === 'profile') {
    renderProfile();
  }
}

init();
