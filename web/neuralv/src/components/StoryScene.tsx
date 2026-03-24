import { CSSProperties, ReactNode } from 'react';
import { useScrollSceneProgress } from '../hooks/useScrollSceneProgress';

type StoryVisualKind = 'shield' | 'route' | 'platforms' | 'privacy' | 'android' | 'windows' | 'linux';

type StorySceneProps = {
  title: string;
  body: string;
  kicker?: string;
  accent?: string;
  visual: StoryVisualKind;
  aside?: ReactNode;
  compact?: boolean;
};

type StoryVisualPanelConfig = {
  className: string;
  style?: CSSProperties;
  header?: string;
  value?: string;
  lines?: number;
  pills?: number;
};

type StoryVisualNodeConfig = {
  className: string;
  style: CSSProperties;
  accent?: boolean;
};

type StoryVisualTraceConfig = {
  className: string;
  style: CSSProperties;
};

type StoryVisualConfig = {
  eyebrow: string;
  title: string;
  detail: string;
  panels: StoryVisualPanelConfig[];
  nodes: StoryVisualNodeConfig[];
  traces: StoryVisualTraceConfig[];
  chips?: string[];
  coreClassName: string;
  laneClassName?: string;
};

const lineWidths = ['72%', '88%', '58%'] as const;
const pillTones = ['is-strong', 'is-soft', 'is-faint'] as const;

