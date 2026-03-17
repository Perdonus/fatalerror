const REGISTRY_URL = '/basedata/api/packages/registry';
const AUTH_CONFIG_URL = '/basedata/api/nv/auth/config';
const AUTH_ME_URL = '/basedata/api/nv/auth/me';
const AUTH_LOGIN_URL = '/basedata/api/nv/auth/telegram';
const AUTH_LOGOUT_URL = '/basedata/api/nv/auth/logout';

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
          download_url: 'https://raw.githubusercontent.com/Perdonus/NV/linux-builds/linux/nv-linux.tar.gz',
          install_command: 'curl -fsSL https://raw.githubusercontent.com/Perdonus/NV/linux-builds/nv.sh | sh'
        },
        {
          id: 'nv-windows',
          label: 'Windows',
          os: 'windows',
          version: '1.3.3',
          download_url: 'https://raw.githubusercontent.com/Perdonus/NV/windows-builds/windows/nv.exe',
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
        { id: 'linux', label: 'Linux', os: 'linux', version: '1.4.1' }
      ]
    }
  ]
};

const page = document.body.dataset.page;
const state = {
  registry: fallbackRegistry,
  platformFilter: 'all',
  searchTerm: '',
  downloadPlatform: 'linux',
  auth: {
    loading: true,
    enabled: false,
    botUsername: '',
    user: null,
    creator: null,
    error: null
  }
};

window.NVTelegramAuth = handleTelegramWidgetAuth;

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
  const match = /^@([^/]+)\/(.+)$/.exec(String(name || '').trim());
  if (!match) {
    return { creator: 'unknown', packageName: String(name || 'package').trim(), canonicalName: String(name || 'package').trim() };
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
    id: String(variant.id || ''),
    label: String(variant.label || platformLabel(variant.os)),
    os: String(variant.os || 'unknown').toLowerCase(),
    version: String(variant.version || ''),
    downloadUrl: String(variant.download_url || ''),
    installCommand:
      String(variant.install_command || '') ||
      String(variant.metadata?.commands?.powershell?.install || '') ||
      String(variant.metadata?.commands?.cmd?.install || ''),
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
    title: String(pkg.title || identity.packageName),
    description: String(pkg.description || 'Пакет для NV.'),
    homepage: String(pkg.homepage || ''),
    latestVersion: String(pkg.latest_version || variants[0]?.version || '—'),
    variants,
    platforms
  };
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

function creatorLink(creator) {
  return `/nv/profile/?creator=${encodeURIComponent(creator)}`;
}

function packageInstallCommand(pkg) {
  return `nv install ${pkg.name}`;
}

