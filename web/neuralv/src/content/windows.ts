export type WindowsHeroStat = {
  label: string;
  detail: string;
};

export type WindowsProofPoint = {
  title: string;
  text: string;
};

export type WindowsCapability = {
  eyebrow: string;
  title: string;
  text: string;
  bullets: string[];
};

export type WindowsCheckCluster = {
  title: string;
  text: string;
  bullets: string[];
};

export type WindowsWorkflowStep = {
  step: string;
  title: string;
  text: string;
  outcome: string;
};

export type WindowsPipelineStage = {
  title: string;
  text: string;
  signal: string;
};

export type WindowsTrack = {
  eyebrow: string;
  title: string;
  steps: string[];
};

export type WindowsDownloadBrief = {
  title: string;
  text: string;
};

export type WindowsSalesCard = {
  title: string;
  text: string;
};

export type WindowsFaqItem = {
  question: string;
  answer: string;
};

export const windowsPageContent = {
  hero: {
    eyebrow: 'Windows / GUI + resident protection',
    title: 'NeuralV для Windows держит под контролем запуск EXE и DLL без перегруженного enterprise UI.',
    description:
      'Это отдельный desktop-клиент для рабочих станций и домашних ПК: понятный GUI, always-on resident protection, on-demand сканирование и server-backed deep verdict для спорных файлов.',
    highlights: [
      'GUI для ежедневной работы: очереди проверок, история, quarantine-подсказки и быстрый доступ к серверным отчётам.',
      'Resident protection наблюдает за download, temp, desktop и autostart зонами до того, как пользователь откроет подозрительный файл.',
      'Каждый спорный verdict может быть расширен серверным deep pipeline вместо noisy локального popup-only сценария.'
    ],
    stats: [
      {
        label: 'Desktop surface',
        detail: 'Очередь проверок, история, live verdict badges и единый вход в аккаунт NeuralV.'
      },
      {
        label: 'Resident loop',
        detail: 'Мониторинг новых EXE, DLL, инжекторов, dropper-папок и persistence-сигналов.'
      },
      {
        label: 'Deep server path',
        detail: 'Hash reputation, signer intelligence, YARA/static PE heuristics и AI post-filter.'
      }
    ]
  },
  proofPoints: [
    {
      title: 'GUI без лишнего шума',
      text: 'Главный экран показывает только важные статусы: что проверилось локально, что ушло на сервер и какой verdict уже готов.'
    },
    {
      title: 'Проверка до запуска',
      text: 'Resident path следит за папками загрузок, вложениями, temp-цепочками и появлением новых autorun entry.'
    },
    {
      title: 'EXE, DLL и side-load сценарии',
      text: 'NeuralV не ограничивается только файлами из загрузок: отдельно подсвечиваются signer anomalies, packer hints и suspicious imports.'
    },
    {
      title: 'Одна история на всех устройствах',
      text: 'Windows-клиент использует тот же аккаунт, что Android и Linux, поэтому deep verdict и события resident protection не теряются.'
    }
  ],
  capabilities: [
    {
      eyebrow: 'GUI',
      title: 'Понятный desktop-интерфейс для повседневной проверки',
      text: 'Страница построена вокруг сценария "скачал, проверил, понял verdict". Без длинных policy-таблиц и спрятанных логов.',
      bullets: [
        'Большие карточки текущего статуса и последних угроз вместо перегруженного dashboard.',
        'История локальных и серверных проверок в одном потоке, чтобы не искать результат по вкладкам.',
        'Выделенные CTA на скачивание, обновление и открытие полного server-report.'
      ]
    },
    {
      eyebrow: 'Resident protection',
      title: 'Фоновая защита, рассчитанная на реальные пользовательские привычки',
      text: 'Windows-клиент отслеживает не только ручной scan, но и появление новых файлов в типичных risk-зонах.',
      bullets: [
        'Download, temp, desktop, browser cache, archives extraction и autostart directories.',
        'Сигналы запуска из shell open, double-click сценариев и цепочки "распаковка -> запуск".',
        'Отдельный поток событий для подозрительных DLL рядом с EXE и известных sideload paths.'
      ]
    },
    {
      eyebrow: 'Server intelligence',
      title: 'Локальная скорость плюс серверная глубина для спорных файлов',
      text: 'Если локальная эвристика видит риск, NeuralV дотягивает контекст из backend и показывает verdict без лишнего noise.',
      bullets: [
        'Hash reputation и сопоставление с уже известными verdict на backend.',
        'Static PE/YARA, signer reputation и publisher allowlist/denylist.',
        'AI post-filter оставляет пользователю только те события, где действительно нужен action.'
      ]
    }
  ],
  localChecks: [
    {
      title: 'EXE и DLL профиль',
      text: 'Локальный движок быстро снимает базовый профиль исполняемого файла, даже если пользователь только что его скачал.',
      bullets: [
        'PE headers, machine type, timestamp anomalies, section layout и entropy spikes.',
        'Overlay, packer markers, suspicious resources и типичные dropper/persistence паттерны.',
        'DLL рядом с EXE, side-loading hints, mismatched exports и непохожая publisher-цепочка.'
      ]
    },
    {
      title: 'Trust и provenance',
      text: 'Проверка не ограничивается файлом: учитывается и путь происхождения, и подпись издателя, и сценарий появления на диске.',
      bullets: [
        'Signer validation, invalid chain, self-signed publisher и редкие/новые издатели.',
        'Mark-of-the-Web, install source hints, download path и связь с архивами или вложениями.',
        'Сравнение имени файла, продукта, компании и версии на признаки spoofing.'
      ]
    }
  ],
  serverChecks: [
    {
      title: 'Selective и deep pipeline',
      text: 'На сервер уходит не всё подряд, а только те кейсы, где backend действительно добавляет ценность.',
      bullets: [
        'Hash reputation и cross-client history по уже известным образцам.',
        'YARA/static PE rules, VT-enrichment и publisher reputation.',
        'Повторная оценка suspicious imports, packer behavior и цепочки заражения.'
      ]
    },
    {
      title: 'Вердикт, который можно объяснить',
      text: 'Пользователь видит не только красный статус, но и краткое объяснение: почему файл поднял риск и что делать дальше.',
      bullets: [
        'Отдельные признаки из local stage и server stage не смешиваются в непрозрачный score.',
        'AI triage снижает количество false positive до пользовательского интерфейса.',
        'Полный server-report остаётся доступным для advanced review и команды response.'
      ]
    }
  ],
  residentSignals: [
    'Новые EXE/DLL в Downloads, Desktop, Temp и рабочих папках мессенджеров.',
    'Неожиданное появление autorun, startup shortcuts, scheduled tasks и persistence-файлов.',
    'Распаковка архива с последующим запуском исполняемого файла без долгой ручной паузы.',
    'Подмена DLL рядом с доверенным приложением или запуск бинарника из нестандартного пути.'
  ],
  workflow: [
    {
      step: '01',
      title: 'Скачивание и первый контакт',
      text: 'Пользователь получает EXE, DLL или архив. Resident path отмечает источник и место появления на диске.',
      outcome: 'Сразу виден контекст происхождения: download, temp, messenger, archive extraction.'
    },
    {
      step: '02',
      title: 'Моментальный локальный анализ',
      text: 'До открытия файла GUI получает быстрый verdict по PE-профилю, signer-сигналам и базовой эвристике.',
      outcome: 'Чистые файлы проходят без лишнего шума, спорные отправляются в selective server path.'
    },
    {
      step: '03',
      title: 'Server-backed deep triage',
      text: 'Backend добирает reputation, YARA/static PE и cross-device историю, если локальных данных недостаточно.',
      outcome: 'Пользователь видит объяснимый verdict, а не просто "потенциально опасно".'
    },
    {
      step: '04',
      title: 'Действие и история',
      text: 'После решения пользователя событие остаётся в истории Windows-клиента и в общем аккаунте NeuralV.',
      outcome: 'Можно быстро повторить scan, скачать новую сборку или открыть полный report без поиска по логам.'
    }
  ],
  pipeline: [
    {
      title: 'Resident watch',
      text: 'Always-on наблюдение за новыми файлами, suspicious paths и launch-попытками.',
      signal: 'Windows event stream'
    },
    {
      title: 'Local PE heuristics',
      text: 'Быстрый анализ структуры файла, подписи, packer hints и import surface прямо на устройстве.',
      signal: 'Low-latency first verdict'
    },
    {
      title: 'Selective upload',
      text: 'На backend уходят только нужные кейсы: hash, telemetry summary и контекст происхождения.',
      signal: 'Bandwidth-aware handoff'
    },
    {
      title: 'Deep server verdict',
      text: 'Hash reputation, YARA/static PE, signer intelligence и AI post-filter собираются в один объяснимый итог.',
      signal: 'Actionable report'
    }
  ],
  installTrack: {
    eyebrow: 'Install',
    title: 'Как пользователь начинает работу',
    steps: [
      'Скачать актуальную Windows-сборку из release manifest на этой странице.',
      'Запустить установщик или рабочую сборку и войти в аккаунт NeuralV.',
      'Включить resident protection, если нужен постоянный мониторинг download и autorun-сценариев.',
      'Открыть первую папку, файл или архив на проверку и дождаться локального verdict.'
    ]
  },
  updateTrack: {
    eyebrow: 'Update',
    title: 'Как поддерживается актуальность клиента',
    steps: [
      'Приложение показывает текущую версию и подсказывает, когда в manifest появилась новая сборка.',
      'Офлайн-сценарий остаётся простым: можно заново скачать свежий build прямо со страницы.',
      'После обновления сохраняются авторизация, история проверок и связка с server-side report.',
      'Resident protection после апдейта продолжает работать без повторной ручной настройки.'
    ]
  },
  downloadBriefs: [
    {
      title: 'Один Windows-раздел вместо путаницы по каналам',
      text: 'Пользователь видит текущую версию, имя артефакта, hash и заметки release manifest в одном месте.'
    },
    {
      title: 'Проверка целостности до установки',
      text: 'Если нужен ручной контроль, SHA256 и release notes уже находятся рядом с кнопкой скачивания.'
    },
    {
      title: 'Подходит и для analyst-flow',
      text: 'Страница одинаково удобна и для домашнего пользователя, и для тестовой рабочей станции, где нужен быстрый rebuild / re-download.'
    }
  ],
  salesCards: [
    {
      title: 'Для домашнего ПК',
      text: 'NeuralV объясняет риск простыми статусами и не заставляет пользователя разбираться в сигнатурах и policy.'
    },
    {
      title: 'Для рабочей станции',
      text: 'Resident protection и server verdict особенно полезны там, где постоянно приходят новые инсталляторы, архивы и DLL.'
    },
    {
      title: 'Для response и QA',
      text: 'История событий и серверный отчёт позволяют быстро воспроизвести кейс и понять, почему verdict изменился после deep scan.'
    }
  ],
  faq: [
    {
      question: 'Это только on-demand сканер?',
      answer:
        'Нет. Windows-версия покрывает и ручной запуск проверок из GUI, и resident monitoring для файлов, которые только что появились на диске.'
    },
    {
      question: 'Что происходит, если локальный verdict неуверенный?',
      answer:
        'NeuralV переводит кейс в selective server path, чтобы добрать hash reputation, signer intelligence и deep static signals.'
    },
    {
      question: 'Нужно ли вручную искать новую сборку?',
      answer:
        'Нет. Страница уже смотрит в release manifest и показывает актуальную версию, а сам клиент может подсказать, что апдейт доступен.'
    }
  ]
} as const;