const visualConfigs: Record<StoryVisualKind, StoryVisualConfig> = {
  shield: {
    eyebrow: 'core',
    title: 'active shield',
    detail: 'local guard',
    coreClassName: 'story-visual-core-shield',
    laneClassName: 'story-visual-lane-shield',
    panels: [
      { className: 'story-visual-panel-shell is-main', style: { top: '12%', left: '15%', width: '48%', height: '28%' }, header: 'Core', value: 'stable', lines: 3, pills: 2 },
      { className: 'story-visual-panel-shell is-side', style: { top: '18%', right: '10%', width: '23%', height: '22%' }, header: 'Scan', value: '93%', lines: 2 },
      { className: 'story-visual-panel-shell is-base', style: { bottom: '13%', left: '18%', width: '50%', height: '18%' }, header: 'Shield', value: 'ready', pills: 3 }
    ],
    nodes: [
      { className: 'story-visual-node-shell', style: { top: '26%', left: '12%' } },
      { className: 'story-visual-node-shell', style: { top: '56%', left: '22%' } },
      { className: 'story-visual-node-shell', style: { top: '34%', right: '15%' }, accent: true }
    ],
    traces: [
      { className: 'story-visual-trace-shell is-curve', style: { top: '52%', left: '16%', width: '48%', transform: 'rotate(-10deg)' } },
      { className: 'story-visual-trace-shell is-curve is-secondary', style: { top: '40%', right: '14%', width: '24%', transform: 'rotate(38deg)' } }
    ],
    chips: ['scan net', 'local cache', 'active watch']
  },
  route: {
    eyebrow: 'route',
    title: 'signal path',
    detail: 'adaptive trace',
    coreClassName: 'story-visual-core-route',
    laneClassName: 'story-visual-lane-route',
    panels: [
      { className: 'story-visual-panel-shell is-main', style: { top: '14%', left: '12%', width: '38%', height: '24%' }, header: 'Entry', value: 'clean', lines: 2, pills: 1 },
      { className: 'story-visual-panel-shell is-main', style: { top: '18%', right: '12%', width: '32%', height: '24%' }, header: 'Review', value: 'deep', lines: 3, pills: 2 },
      { className: 'story-visual-panel-shell is-base', style: { bottom: '14%', left: '29%', width: '42%', height: '18%' }, header: 'Route', value: 'linked', pills: 3 }
    ],
    nodes: [
      { className: 'story-visual-node-shell', style: { top: '58%', left: '14%' } },
      { className: 'story-visual-node-shell', style: { top: '28%', left: '43%' }, accent: true },
      { className: 'story-visual-node-shell', style: { top: '62%', right: '12%' } }
    ],
    traces: [
      { className: 'story-visual-trace-shell is-long', style: { top: '54%', left: '18%', width: '62%', transform: 'rotate(6deg)' } },
      { className: 'story-visual-trace-shell is-long is-secondary', style: { top: '42%', left: '24%', width: '40%', transform: 'rotate(-28deg)' } }
    ],
    chips: ['input', 'analysis', 'decision']
  },
  platforms: {
    eyebrow: 'platform',
    title: 'shared logic',
    detail: 'per system shell',
    coreClassName: 'story-visual-core-platforms',
    laneClassName: 'story-visual-lane-platforms',
    panels: [
      { className: 'story-visual-panel-shell is-main', style: { top: '12%', left: '8%', width: '26%', height: '22%' }, header: 'Android', value: 'apk', lines: 2 },
      { className: 'story-visual-panel-shell is-main', style: { top: '12%', right: '8%', width: '38%', height: '22%' }, header: 'Windows', value: 'setup', lines: 3 },
      { className: 'story-visual-panel-shell is-base', style: { bottom: '12%', left: '21%', width: '58%', height: '24%' }, header: 'Linux', value: 'nv', lines: 2, pills: 2 }
    ],
    nodes: [
      { className: 'story-visual-node-shell', style: { top: '34%', left: '35%' } },
      { className: 'story-visual-node-shell', style: { top: '48%', left: 'calc(50% - 9px)' }, accent: true },
      { className: 'story-visual-node-shell', style: { top: '34%', right: '41%' } }
    ],
    traces: [
      { className: 'story-visual-trace-shell is-long', style: { top: '42%', left: '31%', width: '22%', transform: 'rotate(90deg)' } },
      { className: 'story-visual-trace-shell is-curve is-secondary', style: { top: '60%', left: '18%', width: '60%', transform: 'rotate(-4deg)' } }
    ],
    chips: ['android', 'windows', 'linux']
  },
  privacy: {
    eyebrow: 'privacy',
    title: 'quiet control',
    detail: 'signal without noise',
    coreClassName: 'story-visual-core-privacy',
    laneClassName: 'story-visual-lane-privacy',
    panels: [
      { className: 'story-visual-panel-shell is-main', style: { top: '13%', left: '14%', width: '72%', height: '18%' }, header: 'Privacy', value: 'focused', pills: 3 },
      { className: 'story-visual-panel-shell is-base', style: { bottom: '15%', left: '22%', width: '56%', height: '16%' }, header: 'Alerts', value: 'minimal', lines: 2 }
    ],
    nodes: [
      { className: 'story-visual-node-shell', style: { top: '26%', left: '18%' } },
      { className: 'story-visual-node-shell', style: { top: '26%', right: '18%' } },
      { className: 'story-visual-node-shell', style: { top: '56%', left: 'calc(50% - 9px)' }, accent: true }
    ],
    traces: [
      { className: 'story-visual-trace-shell is-curve', style: { top: '62%', left: '24%', width: '52%', transform: 'rotate(0deg)' } },
      { className: 'story-visual-trace-shell is-secondary', style: { top: '50%', left: '30%', width: '40%', transform: 'rotate(-56deg)' } }
    ],
    chips: ['private view', 'local result', 'clear action']
  },
  android: {
    eyebrow: 'android',
    title: 'single apk',
    detail: 'fast entry',
    coreClassName: 'story-visual-core-android',
    laneClassName: 'story-visual-lane-android',
    panels: [
      { className: 'story-visual-panel-shell is-side', style: { top: '16%', right: '14%', width: '24%', height: '18%' }, header: 'Build', value: 'apk', lines: 2 },
      { className: 'story-visual-panel-shell is-base', style: { bottom: '14%', left: '18%', width: '46%', height: '18%' }, header: 'Install', value: '1 tap', pills: 2 }
    ],
    nodes: [
      { className: 'story-visual-node-shell', style: { top: '24%', left: '24%' } },
      { className: 'story-visual-node-shell', style: { top: '56%', left: '18%' } },
      { className: 'story-visual-node-shell', style: { top: '60%', right: '16%' }, accent: true }
    ],
    traces: [
      { className: 'story-visual-trace-shell is-long', style: { top: '62%', left: '20%', width: '54%', transform: 'rotate(-12deg)' } },
      { className: 'story-visual-trace-shell is-secondary', style: { top: '30%', left: '42%', width: '26%', transform: 'rotate(28deg)' } }
    ],
    chips: ['mobile', 'account', 'ready']
  },
  windows: {
    eyebrow: 'windows',
    title: 'setup or portable',
    detail: 'same control',
    coreClassName: 'story-visual-core-windows',
    laneClassName: 'story-visual-lane-windows',
    panels: [
      { className: 'story-visual-panel-shell is-side', style: { top: '18%', left: '10%', width: '20%', height: '44%' }, header: 'Modes', value: '3', lines: 3 },
      { className: 'story-visual-panel-shell is-main', style: { top: '18%', right: '11%', width: '44%', height: '28%' }, header: 'Windows', value: 'deploy', lines: 3, pills: 2 },
      { className: 'story-visual-panel-shell is-base', style: { bottom: '14%', left: '33%', width: '42%', height: '16%' }, header: 'Update', value: 'nv', pills: 2 }
    ],
    nodes: [
      { className: 'story-visual-node-shell', style: { top: '24%', left: '34%' } },
      { className: 'story-visual-node-shell', style: { top: '52%', right: '14%' }, accent: true },
      { className: 'story-visual-node-shell', style: { top: '66%', left: '32%' } }
    ],
    traces: [
      { className: 'story-visual-trace-shell is-long', style: { top: '54%', left: '28%', width: '50%', transform: 'rotate(2deg)' } },
      { className: 'story-visual-trace-shell is-secondary', style: { top: '38%', left: '30%', width: '42%', transform: 'rotate(-22deg)' } }
    ],
    chips: ['setup', 'portable', 'nv']
  },
  linux: {
    eyebrow: 'linux',
    title: 'nv path',
    detail: 'clean install',
    coreClassName: 'story-visual-core-linux',
    laneClassName: 'story-visual-lane-linux',
    panels: [
      { className: 'story-visual-panel-shell is-side', style: { top: '20%', left: '12%', width: '22%', height: '38%' }, header: 'CLI', value: 'curl', lines: 3 },
      { className: 'story-visual-panel-shell is-main', style: { top: '18%', right: '11%', width: '46%', height: '26%' }, header: 'Linux', value: 'nv install', lines: 2, pills: 2 },
      { className: 'story-visual-panel-shell is-base', style: { bottom: '14%', left: '32%', width: '40%', height: '16%' }, header: 'Update', value: 'same path', pills: 2 }
    ],
    nodes: [
      { className: 'story-visual-node-shell', style: { top: '24%', right: '16%' } },
      { className: 'story-visual-node-shell', style: { top: '58%', right: '14%' }, accent: true },
      { className: 'story-visual-node-shell', style: { top: '64%', left: '26%' } }
    ],
    traces: [
      { className: 'story-visual-trace-shell is-long', style: { top: '52%', left: '24%', width: '56%', transform: 'rotate(-8deg)' } },
      { className: 'story-visual-trace-shell is-secondary', style: { top: '34%', left: '36%', width: '30%', transform: 'rotate(18deg)' } }
    ],
    chips: ['shell', 'nv', 'update']
  }
};

