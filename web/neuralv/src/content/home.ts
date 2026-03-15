export type HomeMetric = {
  value: string;
  label: string;
  detail: string;
};

export type HomePlatformCard = {
  id: 'android' | 'windows' | 'linux';
  route: '/android' | '/windows' | '/linux';
  eyebrow: string;
  title: string;
  summary: string;
  bullets: string[];
  primaryLabel: string;
  secondaryLabel: string;
  manifestPlatform: 'android' | 'windows' | 'linux';
  tone: 'android' | 'windows' | 'linux';
};

export type HomeAdvantage = {
  eyebrow: string;
  title: string;
  text: string;
  size: 'normal' | 'wide';
};

export type HomeArchitectureCard = {
  eyebrow: string;
  title: string;
  text: string;
  bullets: string[];
  tone: 'local' | 'server' | 'sync';
};

export type HomeInstallStep = {
  title: string;
  text: string;
};

export const homeMetrics: HomeMetric[] = [
  {
    value: '3',
    label: 'клиентские поверхности',
    detail: 'Android, Windows и Linux получают одинаково ясный вход в продукт.'
  },
  {
    value: '1',
    label: 'release manifest',
    detail: 'Один источник правды для версий, ссылок, SHA256 и install-команд.'
  },
  {
    value: '2',
    label: 'слоя анализа',
    detail: 'Локальный сигнал на устройстве усиливается серверным triage и репутацией.'
  }
];

export const homePlatformCards: HomePlatformCard[] = [
  {
    id: 'android',
    route: '/android',
    eyebrow: 'Мобильный контур',
    title: 'Android',
    summary:
      'APK-доставка, локальная проверка приложений и серверные deep/selective/APK сценарии в одном потоке.',
    bullets: [
      'mobile-first UX с понятным статусом защиты и фоновой проверкой',
      'локальный анализ приложений, разрешений и install source',
      'серверная перепроверка без разрыва между телефоном и desktop-историей'
    ],
    primaryLabel: 'Открыть Android',
    secondaryLabel: 'Скачать APK',
    manifestPlatform: 'android',
    tone: 'android'
  },
  {
    id: 'windows',
    route: '/windows',
    eyebrow: 'Рабочая станция',
    title: 'Windows',
    summary:
      'Compose Desktop для on-demand и resident сценариев с фокусом на EXE/DLL, signer validation и persistence.',
    bullets: [
      'installer или portable build отдаются через manifest без ручных ссылок',
      'локальная эвристика по PE-сигналам, entropy, imports и signer metadata',
      'сервер хранит расширенный отчёт, UI показывает только чистый итог'
    ],
    primaryLabel: 'Открыть Windows',
    secondaryLabel: 'Скачать build',
    manifestPlatform: 'windows',
    tone: 'windows'
  },
  {
    id: 'linux',
    route: '/linux',
    eyebrow: 'GUI + shell',
    title: 'Linux',
    summary:
      'Desktop GUI и shell/TUI клиент сходятся в одном продукте: GUI для desktop, shell для серверных и ops-сценариев.',
    bullets: [
      'desktop-артефакт и shell installer публикуются как часть одного релиза',
      'локальный анализ ELF, autorun, package provenance и systemd entrypoints',
      'resident-модель строится вокруг neuralvd, а shell остаётся first-class поверхностью'
    ],
    primaryLabel: 'Открыть Linux',
    secondaryLabel: 'Скачать GUI',
    manifestPlatform: 'linux',
    tone: 'linux'
  }
];