function renderPlatformBadges(platforms) {
  return platforms.map((platform) => `<span class="badge">${escapeHtml(platformLabel(platform))}</span>`).join('');
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

  const packagesMetric = document.getElementById('metric-packages');
  const creatorsMetric = document.getElementById('metric-creators');
  if (packagesMetric) packagesMetric.textContent = String(packages.length);
  if (creatorsMetric) creatorsMetric.textContent = String(creators.length);
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

async function loadAuthState() {
  state.auth.loading = true;
  renderAuthSlot();
  try {
    const [configResponse, meResponse] = await Promise.all([
      fetch(AUTH_CONFIG_URL, { cache: 'no-store', credentials: 'include' }),
      fetch(AUTH_ME_URL, { cache: 'no-store', credentials: 'include' })
    ]);
    const config = configResponse.ok ? await configResponse.json() : { enabled: false, bot_username: '' };
    const me = meResponse.ok ? await meResponse.json() : { authenticated: false };
    state.auth.enabled = Boolean(config.enabled);
    state.auth.botUsername = String(config.bot_username || '').trim();
    state.auth.user = me.authenticated ? me.user || null : null;
    state.auth.creator = me.authenticated ? me.creator || null : null;
    state.auth.error = null;
  } catch (error) {
    console.warn('NV auth bootstrap failed', error);
    state.auth.enabled = false;
    state.auth.botUsername = '';
    state.auth.user = null;
    state.auth.creator = null;
    state.auth.error = error instanceof Error ? error.message : 'Не удалось загрузить вход';
  } finally {
    state.auth.loading = false;
    renderAuthSlot();
    renderProfile();
  }
}

function authDisplayName() {
  if (!state.auth.user) return 'NV user';
  const fullName = [state.auth.user.first_name, state.auth.user.last_name].filter(Boolean).join(' ').trim();
  return state.auth.user.display_name || fullName || state.auth.user.username || 'NV user';
}

function authHandle() {
  if (state.auth.creator?.slug) return `@${state.auth.creator.slug}`;
  if (state.auth.user?.username) return `@${state.auth.user.username}`;
  return 'Telegram';
}

function authAvatarMarkup(wrapperClass = 'auth-avatar') {
  if (state.auth.user?.photo_url) {
    return `<span class="${wrapperClass}"><img class="auth-avatar-image" src="${escapeHtml(state.auth.user.photo_url)}" alt="${escapeHtml(authDisplayName())}" /></span>`;
  }
  const letter = authDisplayName().charAt(0).toUpperCase() || 'N';
  return `<span class="${wrapperClass}"><span class="auth-avatar-fallback">${escapeHtml(letter)}</span></span>`;
}

function mountTelegramWidget(container) {
  if (!container || !state.auth.enabled || !state.auth.botUsername) return;
  container.innerHTML = '';
  const host = document.createElement('div');
  host.className = 'telegram-widget-host';
  const script = document.createElement('script');
  script.async = true;
  script.src = 'https://telegram.org/js/telegram-widget.js?22';
  script.setAttribute('data-telegram-login', state.auth.botUsername);
  script.setAttribute('data-size', 'large');
  script.setAttribute('data-userpic', 'false');
  script.setAttribute('data-radius', '999');
  script.setAttribute('data-request-access', 'write');
  script.setAttribute('data-onauth', 'window.NVTelegramAuth(user)');
  host.appendChild(script);
  container.appendChild(host);
}

function renderAuthSlot() {
  const slot = document.getElementById('auth-slot');
  if (!slot) return;

  if (state.auth.loading) {
    slot.innerHTML = '<div class="auth-status-card">Проверяем вход…</div>';
    return;
  }

  if (state.auth.user && state.auth.creator) {
    slot.innerHTML = `
      <div class="auth-user-card">
        <a class="auth-user-link" href="/nv/profile/">
          ${authAvatarMarkup('auth-avatar')}
          <span class="auth-meta">
            <strong>${escapeHtml(authDisplayName())}</strong>
            <span>${escapeHtml(authHandle())}</span>
          </span>
        </a>
        <button class="ghost-button ghost-button-compact" type="button" id="nv-logout-button">Выйти</button>
      </div>
    `;
    document.getElementById('nv-logout-button')?.addEventListener('click', logoutSiteUser);
    return;
  }

  if (!state.auth.enabled) {
    slot.innerHTML = `
      <div class="auth-status-card">
        <div>
          <strong>Telegram login ещё не настроен</strong>
          <span>${escapeHtml(state.auth.error || 'Нужны bot username, bot token и web session secret.')}</span>
        </div>
      </div>
    `;
    return;
  }

  slot.innerHTML = `
    <div class="auth-widget-card">
      <div>
        <strong>Войти через Telegram</strong>
        <span>Это включит creator-профиль и web-сессию сайта.</span>
      </div>
      <div id="header-telegram-widget"></div>
    </div>
  `;
  mountTelegramWidget(document.getElementById('header-telegram-widget'));
}

async function handleTelegramWidgetAuth(user) {
  try {
    const response = await fetch(AUTH_LOGIN_URL, {
      method: 'POST',
      credentials: 'include',
      headers: {
        'Content-Type': 'application/json',
        Accept: 'application/json'
      },
      body: JSON.stringify({ telegram_auth: user })
    });
    const payload = await response.json().catch(() => ({}));
    if (!response.ok) {
      throw new Error(payload?.error || `HTTP ${response.status}`);
    }
    state.auth.user = payload.user || null;
    state.auth.creator = payload.creator || null;
    state.auth.error = null;
    renderAuthSlot();
    renderProfile();
  } catch (error) {
    console.warn('NV Telegram login failed', error);
    state.auth.error = error instanceof Error ? error.message : 'Не удалось завершить вход';
    renderAuthSlot();
  }
}

async function logoutSiteUser() {
  try {
    await fetch(AUTH_LOGOUT_URL, {
      method: 'POST',
      credentials: 'include',
      headers: { Accept: 'application/json' }
    });
  } catch (error) {
    console.warn('NV logout failed', error);
  }
  state.auth.user = null;
  state.auth.creator = null;
  renderAuthSlot();
  renderProfile();
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
  const root = document.getElementById('profile-content');
  if (!root) return;

  const packages = getPackages();
  const creators = getCreators(packages);
  const params = new URLSearchParams(window.location.search);
  const fallbackCreator = state.auth.creator?.slug || creators[0]?.creator || 'lvls';
  const requestedCreator = (params.get('creator') || fallbackCreator).trim().replace(/^@/, '');
  const creator = creators.find((item) => item.creator.toLowerCase() === requestedCreator.toLowerCase());
  const canPublish = Boolean(state.auth.creator?.slug && state.auth.creator.slug.toLowerCase() === requestedCreator.toLowerCase());
  const creatorPackages = creator ? creator.packages.map(renderPackageCard).join('') : '';

  root.innerHTML = `
    <section class="hero hero-compact">
      <div class="hero-copy hero-copy-tight">
        <p class="eyebrow">Создатель</p>
        <h1>@${escapeHtml(requestedCreator)}</h1>
        <p class="hero-text">
          ${escapeHtml(canPublish
            ? 'Это твой creator-профиль. Telegram-сессия уже активна, ниже доступна модель формы публикации.'
            : creator
              ? `Автор публикует ${creator.packageCount} ${pluralizeRu(creator.packageCount, 'пакет', 'пакета', 'пакетов')} для ${creator.platforms.map(platformLabel).join(' и ')}.`
              : 'Пока в каталоге нет пакетов этого автора.')}
        </p>
      </div>
    </section>

    <section class="profile-layout">
      <article class="section-shell profile-main-shell">
        <div class="profile-meta">
          <div class="metric-card">
            <span class="metric-value">${escapeHtml(String(creator?.packageCount || 0))}</span>
            <span class="metric-label">${pluralizeRu(creator?.packageCount || 0, 'пакет', 'пакета', 'пакетов')}</span>
          </div>
          <div class="metric-card">
            <span class="metric-value">${escapeHtml(creator ? creator.platforms.map(platformLabel).join(', ') : '—')}</span>
            <span class="metric-label">платформы</span>
          </div>
          <div class="metric-card">
            <span class="metric-value">@${escapeHtml(requestedCreator)}</span>
            <span class="metric-label">slug создателя</span>
          </div>
        </div>
        <div class="package-grid package-grid-wide" aria-live="polite">${creatorPackages}</div>
        <p class="empty-state" ${creator ? 'hidden' : ''}>У этого автора пока нет пакетов в каталоге.</p>
      </article>

      <aside class="profile-sidebar">
        <article class="section-shell side-stack-card">
          <div class="section-head section-head-compact">
            <div>
              <p class="eyebrow">Telegram</p>
              <h2>Вход создателя</h2>
            </div>
          </div>
          <div class="widget-slot" id="telegram-widget-slot"></div>
        </article>

        <article class="section-shell side-stack-card" ${canPublish ? '' : 'hidden'}>
          <div class="section-head section-head-compact">
            <div>
              <p class="eyebrow">Publish</p>
              <h2>Форма публикации</h2>
            </div>
          </div>
          <form class="publish-form" id="publish-form" action="#" method="dialog">
            <label class="field">
              <span>Creator</span>
              <input id="publish-creator" type="text" value="@${escapeHtml(requestedCreator)}" readonly />
            </label>
            <label class="field">
              <span>Пакет</span>
              <input id="publish-package" type="text" placeholder="${escapeHtml(requestedCreator)}-package" />
            </label>
            <label class="field">
              <span>Версия</span>
              <input id="publish-version" type="text" placeholder="1.0.0" />
            </label>
            <label class="field field-wide">
              <span>Описание</span>
              <textarea id="publish-description" rows="4" placeholder="Коротко о пакете"></textarea>
            </label>
            <div class="toggle-row" aria-label="Платформы пакета">
              <label><input type="checkbox" checked /> Windows</label>
              <label><input type="checkbox" checked /> Linux</label>
            </div>
            <label class="field field-wide">
              <span>Источник архива</span>
              <input id="publish-url" type="url" placeholder="https://example.com/package.zip" />
            </label>
            <div class="form-actions">
              <button class="primary-button" type="button" disabled>Опубликовать</button>
              <span class="form-note">Это publish-form модель. Реальный backend publish API можно подвязать следующим слоем.</span>
            </div>
          </form>
        </article>
      </aside>
    </section>
  `;

  const widgetSlot = document.getElementById('telegram-widget-slot');
  if (widgetSlot) {
    if (state.auth.user && state.auth.creator) {
      widgetSlot.innerHTML = `
        <div class="auth-user-card auth-user-card-vertical">
          <div class="auth-user-link">
            ${authAvatarMarkup('auth-avatar')}
            <span class="auth-meta">
              <strong>${escapeHtml(authDisplayName())}</strong>
              <span>${escapeHtml(authHandle())}</span>
            </span>
          </div>
          <button class="ghost-button ghost-button-compact" type="button" id="profile-logout-button">Выйти</button>
        </div>
      `;
      document.getElementById('profile-logout-button')?.addEventListener('click', logoutSiteUser);
    } else if (state.auth.enabled) {
      widgetSlot.innerHTML = '<div id="profile-telegram-auth"></div>';
      mountTelegramWidget(document.getElementById('profile-telegram-auth'));
    } else {
      widgetSlot.innerHTML = '<div class="auth-status-card">Telegram login ещё не настроен на backend.</div>';
    }
  }
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
  await Promise.all([loadRegistry(), loadAuthState()]);

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
