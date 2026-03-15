import { Link } from 'react-router-dom';
import {
  homeAdvantages,
  homeArchitectureCards,
  homeInstallSteps,
  homeManifestFacts,
  homeMetrics,
  homePlatformCards,
  homeShellFallbackCommand
} from '../content/home';
import { useReleaseManifest } from '../hooks/useReleaseManifest';
import { getArtifact, type ReleaseArtifact } from '../lib/manifest';

const manifestJsonHref = '/basedata/api/releases/manifest';

const homePageStyles = `
  .nv-home-page {
    display: grid;
    gap: 24px;
  }

  .nv-home-section {
    position: relative;
    overflow: hidden;
    padding: clamp(26px, 4vw, 40px);
    isolation: isolate;
  }

  .nv-home-section::before {
    content: '';
    position: absolute;
    inset: 0;
    background: linear-gradient(140deg, rgba(255, 255, 255, 0.12), transparent 55%);
    pointer-events: none;
  }

  .nv-home-hero {
    display: grid;
    grid-template-columns: minmax(0, 1.18fr) minmax(320px, 0.82fr);
    gap: 24px;
    background:
      radial-gradient(circle at 8% 18%, rgba(111, 140, 255, 0.34), transparent 28%),
      radial-gradient(circle at 88% 14%, rgba(69, 173, 160, 0.22), transparent 24%),
      linear-gradient(145deg, rgba(249, 251, 255, 0.96), rgba(232, 240, 255, 0.88));
  }

  .nv-home-hero-copy,
  .nv-home-hero-side {
    position: relative;
    z-index: 1;
  }

  .nv-home-chip-row,
  .nv-home-action-row,
  .nv-home-card-actions,
  .nv-home-status-actions,
  .nv-home-final-actions {
    display: flex;
    flex-wrap: wrap;
    gap: 12px;
  }

  .nv-home-chip {
    display: inline-flex;
    align-items: center;
    gap: 10px;
    padding: 10px 14px;
    border-radius: 999px;
    border: 1px solid rgba(54, 92, 183, 0.14);
    background: rgba(255, 255, 255, 0.74);
    color: rgba(24, 32, 51, 0.82);
    font-size: 0.92rem;
    letter-spacing: 0.01em;
  }

  .nv-home-display {
    margin: 16px 0 0;
    max-width: 11ch;
    font-size: clamp(3rem, 6vw, 5.9rem);
    line-height: 0.9;
    letter-spacing: -0.075em;
  }

  .nv-home-lead {
    margin: 20px 0 0;
    max-width: 60ch;
    color: var(--nv-muted);
    font-size: clamp(1rem, 2vw, 1.14rem);
    line-height: 1.72;
  }

  .nv-home-action-row {
    margin-top: 24px;
  }

  .nv-home-metrics {
    display: grid;
    grid-template-columns: repeat(3, minmax(0, 1fr));
    gap: 14px;
    margin-top: 28px;
  }

  .nv-home-metric {
    padding: 18px 18px 20px;
    border-radius: 24px;
    border: 1px solid rgba(54, 92, 183, 0.12);
    background: rgba(255, 255, 255, 0.72);
    box-shadow: 0 20px 50px rgba(41, 72, 138, 0.08);
    animation: nv-home-rise 720ms ease both;
  }

  .nv-home-metric-value {
    display: block;
    margin-bottom: 8px;
    font-size: clamp(1.9rem, 4vw, 2.6rem);
    line-height: 1;
    letter-spacing: -0.05em;
  }

  .nv-home-metric-label {
    margin: 0;
    font-weight: 700;
  }

  .nv-home-metric-detail {
    margin: 8px 0 0;
    color: var(--nv-muted);
    line-height: 1.55;
    font-size: 0.95rem;
  }

  .nv-home-hero-side {
    display: grid;
    gap: 16px;
  }

  .nv-home-visual {
    position: relative;
    min-height: 360px;
    overflow: hidden;
    border-radius: 32px;
    border: 1px solid rgba(54, 92, 183, 0.12);
    background:
      radial-gradient(circle at 50% 50%, rgba(111, 140, 255, 0.28), transparent 32%),
      linear-gradient(180deg, rgba(255, 255, 255, 0.92), rgba(236, 243, 255, 0.86));
  }

  .nv-home-orbit,
  .nv-home-orbit::after {
    position: absolute;
    border-radius: 999px;
  }

  .nv-home-orbit {
    border: 1px solid rgba(54, 92, 183, 0.16);
    animation: nv-home-float 11s ease-in-out infinite;
  }

  .nv-home-orbit::after {
    content: '';
    inset: 12px;
    border: 1px solid rgba(54, 92, 183, 0.08);
  }

  .nv-home-orbit-a {
    inset: 34px;
  }

  .nv-home-orbit-b {
    inset: 84px;
    animation-duration: 14s;
    animation-direction: reverse;
  }

  .nv-home-orbit-c {
    inset: 132px;
    animation-duration: 9s;
  }

  .nv-home-core-card,
  .nv-home-signal-card {
    position: absolute;
    border-radius: 26px;
    border: 1px solid rgba(54, 92, 183, 0.12);
    background: rgba(255, 255, 255, 0.82);
    box-shadow: 0 18px 50px rgba(39, 67, 127, 0.1);
    backdrop-filter: blur(14px);
  }

  .nv-home-core-card {
    inset: auto 24px 24px 24px;
    padding: 20px 22px;
  }

  .nv-home-core-card span,
  .nv-home-signal-card span,
  .nv-home-label,
  .nv-home-manifest-label,
  .nv-home-platform-kicker {
    display: block;
    color: var(--nv-muted);
    font-size: 0.78rem;
    letter-spacing: 0.14em;
    text-transform: uppercase;
  }

  .nv-home-core-card strong,
  .nv-home-signal-card strong,
  .nv-home-availability,
  .nv-home-manifest-value,
  .nv-home-row-meta strong {
    display: block;
    margin-top: 6px;
    font-size: 1rem;
    letter-spacing: -0.02em;
  }

  .nv-home-core-card p,
  .nv-home-signal-card p,
  .nv-home-status-note,
  .nv-home-platform-summary,
  .nv-home-advantage-card p,
  .nv-home-architecture-card p,
  .nv-home-step p,
  .nv-home-final-card p {
    margin: 10px 0 0;
    color: var(--nv-muted);
    line-height: 1.62;
  }

  .nv-home-signal-card {
    padding: 14px 16px 16px;
    width: min(200px, calc(100% - 48px));
    animation: nv-home-rise 780ms ease both;
  }

  .nv-home-signal-top {
    top: 22px;
    left: 22px;
    animation-delay: 90ms;
  }

  .nv-home-signal-mid {
    top: 110px;
    right: 22px;
    animation-delay: 180ms;
  }

  .nv-home-signal-bottom {
    left: 52px;
    bottom: 118px;
    animation-delay: 270ms;
  }

  .nv-home-status-card,
  .nv-home-install-panel,
  .nv-home-final-card {
    position: relative;
    overflow: hidden;
    padding: 24px;
    border-radius: 28px;
    border: 1px solid rgba(54, 92, 183, 0.12);
    background: rgba(255, 255, 255, 0.76);
    box-shadow: 0 20px 56px rgba(43, 69, 128, 0.1);
  }

  .nv-home-status-card::after,
  .nv-home-install-panel::after,
  .nv-home-final-card::after {
    content: '';
    position: absolute;
    inset: auto -20% -55% auto;
    width: 240px;
    height: 240px;
    border-radius: 999px;
    background: radial-gradient(circle, rgba(111, 140, 255, 0.16), transparent 68%);
    pointer-events: none;
  }

  .nv-home-status-top {
    display: flex;
    flex-wrap: wrap;
    align-items: center;
    justify-content: space-between;
    gap: 14px;
  }

  .nv-home-status-pill,
  .nv-home-version-pill {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    min-height: 34px;
    padding: 6px 12px;
    border-radius: 999px;
    font-weight: 700;
    font-size: 0.88rem;
  }

  .nv-home-status-pill[data-state='live'] {
    color: #135e3b;
    background: rgba(205, 241, 220, 0.82);
  }

  .nv-home-status-pill[data-state='fallback'] {
    color: #7a4a00;
    background: rgba(255, 232, 193, 0.9);
  }

  .nv-home-status-pill[data-state='loading'] {
    color: #16346f;
    background: rgba(220, 230, 255, 0.94);
  }

  .nv-home-status-card h3,
  .nv-home-section-header h3,
  .nv-home-platform-header h3,
  .nv-home-advantage-card h4,
  .nv-home-architecture-card h4,
  .nv-home-install-panel h3,
  .nv-home-final-card h3 {
    margin: 0;
  }

  .nv-home-section-header {
    position: relative;
    z-index: 1;
    max-width: 62ch;
  }

  .nv-home-section-header h3,
  .nv-home-final-card h3 {
    font-size: clamp(2rem, 4vw, 3.3rem);
    line-height: 0.97;
    letter-spacing: -0.06em;
  }

  .nv-home-section-header p,
  .nv-home-final-card p {
    font-size: 1rem;
  }

  .nv-home-platform-grid {
    position: relative;
    z-index: 1;
    display: grid;
    grid-template-columns: repeat(3, minmax(0, 1fr));
    gap: 18px;
    margin-top: 28px;
  }

  .nv-home-platform-card,
  .nv-home-advantage-card,
  .nv-home-architecture-card {
    position: relative;
    overflow: hidden;
    display: flex;
    flex-direction: column;
    gap: 16px;
    min-height: 100%;
    padding: 24px;
    border-radius: 28px;
    border: 1px solid rgba(54, 92, 183, 0.12);
    background: rgba(255, 255, 255, 0.74);
    box-shadow: 0 20px 56px rgba(43, 69, 128, 0.1);
    animation: nv-home-rise 760ms ease both;
    transition: transform 180ms ease, box-shadow 180ms ease, border-color 180ms ease;
  }

  .nv-home-platform-card:hover,
  .nv-home-advantage-card:hover,
  .nv-home-architecture-card:hover {
    transform: translateY(-4px);
    box-shadow: 0 24px 68px rgba(43, 69, 128, 0.15);
    border-color: rgba(54, 92, 183, 0.22);
  }

  .nv-home-platform-card::before,
  .nv-home-advantage-card::before,
  .nv-home-architecture-card::before {
    content: '';
    position: absolute;
    inset: auto -16% -34% auto;
    width: 180px;
    height: 180px;
    border-radius: 999px;
    pointer-events: none;
    background: radial-gradient(circle, rgba(111, 140, 255, 0.18), transparent 70%);
  }

  .nv-home-platform-card[data-tone='android']::before {
    background: radial-gradient(circle, rgba(75, 118, 255, 0.2), transparent 70%);
  }

  .nv-home-platform-card[data-tone='windows']::before {
    background: radial-gradient(circle, rgba(36, 177, 162, 0.18), transparent 72%);
  }

  .nv-home-platform-card[data-tone='linux']::before {
    background: radial-gradient(circle, rgba(255, 178, 82, 0.22), transparent 72%);
  }

  .nv-home-platform-header {
    display: flex;
    align-items: flex-start;
    justify-content: space-between;
    gap: 14px;
  }

  .nv-home-platform-title {
    font-size: 1.5rem;
    line-height: 1.02;
    letter-spacing: -0.04em;
  }

  .nv-home-version-pill {
    color: #16346f;
    background: rgba(220, 230, 255, 0.96);
  }

  .nv-home-availability[data-state='ready'] {
    color: var(--nv-ok);
  }

  .nv-home-availability[data-state='command'] {
    color: var(--nv-primary-strong);
  }

  .nv-home-availability[data-state='pending'] {
    color: var(--nv-warn);
  }

  .nv-home-platform-summary {
    min-height: 70px;
  }

  .nv-home-platform-meta {
    display: grid;
    gap: 10px;
    padding: 14px 16px;
    border-radius: 22px;
    background: rgba(245, 248, 255, 0.84);
    border: 1px solid rgba(54, 92, 183, 0.1);
  }

  .nv-home-platform-meta strong {
    display: block;
    font-size: 0.98rem;
  }

  .nv-home-platform-meta p {
    margin: 4px 0 0;
    color: var(--nv-muted);
    font-size: 0.92rem;
    line-height: 1.45;
    word-break: break-word;
  }

  .nv-home-list {
    margin: 0;
    padding: 0;
    list-style: none;
    display: grid;
    gap: 12px;
  }

  .nv-home-list li {
    position: relative;
    padding-left: 18px;
    color: var(--nv-muted);
    line-height: 1.58;
  }

  .nv-home-list li::before {
    content: '';
    position: absolute;
    top: 0.65em;
    left: 0;
    width: 8px;
    height: 8px;
    border-radius: 999px;
    background: linear-gradient(180deg, var(--nv-secondary), var(--nv-primary));
  }

  .nv-home-card-actions {
    margin-top: auto;
  }

  .nv-home-advantage-grid {
    position: relative;
    z-index: 1;
    display: grid;
    grid-template-columns: repeat(12, minmax(0, 1fr));
    gap: 18px;
    margin-top: 28px;
  }

  .nv-home-advantage-card {
    grid-column: span 3;
  }

  .nv-home-advantage-card[data-size='wide'] {
    grid-column: span 6;
  }

  .nv-home-advantage-card h4,
  .nv-home-architecture-card h4 {
    font-size: 1.42rem;
    line-height: 1.08;
    letter-spacing: -0.04em;
  }

  .nv-home-architecture-rail {
    position: relative;
    z-index: 1;
    display: grid;
    grid-template-columns: repeat(3, minmax(0, 1fr));
    gap: 12px;
    margin-top: 24px;
  }

  .nv-home-rail-pill {
    display: flex;
    align-items: center;
    justify-content: center;
    min-height: 48px;
    padding: 10px 16px;
    border-radius: 18px;
    border: 1px solid rgba(54, 92, 183, 0.12);
    background: rgba(255, 255, 255, 0.7);
    font-weight: 600;
    text-align: center;
  }

  .nv-home-architecture-grid {
    position: relative;
    z-index: 1;
    display: grid;
    grid-template-columns: repeat(3, minmax(0, 1fr));
    gap: 18px;
    margin-top: 18px;
  }

  .nv-home-architecture-card[data-tone='local']::before {
    background: radial-gradient(circle, rgba(91, 118, 255, 0.19), transparent 72%);
  }

  .nv-home-architecture-card[data-tone='server']::before {
    background: radial-gradient(circle, rgba(49, 185, 171, 0.18), transparent 72%);
  }

  .nv-home-architecture-card[data-tone='sync']::before {
    background: radial-gradient(circle, rgba(255, 170, 68, 0.2), transparent 72%);
  }

  .nv-home-install-grid {
    position: relative;
    z-index: 1;
    display: grid;
    grid-template-columns: minmax(0, 1.06fr) minmax(320px, 0.94fr);
    gap: 18px;
    margin-top: 28px;
  }

  .nv-home-step-list {
    display: grid;
    gap: 14px;
  }

  .nv-home-step {
    display: grid;
    grid-template-columns: auto minmax(0, 1fr);
    gap: 16px;
    padding: 18px;
    border-radius: 24px;
    border: 1px solid rgba(54, 92, 183, 0.12);
    background: rgba(255, 255, 255, 0.72);
    box-shadow: 0 18px 48px rgba(43, 69, 128, 0.08);
    animation: nv-home-rise 760ms ease both;
  }

  .nv-home-step-index {
    width: 46px;
    height: 46px;
    display: grid;
    place-items: center;
    border-radius: 16px;
    background: linear-gradient(180deg, rgba(220, 230, 255, 0.98), rgba(198, 214, 255, 0.92));
    color: #16346f;
    font-weight: 800;
  }

  .nv-home-step h4 {
    margin: 0;
    font-size: 1.1rem;
    line-height: 1.18;
  }

  .nv-home-manifest-list {
    display: grid;
    gap: 10px;
    margin-top: 18px;
  }

  .nv-home-manifest-row {
    display: flex;
    align-items: flex-start;
    justify-content: space-between;
    gap: 14px;
    padding: 14px 0;
    border-top: 1px solid rgba(54, 92, 183, 0.12);
  }

  .nv-home-manifest-row:first-child {
    border-top: 0;
    padding-top: 0;
  }

  .nv-home-row-meta {
    min-width: 100px;
    text-align: right;
  }

  .nv-home-row-meta span {
    display: block;
    margin-top: 4px;
    color: var(--nv-muted);
    font-size: 0.9rem;
  }

  .nv-home-code {
    margin: 18px 0 0;
    padding: 16px;
    border-radius: 22px;
    border: 1px solid rgba(54, 92, 183, 0.12);
    background: #f5f8ff;
    color: #17336f;
    font-family: 'JetBrains Mono', 'SFMono-Regular', Consolas, monospace;
    font-size: 0.92rem;
    line-height: 1.65;
    white-space: pre-wrap;
    word-break: break-word;
  }

  .nv-home-fact-list {
    margin: 18px 0 0;
    padding: 0;
    list-style: none;
    display: grid;
    gap: 10px;
  }

  .nv-home-fact-list li {
    position: relative;
    padding-left: 18px;
    color: var(--nv-muted);
    line-height: 1.56;
  }

  .nv-home-fact-list li::before {
    content: '';
    position: absolute;
    top: 0.72em;
    left: 0;
    width: 7px;
    height: 7px;
    border-radius: 999px;
    background: linear-gradient(180deg, rgba(36, 177, 162, 1), rgba(54, 92, 183, 1));
  }

  .nv-home-final-card {
    display: grid;
    grid-template-columns: minmax(0, 1fr) auto;
    gap: 18px;
    align-items: end;
    background:
      radial-gradient(circle at 12% 18%, rgba(111, 140, 255, 0.2), transparent 30%),
      linear-gradient(150deg, rgba(249, 251, 255, 0.98), rgba(232, 240, 255, 0.9));
  }

  .nv-home-final-actions {
    justify-content: flex-end;
  }

  @keyframes nv-home-float {
    0%, 100% {
      transform: translateY(0) scale(1);
    }

    50% {
      transform: translateY(-10px) scale(1.015);
    }
  }

  @keyframes nv-home-rise {
    from {
      opacity: 0;
      transform: translateY(14px);
    }

    to {
      opacity: 1;
      transform: translateY(0);
    }
  }

  @media (max-width: 1120px) {
    .nv-home-hero,
    .nv-home-install-grid,
    .nv-home-final-card {
      grid-template-columns: 1fr;
    }

    .nv-home-platform-grid,
    .nv-home-architecture-grid {
      grid-template-columns: repeat(2, minmax(0, 1fr));
    }

    .nv-home-architecture-grid .nv-home-architecture-card:last-child {
      grid-column: 1 / -1;
    }

    .nv-home-advantage-grid {
      grid-template-columns: repeat(2, minmax(0, 1fr));
    }

    .nv-home-advantage-card,
    .nv-home-advantage-card[data-size='wide'] {
      grid-column: span 1;
    }
  }

  @media (max-width: 780px) {
    .nv-home-display,
    .nv-home-section-header h3,
    .nv-home-final-card h3 {
      max-width: none;
    }

    .nv-home-metrics,
    .nv-home-platform-grid,
    .nv-home-architecture-grid,
    .nv-home-architecture-rail {
      grid-template-columns: 1fr;
    }

    .nv-home-status-top,
    .nv-home-platform-header,
    .nv-home-manifest-row {
      flex-direction: column;
      align-items: flex-start;
    }

    .nv-home-row-meta,
    .nv-home-final-actions {
      min-width: 0;
      text-align: left;
      justify-content: flex-start;
    }

    .nv-home-visual {
      min-height: 320px;
    }

    .nv-home-signal-mid {
      top: 92px;
    }

    .nv-home-signal-bottom {
      left: 22px;
      bottom: 104px;
    }
  }

  @media (max-width: 560px) {
    .nv-home-section,
    .nv-home-final-card,
    .nv-home-status-card,
    .nv-home-install-panel,
    .nv-home-platform-card,
    .nv-home-advantage-card,
    .nv-home-architecture-card {
      padding: 20px;
      border-radius: 24px;
    }

    .nv-home-display {
      font-size: clamp(2.6rem, 12vw, 3.6rem);
      line-height: 0.94;
    }

    .nv-home-visual {
      min-height: 300px;
    }

    .nv-home-signal-card {
      width: calc(100% - 44px);
    }

    .nv-home-signal-top,
    .nv-home-signal-mid,
    .nv-home-signal-bottom {
      left: 22px;
      right: 22px;
    }

    .nv-home-signal-mid {
      top: 108px;
    }

    .nv-home-signal-bottom {
      bottom: 118px;
    }
  }

  @media (prefers-reduced-motion: reduce) {
    .nv-home-metric,
    .nv-home-signal-card,
    .nv-home-orbit {
      animation: none;
    }

    .nv-home-platform-card,
    .nv-home-advantage-card,
    .nv-home-architecture-card {
      transition: none;
    }
  }
`;

