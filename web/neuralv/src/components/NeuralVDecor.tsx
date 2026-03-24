type NeuralVDecorVariant = 'home' | 'android' | 'windows' | 'linux' | 'account';

type NeuralVDecorProps = {
  variant: NeuralVDecorVariant;
  className?: string;
};

const labels: Record<NeuralVDecorVariant, { title: string; note: string }> = {
  home: { title: 'NeuralV', note: 'Android / Windows / Linux' },
  android: { title: 'Android', note: 'Один APK' },
  windows: { title: 'Windows', note: 'Setup / portable / NV' },
  linux: { title: 'Linux', note: 'Установка через NV' },
  account: { title: 'Аккаунт', note: 'Почта, профиль и подтверждения' }
};

export function NeuralVDecor({ variant, className = '' }: NeuralVDecorProps) {
  const copy = labels[variant];

  return (
    <div className={`neuralv-decor-static ${className}`.trim()} aria-hidden="true">
      <div className="neuralv-decor-card neuralv-decor-card-main">
        <svg className="neuralv-decor-svg" viewBox="0 0 320 220" fill="none">
          <rect x="20" y="18" width="280" height="184" rx="30" className="neuralv-decor-frame" />
          <rect x="52" y="52" width="216" height="52" rx="20" className="neuralv-decor-block neuralv-decor-block-accent" />
          <rect x="52" y="122" width="92" height="48" rx="18" className="neuralv-decor-block" />
          <rect x="164" y="122" width="104" height="48" rx="18" className="neuralv-decor-block" />
          <path d="M112 146 H164" className="neuralv-decor-line" />
          <circle cx="112" cy="146" r="8" className="neuralv-decor-node neuralv-decor-node-accent" />
          <circle cx="164" cy="146" r="8" className="neuralv-decor-node" />
        </svg>
        <div className="neuralv-decor-copy">
          <strong>{copy.title}</strong>
          <span>{copy.note}</span>
        </div>
      </div>
    </div>
  );
}
