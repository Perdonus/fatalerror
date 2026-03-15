import { useEffect, useMemo, useState } from 'react';
import { getArtifact, isArtifactReady } from '../lib/manifest';
import { useReleaseManifest } from '../hooks/useReleaseManifest';

type InstallMode = 'gui' | 'cli';
type DistroKey = 'ubuntu' | 'fedora' | 'arch' | 'generic';

type DistroOption = {
  key: DistroKey;
  label: string;
  title: string;
  note: string;
};

const NV_INSTALL_URL = 'https://sosiskibot.ru/neuralv/install/nv.sh';

const distroOptions: DistroOption[] = [
  {
    key: 'ubuntu',
    label: 'Ubuntu / Debian',
    title: 'Ubuntu, Debian, Pop!_OS, Mint',
    note: 'Хороший вариант для обычного рабочего стола.'
  },
  {
    key: 'fedora',
    label: 'Fedora / RHEL',
    title: 'Fedora, Nobara, RHEL-совместимые',
    note: 'Подходит, если предпочитаешь RPM-мир и desktop-сессию.'
  },
  {
    key: 'arch',
    label: 'Arch / Manjaro',
    title: 'Arch, EndeavourOS, Manjaro',
    note: 'Удобно, если ты и так живёшь в терминале и любишь контролировать установку.'
  },
  {
    key: 'generic',
    label: 'Другое',
    title: 'Любой совместимый x64 Linux',
    note: 'Если твой дистрибутив не в списке, используй общий сценарий.'
  }
];

const featureCards = [
  {
    title: 'GUI',
    text: 'Для рабочего стола, когда хочется обычное окно и историю проверок.'
  },
  {
    title: 'CLI',
    text: 'Для терминала, SSH и машин, где не нужен тяжёлый интерфейс.'
  },
  {
    title: 'Daemon',
    text: 'Для фоновой защиты, если нужен постоянный контроль в системе.'
  }
];

function buildCliCommands(): string {
  return [
    '# 1) Установите nv',
    `curl -fsSL ${NV_INSTALL_URL} | sh`,
    '',
    '# 2) Поставьте NeuralV CLI',
    'nv install neuralv@latest',
    '',
    '# 3) Проверьте версии',
    'nv -v',
    'neuralv -v'
  ].join('\n');
}

function buildGuiCommands(distro: DistroOption, downloadUrl?: string): string {
  const sourceLine = downloadUrl
    ? `curl -L "${downloadUrl}" -o neuralv-linux.tar.gz`
    : 'curl -L "<ссылка-на-gui-архив>" -o neuralv-linux.tar.gz';

  return [
    `# ${distro.title}`,
    '# 1) Скачайте GUI-архив',
    sourceLine,
    '',
    '# 2) Распакуйте его в домашнюю папку',
    'mkdir -p ~/.local/opt/neuralv',
    'tar -xzf neuralv-linux.tar.gz -C ~/.local/opt/neuralv',
    '',
    '# 3) Запустите приложение',
    '~/.local/opt/neuralv/neuralv'
  ].join('\n');
}