function StoryVisualPanel({ className, style, header, value, lines = 0, pills = 0 }: StoryVisualPanelConfig) {
  return (
    <div className={className} style={style}>
      {header ? <span className="story-visual-panel-label">{header}</span> : null}
      {value ? <strong className="story-visual-panel-value">{value}</strong> : null}
      {lines ? (
        <div className="story-visual-panel-lines">
          {Array.from({ length: lines }).map((_, index) => (
            <span key={index} style={{ width: lineWidths[index % lineWidths.length] }} />
          ))}
        </div>
      ) : null}
      {pills ? (
        <div className="story-visual-panel-pills">
          {Array.from({ length: pills }).map((_, index) => (
            <span key={index} className={pillTones[index % pillTones.length]} />
          ))}
        </div>
      ) : null}
    </div>
  );
}

function StoryVisualCore({ kind, config }: { kind: StoryVisualKind; config: StoryVisualConfig }) {
  switch (kind) {
    case 'shield':
    case 'privacy':
      return (
        <div className={`story-visual-core ${config.coreClassName}`}>
          <span className="story-visual-core-ring is-outer" />
          <span className="story-visual-core-ring is-mid" />
          <span className="story-visual-core-shield-shape" />
          <span className="story-visual-core-check" />
          <span className="story-visual-core-scan" />
        </div>
      );
    case 'platforms':
      return (
        <div className={`story-visual-core ${config.coreClassName}`}>
          <span className="story-visual-platform-card is-left" />
          <span className="story-visual-platform-card is-top" />
          <span className="story-visual-platform-card is-bottom" />
          <span className="story-visual-platform-hub" />
        </div>
      );
    case 'android':
      return (
        <div className={`story-visual-core ${config.coreClassName}`}>
          <span className="story-visual-device-shell" />
          <span className="story-visual-device-screen" />
          <span className="story-visual-device-speaker" />
          <span className="story-visual-device-home" />
          <span className="story-visual-device-glow" />
        </div>
      );
    case 'windows':
      return (
        <div className={`story-visual-core ${config.coreClassName}`}>
          <span className="story-visual-window-shell" />
          <span className="story-visual-window-panel is-nav" />
          <span className="story-visual-window-panel is-header" />
          <span className="story-visual-window-panel is-content" />
          <span className="story-visual-window-focus" />
        </div>
      );
    case 'linux':
      return (
        <div className={`story-visual-core ${config.coreClassName}`}>
          <span className="story-visual-terminal-shell" />
          <span className="story-visual-terminal-bar" />
          <span className="story-visual-terminal-line is-prompt" />
          <span className="story-visual-terminal-line is-command" />
          <span className="story-visual-terminal-line is-result" />
          <span className="story-visual-terminal-caret" />
        </div>
      );
    case 'route':
    default:
      return (
        <div className={`story-visual-core ${config.coreClassName}`}>
          <span className="story-visual-route-segment is-left" />
          <span className="story-visual-route-segment is-mid" />
          <span className="story-visual-route-segment is-right" />
          <span className="story-visual-route-pulse" />
        </div>
      );
  }
}