function formatManifestDate(value: string | number | undefined) {
  if (value === undefined || value === null || value === '') {
    return 'ожидает первой публикации';
  }

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return String(value);
  }

  return new Intl.DateTimeFormat('ru-RU', {
    dateStyle: 'medium',
    timeStyle: 'short'
  }).format(date);
}

function getStatusState(
  loading: boolean,
  source: 'remote' | 'fallback'
): 'loading' | 'live' | 'fallback' {
  if (loading) {
    return 'loading';
  }

  return source === 'remote' ? 'live' : 'fallback';
}

function getStatusLabel(loading: boolean, source: 'remote' | 'fallback') {
  if (loading) {
    return 'manifest sync';
  }

  return source === 'remote' ? 'live manifest' : 'fallback manifest';
}

function getStatusHeadline(loading: boolean, source: 'remote' | 'fallback') {
  if (loading) {
    return 'Главная подтягивает актуальные артефакты и install-команды.';
  }

  return source === 'remote'
    ? 'Сайт читает живой release manifest и показывает актуальные CTA без ручной матрицы ссылок.'
    : 'Сейчас показан fallback-контур, но структура страницы уже построена вокруг manifest и готова к живым релизам.';
}

function getArtifactState(artifact?: ReleaseArtifact): 'ready' | 'command' | 'pending' {
  if (artifact?.downloadUrl) {
    return 'ready';
  }

  if (artifact?.installCommand) {
    return 'command';
  }

  return 'pending';
}

