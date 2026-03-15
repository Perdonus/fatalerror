import {
  androidCapabilityTiers,
  androidHeroMetrics,
  androidInstallSteps,
  androidLocalChecks,
  androidPreviewScreens,
  androidProtectionLoop,
  androidServerChecks,
  androidUpdateModes
} from '../content/android';
import { ManifestBanner } from '../components/ManifestBanner';
import { useReleaseManifest } from '../hooks/useReleaseManifest';
import { getArtifact } from '../lib/manifest';
import type { ReleaseArtifact } from '../lib/manifest';

function formatGeneratedAt(value?: string | number): string {
  if (value === undefined || value === null) {
    return 'pending';
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

function DownloadAction({ artifact, label }: { artifact?: ReleaseArtifact; label: string }) {
  if (!artifact?.downloadUrl) {
    return <md-outlined-button disabled>{label}</md-outlined-button>;
  }

  return (
    <a href={artifact.downloadUrl} target="_blank" rel="noreferrer">
      <md-filled-button>{label}</md-filled-button>
    </a>
  );
}

export function AndroidPage() {
  const manifestState = useReleaseManifest();
  const artifact = getArtifact(manifestState.manifest, 'android');
  const releaseChannel = artifact?.channel ?? manifestState.manifest.releaseChannel ?? 'stable';
  const fileName = artifact?.fileName ?? 'NeuralV-android.apk';
  const version = artifact?.version ?? 'pending';
  const generatedAt = formatGeneratedAt(manifestState.manifest.generatedAt);

  return (
    <>
      <style>{androidPageStyles}</style>
      <div className="stack-xl android-page">
        <ManifestBanner {...manifestState} />

        <section className="surface-card android-hero-card">
          <div className="android-hero-copy">
            <div className="eyebrow">Android / md3 expressive</div>
            <h2>NeuralV для Android держит мобильную защиту в активном контуре 24/7.</h2>
            <p className="android-hero-lead">
              Локальные сигналы, серверные deep/selective/APK проверки и аккуратный user-facing verdict
              живут в одной Android-версии без desktop-перегруза и без лишнего шума.
            </p>

            <div className="android-metric-grid" aria-label="Ключевые свойства Android-версии NeuralV">
              {androidHeroMetrics.map((metric) => (
                <article key={metric.value} className="android-metric-card">
                  <strong>{metric.value}</strong>
                  <span>{metric.label}</span>
                </article>
              ))}
            </div>

            <div className="android-hero-actions">
              <DownloadAction artifact={artifact} label="Скачать APK" />
              <a href="#android-install">
                <md-filled-tonal-button>Установка APK</md-filled-tonal-button>
              </a>
              <a href="#android-modes">
                <md-outlined-button>Guest / Regular / Developer</md-outlined-button>
              </a>
            </div>

            <div className="android-release-strip" aria-label="Статус Android release manifest">
              <div className="android-release-pill">
                <span>Версия</span>
                <strong>{version}</strong>
              </div>
              <div className="android-release-pill">
                <span>Канал</span>
                <strong>{releaseChannel}</strong>
              </div>
              <div className="android-release-pill">
                <span>Файл</span>
                <strong>{fileName}</strong>
              </div>
              <div className="android-release-pill">
                <span>Manifest</span>
                <strong>{generatedAt}</strong>
              </div>
            </div>
          </div>

          <div className="android-hero-visual" aria-hidden="true">
            <div className="android-aura android-aura--a" />
            <div className="android-aura android-aura--b" />
            <div className="android-aura android-aura--c" />
            <div className="android-floating-chip android-floating-chip--left">deep / selective / apk</div>
            <div className="android-floating-chip android-floating-chip--right">ai post-filter active</div>
            <div className="android-floating-chip android-floating-chip--bottom">guest to developer in one app</div>

            <div className="android-device-frame">
              <div className="android-device-shell">
                <div className="android-device-topline">
                  <span className="android-device-sensor" />
                  <span className="android-device-speaker" />
                </div>

                <div className="android-device-screen">
                  <div className="android-device-badge">Resident shield</div>
                  <h3>24/7 защита активна</h3>
                  <p>Новые установки, обновления пакетов и suspicious permission drift идут в одну ленту.</p>

                  <div className="android-signal-panel">
                    <div>
                      <span>Cloud status</span>
                      <strong>Server scan ready</strong>
                    </div>
                    <span className="android-status-dot" />
                  </div>

                  <div className="android-bar-chart">
                    <span className="android-bar android-bar--1" />
                    <span className="android-bar android-bar--2" />
                    <span className="android-bar android-bar--3" />
                    <span className="android-bar android-bar--4" />
                  </div>

                  <div className="android-mini-feed">
                    <div className="android-feed-row">
                      <strong>Package diff</strong>
                      <span>2 новых сигнала</span>
                    </div>
                    <div className="android-feed-row">
                      <strong>Verdict</strong>
                      <span>1 пакет отправлен на deep scan</span>
                    </div>
                    <div className="android-feed-row">
                      <strong>Noise control</strong>
                      <span>AI скрывает шум до финального отчёта</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        <section className="android-verify-grid" aria-label="Локальные и серверные проверки Android-версии">
          <article className="surface-card android-verify-card android-verify-card--local">
            <div className="android-section-heading">
              <div className="eyebrow">On device</div>
              <h3>Что NeuralV проверяет локально</h3>
              <p>
                Быстрый слой остаётся на устройстве: он ловит понятные Android-сигналы раньше, чем понадобится
                тяжёлый серверный разбор.
              </p>
            </div>
            <ul className="android-check-list">
              {androidLocalChecks.map((item) => (
                <li key={item}>{item}</li>
              ))}
            </ul>
          </article>

          <article className="surface-card android-verify-card android-verify-card--server">
            <div className="android-section-heading">
              <div className="eyebrow">Cloud verdict</div>
              <h3>Что уходит на серверную перепроверку</h3>
              <p>
                Сервер закрывает тяжёлый анализ и оставляет телефону только то, что действительно нужно показать
                пользователю быстро и чисто.
              </p>
            </div>
            <ul className="android-check-list">
              {androidServerChecks.map((item) => (
                <li key={item}>{item}</li>
              ))}
            </ul>
          </article>
        </section>

        <section className="surface-card android-loop-card">
          <div className="android-section-heading android-section-heading--wide">
            <div className="eyebrow">Always on</div>
            <h3>Как выглядит контур 24/7 защиты</h3>
            <p>
              Android-версия работает как последовательность коротких и понятных шагов: обнаружить, оценить,
              эскалировать, вернуть спокойный verdict.
            </p>
          </div>
          <div className="android-loop-grid">
            {androidProtectionLoop.map((step, index) => (
              <article key={step.title} className="android-loop-step">
                <span className="android-loop-index">0{index + 1}</span>
                <h4>{step.title}</h4>
                <p>{step.text}</p>
              </article>
            ))}
          </div>
        </section>

        <section id="android-modes" className="android-tier-grid" aria-label="Режимы доступа Android-версии">
          {androidCapabilityTiers.map((tier) => (
            <article key={tier.id} className={`surface-card android-tier-card android-tier-card--${tier.accent}`}>
              <div className="android-tier-head">
                <div>
                  <div className="eyebrow">{tier.badge}</div>
                  <h3>{tier.title}</h3>
                </div>
                <span className="android-tier-token">{tier.id}</span>
              </div>
              <p className="android-tier-summary">{tier.summary}</p>
              <ul className="android-tier-list">
                {tier.bullets.map((item) => (
                  <li key={item}>{item}</li>
                ))}
              </ul>
            </article>
          ))}
        </section>

        <section className="android-showcase-block">
          <div className="android-section-heading android-section-heading--wide">
            <div className="eyebrow">Screen-like sections</div>
            <h3>Три ключевых состояния интерфейса</h3>
            <p>
              Страница показывает не абстрактные слоганы, а тот ритм, в котором Android-клиент реально живёт:
              быстрый скан, server escalation и чистый итоговый отчёт.
            </p>
          </div>
          <div className="android-preview-grid">
            {androidPreviewScreens.map((screen) => (
              <article key={screen.title} className="surface-card android-preview-card">
                <div className="android-preview-window">
                  <div className="android-preview-header">
                    <span className="android-preview-dot" />
                    <span className="android-preview-dot" />
                    <span className="android-preview-dot" />
                  </div>
                  <div className="eyebrow">{screen.eyebrow}</div>
                  <h4>{screen.title}</h4>
                  <p>{screen.text}</p>
                  <div className="android-preview-chipset">
                    {screen.chips.map((chip) => (
                      <span key={chip} className="android-preview-chip">
                        {chip}
                      </span>
                    ))}
                  </div>
                </div>
                <p className="android-preview-footer">{screen.footer}</p>
              </article>
            ))}
          </div>
        </section>

        <section className="android-detail-grid">
          <article className="surface-card android-build-card">
            <div className="android-section-heading">
              <div className="eyebrow">APK release</div>
              <h3>Что видно перед установкой</h3>
              <p>
                Эта страница не прячет релиз в одну безликую кнопку: версия, файл, канал и хэш доступны до начала
                установки APK.
              </p>
            </div>

            <div className="android-build-meta">
              <div className="android-build-meta-item">
                <span>Version</span>
                <strong>{version}</strong>
              </div>
              <div className="android-build-meta-item">
                <span>Channel</span>
                <strong>{releaseChannel}</strong>
              </div>
              <div className="android-build-meta-item">
                <span>File</span>
                <strong>{fileName}</strong>
              </div>
              <div className="android-build-meta-item">
                <span>Manifest time</span>
                <strong>{generatedAt}</strong>
              </div>
            </div>

            <div className="android-sha-block">
              <span>SHA256</span>
              <code>{artifact?.sha256 ?? 'Будет показан автоматически после публикации Android artifact.'}</code>
            </div>

            <ul className="android-note-list">
              {(artifact?.notes?.length ? artifact.notes : ['APK и release notes подтянутся сюда автоматически из backend manifest.']).map(
                (note) => (
                  <li key={note}>{note}</li>
                )
              )}
            </ul>

            <div className="android-build-actions">
              <DownloadAction artifact={artifact} label="Забрать Android APK" />
              <a href="/basedata/api/releases/manifest" target="_blank" rel="noreferrer">
                <md-outlined-button>Открыть manifest JSON</md-outlined-button>
              </a>
            </div>
          </article>

          <article id="android-install" className="surface-card android-steps-card">
            <div className="android-section-heading">
              <div className="eyebrow">Install flow</div>
              <h3>Установка APK без сюрпризов</h3>
              <p>
                Сценарий остаётся прямым: скачать, разрешить установку из доверенного источника, выбрать глубину
                режима после первого запуска.
              </p>
            </div>
            <div className="android-step-stack">
              {androidInstallSteps.map((step, index) => (
                <article key={step.title} className="android-step-card">
                  <span className="android-step-index">{index + 1}</span>
                  <div>
                    <h4>{step.title}</h4>
                    <p>{step.text}</p>
                    <small>{step.helper}</small>
                  </div>
                </article>
              ))}
            </div>
          </article>
        </section>

        <section className="android-detail-grid android-detail-grid--bottom">
          <article className="surface-card android-updates-card">
            <div className="android-section-heading">
              <div className="eyebrow">Update rhythm</div>
              <h3>Как приходят обновления</h3>
              <p>
                Обновление Android-сборки опирается на тот же release manifest: страница и клиент смотрят на один и
                тот же источник правды.
              </p>
            </div>
            <div className="android-update-list">
              {androidUpdateModes.map((mode) => (
                <article key={mode.title} className="android-update-card">
                  <h4>{mode.title}</h4>
                  <p>{mode.text}</p>
                  <small>{mode.helper}</small>
                </article>
              ))}
            </div>
          </article>

          <article className="surface-card android-trust-card">
            <div className="android-section-heading">
              <div className="eyebrow">Why this page exists</div>
              <h3>Одна Android-страница для трёх уровней глубины</h3>
              <p>
                Guest видит понятную установку и базовый статус. Regular получает серверные проверки и историю.
                Developer раскрывает техслой без отдельного интерфейса и без смены платформы.
              </p>
            </div>
            <div className="android-trust-ribbon">
              <span>guest: быстрый старт без перегруза</span>
              <span>regular: единый аккаунт и история</span>
              <span>developer: triage, hashes и reason codes</span>
            </div>
            <p className="android-trust-footnote">
              В результате страница одновременно выглядит как маркетинговый entry point, релиз-центр и понятное
              техническое описание Android-версии NeuralV.
            </p>
          </article>
        </section>
      </div>
    </>
  );
}

const androidPageStyles = `
.android-page {
  --android-ink: #14233f;
  --android-muted: #53627f;
  --android-line: rgba(28, 53, 104, 0.12);
  --android-indigo: #2e63ff;
  --android-cyan: #0b8e9f;
  --android-mint: #1b8c6c;
  --android-amber: #a96500;
  --android-shadow: 0 28px 90px rgba(30, 55, 118, 0.14);
}

.android-page .surface-card {
  isolation: isolate;
}

.android-page .android-hero-card {
  display: grid;
  grid-template-columns: minmax(0, 1.12fr) minmax(320px, 0.88fr);
  gap: 28px;
  padding: 32px;
  background:
    radial-gradient(circle at 12% 18%, rgba(110, 143, 255, 0.26), transparent 24%),
    radial-gradient(circle at 82% 16%, rgba(52, 206, 192, 0.18), transparent 18%),
    linear-gradient(155deg, rgba(255, 255, 255, 0.92), rgba(236, 243, 255, 0.86));
  box-shadow: var(--android-shadow);
}

.android-page .android-hero-card::before {
  content: '';
  position: absolute;
  inset: auto -120px -140px auto;
  width: 320px;
  height: 320px;
  border-radius: 44% 56% 62% 38%;
  background: linear-gradient(180deg, rgba(58, 102, 255, 0.12), rgba(34, 196, 165, 0.06));
  transform: rotate(-12deg);
}

.android-page .android-hero-copy {
  display: grid;
  gap: 22px;
  align-content: start;
}

.android-page .android-hero-copy h2,
.android-page .android-section-heading h3,
.android-page .android-loop-step h4,
.android-page .android-tier-card h3,
.android-page .android-preview-card h4,
.android-page .android-step-card h4,
.android-page .android-update-card h4,
.android-page .android-device-screen h3 {
  margin: 0;
}

.android-page .android-hero-copy h2 {
  font-size: clamp(2.8rem, 5vw, 4.7rem);
  line-height: 0.94;
  letter-spacing: -0.07em;
  max-width: 11ch;
}

.android-page .android-hero-lead,
.android-page .android-section-heading p,
.android-page .android-loop-step p,
.android-page .android-tier-summary,
.android-page .android-preview-card p,
.android-page .android-step-card p,
.android-page .android-update-card p,
.android-page .android-trust-footnote,
.android-page .android-device-screen p {
  margin: 0;
  color: var(--android-muted);
  line-height: 1.65;
}

.android-page .android-metric-grid,
.android-page .android-release-strip,
.android-page .android-verify-grid,
.android-page .android-tier-grid,
.android-page .android-preview-grid,
.android-page .android-detail-grid,
.android-page .android-build-meta {
  display: grid;
  gap: 18px;
}

.android-page .android-metric-grid {
  grid-template-columns: repeat(3, minmax(0, 1fr));
}

.android-page .android-metric-card,
.android-page .android-release-pill,
.android-page .android-build-meta-item {
  display: grid;
  gap: 10px;
  padding: 18px;
  border: 1px solid var(--android-line);
  background: rgba(255, 255, 255, 0.7);
  box-shadow: inset 0 1px 0 rgba(255, 255, 255, 0.45);
}

.android-page .android-metric-card {
  border-radius: 28px 28px 48px 28px;
}

.android-page .android-release-pill,
.android-page .android-build-meta-item {
  border-radius: 24px;
}

.android-page .android-metric-card strong,
.android-page .android-release-pill strong,
.android-page .android-build-meta-item strong {
  font-size: 1.02rem;
  color: var(--android-ink);
}

.android-page .android-metric-card span,
.android-page .android-release-pill span,
.android-page .android-build-meta-item span,
.android-page .android-sha-block span {
  font-size: 0.82rem;
  letter-spacing: 0.08em;
  text-transform: uppercase;
  color: var(--android-muted);
}

.android-page .android-hero-actions,
.android-page .android-build-actions,
.android-page .android-trust-ribbon,
.android-page .android-preview-chipset {
  display: flex;
  flex-wrap: wrap;
  gap: 12px;
}

.android-page .android-release-strip {
  grid-template-columns: repeat(4, minmax(0, 1fr));
}

.android-page .android-hero-visual {
  position: relative;
  min-height: 560px;
  display: grid;
  place-items: center;
}

.android-page .android-aura {
  position: absolute;
  border-radius: 999px;
  filter: blur(4px);
  animation: androidDrift 12s ease-in-out infinite;
}

.android-page .android-aura--a {
  width: 270px;
  height: 270px;
  top: 34px;
  left: 28px;
  background: rgba(102, 137, 255, 0.2);
}

.android-page .android-aura--b {
  width: 190px;
  height: 190px;
  right: 30px;
  top: 86px;
  background: rgba(46, 210, 198, 0.18);
  animation-delay: -3s;
}

.android-page .android-aura--c {
  width: 160px;
  height: 160px;
  right: 72px;
  bottom: 54px;
  background: rgba(255, 193, 92, 0.18);
  animation-delay: -6s;
}

.android-page .android-floating-chip {
  position: absolute;
  z-index: 2;
  padding: 12px 16px;
  border-radius: 999px;
  background: rgba(255, 255, 255, 0.82);
  border: 1px solid rgba(46, 99, 255, 0.14);
  box-shadow: 0 16px 28px rgba(51, 76, 138, 0.12);
  font-size: 0.84rem;
  color: var(--android-ink);
  backdrop-filter: blur(20px);
}

.android-page .android-floating-chip--left {
  top: 34px;
  left: 8px;
  animation: androidFloat 9s ease-in-out infinite;
}

.android-page .android-floating-chip--right {
  top: 148px;
  right: 0;
  animation: androidFloat 11s ease-in-out infinite;
}

.android-page .android-floating-chip--bottom {
  bottom: 26px;
  left: 18px;
  animation: androidFloat 10s ease-in-out infinite;
}

.android-page .android-device-frame {
  position: relative;
  z-index: 1;
  width: min(340px, 100%);
  padding: 14px;
  border-radius: 44px;
  background: linear-gradient(160deg, rgba(24, 37, 73, 0.96), rgba(18, 30, 62, 0.88));
  box-shadow: 0 28px 70px rgba(21, 35, 79, 0.28);
  animation: androidFloat 12s ease-in-out infinite;
}

.android-page .android-device-shell {
  padding: 10px;
  border-radius: 36px;
  background: linear-gradient(180deg, rgba(244, 248, 255, 0.18), rgba(255, 255, 255, 0.04));
}

.android-page .android-device-topline {
  height: 24px;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 10px;
}

.android-page .android-device-sensor {
  width: 10px;
  height: 10px;
  border-radius: 999px;
  background: rgba(255, 255, 255, 0.72);
}

.android-page .android-device-speaker {
  width: 92px;
  height: 8px;
  border-radius: 999px;
  background: rgba(255, 255, 255, 0.5);
}

.android-page .android-device-screen {
  display: grid;
  gap: 16px;
  min-height: 472px;
  padding: 22px;
  border-radius: 30px;
  background:
    radial-gradient(circle at top right, rgba(101, 132, 255, 0.22), transparent 22%),
    linear-gradient(180deg, #f7fbff 0%, #eef3ff 54%, #e8f8f4 100%);
}

.android-page .android-device-badge {
  justify-self: start;
  padding: 8px 12px;
  border-radius: 999px;
  background: rgba(20, 35, 63, 0.08);
  font-size: 0.78rem;
  letter-spacing: 0.08em;
  text-transform: uppercase;
}

.android-page .android-signal-panel {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  padding: 16px 18px;
  border-radius: 24px 24px 34px 24px;
  background: rgba(255, 255, 255, 0.72);
  border: 1px solid rgba(28, 53, 104, 0.1);
}

.android-page .android-signal-panel div {
  display: grid;
  gap: 4px;
}

.android-page .android-signal-panel span,
.android-page .android-feed-row span,
.android-page .android-step-card small,
.android-page .android-update-card small,
.android-page .android-preview-footer {
  color: var(--android-muted);
}

.android-page .android-status-dot {
  width: 14px;
  height: 14px;
  border-radius: 999px;
  background: linear-gradient(180deg, #18b678, #077f59);
  box-shadow: 0 0 0 8px rgba(24, 182, 120, 0.14);
}

.android-page .android-bar-chart {
  display: grid;
  grid-template-columns: repeat(4, minmax(0, 1fr));
  align-items: end;
  gap: 10px;
  min-height: 98px;
  padding: 16px;
  border-radius: 26px;
  background: rgba(255, 255, 255, 0.64);
  border: 1px solid rgba(28, 53, 104, 0.08);
}

.android-page .android-bar {
  display: block;
  border-radius: 999px 999px 16px 16px;
  background: linear-gradient(180deg, rgba(46, 99, 255, 0.92), rgba(12, 142, 159, 0.72));
  animation: androidPulse 4.2s ease-in-out infinite;
}

.android-page .android-bar--1 {
  height: 46%;
}

.android-page .android-bar--2 {
  height: 74%;
  animation-delay: -0.7s;
}

.android-page .android-bar--3 {
  height: 58%;
  animation-delay: -1.1s;
}

.android-page .android-bar--4 {
  height: 86%;
  animation-delay: -1.6s;
}

.android-page .android-mini-feed {
  display: grid;
  gap: 10px;
}

.android-page .android-feed-row {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 12px;
  padding: 14px 16px;
  border-radius: 22px;
  background: rgba(255, 255, 255, 0.7);
  border: 1px solid rgba(28, 53, 104, 0.08);
}

.android-page .android-feed-row strong {
  max-width: 44%;
}

.android-page .android-verify-grid,
.android-page .android-detail-grid {
  grid-template-columns: repeat(2, minmax(0, 1fr));
}

.android-page .android-verify-card,
.android-page .android-loop-card,
.android-page .android-build-card,
.android-page .android-steps-card,
.android-page .android-updates-card,
.android-page .android-trust-card {
  padding: 30px;
}

.android-page .android-verify-card {
  background: linear-gradient(180deg, rgba(255, 255, 255, 0.88), rgba(240, 246, 255, 0.82));
}

.android-page .android-verify-card--server,
.android-page .android-updates-card {
  background: linear-gradient(180deg, rgba(233, 245, 255, 0.92), rgba(240, 255, 251, 0.86));
}

.android-page .android-section-heading {
  display: grid;
  gap: 10px;
  margin-bottom: 18px;
}

.android-page .android-section-heading--wide {
  max-width: 64ch;
}

.android-page .android-check-list,
.android-page .android-tier-list,
.android-page .android-note-list {
  margin: 0;
  padding: 0;
  list-style: none;
  display: grid;
  gap: 14px;
}

.android-page .android-check-list li,
.android-page .android-tier-list li,
.android-page .android-note-list li {
  position: relative;
  padding-left: 22px;
  color: var(--android-muted);
  line-height: 1.62;
}

.android-page .android-check-list li::before,
.android-page .android-tier-list li::before,
.android-page .android-note-list li::before {
  content: '';
  position: absolute;
  top: 10px;
  left: 0;
  width: 10px;
  height: 10px;
  border-radius: 999px;
  background: linear-gradient(180deg, var(--android-indigo), var(--android-cyan));
}

.android-page .android-loop-card {
  background:
    radial-gradient(circle at top left, rgba(105, 138, 255, 0.16), transparent 24%),
    linear-gradient(180deg, rgba(255, 255, 255, 0.9), rgba(239, 245, 255, 0.84));
}

.android-page .android-loop-grid {
  display: grid;
  grid-template-columns: repeat(4, minmax(0, 1fr));
  gap: 14px;
}

.android-page .android-loop-step {
  display: grid;
  gap: 10px;
  padding: 20px;
  border-radius: 28px 28px 28px 48px;
  background: rgba(255, 255, 255, 0.72);
  border: 1px solid rgba(28, 53, 104, 0.08);
}

.android-page .android-loop-index,
.android-page .android-tier-token,
.android-page .android-step-index {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: fit-content;
  min-width: 42px;
  padding: 8px 12px;
  border-radius: 999px;
  font-weight: 700;
  letter-spacing: 0.05em;
}

.android-page .android-loop-index,
.android-page .android-step-index {
  background: rgba(46, 99, 255, 0.12);
  color: var(--android-indigo);
}

.android-page .android-tier-grid,
.android-page .android-preview-grid {
  grid-template-columns: repeat(3, minmax(0, 1fr));
}

.android-page .android-tier-card,
.android-page .android-preview-card {
  padding: 28px;
}

.android-page .android-tier-card {
  border-radius: 32px 56px 32px 32px;
}

.android-page .android-tier-card--glacier {
  background: linear-gradient(180deg, rgba(238, 245, 255, 0.98), rgba(255, 255, 255, 0.9));
}

.android-page .android-tier-card--mint {
  background: linear-gradient(180deg, rgba(233, 253, 247, 0.98), rgba(255, 255, 255, 0.9));
}

.android-page .android-tier-card--sun {
  background: linear-gradient(180deg, rgba(255, 245, 223, 0.98), rgba(255, 255, 255, 0.9));
}

.android-page .android-tier-head {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 14px;
  margin-bottom: 16px;
}

.android-page .android-tier-token {
  background: rgba(20, 35, 63, 0.08);
  color: var(--android-ink);
  text-transform: uppercase;
}

.android-page .android-tier-summary {
  margin-bottom: 18px;
}

.android-page .android-showcase-block {
  display: grid;
  gap: 18px;
}

.android-page .android-preview-card {
  display: grid;
  gap: 14px;
  background: linear-gradient(180deg, rgba(255, 255, 255, 0.9), rgba(242, 246, 255, 0.86));
}

.android-page .android-preview-window {
  display: grid;
  gap: 14px;
  min-height: 270px;
  padding: 18px;
  border-radius: 28px;
  background:
    radial-gradient(circle at top right, rgba(111, 140, 255, 0.16), transparent 24%),
    linear-gradient(180deg, rgba(255, 255, 255, 0.92), rgba(235, 242, 255, 0.86));
  border: 1px solid rgba(28, 53, 104, 0.08);
}

.android-page .android-preview-header {
  display: flex;
  gap: 8px;
}

.android-page .android-preview-dot {
  width: 10px;
  height: 10px;
  border-radius: 999px;
  background: rgba(20, 35, 63, 0.16);
}

.android-page .android-preview-chip {
  padding: 8px 10px;
  border-radius: 999px;
  background: rgba(255, 255, 255, 0.74);
  border: 1px solid rgba(46, 99, 255, 0.12);
  font-size: 0.8rem;
}

.android-page .android-build-meta {
  grid-template-columns: repeat(2, minmax(0, 1fr));
}

.android-page .android-sha-block {
  display: grid;
  gap: 10px;
  margin-top: 18px;
  padding: 18px;
  border-radius: 28px;
  background: rgba(20, 35, 63, 0.94);
}

.android-page .android-sha-block code {
  font-family: 'JetBrains Mono', 'SFMono-Regular', monospace;
  font-size: 0.88rem;
  line-height: 1.55;
  color: #eef4ff;
  word-break: break-word;
}

.android-page .android-note-list {
  margin-top: 18px;
}

.android-page .android-build-actions {
  margin-top: 20px;
}

.android-page .android-step-stack,
.android-page .android-update-list {
  display: grid;
  gap: 14px;
}

.android-page .android-step-card,
.android-page .android-update-card {
  display: grid;
  gap: 12px;
  padding: 18px;
  border-radius: 26px;
  background: rgba(255, 255, 255, 0.72);
  border: 1px solid rgba(28, 53, 104, 0.08);
}

.android-page .android-step-card {
  grid-template-columns: auto 1fr;
  align-items: start;
}

.android-page .android-step-card div {
  display: grid;
  gap: 8px;
}

.android-page .android-detail-grid--bottom .android-trust-card {
  background:
    radial-gradient(circle at 100% 0, rgba(103, 136, 255, 0.2), transparent 24%),
    linear-gradient(180deg, rgba(255, 255, 255, 0.92), rgba(239, 245, 255, 0.84));
}

.android-page .android-trust-ribbon {
  margin: 16px 0 0;
}

.android-page .android-trust-ribbon span {
  padding: 12px 16px;
  border-radius: 999px;
  background: rgba(255, 255, 255, 0.76);
  border: 1px solid rgba(46, 99, 255, 0.12);
  color: var(--android-ink);
}

.android-page .android-trust-footnote {
  margin-top: 18px;
}

@keyframes androidFloat {
  0%,
  100% {
    transform: translate3d(0, 0, 0);
  }
  50% {
    transform: translate3d(0, -14px, 0);
  }
}

@keyframes androidDrift {
  0%,
  100% {
    transform: translate3d(0, 0, 0) scale(1);
  }
  50% {
    transform: translate3d(14px, -12px, 0) scale(1.05);
  }
}

@keyframes androidPulse {
  0%,
  100% {
    opacity: 0.82;
    transform: scaleY(0.96);
  }
  50% {
    opacity: 1;
    transform: scaleY(1.04);
  }
}

@media (max-width: 1120px) {
  .android-page .android-hero-card,
  .android-page .android-verify-grid,
  .android-page .android-detail-grid,
  .android-page .android-tier-grid,
  .android-page .android-preview-grid,
  .android-page .android-loop-grid {
    grid-template-columns: 1fr;
  }

  .android-page .android-hero-visual {
    min-height: 480px;
  }

  .android-page .android-metric-grid,
  .android-page .android-release-strip {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }
}

@media (max-width: 760px) {
  .android-page .android-hero-card,
  .android-page .android-verify-card,
  .android-page .android-loop-card,
  .android-page .android-tier-card,
  .android-page .android-preview-card,
  .android-page .android-build-card,
  .android-page .android-steps-card,
  .android-page .android-updates-card,
  .android-page .android-trust-card {
    padding: 22px;
  }

  .android-page .android-hero-copy h2 {
    max-width: none;
    font-size: clamp(2.35rem, 10vw, 3.7rem);
  }

  .android-page .android-metric-grid,
  .android-page .android-release-strip,
  .android-page .android-build-meta,
  .android-page .android-step-card {
    grid-template-columns: 1fr;
  }

  .android-page .android-hero-visual {
    min-height: 420px;
  }

  .android-page .android-device-frame {
    width: min(292px, 100%);
  }

  .android-page .android-device-screen {
    min-height: 420px;
    padding: 18px;
  }

  .android-page .android-floating-chip {
    position: static;
    justify-self: center;
  }
}
`;