function StoryVisual({ kind }: { kind: StoryVisualKind }) {
  const config = visualConfigs[kind];

  return (
    <div className={`story-visual story-visual-${kind}`} aria-hidden="true">
      <div className="story-visual-stage">
        <span className="story-visual-aura story-visual-aura-primary" />
        <span className="story-visual-aura story-visual-aura-secondary" />
        <span className={`story-visual-lane ${config.laneClassName || ''}`.trim()} />
        <div className="story-visual-badge">
          <span className="story-visual-badge-kicker">{config.eyebrow}</span>
          <strong>{config.title}</strong>
          <span>{config.detail}</span>
        </div>
        {config.panels.map((panel, index) => (
          <StoryVisualPanel key={`${kind}-panel-${index}`} {...panel} />
        ))}
        {config.traces.map((trace, index) => (
          <span key={`${kind}-trace-${index}`} className={trace.className} style={trace.style} />
        ))}
        {config.nodes.map((node, index) => (
          <span
            key={`${kind}-node-${index}`}
            className={`${node.className}${node.accent ? ' is-accent' : ''}`}
            style={node.style}
          >
            <span className="story-visual-node-ring is-inner" />
            <span className="story-visual-node-ring is-outer" />
          </span>
        ))}
        <StoryVisualCore kind={kind} config={config} />
        {config.chips?.length ? (
          <div className="story-visual-chip-row">
            {config.chips.map((chip) => (
              <span key={chip} className="story-visual-chip">{chip}</span>
            ))}
          </div>
        ) : null}
      </div>
    </div>
  );
}

export function StoryScene({ title, body, kicker, accent, visual, aside, compact = false }: StorySceneProps) {
  const { ref, style } = useScrollSceneProgress<HTMLElement>();

  return (
    <section ref={ref} className={`story-scene${compact ? ' story-scene-compact' : ''}`} style={style}>
      <div className="story-scene-sticky">
        <article className={`story-scene-card story-scene-card-${visual}`} data-kind={visual}>
          <div className="story-scene-copy">
            {kicker ? <span className="story-scene-kicker">{kicker}</span> : null}
            <h2>{title}</h2>
            <p>{body}</p>
            {accent ? <div className="story-scene-accent">{accent}</div> : null}
            {aside ? <div className="story-scene-aside">{aside}</div> : null}
          </div>
          <div className={`story-scene-visual-wrap story-scene-visual-wrap-${visual}`}>
            <span className="story-visual-grid" aria-hidden="true" />
            <span className="story-visual-glow" aria-hidden="true" />
            <span className="story-visual-beam" aria-hidden="true" />
            <span className="story-visual-frame" aria-hidden="true" />
            <span className="story-visual-frame story-visual-frame-inner" aria-hidden="true" />
            <span className="story-visual-contour story-visual-contour-a" aria-hidden="true" />
            <span className="story-visual-contour story-visual-contour-b" aria-hidden="true" />
            <span className="story-visual-orbit story-visual-orbit-a" aria-hidden="true" />
            <span className="story-visual-orbit story-visual-orbit-b" aria-hidden="true" />
            <span className="story-visual-tracker" aria-hidden="true" />
            <span className="story-visual-scanline" aria-hidden="true" />
            <StoryVisual kind={visual} />
          </div>
        </article>
      </div>
    </section>
  );
}
