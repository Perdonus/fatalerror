import { ManifestBanner } from '../components/ManifestBanner';
import { useReleaseManifest } from '../hooks/useReleaseManifest';
import { getArtifact, type ReleaseArtifact } from '../lib/manifest';

const windowsPageStyles = `
  .nv-windows {
    display: grid;
    gap: 20px;
  }

  .nv-windows-hero,
  .nv-windows-install,
  .nv-windows-essentials {
    display: grid;
    gap: 18px;
  }

  .nv-windows-hero {
    grid-template-columns: minmax(0, 1.08fr) minmax(280px, 0.92fr);
    padding: clamp(24px, 4vw, 38px);
    background:
      radial-gradient(circle at 0 0, rgba(84, 170, 255, 0.14), transparent 28%),
      radial-gradient(circle at 100% 0, rgba(16, 155, 132, 0.12), transparent 24%),
      linear-gradient(180deg, var(--nv-surface-strong), var(--nv-surface));
  }

  .nv-windows-copy,
  .nv-windows-side,
  .nv-install-card,
  .nv-essential-card {
    display: grid;
    gap: 12px;
  }

  .nv-windows-copy h1,
  .nv-install-card h3,
  .nv-essential-card h3 {
    margin: 0;
    letter-spacing: -0.04em;
  }

  .nv-windows-copy h1 {
    font-size: clamp(2.4rem, 6vw, 4.6rem);
    line-height: 0.94;
    max-width: 10ch;
  }

  .nv-windows-copy p,
  .nv-windows-side p,
  .nv-install-card p,
  .nv-essential-card p {
    margin: 0;
    color: var(--nv-text-soft);
    line-height: 1.6;
  }

  .nv-windows-eyebrow,
  .nv-command-label {
    color: var(--nv-text-faint);
    text-transform: uppercase;
    letter-spacing: 0.16em;
    font-size: 0.74rem;
  }

  .nv-windows-chip-row,
  .nv-windows-actions,
  .nv-pill-grid,
  .nv-command-stack {
    display: flex;
    flex-wrap: wrap;
    gap: 12px;
  }

  .nv-windows-chip,
  .nv-side-pill {
    padding: 10px 14px;
    border-radius: 999px;
    border: 1px solid var(--nv-stroke);
    background: var(--nv-surface-muted);
    color: var(--nv-text-soft);
  }

  .nv-side-pill strong {
    color: var(--nv-text);
    font-size: 0.98rem;
  }

  .nv-windows-install {
    grid-template-columns: repeat(3, minmax(0, 1fr));
  }

  .nv-install-card,
  .nv-essential-card {
    padding: 24px;
    border-radius: var(--nv-radius-xl);
    border: 1px solid var(--nv-stroke);
    background: var(--nv-surface);
  }

  .nv-command-stack {
    flex-direction: column;
  }

  .nv-command-row {
    display: grid;
    gap: 8px;
  }

  .nv-command-window {
    margin: 0;
    padding: 14px 16px;
    border-radius: 20px;
    border: 1px solid var(--nv-stroke);
    background: var(--nv-surface-muted);
    overflow-x: auto;
  }

  .nv-command-window code {
    display: block;
    white-space: pre-wrap;
    word-break: break-word;
    font-size: 0.92rem;
    line-height: 1.55;
    color: var(--nv-text);
  }

  .nv-download-meta {
    display: grid;
    gap: 10px;
  }

  .nv-download-meta code {
    font-size: 0.9rem;
    color: var(--nv-text-soft);
    word-break: break-all;
  }

  .nv-windows-essentials {
    grid-template-columns: repeat(3, minmax(0, 1fr));
  }

  @media (max-width: 1080px) {
    .nv-windows-hero,
    .nv-windows-install,
    .nv-windows-essentials {
      grid-template-columns: 1fr;
    }
  }
`;

function readMetadataString(artifact: ReleaseArtifact | undefined, key: string, fallback: string) {
  const metadata = artifact?.metadata;
  if (!metadata || typeof metadata !== 'object') {
    return fallback;
  }

  const value = metadata[key];
  return typeof value === 'string' && value.trim() ? value.trim() : fallback;
}

function commandBlock(label: string, command: string) {
  return (
    <div className="nv-command-row" key={`${label}-${command}`}>
      <div className="nv-command-label">{label}</div>
      <pre className="nv-command-window">
        <code>{command}</code>
      </pre>
    </div>
  );
}

