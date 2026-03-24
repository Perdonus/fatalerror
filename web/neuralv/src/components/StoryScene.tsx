import { ReactNode } from 'react';
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

function StoryVisual({ kind }: { kind: StoryVisualKind }) {
  switch (kind) {
    case 'route':
      return (
        <svg viewBox="0 0 360 240" className="story-visual-svg" fill="none" aria-hidden="true">
          <rect x="26" y="28" width="308" height="184" rx="28" className="story-panel-outline" />
          <path d="M58 156 C110 156 112 82 168 82 C224 82 222 172 286 172" className="story-route-line" />
          <circle cx="58" cy="156" r="14" className="story-node story-node-soft" />
          <circle cx="168" cy="82" r="14" className="story-node story-node-accent" />
          <circle cx="286" cy="172" r="14" className="story-node story-node-soft" />
          <rect x="62" y="54" width="94" height="18" rx="9" className="story-chip-fill" />
          <rect x="206" y="54" width="88" height="18" rx="9" className="story-chip-fill story-chip-fill-faint" />
        </svg>
      );
    case 'platforms':
      return (
        <svg viewBox="0 0 360 240" className="story-visual-svg" fill="none" aria-hidden="true">
          <rect x="30" y="34" width="124" height="82" rx="24" className="story-panel-outline" />
          <rect x="176" y="34" width="154" height="82" rx="24" className="story-panel-outline" />
          <rect x="84" y="138" width="190" height="74" rx="28" className="story-panel-outline story-panel-outline-accent" />
          <path d="M154 76 H176" className="story-grid-link" />
          <path d="M206 116 V138" className="story-grid-link" />
          <circle cx="154" cy="76" r="9" className="story-node story-node-soft" />
          <circle cx="176" cy="76" r="9" className="story-node story-node-soft" />
          <circle cx="206" cy="138" r="11" className="story-node story-node-accent" />
        </svg>
      );
    case 'privacy':
      return (
        <svg viewBox="0 0 360 240" className="story-visual-svg" fill="none" aria-hidden="true">
          <rect x="42" y="42" width="276" height="156" rx="34" className="story-panel-outline" />
          <path d="M180 64 L236 86 V126 C236 157 212 182 180 194 C148 182 124 157 124 126 V86 Z" className="story-shield" />
          <circle cx="180" cy="124" r="18" className="story-node story-node-accent" />
          <path d="M140 170 H220" className="story-grid-link" />
          <path d="M110 94 H124" className="story-grid-link" />
          <path d="M236 94 H250" className="story-grid-link" />
        </svg>
      );
    case 'android':
      return (
        <svg viewBox="0 0 360 240" className="story-visual-svg" fill="none" aria-hidden="true">
          <rect x="112" y="24" width="136" height="192" rx="34" className="story-panel-outline story-panel-outline-accent" />
          <rect x="138" y="54" width="84" height="8" rx="4" className="story-chip-fill" />
          <rect x="138" y="78" width="84" height="82" rx="22" className="story-panel-fill" />
          <rect x="138" y="174" width="84" height="16" rx="8" className="story-chip-fill story-chip-fill-faint" />
        </svg>
      );
    case 'windows':
      return (
        <svg viewBox="0 0 360 240" className="story-visual-svg" fill="none" aria-hidden="true">
          <rect x="32" y="40" width="296" height="168" rx="28" className="story-panel-outline" />
          <path d="M88 88 H272" className="story-grid-link" />
          <path d="M88 124 H226" className="story-grid-link" />
          <path d="M88 160 H248" className="story-grid-link" />
          <rect x="64" y="68" width="58" height="108" rx="18" className="story-panel-fill" />
          <rect x="286" y="72" width="20" height="96" rx="10" className="story-chip-fill" />
        </svg>
      );
    case 'linux':
      return (
        <svg viewBox="0 0 360 240" className="story-visual-svg" fill="none" aria-hidden="true">
          <rect x="44" y="48" width="272" height="144" rx="30" className="story-panel-outline" />
          <path d="M78 92 H280" className="story-grid-link" />
          <path d="M78 128 H218" className="story-grid-link" />
          <path d="M78 164 H246" className="story-grid-link" />
          <rect x="72" y="74" width="68" height="92" rx="18" className="story-panel-fill" />
          <circle cx="272" cy="162" r="14" className="story-node story-node-accent" />
        </svg>
      );
    case 'shield':
    default:
      return (
        <svg viewBox="0 0 360 240" className="story-visual-svg" fill="none" aria-hidden="true">
          <circle cx="180" cy="120" r="76" className="story-ring story-ring-outer" />
          <circle cx="180" cy="120" r="52" className="story-ring story-ring-inner" />
          <path d="M180 52 L236 74 V118 C236 155 214 180 180 196 C146 180 124 155 124 118 V74 Z" className="story-shield" />
          <path d="M104 120 H146 L162 94 L184 148 L202 110 H256" className="story-route-line" />
        </svg>
      );
  }
}

export function StoryScene({ title, body, kicker, accent, visual, aside, compact = false }: StorySceneProps) {
  const { ref, style } = useScrollSceneProgress<HTMLElement>();

  return (
    <section ref={ref} className={`story-scene${compact ? ' story-scene-compact' : ''}`} style={style}>
      <div className="story-scene-sticky">
        <article className="story-scene-card">
          <div className="story-scene-copy">
            {kicker ? <span className="story-scene-kicker">{kicker}</span> : null}
            <h2>{title}</h2>
            <p>{body}</p>
            {accent ? <div className="story-scene-accent">{accent}</div> : null}
            {aside ? <div className="story-scene-aside">{aside}</div> : null}
          </div>
          <div className="story-scene-visual-wrap">
            <StoryVisual kind={visual} />
          </div>
        </article>
      </div>
    </section>
  );
}
