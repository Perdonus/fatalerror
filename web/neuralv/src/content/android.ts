export type AndroidHeroMetric = {
  value: string;
  label: string;
};

export type AndroidCapabilityTier = {
  id: 'guest' | 'regular' | 'developer';
  title: string;
  badge: string;
  summary: string;
  bullets: string[];
  accent: 'glacier' | 'mint' | 'sun';
};

export type AndroidPreviewScreen = {
  eyebrow: string;
  title: string;
  text: string;
  chips: string[];
  footer: string;
};

export type AndroidFlowStep = {
  title: string;
  text: string;
};

export type AndroidInstallStep = {
  title: string;
  text: string;
  helper: string;
};

export type AndroidUpdateMode = {
  title: string;
  text: string;
  helper: string;
};

export const androidHeroMetrics: AndroidHeroMetric[] = [
  {
    value: '24/7',
    label: 'foreground/background защита и контроль новых установок'
  },
  {
    value: 'Local + Server',
    label: 'двухступенчатый вердикт без перегруза интерфейса'
  },
  {
    value: 'Guest / Regular / Developer',
    label: 'три уровня глубины для разных сценариев использования'
  }
];

export const androidLocalChecks: string[] = [
  'Быстрая проверка установленных приложений, install source и списка разрешений прямо на устройстве.',
  'Отслеживание новых APK, side-load установок и изменений в уже установленном наборе приложений.',
  'Фоновые сигналы по package name, подписи, suspicious permission mix и базовым индикаторам риска.',
  'Тихий mobile-first UX: тревога появляется только когда сигнал реально требует действия.'
];

export const androidServerChecks: string[] = [
  'Deep, selective и APK-проверки на сервере через hash reputation, статический анализ и внешние reputation-сигналы.',
  'AI post-filter гасит шумные false positive до того, как результат дойдёт до пользователя.',
  'Повторная перепроверка спорных кейсов без нагрузки на батарею и мобильное устройство.',
  'Developer-уровень открывает расширенный отчёт: reason codes, server verdict и сырые артефакты для triage.'
];

export const androidProtectionLoop: AndroidFlowStep[] = [
  {
    title: 'Ловит событие',
    text: 'NeuralV замечает новую установку, обновление пакета или необычный permission drift.'
  },
  {
    title: 'Собирает локальный сигнал',
    text: 'На устройстве оцениваются package metadata, install source, подпись и быстрые эвристики.'
  },
  {
    title: 'Эскалирует на сервер',
    text: 'Подозрительный APK уходит в deep/selective/APK pipeline без ручного вмешательства.'
  },
  {
    title: 'Отдаёт понятный вердикт',
    text: 'Пользователь видит чистый итог, а developer при необходимости может развернуть полный отчёт.'
  }
];

export const androidCapabilityTiers: AndroidCapabilityTier[] = [
  {
    id: 'guest',
    title: 'Guest mode',
    badge: 'Быстрый старт',
    summary: 'Подходит для первого знакомства: скачать APK, запустить локальную проверку и увидеть базовый статус устройства.',
    bullets: [
      'Локальная проверка приложений и тревоги по явным рискам.',
      'Базовая карточка вердикта без перегруженной аналитики.',
      'Подходит для side-load сценария без обязательного погружения в аккаунт.'
    ],
    accent: 'glacier'
  },
  {
    id: 'regular',
    title: 'Regular account',
    badge: 'Повседневная защита',
    summary: 'Основной режим для постоянного использования: синхронизация истории, серверные проверки и единый контур с desktop-клиентами.',
    bullets: [
      'История проверок и повторная перепроверка подозрительных объектов.',
      'Серверные deep/selective/APK verdicts в одном аккаунте.',
      'Уведомления о свежих сигналах и новых релизах APK через общий manifest.'
    ],
    accent: 'mint'
  },
  {
    id: 'developer',
    title: 'Developer view',
    badge: 'Расширенный triage',
    summary: 'Нужен для QA, reverse engineering и расследования: вместо упрощённого статуса доступен технический слой поверх обычного UX.',
    bullets: [
      'Полный server-side отчёт по deep/selective/APK проверке.',
      'Подробные reason codes, сырой verdict trace и статус AI post-filter.',
      'Удобно для воспроизводимости инцидента, багрепорта и валидации ложных срабатываний.'
    ],
    accent: 'sun'
  }
];

export const androidPreviewScreens: AndroidPreviewScreen[] = [
  {
    eyebrow: 'Scan pulse',
    title: 'Экран быстрой проверки',
    text: 'Одна поверхность показывает install source, уровень риска и моментальный результат без лишних переходов.',
    chips: ['resident shield', 'permission drift', 'package diff'],
    footer: 'Подходит для регулярной быстрой проверки в дороге.'
  },
  {
    eyebrow: 'Cloud escalation',
    title: 'Серверный escalation flow',
    text: 'Если локальный сигнал не уверен, приложение спокойно отправляет объект в серверный deep/selective/APK pipeline.',
    chips: ['deep scan', 'selective scan', 'apk report'],
    footer: 'Батарея не тратится на тяжёлый анализ на самом телефоне.'
  },
  {
    eyebrow: 'Clear verdict',
    title: 'Финальный user-facing отчёт',
    text: 'AI post-filter оставляет только actionable-сигналы, а developer может раскрыть технический слой поверх финального verdict.',
    chips: ['ai post-filter', 'reason codes', 'history sync'],
    footer: 'Обычный пользователь видит чистый результат, а не поток шумных тревог.'
  }
];

export const androidInstallSteps: AndroidInstallStep[] = [
  {
    title: 'Скачай актуальный APK',
    text: 'Забери свежую сборку прямо с release manifest этой страницы и заранее посмотри версию, имя файла и SHA256.',
    helper: 'Это удобно для безопасного side-load сценария и ручной сверки артефакта.'
  },
  {
    title: 'Разреши установку из доверенного источника',
    text: 'Если Android запросит подтверждение, дай одноразовое разрешение на установку APK из браузера или файлового менеджера.',
    helper: 'После завершения установки разрешение можно снова отключить в системных настройках.'
  },
  {
    title: 'Запусти NeuralV и выбери глубину режима',
    text: 'Сразу после первого запуска можно остаться в guest-сценарии или войти в аккаунт для серверных проверок и истории.',
    helper: 'Developer-режим нужен только тем, кому важны расширенные отчёты и triage.'
  }
];

export const androidUpdateModes: AndroidUpdateMode[] = [
  {
    title: 'Manifest-driven обновления',
    text: 'Сайт и приложение ориентируются на единый release manifest, поэтому версия APK и канал публикации читаются из одного источника.',
    helper: 'Это снижает риск рассинхрона между страницей загрузки и реальным релизом.'
  },
  {
    title: 'Прозрачная ручная валидация',
    text: 'Перед установкой обновления можно сверить file name, channel и SHA256, не доверяя слепо одной кнопке.',
    helper: 'Полезно для security-aware пользователей и для тестовых сборок.'
  },
  {
    title: 'Спокойный rollout для developer',
    text: 'Developer-сценарий позволяет сравнивать вердикты между сборками и быстро понимать, изменился ли pipeline или только UI-слой.',
    helper: 'Это удобно для QA-регрессий и анализа ложных срабатываний после обновления.'
  }
];