export const homeAdvantages: HomeAdvantage[] = [
  {
    eyebrow: 'Единый контур',
    title: 'Один аккаунт и одна история проверки для всех устройств.',
    text:
      'Пользователь не собирает продукт из независимых клиентов. Android, Windows и Linux подчиняются одному auth-потоку и одному back-office.',
    size: 'wide'
  },
  {
    eyebrow: 'Локальная скорость',
    title: 'Быстрый первый ответ приходит с устройства.',
    text:
      'Каждый клиент умеет давать первичный сигнал без ожидания сети: от приложений Android до EXE/DLL и ELF/AppImage.',
    size: 'normal'
  },
  {
    eyebrow: 'Серверная глубина',
    title: 'Сложный анализ остаётся на backend, а не в UI.',
    text:
      'Hash reputation, VT, статические эвристики и AI triage сглаживают шум, не перегружая интерфейс деталями.',
    size: 'normal'
  },
  {
    eyebrow: 'Manifest-first',
    title: 'Главная страница не хардкодит релизы, она читает контракт публикации.',
    text:
      'Версия, канал, SHA256, download URL и install command попадают на сайт из одного источника, поэтому витрина и релиз не расходятся.',
    size: 'wide'
  },
  {
    eyebrow: 'Shell как часть продукта',
    title: 'Linux shell не спрятан в документации.',
    text:
      'Команда установки и lifecycle daemon видны рядом с GUI-потоком, поэтому ops-сценарии живут в том же ритме, что и desktop.',
    size: 'normal'
  },
  {
    eyebrow: 'Чистая подача',
    title: 'Пользователь видит решение, а не сырые события.',
    text:
      'Сайт и клиенты показывают понятные CTA, а расширенная техническая детализация остаётся там, где она действительно нужна.',
    size: 'normal'
  }
];

export const homeArchitectureCards: HomeArchitectureCard[] = [
  {
    eyebrow: 'Local layer',
    title: 'На устройстве собираются быстрые и platform-aware сигналы.',
    text:
      'Каждая поверхность стартует с локального контекста: приложения, исполняемые файлы, provenance, autorun и resident события.',
    bullets: [
      'Android: apps, permissions, install source и фоновый статус',
      'Windows: PE metadata, signer, imports, packer markers и новые бинарники',
      'Linux: ELF/AppImage, capabilities, package manager provenance и systemd hooks'
    ],
    tone: 'local'
  },
  {
    eyebrow: 'Server layer',
    title: 'Backend усиливает локальный сигнал репутацией и статическим triage.',
    text:
      'Серверная часть получает summary и артефакты, прогоняет их через hash reputation, VT, правила и AI post-filter, а затем нормализует результат.',
    bullets: [
      'deep/selective/APK сценарии для Android',
      'YARA/static PE heuristics и publisher rules для Windows',
      'ELF/AppImage static analysis и distro-aware контекст для Linux'
    ],
    tone: 'server'
  },
  {
    eyebrow: 'Sync layer',
    title: 'Manifest и история проверок связывают доставку, установку и итоговый UX.',
    text:
      'Тот же backend публикует артефакты и install-команды, а клиенты после входа синхронизируют историю, чтобы продукт чувствовался единым.',
    bullets: [
      'release manifest синхронизирует сайт и артефакты',
      'desktop, mobile и shell читают один ритм релиза',
      'отчёты и статусы остаются согласованными между поверхностями'
    ],
    tone: 'sync'
  }
];

export const homeInstallSteps: HomeInstallStep[] = [
  {
    title: 'Релиз публикуется в manifest.',
    text:
      'Backend отдаёт актуальные версии, каналы, SHA256, download URL и installCommand. Витрина главной страницы читает именно этот слой.'
  },
  {
    title: 'Пользователь выбирает свою поверхность.',
    text:
      'Android получает прямой APK-flow, Windows получает desktop build, Linux получает GUI-артефакт и при необходимости shell installer.'
  },
  {
    title: 'Установка следует platform-native пути.',
    text:
      'APK ставится как мобильное приложение, desktop-клиенты запускаются через installer или archive, shell-клиент поднимает CLI и daemon через одну команду.'
  },
  {
    title: 'После входа включается единый продуктовый контур.',
    text:
      'История проверок, серверные отчёты и статусы защиты синхронизируются между клиентами, поэтому переход между платформами не ломает опыт.'
  }
];

export const homeManifestFacts = [
  'Версии и каналы не размазываются по странице вручную.',
  'Download URL и installCommand приходят из backend release contract.',
  'SHA256 и file name можно показывать рядом с CTA без отдельной ручной правки.',
  'Fallback режим сохраняет витрину рабочей даже до первого живого релиза.'
];

export const homeShellFallbackCommand =
  'curl -fsSL https://sosiskibot.ru/neuralv/install/linux.sh | bash';
