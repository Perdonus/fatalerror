type NeuralVDecorVariant = 'home' | 'android' | 'windows' | 'linux' | 'account';

type NeuralVDecorProps = {
  variant: NeuralVDecorVariant;
  className?: string;
};

type DecorCopy = {
  title: string;
  value: string;
  note: string;
  side: string;
  footer: string;
  mode: string;
};

const decorCopy: Record<NeuralVDecorVariant, DecorCopy> = {
  home: {
    title: 'Проверка',
    value: 'Многоэтапно',
    note: 'Локально и глубже',
    side: 'Android / Windows / Linux',
    footer: 'Один продукт, разные сценарии под систему',
    mode: 'Сигналы'
  },
  android: {
    title: 'Android',
    value: 'Один APK',
    note: 'Телефон и планшет',
    side: 'Общий аккаунт',
    footer: 'Быстрая установка и история в том же аккаунте',
    mode: 'Мобильный клиент'
  },
  windows: {
    title: 'Windows',
    value: 'Нативно',
    note: 'Setup / portable / NV',
    side: 'GUI + CLI',
    footer: 'Launcher, updater и bundle под один install root',
    mode: 'Desktop bundle'
  },
  linux: {
    title: 'Linux',
    value: 'Через NV',
    note: 'Один поддерживаемый путь',
    side: 'GUI + CLI',
    footer: 'Ставится короче и понятнее, чем витрина пакетов',
    mode: 'Unified install'
  },
  account: {
    title: 'Аккаунт',
    value: 'Через письмо',
    note: 'Вход, регистрация и профиль',
    side: 'Тот же NeuralV',
    footer: 'Подтверждение и смена данных живут на сайте, а не в случайных временных формах',
    mode: 'Web auth'
  }
};

export function NeuralVDecor({ variant, className = '' }: NeuralVDecorProps) {
  const copy = decorCopy[variant];

  return (
    <div className={`decor-scene decor-scene-${variant} ${className}`.trim()} aria-hidden="true">
      <article className="decor-panel decor-panel-main">
        <div className="decor-panel-header">
          <span>{copy.title}</span>
          <small>{copy.mode}</small>
        </div>

        <div className="decor-orbit-wrap">
          <svg className="decor-svg decor-svg-rings" viewBox="0 0 260 260" fill="none">
            <circle className="decor-ring decor-ring-a" cx="130" cy="130" r="92" />
            <circle className="decor-ring decor-ring-b" cx="130" cy="130" r="68" />
            <circle className="decor-ring decor-ring-c" cx="130" cy="130" r="44" />
            <path className="decor-shield" d="M130 56 L186 78 V128 C186 169 162 196 130 212 C98 196 74 169 74 128 V78 Z" />
            <path className="decor-pulse" d="M54 136 H92 L108 112 L126 156 L144 122 H206" />
            <circle className="decor-dot decor-dot-a" cx="130" cy="38" r="6" />
            <circle className="decor-dot decor-dot-b" cx="215" cy="130" r="5" />
            <circle className="decor-dot decor-dot-c" cx="130" cy="222" r="5" />
            <circle className="decor-dot decor-dot-d" cx="45" cy="130" r="4" />
          </svg>
        </div>

        <div className="decor-copy">
          <span>{copy.note}</span>
          <strong>{copy.value}</strong>
          <small>{copy.footer}</small>
        </div>
      </article>

      <div className="decor-side-grid">
        <article className="decor-panel decor-panel-compact">
          <div className="decor-panel-header decor-panel-header-tight">
            <span>Маршрут</span>
            <small>{copy.side}</small>
          </div>
          <svg className="decor-svg decor-svg-bars" viewBox="0 0 220 110" fill="none">
            <rect className="decor-bar decor-bar-a" x="22" y="42" width="18" height="42" rx="9" />
            <rect className="decor-bar decor-bar-b" x="58" y="24" width="18" height="60" rx="9" />
            <rect className="decor-bar decor-bar-c" x="94" y="50" width="18" height="34" rx="9" />
            <rect className="decor-bar decor-bar-d" x="130" y="16" width="18" height="68" rx="9" />
            <rect className="decor-bar decor-bar-e" x="166" y="34" width="18" height="50" rx="9" />
            <path className="decor-track decor-track-bars" d="M22 84 C50 74 64 48 94 50 C122 52 132 22 166 34" />
          </svg>
        </article>

        <article className="decor-panel decor-panel-radar">
          <div className="decor-panel-header decor-panel-header-tight">
            <span>Контур</span>
            <small>{copy.mode}</small>
          </div>
          <svg className="decor-svg decor-svg-radar" viewBox="0 0 220 110" fill="none">
            <path className="decor-radar-arc" d="M18 92 C46 46 90 20 132 18 C168 16 196 24 204 28" />
            <path className="decor-radar-arc decor-radar-arc-soft" d="M30 92 C54 56 94 34 132 32 C164 30 186 34 194 38" />
            <circle className="decor-radar-node decor-radar-node-a" cx="76" cy="54" r="5" />
            <circle className="decor-radar-node decor-radar-node-b" cx="132" cy="32" r="6" />
            <circle className="decor-radar-node decor-radar-node-c" cx="182" cy="40" r="5" />
            <path className="decor-radar-scan" d="M110 92 L132 32" />
          </svg>
        </article>
      </div>

      <article className="decor-panel decor-panel-wide">
        <div className="decor-panel-header decor-panel-header-tight">
          <span>Связи</span>
          <small>{copy.title}</small>
        </div>
        <svg className="decor-svg decor-svg-grid" viewBox="0 0 320 132" fill="none">
          <path className="decor-grid-line" d="M20 24 H300" />
          <path className="decor-grid-line" d="M20 66 H300" />
          <path className="decor-grid-line" d="M20 108 H300" />
          <path className="decor-grid-line" d="M68 12 V118" />
          <path className="decor-grid-line" d="M160 12 V118" />
          <path className="decor-grid-line" d="M252 12 V118" />
          <circle className="decor-node decor-node-a" cx="68" cy="24" r="7" />
          <circle className="decor-node decor-node-b" cx="160" cy="66" r="7" />
          <circle className="decor-node decor-node-c" cx="252" cy="108" r="7" />
          <circle className="decor-node decor-node-d" cx="252" cy="24" r="5" />
          <path className="decor-track" d="M68 24 C102 26 126 42 160 66 C192 88 214 102 252 108" />
          <path className="decor-track decor-track-alt" d="M68 66 C102 60 120 40 160 34 C198 28 220 24 252 24" />
        </svg>
      </article>
    </div>
  );
}
