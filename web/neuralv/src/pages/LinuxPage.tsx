import { ManifestBanner } from '../components/ManifestBanner';
import { linuxInstallCommand, linuxPageContent } from '../content/linux';
import { useReleaseManifest } from '../hooks/useReleaseManifest';
import { getArtifact } from '../lib/manifest';
import type { ReleaseArtifact } from '../lib/manifest';

type ActionButtonProps = {
  label: string;
  href?: string;
  kind?: 'filled' | 'tonal' | 'outlined';
  disabled?: boolean;
  external?: boolean;
};

const linuxPageStyles = `
  .linux-page {
    position: relative;
  }

  .linux-page section[id] {
    scroll-margin-top: 120px;
  }

  .linux-page .surface-card {
    border-color: rgba(63, 87, 139, 0.14);
  }

  .linux-hero {
    position: relative;
    overflow: hidden;
    display: grid;
    grid-template-columns: minmax(0, 1.1fr) minmax(340px, 0.9fr);
    gap: 24px;
    padding: 34px;
    background:
      radial-gradient(circle at 12% 18%, rgba(255, 207, 114, 0.24), transparent 26%),
      radial-gradient(circle at 82% 18%, rgba(90, 195, 176, 0.22), transparent 24%),
      linear-gradient(155deg, rgba(255, 250, 241, 0.96), rgba(244, 248, 255, 0.88));
  }

  .linux-hero::before {
    content: '';
    position: absolute;
    inset: 18px auto auto 18px;
    width: 180px;
    height: 180px;
    border-radius: 42px;
    background: linear-gradient(180deg, rgba(255, 221, 167, 0.34), rgba(255, 255, 255, 0));
    transform: rotate(-10deg);
    pointer-events: none;
  }

  .linux-hero::after {
    background: linear-gradient(135deg, rgba(255, 255, 255, 0.22), transparent 62%);
  }

  .linux-hero-copy,
  .linux-hero-stage {
    position: relative;
    z-index: 1;
  }

  .linux-hero-copy {
    display: grid;
    gap: 22px;
    align-content: start;
  }

  .linux-kicker,
  .linux-section-kicker,
  .linux-card-kicker,
  .linux-artifact-eyebrow,
  .linux-flow-eyebrow,
  .linux-command-label,
  .linux-systemd-unit,
  .linux-band-emphasis {
    text-transform: uppercase;
    letter-spacing: 0.16em;
    font-size: 0.72rem;
    font-weight: 700;
  }

  .linux-kicker,
  .linux-section-kicker,
  .linux-card-kicker,
  .linux-artifact-eyebrow,
  .linux-flow-eyebrow {
    color: #5f6a82;
  }

  .linux-hero h2,
  .linux-section-head h3,
  .linux-intro-card h3,
  .linux-flow-card h3,
  .linux-systemd-card h3,
  .linux-daemon-card h3,
  .linux-rail-card h4,
  .linux-lane-card h4,
  .linux-mode-card h4,
  .linux-band-card h4,
  .linux-artifact-card h4,
  .linux-command-card h4 {
    margin: 0;
    font-family: 'Space Grotesk', 'Google Sans', 'Segoe UI', sans-serif;
    letter-spacing: -0.05em;
  }

  .linux-hero h2 {
    max-width: 11ch;
    font-size: clamp(2.8rem, 6vw, 5.2rem);
    line-height: 0.9;
  }

  .linux-summary,
  .linux-audience,
  .linux-section-head p,
  .linux-mode-card p,
  .linux-band-card p,
  .linux-intro-card p,
  .linux-flow-card p,
  .linux-systemd-card p,
  .linux-daemon-card p,
  .linux-rail-card p,
  .linux-lane-card p,
  .linux-artifact-card p,
  .linux-command-card p {
    margin: 0;
    color: #56617a;
    line-height: 1.68;
  }

  .linux-audience {
    max-width: 70ch;
  }

  .linux-chip-row,
  .linux-hero-actions,
  .linux-artifact-actions {
    display: flex;
    flex-wrap: wrap;
    gap: 12px;
  }

  .linux-chip {
    padding: 10px 14px;
    border-radius: 999px;
    border: 1px solid rgba(59, 92, 156, 0.14);
    background: rgba(255, 255, 255, 0.74);
    box-shadow: 0 8px 18px rgba(40, 64, 116, 0.08);
    font-size: 0.92rem;
    color: #31405d;
  }

  .linux-metric-grid {
    display: grid;
    grid-template-columns: repeat(2, minmax(0, 1fr));
    gap: 14px;
  }

  .linux-metric-card {
    padding: 18px 18px 20px;
    border-radius: 28px 24px 34px 22px;
    border: 1px solid rgba(59, 92, 156, 0.12);
    background: rgba(255, 255, 255, 0.72);
    box-shadow: 0 14px 30px rgba(44, 65, 112, 0.08);
  }

  .linux-metric-card:nth-child(3n + 1) {
    background: linear-gradient(160deg, rgba(255, 247, 228, 0.92), rgba(255, 255, 255, 0.78));
  }

  .linux-metric-card:nth-child(3n + 2) {
    background: linear-gradient(160deg, rgba(231, 245, 255, 0.92), rgba(255, 255, 255, 0.78));
  }

  .linux-metric-card:nth-child(3n + 3) {
    background: linear-gradient(160deg, rgba(227, 250, 244, 0.92), rgba(255, 255, 255, 0.78));
  }

  .linux-metric-label {
    display: block;
    margin-bottom: 8px;
    color: #66708a;
    font-size: 0.76rem;
    text-transform: uppercase;
    letter-spacing: 0.16em;
  }

  .linux-metric-value {
    display: block;
    margin-bottom: 8px;
    color: #17223b;
    font-size: 1.38rem;
    font-weight: 700;
  }

  .linux-metric-detail {
    color: #56617a;
    font-size: 0.94rem;
    line-height: 1.5;
  }

  .linux-hero-stage {
    min-height: 100%;
    display: grid;
    align-content: center;
    padding: 8px 0;
  }

  .linux-stage-shell {
    position: relative;
    display: grid;
    gap: 16px;
    padding: 26px;
    border-radius: 36px;
    background:
      radial-gradient(circle at 18% 18%, rgba(120, 195, 255, 0.16), transparent 26%),
      radial-gradient(circle at 82% 22%, rgba(255, 193, 94, 0.16), transparent 22%),
      linear-gradient(180deg, rgba(15, 24, 47, 0.98), rgba(30, 45, 82, 0.92));
    border: 1px solid rgba(135, 161, 233, 0.16);
    box-shadow: 0 28px 60px rgba(17, 24, 46, 0.28);
    color: #eff5ff;
  }

  .linux-stage-shell::before,
  .linux-stage-shell::after {
    content: '';
    position: absolute;
    border-radius: 999px;
    pointer-events: none;
  }

  .linux-stage-shell::before {
    inset: 24px auto auto -18px;
    width: 94px;
    height: 94px;
    background: rgba(84, 170, 255, 0.16);
    animation: linuxFloat 10s ease-in-out infinite;
  }

  .linux-stage-shell::after {
    inset: auto -10px 18px auto;
    width: 112px;
    height: 112px;
    background: rgba(75, 214, 177, 0.12);
    animation: linuxFloat 12s ease-in-out infinite reverse;
  }

  .linux-terminal {
    position: relative;
    overflow: hidden;
    padding: 18px;
    border-radius: 26px;
    background: rgba(8, 13, 28, 0.72);
    border: 1px solid rgba(137, 161, 233, 0.14);
  }

  .linux-terminal::after {
    content: '';
    position: absolute;
    inset: 0;
    background: linear-gradient(180deg, transparent 0%, rgba(255, 255, 255, 0.04) 48%, transparent 100%);
    transform: translateY(-110%);
    animation: linuxSweep 8s linear infinite;
    pointer-events: none;
  }

  .linux-terminal-top {
    display: flex;
    justify-content: space-between;
    gap: 16px;
    align-items: center;
    margin-bottom: 12px;
    color: rgba(219, 230, 255, 0.78);
    font-size: 0.8rem;
    letter-spacing: 0.12em;
    text-transform: uppercase;
  }

  .linux-terminal-command,
  .linux-command-stack code,
  .linux-command-card code,
  .linux-artifact-command {
    display: block;
    font-family: 'JetBrains Mono', 'SFMono-Regular', monospace;
    font-size: 0.92rem;
    line-height: 1.6;
    white-space: pre-wrap;
    word-break: break-word;
  }

  .linux-terminal-command,
  .linux-artifact-command {
    padding: 14px 16px;
    border-radius: 18px;
    background: rgba(244, 248, 255, 0.08);
    color: #f7fbff;
  }

  .linux-stage-rails {
    display: grid;
    gap: 12px;
  }

  .linux-stage-rail {
    display: grid;
    grid-template-columns: auto 1fr;
    gap: 12px;
    align-items: start;
    padding: 14px 16px;
    border-radius: 20px;
    background: rgba(255, 255, 255, 0.06);
    border: 1px solid rgba(137, 161, 233, 0.12);
  }

  .linux-stage-index {
    width: 30px;
    height: 30px;
    border-radius: 12px;
    display: grid;
    place-items: center;
    background: linear-gradient(180deg, rgba(120, 171, 255, 0.94), rgba(44, 98, 199, 0.94));
    box-shadow: inset 0 1px 0 rgba(255, 255, 255, 0.24);
    color: #fdfcff;
    font-size: 0.82rem;
    font-weight: 700;
  }

  .linux-stage-rail strong,
  .linux-flow-step h4,
  .linux-systemd-step h4,
  .linux-artifact-card h4,
  .linux-lane-card h4,
  .linux-mode-card h4,
  .linux-band-card h4,
  .linux-command-card h4,
  .linux-rail-card h4 {
    display: block;
    font-size: 1.28rem;
    line-height: 1.05;
  }

  .linux-stage-rail span {
    display: block;
    margin-top: 6px;
    color: rgba(228, 236, 255, 0.76);
    line-height: 1.5;
  }

  .linux-stage-note {
    color: rgba(229, 236, 255, 0.74);
    font-size: 0.94rem;
    line-height: 1.6;
  }

  .linux-section-shell,
  .linux-verify-shell,
  .linux-command-shell {
    display: grid;
    gap: 20px;
  }

  .linux-section-head {
    display: grid;
    gap: 10px;
    max-width: 72ch;
  }

  .linux-section-head h3 {
    font-size: clamp(2rem, 4vw, 3.2rem);
    line-height: 0.95;
  }

  .linux-mode-grid,
  .linux-band-grid,
  .linux-verify-grid,
  .linux-lane-grid,
  .linux-command-grid {
    display: grid;
    gap: 20px;
  }

  .linux-mode-grid {
    grid-template-columns: repeat(3, minmax(0, 1fr));
  }

  .linux-mode-card,
  .linux-band-card,
  .linux-intro-card,
  .linux-flow-card,
  .linux-systemd-card,
  .linux-daemon-card,
  .linux-rail-card,
  .linux-lane-card,
  .linux-artifact-card,
  .linux-command-card {
    padding: 28px;
    border-radius: 30px;
  }

  .linux-mode-card {
    display: grid;
    gap: 16px;
    align-content: start;
    border-radius: 32px 22px 36px 24px;
    background: linear-gradient(170deg, rgba(255, 252, 244, 0.96), rgba(255, 255, 255, 0.78));
  }

  .linux-mode-card.is-shell {
    background: linear-gradient(170deg, rgba(235, 244, 255, 0.96), rgba(255, 255, 255, 0.78));
  }

  .linux-mode-card.is-daemon {
    background: linear-gradient(170deg, rgba(231, 250, 245, 0.96), rgba(255, 255, 255, 0.78));
  }

  .linux-bullet-list,
  .linux-note-list,
  .linux-highlight-list,
  .linux-rail-list,
  .linux-mini-list {
    list-style: none;
    margin: 0;
    padding: 0;
    display: grid;
    gap: 12px;
  }

  .linux-bullet-list li,
  .linux-rail-list li {
    display: grid;
    grid-template-columns: 14px 1fr;
    gap: 10px;
    align-items: start;
    color: #4c5771;
    line-height: 1.56;
  }

  .linux-bullet-list li::before,
  .linux-rail-list li::before {
    content: '';
    width: 10px;
    height: 10px;
    margin-top: 7px;
    border-radius: 999px;
    background: linear-gradient(180deg, #f4a44d, #e47634);
    box-shadow: 0 0 0 5px rgba(244, 164, 77, 0.12);
  }

  .linux-footnote {
    padding-top: 14px;
    border-top: 1px solid rgba(64, 89, 143, 0.08);
    color: #5d6881;
    font-size: 0.94rem;
  }

  .linux-coverage-layout,
  .linux-flow-layout,
  .linux-systemd-layout {
    display: grid;
    gap: 20px;
    align-items: start;
  }

  .linux-coverage-layout {
    grid-template-columns: minmax(0, 0.92fr) minmax(0, 1.08fr);
  }

  .linux-band-grid {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }

  .linux-intro-card {
    background: linear-gradient(160deg, rgba(255, 251, 240, 0.98), rgba(255, 255, 255, 0.82));
  }

  .linux-intro-card h3,
  .linux-flow-card h3,
  .linux-systemd-card h3,
  .linux-daemon-card h3 {
    font-size: clamp(1.8rem, 3vw, 2.5rem);
    line-height: 0.95;
  }

  .linux-band-card {
    display: grid;
    gap: 14px;
    background: rgba(255, 255, 255, 0.8);
    border: 1px solid rgba(59, 92, 156, 0.12);
  }

  .linux-band-card:nth-child(4n + 1) {
    background: linear-gradient(160deg, rgba(255, 246, 224, 0.96), rgba(255, 255, 255, 0.82));
  }

  .linux-band-card:nth-child(4n + 2) {
    background: linear-gradient(160deg, rgba(235, 246, 255, 0.96), rgba(255, 255, 255, 0.82));
  }

  .linux-band-card:nth-child(4n + 3) {
    background: linear-gradient(160deg, rgba(235, 250, 247, 0.96), rgba(255, 255, 255, 0.82));
  }

  .linux-band-card:nth-child(4n) {
    background: linear-gradient(160deg, rgba(247, 241, 255, 0.96), rgba(255, 255, 255, 0.82));
  }

  .linux-band-emphasis {
    color: #36508e;
  }

  .linux-note-list li {
    color: #55617a;
    line-height: 1.56;
  }

  .linux-note-list li::before {
    content: '/';
    margin-right: 8px;
    color: #d37431;
    font-weight: 700;
  }

  .linux-flow-layout {
    grid-template-columns: minmax(0, 1.1fr) minmax(320px, 0.9fr);
  }

  .linux-flow-card {
    background: linear-gradient(160deg, rgba(244, 248, 255, 0.96), rgba(255, 255, 255, 0.84));
  }

  .linux-flow-list,
  .linux-systemd-list,
  .linux-command-list,
  .linux-artifact-stack {
    display: grid;
    gap: 18px;
    margin-top: 22px;
  }

  .linux-flow-step,
  .linux-systemd-step,
  .linux-command-row {
    position: relative;
    padding: 20px 20px 20px 24px;
    border-radius: 24px;
    border: 1px solid rgba(59, 92, 156, 0.12);
    background: rgba(255, 255, 255, 0.76);
  }

  .linux-flow-step::before,
  .linux-systemd-step::before {
    content: '';
    position: absolute;
    left: 0;
    top: 22px;
    bottom: 22px;
    width: 4px;
    border-radius: 999px;
    background: linear-gradient(180deg, #efaa48, #4ca9cb 62%, #28b67c);
  }

  .linux-flow-step-head {
    display: grid;
    gap: 8px;
  }

  .linux-flow-eyebrow {
    display: inline-flex;
    align-items: center;
    width: fit-content;
    padding: 6px 10px;
    border-radius: 999px;
    background: rgba(54, 80, 142, 0.08);
  }

  .linux-command-stack {
    display: grid;
    gap: 10px;
    margin-top: 14px;
  }

  .linux-command-stack code {
    padding: 12px 14px;
    border-radius: 18px;
    background: #0f1830;
    color: #eff5ff;
  }

  .linux-flow-note {
    margin-top: 12px;
    color: #64708a;
    font-size: 0.94rem;
  }

  .linux-artifact-stack {
    margin-top: 0;
  }

  .linux-artifact-card {
    display: grid;
    gap: 16px;
    background: linear-gradient(160deg, rgba(255, 250, 240, 0.98), rgba(255, 255, 255, 0.84));
  }

  .linux-artifact-card.is-shell {
    background: linear-gradient(160deg, rgba(235, 246, 255, 0.98), rgba(255, 255, 255, 0.84));
  }

  .linux-artifact-card.is-daemon {
    background: linear-gradient(160deg, rgba(235, 250, 245, 0.98), rgba(255, 255, 255, 0.84));
  }

  .linux-artifact-top {
    display: flex;
    justify-content: space-between;
    gap: 18px;
    align-items: start;
  }

  .linux-artifact-version {
    color: #18315d;
    font-family: 'Space Grotesk', 'Google Sans', 'Segoe UI', sans-serif;
    font-size: 1.3rem;
    font-weight: 700;
    letter-spacing: -0.04em;
  }

  .linux-artifact-command {
    background: rgba(15, 24, 48, 0.94);
  }

  .linux-mini-list li {
    color: #56617a;
    line-height: 1.54;
  }

  .linux-systemd-layout {
    grid-template-columns: minmax(0, 1fr) minmax(320px, 0.92fr);
  }

  .linux-systemd-card {
    background: linear-gradient(160deg, rgba(255, 251, 241, 0.98), rgba(255, 255, 255, 0.84));
  }

  .linux-systemd-step {
    padding-left: 24px;
  }

  .linux-systemd-unit {
    display: inline-flex;
    margin-bottom: 10px;
    padding: 6px 10px;
    border-radius: 999px;
    background: rgba(54, 80, 142, 0.08);
    color: #36508e;
  }

  .linux-daemon-card {
    background: linear-gradient(160deg, rgba(232, 250, 245, 0.98), rgba(255, 255, 255, 0.84));
  }

  .linux-highlight-list li {
    padding-bottom: 14px;
    border-bottom: 1px solid rgba(59, 92, 156, 0.1);
    color: #536079;
    line-height: 1.62;
  }

  .linux-highlight-list li:last-child {
    padding-bottom: 0;
    border-bottom: 0;
  }

  .linux-verify-grid,
  .linux-lane-grid {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }

  .linux-rail-card {
    display: grid;
    gap: 14px;
    background: linear-gradient(160deg, rgba(255, 250, 241, 0.98), rgba(255, 255, 255, 0.84));
  }

  .linux-rail-card.is-server {
    background: linear-gradient(160deg, rgba(235, 246, 255, 0.98), rgba(255, 255, 255, 0.84));
  }

  .linux-lane-card {
    display: grid;
    gap: 14px;
    background: rgba(255, 255, 255, 0.8);
  }

  .linux-command-grid {
    grid-template-columns: repeat(3, minmax(0, 1fr));
  }

  .linux-command-card {
    display: grid;
    gap: 12px;
    background:
      radial-gradient(circle at top right, rgba(130, 177, 255, 0.14), transparent 26%),
      linear-gradient(180deg, rgba(12, 19, 40, 0.98), rgba(28, 43, 80, 0.94));
    border: 1px solid rgba(136, 158, 224, 0.16);
    box-shadow: 0 24px 56px rgba(18, 27, 52, 0.28);
  }

  .linux-command-card .linux-card-kicker,
  .linux-command-label {
    color: rgba(221, 232, 255, 0.78);
  }

  .linux-command-card p,
  .linux-command-card h4,
  .linux-command-card code {
    color: #eff5ff;
  }

  .linux-command-card p {
    color: rgba(226, 235, 255, 0.76);
  }

  .linux-command-row {
    padding: 14px;
    background: rgba(255, 255, 255, 0.05);
    border-color: rgba(136, 158, 224, 0.12);
  }

  .linux-command-row code {
    font-family: 'JetBrains Mono', 'SFMono-Regular', monospace;
    font-size: 0.9rem;
    line-height: 1.6;
    white-space: pre-wrap;
    word-break: break-word;
  }

  .linux-animate {
    animation: linuxFadeUp 760ms cubic-bezier(0.2, 0.8, 0.2, 1) both;
  }

  .linux-hoverable {
    transition: transform 220ms ease, box-shadow 220ms ease, border-color 220ms ease;
  }

  .linux-hoverable:hover {
    transform: translateY(-4px);
    box-shadow: 0 24px 56px rgba(37, 58, 104, 0.14);
    border-color: rgba(54, 92, 183, 0.24);
  }

  @keyframes linuxFadeUp {
    from {
      opacity: 0;
      transform: translate3d(0, 16px, 0);
    }
    to {
      opacity: 1;
      transform: translate3d(0, 0, 0);
    }
  }

  @keyframes linuxFloat {
    0%,
    100% {
      transform: translate3d(0, 0, 0) scale(1);
    }
    50% {
      transform: translate3d(10px, -16px, 0) scale(1.04);
    }
  }

  @keyframes linuxSweep {
    from {
      transform: translateY(-115%);
    }
    to {
      transform: translateY(115%);
    }
  }

  @media (max-width: 1100px) {
    .linux-hero,
    .linux-coverage-layout,
    .linux-flow-layout,
    .linux-systemd-layout,
    .linux-mode-grid,
    .linux-command-grid {
      grid-template-columns: 1fr;
    }

    .linux-band-grid,
    .linux-verify-grid,
    .linux-lane-grid {
      grid-template-columns: repeat(2, minmax(0, 1fr));
    }
  }

  @media (max-width: 780px) {
    .linux-hero,
    .linux-mode-card,
    .linux-band-card,
    .linux-intro-card,
    .linux-flow-card,
    .linux-systemd-card,
    .linux-daemon-card,
    .linux-rail-card,
    .linux-lane-card,
    .linux-artifact-card,
    .linux-command-card {
      padding: 22px;
      border-radius: 26px;
    }

    .linux-metric-grid,
    .linux-band-grid,
    .linux-verify-grid,
    .linux-lane-grid {
      grid-template-columns: 1fr;
    }

    .linux-hero h2,
    .linux-section-head h3,
    .linux-intro-card h3,
    .linux-flow-card h3,
    .linux-systemd-card h3,
    .linux-daemon-card h3 {
      max-width: none;
      font-size: clamp(2rem, 9vw, 3.4rem);
    }
  }

  @media (prefers-reduced-motion: reduce) {
    .linux-animate,
    .linux-stage-shell::before,
    .linux-stage-shell::after,
    .linux-terminal::after,
    .linux-hoverable {
      animation: none !important;
      transition: none !important;
      transform: none !important;
    }
  }
`;