export function WindowsPage() {
  const manifestState = useReleaseManifest();
  const artifact = getArtifact(manifestState.manifest, 'windows');
  const downloadUrl = artifact?.downloadUrl ?? '';
  const version = artifact?.version ?? 'pending';
  const fileName = artifact?.fileName ?? 'neuralv-windows.zip';
  const wingetPackageId = readMetadataString(artifact, 'wingetPackageId', 'NeuralV.NeuralV');
  const wingetInstallCommand = readMetadataString(
    artifact,
    'wingetInstallCommand',
    `winget install --id ${wingetPackageId} -e`
  );
  const wingetUpgradeCommand = readMetadataString(
    artifact,
    'wingetUpgradeCommand',
    `winget upgrade --id ${wingetPackageId} -e`
  );
  const wingetUninstallCommand = readMetadataString(
    artifact,
    'wingetUninstallCommand',
    `winget uninstall --id ${wingetPackageId} -e`
  );
  const nvBootstrapCommand = readMetadataString(
    artifact,
    'nvBootstrapCommand',
    'powershell -NoProfile -ExecutionPolicy Bypass -Command "irm https://sosiskibot.ru/neuralv/install/nv.ps1 | iex"'
  );
  const nvInstallCommand = readMetadataString(artifact, 'nvInstallCommand', 'nv install neuralv@latest');
  const nvUpdateCommand = readMetadataString(artifact, 'nvUpdateCommand', 'nv install neuralv@latest');
  const nvUninstallCommand = readMetadataString(artifact, 'nvUninstallCommand', 'nv uninstall neuralv');

  return (
    <>
      <style>{windowsPageStyles}</style>
      <div className="nv-windows">
        <ManifestBanner {...manifestState} />

        <section className="surface-card nv-windows-hero">
          <div className="nv-windows-copy">
            <div className="nv-windows-eyebrow">Windows</div>
            <h1>NeuralV для Windows.</h1>
            <p>
              Короткий путь: поставить GUI, войти тем же аккаунтом и сразу получить проверку EXE, DLL и новых файлов в фоне.
            </p>
            <div className="nv-windows-chip-row">
              <span className="nv-windows-chip">GUI</span>
              <span className="nv-windows-chip">Resident protection</span>
              <span className="nv-windows-chip">Server verdict</span>
            </div>
            <div className="nv-windows-actions">
              {downloadUrl ? (
                <a href={downloadUrl} target="_blank" rel="noreferrer">
                  <md-filled-button>Скачать для Windows</md-filled-button>
                </a>
              ) : (
                <md-outlined-button disabled>Сборка Windows готовится</md-outlined-button>
              )}
              <a href="#windows-install">
                <md-outlined-button>Команды установки</md-outlined-button>
              </a>
            </div>
          </div>

          <div className="nv-windows-side">
            <div className="nv-side-pill">
              <div className="nv-windows-eyebrow">Версия</div>
              <strong>{version}</strong>
            </div>
            <div className="nv-side-pill">
              <div className="nv-windows-eyebrow">Артефакт</div>
              <strong>{fileName}</strong>
            </div>
            <div className="nv-side-pill">
              <div className="nv-windows-eyebrow">Установка</div>
              <strong>winget, nv или прямое скачивание</strong>
            </div>
          </div>
        </section>

        <section id="windows-install" className="nv-windows-install">
          <article className="nv-install-card surface-card">
            <div className="nv-windows-eyebrow">Через winget</div>
            <h3>Самый короткий путь</h3>
            <p>Если у тебя уже есть winget, хватит одной команды на установку и двух команд на обслуживание.</p>
            <div className="nv-command-stack">
              {commandBlock('Установить', wingetInstallCommand)}
              {commandBlock('Обновить', wingetUpgradeCommand)}
              {commandBlock('Удалить', wingetUninstallCommand)}
            </div>
          </article>

          <article className="nv-install-card surface-card">
            <div className="nv-windows-eyebrow">Через nv</div>
            <h3>Если нужен свой менеджер</h3>
            <p>Сначала ставишь `nv`, потом держишь NeuralV через короткие команды без ручного поиска сборок.</p>
            <div className="nv-command-stack">
              {commandBlock('Поставить nv', nvBootstrapCommand)}
              {commandBlock('Установить NeuralV', nvInstallCommand)}
              {commandBlock('Обновить NeuralV', nvUpdateCommand)}
              {commandBlock('Удалить NeuralV', nvUninstallCommand)}
            </div>
          </article>

          <article className="nv-install-card surface-card">
            <div className="nv-windows-eyebrow">Прямое скачивание</div>
            <h3>Если хочешь забрать GUI сразу</h3>
            <p>Подходит для ручной установки, тестового стенда или когда нужен свежий zip без лишних шагов.</p>
            <div className="nv-download-meta">
              <div className="nv-command-label">Файл</div>
              <strong>{fileName}</strong>
              {artifact?.sha256 ? (
                <>
                  <div className="nv-command-label">SHA256</div>
                  <code>{artifact.sha256}</code>
                </>
              ) : null}
            </div>
            <div className="nv-windows-actions">
              {downloadUrl ? (
                <a href={downloadUrl} target="_blank" rel="noreferrer">
                  <md-filled-tonal-button>Скачать GUI zip</md-filled-tonal-button>
                </a>
              ) : (
                <md-outlined-button disabled>GUI ещё публикуется</md-outlined-button>
              )}
            </div>
          </article>
        </section>

        <section className="nv-windows-essentials">
          <article className="nv-essential-card surface-card">
            <div className="nv-windows-eyebrow">Локально</div>
            <h3>Проверяет EXE и DLL</h3>
            <p>Сразу смотрит файл, подпись и базовые признаки риска до того, как ты его откроешь.</p>
          </article>

          <article className="nv-essential-card surface-card">
            <div className="nv-windows-eyebrow">В фоне</div>
            <h3>Следит за новыми файлами</h3>
            <p>Downloads, temp и автозапуск контролируются без ручного запуска проверки каждый раз.</p>
          </article>

          <article className="nv-essential-card surface-card">
            <div className="nv-windows-eyebrow">На сервере</div>
            <h3>Дотягивает только спорное</h3>
            <p>Когда локального сигнала мало, сервер добирает контекст и отдаёт уже чистый итог без лишнего шума.</p>
          </article>
        </section>
      </div>
    </>
  );
}