export function LinuxPage() {
  const manifestState = useReleaseManifest();
  const guiArtifact = getArtifact(manifestState.manifest, 'linux');
  const cliArtifact = getArtifact(manifestState.manifest, 'shell');
  const nvArtifact = getArtifact(manifestState.manifest, 'nv');
  const guiReady = isArtifactReady(guiArtifact);
  const cliReady = isArtifactReady(cliArtifact) || isArtifactReady(nvArtifact);

  const [installMode, setInstallMode] = useState<InstallMode>(() => (guiReady ? 'gui' : 'cli'));
  const [distro, setDistro] = useState<DistroKey>('ubuntu');
  const [copyState, setCopyState] = useState<'idle' | 'done'>('idle');

  useEffect(() => {
    if (installMode === 'gui' && !guiReady) {
      setInstallMode('cli');
    }
  }, [guiReady, installMode]);

  const selectedDistro = distroOptions.find((item) => item.key === distro) ?? distroOptions[0];

  const commandText = useMemo(() => {
    if (installMode === 'gui') {
      return buildGuiCommands(selectedDistro, guiArtifact?.downloadUrl);
    }
    return buildCliCommands();
  }, [guiArtifact?.downloadUrl, installMode, selectedDistro]);

  const installTitle = installMode === 'gui' ? 'Установка GUI' : 'Установка CLI';
  const installLead = installMode === 'gui'
    ? 'Выбери дистрибутив и бери готовые команды для desktop-версии.'
    : 'CLI ставится через nv и хорошо подходит для терминала, SSH и headless-машин.';

  const handleCopy = async () => {
    if (typeof navigator === 'undefined' || !navigator.clipboard) {
      return;
    }

    try {
      await navigator.clipboard.writeText(commandText);
      setCopyState('done');
      window.setTimeout(() => setCopyState('idle'), 1600);
    } catch {
      setCopyState('idle');
    }
  };

  return (
    <div className="page-stack">
      <section className="hero-card platform-hero linux-hero">
        <div className="hero-copy">
          <span className="section-kicker">Linux</span>
          <h1>Выбери GUI или CLI и возьми готовые команды.</h1>
          <p>
            Сайт не гоняет тебя по длинным инструкциям. Ты выбираешь формат, дистрибутив и сразу получаешь нормальный install flow.
          </p>
          <div className="hero-actions">
            <a className="nv-button" href="#linux-install">Открыть установку</a>
            {guiReady && guiArtifact?.downloadUrl ? (
              <a className="nv-button tonal" href={guiArtifact.downloadUrl} target="_blank" rel="noreferrer">Скачать GUI</a>
            ) : (
              <button className="nv-button tonal is-disabled" type="button" disabled>GUI скоро появится</button>
            )}
          </div>
        </div>

        <div className="hero-panel">
          <div className="mini-stat">
            <span className="mini-stat-label">Подходит для</span>
            <strong>Desktop, терминала и daemon-сценариев</strong>
          </div>
          <div className="mini-stat">
            <span className="mini-stat-label">CLI</span>
            <strong>{cliReady ? 'Готов' : 'Скоро'}</strong>
          </div>
          <div className="mini-stat">
            <span className="mini-stat-label">GUI</span>
            <strong>{guiReady ? 'Готов' : 'Скоро'}</strong>
          </div>
        </div>
      </section>

      <section className="section-block">
        <div className="card-grid three-up compact-grid">
          {featureCards.map((card) => (
            <article key={card.title} className="content-card compact-card">
              <h3>{card.title}</h3>
              <p>{card.text}</p>
            </article>
          ))}
        </div>
      </section>

      <section id="linux-install" className="section-block">
        <div className="section-head">
          <span className="section-kicker">Установка</span>
          <h2>Выбери формат и систему</h2>
        </div>

        <div className="install-layout">
          <aside className="content-card chooser-card">
            <div className="chooser-section">
              <span className="chooser-label">Формат</span>
              <div className="segmented-row">
                <button
                  type="button"
                  className={`segment${installMode === 'gui' ? ' is-active' : ''}`}
                  onClick={() => setInstallMode('gui')}
                  disabled={!guiReady}
                >
                  GUI
                </button>
                <button
                  type="button"
                  className={`segment${installMode === 'cli' ? ' is-active' : ''}`}
                  onClick={() => setInstallMode('cli')}
                >
                  CLI
                </button>
              </div>
              {!guiReady && <p className="chooser-note">GUI-архив ещё готовится, поэтому по умолчанию открыт CLI.</p>}
            </div>

            <div className="chooser-section">
              <span className="chooser-label">Дистрибутив</span>
              <div className="distro-grid">
                {distroOptions.map((option) => (
                  <button
                    key={option.key}
                    type="button"
                    className={`distro-pill${distro === option.key ? ' is-active' : ''}`}
                    onClick={() => setDistro(option.key)}
                  >
                    {option.label}
                  </button>
                ))}
              </div>
              <p className="chooser-note">{selectedDistro.note}</p>
            </div>

            <div className="chooser-section helper-box">
              <span className="chooser-label">Что выбрать</span>
              <p><strong>GUI</strong> — если хочешь обычное окно и мышку.</p>
              <p><strong>CLI</strong> — если живёшь в терминале, SSH или ставишь на слабую машину.</p>
            </div>
          </aside>

          <div className="content-card install-card">
            <div className="install-card-head">
              <div>
                <span className="section-kicker">{installMode === 'gui' ? 'GUI' : 'CLI'}</span>
                <h3>{installTitle}</h3>
                <p>{installLead}</p>
              </div>
              <button className="copy-button" type="button" onClick={handleCopy}>
                {copyState === 'done' ? 'Скопировано' : 'Скопировать'}
              </button>
            </div>

            <div className="command-shell">
              <pre>{commandText}</pre>
            </div>

            <div className="install-card-footer">
              {installMode === 'gui' ? (
                guiReady && guiArtifact?.downloadUrl ? (
                  <a className="nv-button tonal" href={guiArtifact.downloadUrl} target="_blank" rel="noreferrer">Скачать GUI</a>
                ) : (
                  <button className="nv-button tonal is-disabled" type="button" disabled>GUI скоро появится</button>
                )
              ) : (
                <a className="nv-button tonal" href={NV_INSTALL_URL} target="_blank" rel="noreferrer">Открыть nv.sh</a>
              )}

              <span className="install-hint">
                {installMode === 'gui'
                  ? 'Если нужен фоновой режим, потом можно поставить CLI и daemon через nv.'
                  : 'CLI подходит и для обычного терминала, и для headless-сценариев.'}
              </span>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