function formatGeneratedAt(value?: string | number) {
  if (!value) {
    return 'manifest pending';
  }

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return String(value);
  }

  return new Intl.DateTimeFormat('ru-RU', {
    day: '2-digit',
    month: 'short',
    hour: '2-digit',
    minute: '2-digit'
  }).format(date);
}

function shortHash(hash?: string) {
  if (!hash) {
    return 'pending';
  }

  if (hash.length <= 22) {
    return hash;
  }

  return `${hash.slice(0, 12)}...${hash.slice(-8)}`;
}

function ActionButton({ label, href, kind = 'outlined', disabled = false, external = false }: ActionButtonProps) {
  const button =
    kind === 'filled' ? (
      <md-filled-button disabled={disabled}>{label}</md-filled-button>
    ) : kind === 'tonal' ? (
      <md-filled-tonal-button disabled={disabled}>{label}</md-filled-tonal-button>
    ) : (
      <md-outlined-button disabled={disabled}>{label}</md-outlined-button>
    );

  if (disabled || !href) {
    return button;
  }

  return (
    <a href={href} target={external ? '_blank' : undefined} rel={external ? 'noreferrer' : undefined}>
      {button}
    </a>
  );
}

function ArtifactMeta({ artifact, fallbackLabel }: { artifact?: ReleaseArtifact; fallbackLabel: string }) {
  return (
    <ul className="linux-mini-list">
      <li>{artifact?.fileName ? `Artifact: ${artifact.fileName}` : fallbackLabel}</li>
      <li>{`SHA256: ${shortHash(artifact?.sha256)}`}</li>
      {artifact?.notes?.slice(0, 2).map((note) => (
        <li key={note}>{note}</li>
      ))}
    </ul>
  );
}

