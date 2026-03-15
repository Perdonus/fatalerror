export type LinuxMetric = {
  label: string;
  value: string;
  detail: string;
};

export type LinuxModeCard = {
  eyebrow: string;
  title: string;
  description: string;
  bullets: string[];
  footnote: string;
};

export type LinuxCoverageBand = {
  family: string;
  emphasis: string;
  description: string;
  notes: string[];
};

export type LinuxFlowStep = {
  eyebrow: string;
  title: string;
  description: string;
  command?: string;
  secondaryCommand?: string;
  note?: string;
};

export type LinuxSystemdStep = {
  title: string;
  description: string;
  unit: string;
};

export type LinuxRail = {
  eyebrow: string;
  title: string;
  description: string;
  items: string[];
};

export type LinuxCommand = {
  label: string;
  value: string;
};

export type LinuxCommandDeck = {
  eyebrow: string;
  title: string;
  description: string;
  commands: LinuxCommand[];
};

export const linuxInstallCommand = 'curl -fsSL https://sosiskibot.ru/neuralv/install/linux.sh | bash';

export const linuxPageContent = {
  kicker: 'NeuralV / Linux / md3 expressive',
  title: 'GUI, shell/TUI и neuralvd daemon для Linux без раздвоенного стека.',
  summary:
    'Desktop workstation, jump host и headless server получают один маршрут: визуальный GUI, быстрый терминальный путь и optional resident daemon через systemd.',
  audience:
    'Страница рассчитана на инженерные ноутбуки, рабочие станции, VPS и bare-metal узлы, где важно сохранить rootless first install, но включить daemon там, где нужен постоянный мониторинг.',
  heroChips: [
    'Compose Desktop GUI',
    'Shell/TUI operator path',
    'curl|bash bootstrap',
    'systemd opt-in',
    'Local + server checks',
    'Headless-ready'
  ],
  metrics: [
    {
      label: 'Delivery',
      value: 'GUI + CLI',
      detail: 'Один release lane для visual и terminal surface.'
    },
    {
      label: 'Resident path',
      value: 'neuralvd',
      detail: 'Daemon включается отдельно, а не навязывается при каждом install.'
    },
    {
      label: 'Bootstrap',
      value: 'curl|bash',
      detail: 'Быстрый install на workstation и на headless host.'
    }
  ] satisfies LinuxMetric[],
  modeCards: [
    {
      eyebrow: 'GUI',
      title: 'Compose Desktop cockpit',
      description:
        'Для desktop Linux, где нужен привычный визуальный поток: история проверок, артефакты релиза и единая авторизация без отдельного server-only клиента.',
      bullets: [
        'Сканирование ELF, AppImage, shell launchers и .desktop entry points.',
        'Живой статус артефактов и доступ к тем же server verdicts, что видит shell-клиент.',
        'Подходит для workstation сценариев, где оператору нужен быстрый визуальный контроль.'
      ],
      footnote: 'GUI и shell читают одну и ту же событийную модель.'
    },
    {
      eyebrow: 'Shell / TUI',
      title: 'Операторский терминальный путь',
      description:
        'Для SSH-сессий, CI-host и удалённых серверов, где GUI не нужен, а важно быстро поставить клиент, проверить статус и обновиться без лишнего веса.',
      bullets: [
        'Команды status, update, start, stop и uninstall доступны сразу после bootstrap.',
        'Хорошо работает на headless nodes и в сценариях с bastion/jump host.',
        'Тот же backend для server-side triage и release manifest, что и у GUI.'
      ],
      footnote: 'Rootless first: install начинается в user-space и эскалируется только для daemon.'
    },
    {
      eyebrow: 'Daemon',
      title: 'Resident monitoring через neuralvd',
      description:
        'Когда нужен постоянный контроль новых бинарников, autostart paths и системных сервисов, neuralvd включается как отдельный systemd-слой.',
      bullets: [
        'Отслеживание новых ELF/AppImage, suspicious launchers и persistence vectors.',
        'Журналы и lifecycle прозрачны через systemctl и journalctl.',
        'Daemon events отправляются в тот же backend, что обслуживает GUI и shell verdicts.'
      ],
      footnote: 'Daemon не обязателен: его включают только там, где resident path реально нужен.'
    }
  ] satisfies LinuxModeCard[],
  coverageIntro:
    'Linux-версия не привязана к одному desktop stack: приоритетный путь покрывает desktop и server сценарии, а различия между дистрибутивами сведены к provenance checks и install ergonomics.',
  coverageBands: [
    {
      family: 'Ubuntu / Debian',
      emphasis: 'Primary workstation path',
      description:
        'GUI, shell installer и systemd flow подходят для обычных desktop и laptop сценариев, где важны provenance через dpkg и понятный user-space install.',
      notes: [
        'dpkg provenance и package-origin сигналы, когда пакетный менеджер доступен.',
        'Подходит для ноутбуков, VDI и рабочих станций разработчиков.'
      ]
    },
    {
      family: 'Fedora / RHEL / Alma / Rocky',
      emphasis: 'Server-friendly path',
      description:
        'Shell/TUI и daemon-first маршрут удобен на инженерных серверах и fleet-узлах, где важны rpm provenance, systemd lifecycle и предсказуемые обновления.',
      notes: [
        'Уместен для jump hosts, CI runners и production-like staging nodes.',
        'Хорошо сочетается с постоянной проверкой neuralvd и journald.'
      ]
    },
    {
      family: 'Arch / Endeavour / Manjaro',
      emphasis: 'Lean operator path',
      description:
        'Для систем, где критична скорость обновления и CLI-first эксплуатация: installer даёт быстрый bootstrap, а локальные проверки опираются на pacman provenance и ELF heuristics.',
      notes: [
        'Хороший выбор для power-user workstation и security lab окружений.',
        'CLI/TUI сценарий особенно удобен для частых обновлений и ручного триажа.'
      ]
    },
    {
      family: 'openSUSE / Tumbleweed',
      emphasis: 'systemd-centric path',
      description:
        'Сильный акцент на service visibility, journald и системных unit-файлах делает distro удобной для resident monitoring и ручной диагностики.',
      notes: [
        'Сигналы systemd units и пользовательских автозапусков хорошо ложатся в local checks.',
        'Подходит для mixed desktop/server инсталляций.'
      ]
    }
  ] satisfies LinuxCoverageBand[],
  installFlow: [
    {
      eyebrow: '01 / bootstrap',
      title: 'Поставить shell/TUI одной командой',
      description:
        'Installer тянет актуальный release lane и поднимает терминальную поверхность без тяжёлого package-specific setup.',
      command: linuxInstallCommand,
      note: 'Базовый путь остаётся rootless; привилегии нужны только для daemon flow.'
    },
    {
      eyebrow: '02 / operator',
      title: 'Сразу проверить состояние клиента',
      description:
        'После bootstrap у оператора уже есть базовый control surface для статуса, обновлений и quick operational checks.',
      command: 'neuralv status',
      secondaryCommand: 'neuralv update',
      note: 'Это самый быстрый путь для headless host и SSH-сессий.'
    },
    {
      eyebrow: '03 / daemon',
      title: 'Включить resident monitoring через systemd',
      description:
        'Если узлу нужен постоянный контроль, daemon включается отдельно и начинает жить как обычный systemd service.',
      command: 'sudo systemctl enable --now neuralvd',
      secondaryCommand: 'sudo systemctl status neuralvd --no-pager',
      note: 'Daemon остаётся opt-in, поэтому workstation и server можно держать на одном installer.'
    },
    {
      eyebrow: '04 / verify',
      title: 'Проверить журналы и operational health',
      description:
        'Перед rollout по нескольким узлам полезно убедиться, что сервис поднялся, а local/server verdict pipeline отвечает ожидаемо.',
      command: 'sudo journalctl -u neuralvd -n 40 --no-pager',
      secondaryCommand: 'neuralv status',
      note: 'Этого обычно достаточно, чтобы увидеть активен ли daemon и получает ли оператор предсказуемый state.'
    }
  ] satisfies LinuxFlowStep[],
  systemdFlow: [
    {
      title: 'User shell bootstrap',
      description:
        'Установка начинается из обычной пользовательской shell-сессии и поднимает GUI/CLI слой без обязательной системной регистрации.',
      unit: 'user space / PATH / release manifest'
    },
    {
      title: 'CLI и GUI получают общий state',
      description:
        'Обе поверхности читают одинаковые release и verification данные, поэтому operator view не расходится между workstation и headless host.',
      unit: 'shared events / shared verdict model'
    },
    {
      title: 'Привилегированный opt-in для neuralvd',
      description:
        'Только при необходимости installer добавляет systemd service и включает resident monitoring для server-like сценариев.',
      unit: 'neuralvd.service / systemctl enable --now'
    },
    {
      title: 'Диагностика остаётся linux-native',
      description:
        'Lifecycle и troubleshooting идут через привычные systemctl и journalctl, без отдельной proprietary оболочки вокруг daemon.',
      unit: 'systemctl status / journalctl -u neuralvd'
    }
  ] satisfies LinuxSystemdStep[],
  daemonHighlights: [
    'Мониторинг новых ELF/AppImage, shell launchers, executable bits, SUID и Linux capabilities.',
    'Контроль user/systemd autostart units и других persistence vectors, типичных для desktop и server Linux.',
    'Единая серверная корреляция для GUI, shell и daemon событий, чтобы triage не расходился по поверхностям.',
    'Подходит как для единичной workstation, так и для серверного контура с ручным управлением через systemctl.'
  ],
  localRail: {
    eyebrow: 'Local side',
    title: 'Что Linux-клиент видит на узле сам',
    description:
      'Локальный слой нужен для мгновенных сигналов до server verdict и для сценариев, где оператору важно понять контекст прямо на машине.',
    items: [
      'ELF, AppImage, shell launchers, .desktop files и исполняемые биты.',
      'SUID, file capabilities, suspicious permissions и новые бинарники в common download/temp paths.',
      'Provenance через dpkg, rpm, pacman, flatpak или snap, когда менеджер пакетов доступен.',
      'User/systemd autostart units, autorun paths и базовые persistence traces.'
    ]
  } satisfies LinuxRail,
  serverRail: {
    eyebrow: 'Server side',
    title: 'Что NeuralV перепроверяет удалённо',
    description:
      'Серверный слой добавляет глубокий triage и выносит тяжёлый анализ из workstation/host, но не ломает локальную скорость отклика.',
    items: [
      'Hash reputation, VT-style enrichment и статический анализ ELF/AppImage.',
      'Distro-aware heuristics и корреляция происхождения файла с observed launch path.',
      'AI post-filtering, чтобы убрать шумные false positive до user-facing verdict.',
      'Одинаковый backend path для GUI, shell/TUI и daemon событий.'
    ]
  } satisfies LinuxRail,
  validationRails: [
    {
      eyebrow: 'Workstation lane',
      title: 'GUI + on-demand local triage',
      description:
        'Для laptop и desktop-инсталляций, где нужен визуальный поток, история проверок и быстрое включение серверной перепроверки.',
      items: [
        'Скачать GUI build из release manifest.',
        'Использовать shell installer как fallback operator path.',
        'Подключать daemon только если реально нужен resident monitoring.'
      ]
    },
    {
      eyebrow: 'Server lane',
      title: 'CLI/TUI + neuralvd + journald',
      description:
        'Для headless узлов, где важнее terminal UX, reproducible install и диагностируемый resident режим без лишнего UI слоя.',
      items: [
        'Bootstrap через curl|bash без GUI-зависимостей.',
        'Включить neuralvd через systemd только на нужных серверах.',
        'Проверять operational state через neuralv status и journalctl.'
      ]
    }
  ] satisfies LinuxRail[],
  commandDecks: [
    {
      eyebrow: 'CLI',
      title: 'Ежедневные операторские команды',
      description:
        'Минимальный набор для установки, контроля состояния и обслуживания shell/TUI клиента.',
      commands: [
        {
          label: 'Install',
          value: linuxInstallCommand
        },
        {
          label: 'Status',
          value: 'neuralv status'
        },
        {
          label: 'Update',
          value: 'neuralv update'
        },
        {
          label: 'Stop / uninstall',
          value: 'neuralv stop && neuralv uninstall'
        }
      ]
    },
    {
      eyebrow: 'Daemon',
      title: 'systemd и журналирование',
      description:
        'Когда resident monitoring включён, daemon остаётся полностью linux-native и управляется обычными инструментами ОС.',
      commands: [
        {
          label: 'Enable now',
          value: 'sudo systemctl enable --now neuralvd'
        },
        {
          label: 'Status',
          value: 'sudo systemctl status neuralvd --no-pager'
        },
        {
          label: 'Logs',
          value: 'sudo journalctl -u neuralvd -f'
        },
        {
          label: 'Restart',
          value: 'sudo systemctl restart neuralvd'
        }
      ]
    },
    {
      eyebrow: 'Validation',
      title: 'Быстрая проверка перед rollout',
      description:
        'Короткий operational checklist для случаев, когда нужно убедиться, что host готов к реальной нагрузке и triage идёт по ожидаемому пути.',
      commands: [
        {
          label: 'Manifest / release state',
          value: 'neuralv status'
        },
        {
          label: 'Daemon logs snapshot',
          value: 'sudo journalctl -u neuralvd -n 20 --no-pager'
        },
        {
          label: 'Service guardrail',
          value: 'sudo systemctl is-enabled neuralvd && sudo systemctl is-active neuralvd'
        },
        {
          label: 'Operator refresh',
          value: 'neuralv update'
        }
      ]
    }
  ] satisfies LinuxCommandDeck[]
};