function getArtifactStateLabel(artifact?: ReleaseArtifact) {
  if (artifact?.downloadUrl) {
    return 'download live';
  }

  if (artifact?.installCommand) {
    return 'command live';
  }

  return 'publish pending';
}

function getArtifactDescriptor(artifact?: ReleaseArtifact) {
  if (artifact?.fileName) {
    return artifact.fileName;
  }

  if (artifact?.installCommand) {
    return 'install command из manifest';
  }

  return 'артефакт появится после публикации';
}

function getArtifactSupportText(artifact?: ReleaseArtifact) {
  if (artifact?.sha256) {
    const preview =
      artifact.sha256.length > 18 ? `${artifact.sha256.slice(0, 18)}...` : artifact.sha256;
    return `SHA256 ${preview}`;
  }

  if (artifact?.channel) {
    return `Канал ${artifact.channel}`;
  }

  if (artifact?.notes?.length) {
    return artifact.notes[0];
  }

  return 'Страница ждёт live URL из backend release contract.';
}

export function HomePage() {
  const manifestState = useReleaseManifest();
  const shellArtifact = getArtifact(manifestState.manifest, 'shell');
  const shellCommand = shellArtifact?.installCommand ?? homeShellFallbackCommand;
  const manifestStatusState = getStatusState(manifestState.loading, manifestState.source);
  const platformArtifacts = homePlatformCards.map((platform) => ({
    ...platform,
    artifact: getArtifact(manifestState.manifest, platform.manifestPlatform)
  }));
  const manifestRows = [
    {
      title: 'Android APK',
      artifact: getArtifact(manifestState.manifest, 'android')
    },
    {
      title: 'Windows build',
      artifact: getArtifact(manifestState.manifest, 'windows')
    },
    {
      title: 'Linux GUI',
      artifact: getArtifact(manifestState.manifest, 'linux')
    },
    {
      title: 'Linux shell',
      artifact: shellArtifact
    }
  ];

  return (
    <div className="nv-home-page">
      <style>{homePageStyles}</style>

      <section className="surface-card nv-home-section nv-home-hero">
        <div className="nv-home-hero-copy">
          <div className="eyebrow">NeuralV / md3 expressive</div>
          <div className="nv-home-chip-row">
            <span className="nv-home-chip">local-first signal</span>
            <span className="nv-home-chip">server-amplified verdict</span>
            <span className="nv-home-chip">manifest-driven delivery</span>
          </div>
          <h2 className="nv-home-display">
            Защита, которая начинается на устройстве и заканчивается уверенной серверной подачей.
          </h2>
          <p className="nv-home-lead">
            NeuralV собирает Android, Windows и Linux в один продуктовый ритм: локальные движки
            дают быстрый ответ, backend делает глубокий triage, а release manifest синхронизирует
            установку, загрузки и версионность без ручного расхождения между поверхностями.
          </p>
          <div className="nv-home-action-row">
            <Link to="/android">
              <md-filled-button>Android</md-filled-button>
            </Link>
            <Link to="/windows">
              <md-filled-tonal-button>Windows</md-filled-tonal-button>
            </Link>
            <Link to="/linux">
              <md-outlined-button>Linux</md-outlined-button>
            </Link>
            <a href="#install">
              <md-outlined-button>Установка и manifest</md-outlined-button>
            </a>
          </div>
          <div className="nv-home-metrics">
            {homeMetrics.map((metric, index) => (
              <article
                key={metric.label}
                className="nv-home-metric"
                style={{ animationDelay: `${index * 90}ms` }}
              >
                <span className="nv-home-metric-value">{metric.value}</span>
                <p className="nv-home-metric-label">{metric.label}</p>
                <p className="nv-home-metric-detail">{metric.detail}</p>
              </article>
            ))}
          </div>
        </div>

        <div className="nv-home-hero-side">
          <div className="nv-home-visual">
            <div className="nv-home-orbit nv-home-orbit-a" />
            <div className="nv-home-orbit nv-home-orbit-b" />
            <div className="nv-home-orbit nv-home-orbit-c" />
            <div className="nv-home-signal-card nv-home-signal-top">
              <span>device signal</span>
              <strong>apps, binaries, provenance</strong>
              <p>Платформенный сигнал появляется ещё до серверного запроса.</p>
            </div>
            <div className="nv-home-signal-card nv-home-signal-mid">
              <span>server triage</span>
              <strong>hash, static heuristics, AI filter</strong>
              <p>Шум уходит на backend, в UI остаётся чистое решение.</p>
            </div>
            <div className="nv-home-signal-card nv-home-signal-bottom">
              <span>release delivery</span>
              <strong>manifest -&gt; install -&gt; sync</strong>
              <p>Сайт и клиенты смотрят на один и тот же релизный контракт.</p>
            </div>
            <div className="nv-home-core-card">
              <span>hybrid defense core</span>
              <strong>NeuralV держит mobile, desktop и shell в одном потоке.</strong>
              <p>Не набор разрозненных клиентов, а одна защита с разными поверхностями входа.</p>
            </div>
          </div>

          <article className="nv-home-status-card">
            <div className="nv-home-status-top">
              <div>
                <div className="eyebrow">Manifest status</div>
                <h3>{getStatusHeadline(manifestState.loading, manifestState.source)}</h3>
              </div>
              <span className="nv-home-status-pill" data-state={manifestStatusState}>
                {getStatusLabel(manifestState.loading, manifestState.source)}
              </span>
            </div>
            <div className="nv-home-manifest-list">
              <div className="nv-home-manifest-row">
                <div>
                  <span className="nv-home-manifest-label">release channel</span>
                  <strong className="nv-home-manifest-value">
                    {manifestState.manifest.releaseChannel ?? 'stable'}
                  </strong>
                </div>
                <div className="nv-home-row-meta">
                  <strong>{manifestState.manifest.artifacts.length}</strong>
                  <span>артефактов в manifest</span>
                </div>
              </div>
              <div className="nv-home-manifest-row">
                <div>
                  <span className="nv-home-manifest-label">generated at</span>
                  <strong className="nv-home-manifest-value">
                    {formatManifestDate(manifestState.manifest.generatedAt)}
                  </strong>
                </div>
                <div className="nv-home-row-meta">
                  <strong>{manifestState.source === 'remote' ? 'backend' : 'local fallback'}</strong>
                  <span>источник данных</span>
                </div>
              </div>
            </div>
            <p className="nv-home-status-note">
              {manifestState.error ??
                'Главная связывает hero, CTA и установку напрямую с release manifest.'}
            </p>
            <div className="nv-home-status-actions">
              <a href={manifestJsonHref} target="_blank" rel="noreferrer">
                <md-filled-tonal-button>Открыть manifest JSON</md-filled-tonal-button>
              </a>
              <a href="#platforms">
                <md-outlined-button>CTA по платформам</md-outlined-button>
              </a>
            </div>
          </article>
        </div>
      </section>

      <section id="platforms" className="surface-card nv-home-section">
        <div className="nv-home-section-header">
          <div className="eyebrow">Платформы</div>
          <h3>Три ясных входа в продукт, каждый со своим native ритмом.</h3>
          <p>
            Главная не просто перечисляет клиенты. Она показывает, что именно получает пользователь
            на Android, Windows и Linux, и сразу связывает платформенную витрину с живым manifest.
          </p>
        </div>
        <div className="nv-home-platform-grid">
          {platformArtifacts.map((platform, index) => {
            const artifactState = getArtifactState(platform.artifact);

            return (
              <article
                key={platform.id}
                className="nv-home-platform-card"
                data-tone={platform.tone}
                style={{ animationDelay: `${index * 80}ms` }}
              >
                <div className="nv-home-platform-header">
                  <div>
                    <span className="nv-home-platform-kicker">{platform.eyebrow}</span>
                    <h3 className="nv-home-platform-title">{platform.title}</h3>
                  </div>
                  <span className="nv-home-version-pill">
                    {platform.artifact?.version ?? 'pending'}
                  </span>
                </div>

                <p className="nv-home-platform-summary">{platform.summary}</p>

                <div className="nv-home-platform-meta">
                  <div>
                    <span className="nv-home-label">manifest payload</span>
                    <strong>{getArtifactDescriptor(platform.artifact)}</strong>
                    <p>{getArtifactSupportText(platform.artifact)}</p>
                  </div>
                  <div>
                    <span className="nv-home-label">cta status</span>
                    <strong className="nv-home-availability" data-state={artifactState}>
                      {getArtifactStateLabel(platform.artifact)}
                    </strong>
                  </div>
                </div>

                <ul className="nv-home-list">
                  {platform.bullets.map((bullet) => (
                    <li key={bullet}>{bullet}</li>
                  ))}
                </ul>

                <div className="nv-home-card-actions">
                  <Link to={platform.route}>
                    <md-filled-button>{platform.primaryLabel}</md-filled-button>
                  </Link>
                  {platform.artifact?.downloadUrl ? (
                    <a href={platform.artifact.downloadUrl} target="_blank" rel="noreferrer">
                      <md-outlined-button>{platform.secondaryLabel}</md-outlined-button>
                    </a>
                  ) : manifestState.loading ? (
                    <md-outlined-button disabled>Подтягиваем build</md-outlined-button>
                  ) : (
                    <Link to={platform.route}>
                      <md-outlined-button>Смотреть детали</md-outlined-button>
                    </Link>
                  )}
                </div>
              </article>
            );
          })}
        </div>
      </section>

      <section className="surface-card nv-home-section">
        <div className="nv-home-section-header">
          <div className="eyebrow">Преимущества</div>
          <h3>Почему NeuralV ощущается цельной платформой, а не набором разных клиентов.</h3>
          <p>
            Ключевой выигрыш не только в наборе движков, а в том, как локальный анализ, backend и
            доставка релиза собраны в один управляемый продуктовый контур.
          </p>
        </div>
        <div className="nv-home-advantage-grid">
          {homeAdvantages.map((advantage) => (
            <article
              key={advantage.title}
              className="nv-home-advantage-card"
              data-size={advantage.size}
            >
              <div className="eyebrow">{advantage.eyebrow}</div>
              <h4>{advantage.title}</h4>
              <p>{advantage.text}</p>
            </article>
          ))}
        </div>
      </section>

      <section className="surface-card nv-home-section">
        <div className="nv-home-section-header">
          <div className="eyebrow">Архитектура</div>
          <h3>Локальный и серверный слои разделены по ответственности, но связаны по результату.</h3>
          <p>
            Local-first даёт скорость и контекст, server-side даёт глубину и нормализацию, а слой
            синхронизации держит релизы и историю проверок в одном состоянии.
          </p>
        </div>
        <div className="nv-home-architecture-rail">
          <div className="nv-home-rail-pill">local signals</div>
          <div className="nv-home-rail-pill">server intelligence</div>
          <div className="nv-home-rail-pill">manifest and sync</div>
        </div>
        <div className="nv-home-architecture-grid">
          {homeArchitectureCards.map((card) => (
            <article key={card.title} className="nv-home-architecture-card" data-tone={card.tone}>
              <div className="eyebrow">{card.eyebrow}</div>
              <h4>{card.title}</h4>
              <p>{card.text}</p>
              <ul className="nv-home-list">
                {card.bullets.map((bullet) => (
                  <li key={bullet}>{bullet}</li>
                ))}
              </ul>
            </article>
          ))}
        </div>
      </section>

      <section id="install" className="surface-card nv-home-section">
        <div className="nv-home-section-header">
          <div className="eyebrow">Установка и manifest</div>
          <h3>Установка начинается не с кнопки, а с release contract.</h3>
          <p>
            Эта страница теперь прямо показывает связь между публикацией релиза, platform CTA и
            install flow. Manifest не где-то рядом, а в центре витрины.
          </p>
        </div>
        <div className="nv-home-install-grid">
          <div className="nv-home-step-list">
            {homeInstallSteps.map((step, index) => (
              <article key={step.title} className="nv-home-step">
                <div className="nv-home-step-index">{index + 1}</div>
                <div>
                  <h4>{step.title}</h4>
                  <p>{step.text}</p>
                </div>
              </article>
            ))}
          </div>

          <aside className="nv-home-install-panel">
            <div className="eyebrow">Live release contract</div>
            <h3>Manifest управляет тем, что пользователь видит и как он ставит продукт.</h3>
            <div className="nv-home-manifest-list">
              {manifestRows.map((row) => (
                <div key={row.title} className="nv-home-manifest-row">
                  <div>
                    <span className="nv-home-manifest-label">{row.title}</span>
                    <strong className="nv-home-manifest-value">{getArtifactDescriptor(row.artifact)}</strong>
                  </div>
                  <div className="nv-home-row-meta">
                    <strong>{row.artifact?.version ?? 'pending'}</strong>
                    <span>{getArtifactStateLabel(row.artifact)}</span>
                  </div>
                </div>
              ))}
            </div>

            <pre className="nv-home-code">
              <code>{shellCommand}</code>
            </pre>

            <ul className="nv-home-fact-list">
              {homeManifestFacts.map((fact) => (
                <li key={fact}>{fact}</li>
              ))}
            </ul>

            <div className="nv-home-card-actions">
              <a href={manifestJsonHref} target="_blank" rel="noreferrer">
                <md-filled-tonal-button>JSON manifest</md-filled-tonal-button>
              </a>
              <Link to="/linux">
                <md-outlined-button>Linux GUI и shell</md-outlined-button>
              </Link>
            </div>
          </aside>
        </div>
      </section>

      <section className="nv-home-final-card surface-card">
        <div>
          <div className="eyebrow">NeuralV release rhythm</div>
          <h3>Главная страница теперь продаёт не абстрактную идею, а реальную архитектуру продукта.</h3>
          <p>
            Hero, платформенные CTA, архитектурный блок и install flow завязаны на manifest, поэтому
            страница выглядит выразительно, но остаётся инженерно честной: Android APK, desktop
            builds, Linux shell и fallback-контур описаны в одном месте.
          </p>
        </div>
        <div className="nv-home-final-actions">
          <a href="#platforms">
            <md-filled-button>Выбрать платформу</md-filled-button>
          </a>
          <a href={manifestJsonHref} target="_blank" rel="noreferrer">
            <md-outlined-button>Проверить manifest</md-outlined-button>
          </a>
        </div>
      </section>
    </div>
  );
}