export function LinuxPage() {
  const manifestState = useReleaseManifest();
  const guiArtifact = getArtifact(manifestState.manifest, 'linux');
  const shellArtifact = getArtifact(manifestState.manifest, 'shell');
  const installCommand = shellArtifact?.installCommand ?? linuxInstallCommand;
  const releaseLane = (manifestState.manifest.releaseChannel ?? 'stable').toUpperCase();
  const releaseDetail =
    manifestState.source === 'fallback'
      ? 'Fallback manifest / pending backend release'
      : `Manifest: ${formatGeneratedAt(manifestState.manifest.generatedAt)}`;
  const heroMetrics = [
    ...linuxPageContent.metrics,
    {
      label: 'Release lane',
      value: releaseLane,
      detail: releaseDetail
    }
  ];

  return (
    <>
      <style>{linuxPageStyles}</style>
      <div className="stack-xl linux-page">
        <ManifestBanner {...manifestState} />

        <section className="surface-card linux-hero" id="linux-top">
          <div className="linux-hero-copy">
            <div className="linux-kicker">{linuxPageContent.kicker}</div>
            <h2>{linuxPageContent.title}</h2>
            <p className="linux-summary">{linuxPageContent.summary}</p>
            <p className="linux-audience">{linuxPageContent.audience}</p>

            <div className="linux-chip-row">
              {linuxPageContent.heroChips.map((chip, index) => (
                <span
                  key={chip}
                  className="linux-chip linux-animate"
                  style={{ animationDelay: `${index * 70}ms` }}
                >
                  {chip}
                </span>
              ))}
            </div>

            <div className="linux-hero-actions">
              <ActionButton
                label="Скачать Linux GUI"
                href={guiArtifact?.downloadUrl}
                disabled={!guiArtifact?.downloadUrl}
                kind="filled"
                external
              />
              <ActionButton label="Install flow" href="#linux-install" kind="tonal" />
              <ActionButton label="Daemon + systemd" href="#linux-daemon" kind="outlined" />
            </div>

            <div className="linux-metric-grid">
              {heroMetrics.map((metric, index) => (
                <article
                  key={metric.label}
                  className="linux-metric-card linux-animate linux-hoverable"
                  style={{ animationDelay: `${120 + index * 90}ms` }}
                >
                  <span className="linux-metric-label">{metric.label}</span>
                  <span className="linux-metric-value">{metric.value}</span>
                  <span className="linux-metric-detail">{metric.detail}</span>
                </article>
              ))}
            </div>
          </div>

          <div className="linux-hero-stage linux-animate" style={{ animationDelay: '140ms' }}>
            <div className="linux-stage-shell">
              <div className="linux-terminal">
                <div className="linux-terminal-top">
                  <span>rootless bootstrap</span>
                  <span>{shellArtifact?.version ?? guiArtifact?.version ?? 'pending'}</span>
                </div>
                <code className="linux-terminal-command">{installCommand}</code>
              </div>

              <div className="linux-stage-rails">
                <div className="linux-stage-rail">
                  <div className="linux-stage-index">01</div>
                  <div>
                    <strong>GUI cockpit</strong>
                    <span>Visual release state, checks history and the same server verdicts as shell.</span>
                  </div>
                </div>
                <div className="linux-stage-rail">
                  <div className="linux-stage-index">02</div>
                  <div>
                    <strong>Shell/TUI ops</strong>
                    <span>SSH-friendly control surface for install, status, update and rollout.</span>
                  </div>
                </div>
                <div className="linux-stage-rail">
                  <div className="linux-stage-index">03</div>
                  <div>
                    <strong>neuralvd resident path</strong>
                    <span>systemd lifecycle, journald diagnostics and daemon events in the shared backend lane.</span>
                  </div>
                </div>
              </div>

              <p className="linux-stage-note">
                Один Linux stack для workstation и server: GUI остаётся удобным для desktop, shell/TUI закрывает
                headless path, а neuralvd включается только на узлах, где реально нужен resident monitoring.
              </p>
            </div>
          </div>
        </section>

        <section className="linux-section-shell">
          <div className="linux-section-head">
            <div className="linux-section-kicker">Operating surfaces</div>
            <h3>GUI, shell/TUI и daemon собраны в один linux-native маршрут.</h3>
            <p>
              Страница не раскладывает Linux на случайные SKU: весь поток строится вокруг одного installer и одной
              модели событий, а оператор просто выбирает нужную поверхность под конкретный узел.
            </p>
          </div>

          <div className="linux-mode-grid">
            {linuxPageContent.modeCards.map((card, index) => {
              const modeClass = index === 1 ? 'is-shell' : index === 2 ? 'is-daemon' : 'is-gui';
              return (
                <article
                  key={card.title}
                  className={`surface-card linux-mode-card linux-animate linux-hoverable ${modeClass}`}
                  style={{ animationDelay: `${index * 90}ms` }}
                >
                  <div className="linux-card-kicker">{card.eyebrow}</div>
                  <h4>{card.title}</h4>
                  <p>{card.description}</p>
                  <ul className="linux-bullet-list">
                    {card.bullets.map((bullet) => (
                      <li key={bullet}>{bullet}</li>
                    ))}
                  </ul>
                  <div className="linux-footnote">{card.footnote}</div>
                </article>
              );
            })}
          </div>
        </section>

        <section className="linux-section-shell" id="linux-coverage">
          <div className="linux-coverage-layout">
            <article className="surface-card linux-intro-card linux-animate linux-hoverable">
              <div className="linux-section-kicker">Distro coverage</div>
              <h3>Не один desktop build, а понятный multi-distro путь.</h3>
              <p>{linuxPageContent.coverageIntro}</p>
              <div className="linux-artifact-actions">
                <ActionButton label="Manifest JSON" href="/basedata/api/releases/manifest" kind="outlined" />
                <ActionButton label="Server health" href="/basedata/health" kind="tonal" />
              </div>
            </article>

            <div className="linux-band-grid">
              {linuxPageContent.coverageBands.map((band, index) => (
                <article
                  key={band.family}
                  className="surface-card linux-band-card linux-animate linux-hoverable"
                  style={{ animationDelay: `${index * 80}ms` }}
                >
                  <div className="linux-band-emphasis">{band.emphasis}</div>
                  <h4>{band.family}</h4>
                  <p>{band.description}</p>
                  <ul className="linux-note-list">
                    {band.notes.map((note) => (
                      <li key={note}>{note}</li>
                    ))}
                  </ul>
                </article>
              ))}
            </div>
          </div>
        </section>

        <section className="linux-section-shell" id="linux-install">
          <div className="linux-flow-layout">
            <article className="surface-card linux-flow-card linux-animate linux-hoverable">
              <div className="linux-section-kicker">Install flow</div>
              <h3>Bootstrap через curl|bash, затем systemd только по осознанному opt-in.</h3>
              <p>
                Установка начинается с shell/TUI, но не закрывает GUI-путь: оператор сразу получает терминальный
                контроль и может докрутить daemon только там, где нужен resident слой.
              </p>
              <div className="linux-flow-list">
                {linuxPageContent.installFlow.map((step, index) => (
                  <article
                    key={step.title}
                    className="linux-flow-step linux-animate"
                    style={{ animationDelay: `${110 + index * 80}ms` }}
                  >
                    <div className="linux-flow-step-head">
                      <div className="linux-flow-eyebrow">{step.eyebrow}</div>
                      <h4>{step.title}</h4>
                      <p>{step.description}</p>
                    </div>
                    {(step.command || step.secondaryCommand) && (
                      <div className="linux-command-stack">
                        {step.command ? <code>{step.command}</code> : null}
                        {step.secondaryCommand ? <code>{step.secondaryCommand}</code> : null}
                      </div>
                    )}
                    {step.note ? <div className="linux-flow-note">{step.note}</div> : null}
                  </article>
                ))}
              </div>
            </article>

            <div className="linux-artifact-stack">
              <article className="surface-card linux-artifact-card linux-animate linux-hoverable">
                <div className="linux-artifact-top">
                  <div>
                    <div className="linux-artifact-eyebrow">GUI build</div>
                    <h4>Manifest-driven desktop artifact</h4>
                  </div>
                  <div className="linux-artifact-version">{guiArtifact?.version ?? 'pending'}</div>
                </div>
                <p>Desktop GUI подтягивается из release manifest и остаётся основным визуальным cockpit для Linux workstation.</p>
                <ArtifactMeta
                  artifact={guiArtifact}
                  fallbackLabel="GUI artifact появится после публикации Linux build в manifest."
                />
                <div className="linux-artifact-actions">
                  <ActionButton
                    label="Скачать GUI"
                    href={guiArtifact?.downloadUrl}
                    disabled={!guiArtifact?.downloadUrl}
                    kind="filled"
                    external
                  />
                </div>
              </article>

              <article className="surface-card linux-artifact-card is-shell linux-animate linux-hoverable" style={{ animationDelay: '90ms' }}>
                <div className="linux-artifact-top">
                  <div>
                    <div className="linux-artifact-eyebrow">Shell / TUI</div>
                    <h4>Один лайнер для install и rollback-friendly ops</h4>
                  </div>
                  <div className="linux-artifact-version">{shellArtifact?.version ?? guiArtifact?.version ?? 'pending'}</div>
                </div>
                <p>Installer остаётся главным входом для headless и server сценариев, а manifest отдаёт актуальную команду без ручной пересборки страницы.</p>
                <code className="linux-artifact-command">{installCommand}</code>
                <ArtifactMeta
                  artifact={shellArtifact}
                  fallbackLabel="Shell installer работает как manifest-backed install path even when download artifact is pending."
                />
                <div className="linux-artifact-actions">
                  <ActionButton label="CLI runbook" href="#linux-ops" kind="tonal" />
                </div>
              </article>

              <article className="surface-card linux-artifact-card is-daemon linux-animate linux-hoverable" style={{ animationDelay: '180ms' }}>
                <div className="linux-artifact-top">
                  <div>
                    <div className="linux-artifact-eyebrow">Daemon</div>
                    <h4>Resident path через neuralvd</h4>
                  </div>
                  <div className="linux-artifact-version">systemd</div>
                </div>
                <p>Daemon отделён от базового install, поэтому desktop и server живут на одном bootstrap, а resident monitoring включается адресно.</p>
                <code className="linux-artifact-command">sudo systemctl enable --now neuralvd</code>
                <ul className="linux-mini-list">
                  <li>Подходит для host, где нужен постоянный контроль новых бинарников и persistence vectors.</li>
                  <li>Диагностика идёт через standard linux tooling: systemctl и journalctl.</li>
                </ul>
                <div className="linux-artifact-actions">
                  <ActionButton label="systemd flow" href="#linux-daemon" kind="outlined" />
                </div>
              </article>
            </div>
          </div>
        </section>

        <section className="linux-section-shell" id="linux-daemon">
          <div className="linux-systemd-layout">
            <article className="surface-card linux-systemd-card linux-animate linux-hoverable">
              <div className="linux-section-kicker">systemd flow</div>
              <h3>neuralvd встраивается в Linux без отдельной proprietary оболочки.</h3>
              <p>
                Resident path остаётся предсказуемым: старт из user shell, opt-in регистрация daemon и стандартная диагностика через уже привычный service lifecycle.
              </p>
              <div className="linux-systemd-list">
                {linuxPageContent.systemdFlow.map((step, index) => (
                  <article
                    key={step.title}
                    className="linux-systemd-step linux-animate"
                    style={{ animationDelay: `${100 + index * 80}ms` }}
                  >
                    <div className="linux-systemd-unit">{step.unit}</div>
                    <h4>{step.title}</h4>
                    <p>{step.description}</p>
                  </article>
                ))}
              </div>
            </article>

            <article className="surface-card linux-daemon-card linux-animate linux-hoverable" style={{ animationDelay: '120ms' }}>
              <div className="linux-section-kicker">Resident monitoring</div>
              <h3>Что именно получает daemon-путь на Linux.</h3>
              <p>
                neuralvd нужен не ради галочки: он добавляет постоянный канал наблюдения и сводит Linux-specific сигналы в тот же backend, который уже обслуживает GUI и shell verdicts.
              </p>
              <ul className="linux-highlight-list">
                {linuxPageContent.daemonHighlights.map((highlight) => (
                  <li key={highlight}>{highlight}</li>
                ))}
              </ul>
            </article>
          </div>
        </section>

        <section className="linux-verify-shell" id="linux-verification">
          <div className="linux-section-head">
            <div className="linux-section-kicker">Verification planes</div>
            <h3>Локальные и серверные проверки разделены, но работают как единый triage pipeline.</h3>
            <p>
              Linux-клиент быстро собирает сигналы прямо на узле, а backend добирает глубокий анализ и нормализует вердикты для GUI, shell/TUI и daemon в одном общем pipeline.
            </p>
          </div>

          <div className="linux-verify-grid">
            <article className="surface-card linux-rail-card linux-animate linux-hoverable">
              <div className="linux-card-kicker">{linuxPageContent.localRail.eyebrow}</div>
              <h4>{linuxPageContent.localRail.title}</h4>
              <p>{linuxPageContent.localRail.description}</p>
              <ul className="linux-rail-list">
                {linuxPageContent.localRail.items.map((item) => (
                  <li key={item}>{item}</li>
                ))}
              </ul>
            </article>

            <article className="surface-card linux-rail-card is-server linux-animate linux-hoverable" style={{ animationDelay: '90ms' }}>
              <div className="linux-card-kicker">{linuxPageContent.serverRail.eyebrow}</div>
              <h4>{linuxPageContent.serverRail.title}</h4>
              <p>{linuxPageContent.serverRail.description}</p>
              <ul className="linux-rail-list">
                {linuxPageContent.serverRail.items.map((item) => (
                  <li key={item}>{item}</li>
                ))}
              </ul>
            </article>
          </div>

          <div className="linux-lane-grid">
            {linuxPageContent.validationRails.map((rail, index) => (
              <article
                key={rail.title}
                className="surface-card linux-lane-card linux-animate linux-hoverable"
                style={{ animationDelay: `${index * 80}ms` }}
              >
                <div className="linux-card-kicker">{rail.eyebrow}</div>
                <h4>{rail.title}</h4>
                <p>{rail.description}</p>
                <ul className="linux-note-list">
                  {rail.items.map((item) => (
                    <li key={item}>{item}</li>
                  ))}
                </ul>
              </article>
            ))}
          </div>
        </section>

        <section className="linux-command-shell" id="linux-ops">
          <div className="linux-section-head">
            <div className="linux-section-kicker">CLI / daemon runbook</div>
            <h3>Командный слой собран отдельно, чтобы shell/TUI и neuralvd были удобны в реальной эксплуатации.</h3>
            <p>
              Здесь нет случайных маркетинговых сниппетов: блоки ниже показывают everyday commands, systemd lifecycle и короткий validation path перед rollout на workstation или server fleet.
            </p>
          </div>

          <div className="linux-command-grid">
            {linuxPageContent.commandDecks.map((deck, index) => (
              <article
                key={deck.title}
                className="surface-card linux-command-card linux-animate linux-hoverable"
                style={{ animationDelay: `${index * 90}ms` }}
              >
                <div className="linux-card-kicker">{deck.eyebrow}</div>
                <h4>{deck.title}</h4>
                <p>{deck.description}</p>
                <md-divider />
                <div className="linux-command-list">
                  {deck.commands.map((command) => (
                    <div key={`${deck.title}-${command.label}`} className="linux-command-row">
                      <span className="linux-command-label">{command.label}</span>
                      <code>{command.value}</code>
                    </div>
                  ))}
                </div>
              </article>
            ))}
          </div>
        </section>
      </div>
    </>
  );
}
