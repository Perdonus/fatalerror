import { useEffect, useMemo, useState } from 'react';
import { fetchPublicVerifiedApps, humanizeError, type SiteVerifiedApp } from '../lib/siteAuth';
import '../styles/auth.css';

type PlatformFilter = 'all' | 'android' | 'windows' | 'linux';

const platformItems: Array<{ value: PlatformFilter; label: string }> = [
  { value: 'all', label: 'Все' },
  { value: 'windows', label: 'Windows' },
  { value: 'android', label: 'Android' },
  { value: 'linux', label: 'Linux' }
];

function VerifiedAppTile({ app }: { app: SiteVerifiedApp }) {
  const initial = (app.appName || '?').slice(0, 1).toUpperCase();
  const verifiedAt = app.verifiedAt ? new Intl.DateTimeFormat('ru-RU', { dateStyle: 'medium' }).format(new Date(app.verifiedAt)) : null;

  return (
    <article className="content-card developer-app-card developer-app-card-public">
      <div className="developer-app-card-head">
        <div className="developer-app-avatar" aria-hidden="true">
          {app.avatarUrl ? <img src={app.avatarUrl} alt="" loading="lazy" /> : <span>{initial}</span>}
        </div>
        <div className="developer-app-meta">
          <div className="developer-app-title-row">
            <strong>{app.appName}</strong>
            <span className="profile-status-pill is-active">Безопасно</span>
          </div>
          <p>{app.authorName || 'Проверенный разработчик'}</p>
        </div>
      </div>
      {app.publicSummary ? <p className="developer-app-summary">{app.publicSummary}</p> : null}
      <div className="developer-app-row">
        <span>Платформа</span>
        <strong>{String(app.platform || '').toUpperCase()}</strong>
      </div>
      <div className="developer-app-links">
        {app.repositoryUrl ? <a className="shell-chip" href={app.repositoryUrl} target="_blank" rel="noreferrer">Репозиторий</a> : null}
      </div>
      {verifiedAt ? <div className="developer-app-footnote">Проверено: {verifiedAt}</div> : null}
    </article>
  );
}

export function VerifiedAppsPage() {
  const [platform, setPlatform] = useState<PlatformFilter>('all');
  const [apps, setApps] = useState<SiteVerifiedApp[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    let disposed = false;

    async function load() {
      setLoading(true);
      setError('');
      const result = await fetchPublicVerifiedApps({ platform: platform === 'all' ? undefined : platform, limit: 60 });
      if (disposed) {
        return;
      }
      if (!result.ok) {
        setError(result.error || 'Не удалось загрузить каталог.');
        setApps([]);
        setLoading(false);
        return;
      }
      setApps(result.data || []);
      setLoading(false);
    }

    void load();
    return () => {
      disposed = true;
    };
  }, [platform]);

  const title = useMemo(() => {
    switch (platform) {
      case 'android':
        return 'Android';
      case 'windows':
        return 'Windows';
      case 'linux':
        return 'Linux';
      default:
        return 'Все платформы';
    }
  }, [platform]);

  return (
    <div className="page-stack profile-dashboard-shell verified-apps-shell">
      <section className="profile-dashboard-grid verified-apps-layout">
        <aside className="content-card profile-nav-card verified-apps-nav-card">
          <div className="profile-nav-head">
            <strong>Проверенные</strong>
          </div>
          <div className="profile-nav-list" role="tablist" aria-label="Платформы">
            {platformItems.map((item) => (
              <button
                key={item.value}
                type="button"
                className={`profile-nav-button${platform === item.value ? ' is-active' : ''}`}
                onClick={() => setPlatform(item.value)}
              >
                <span>{item.label}</span>
              </button>
            ))}
          </div>
        </aside>

        <div className="profile-dashboard-main">
          <article className="content-card profile-panel-card profile-panel-card-featured verified-apps-header-card">
            <div className="profile-panel-head">
              <h1>{title}</h1>
            </div>
          </article>

          {error ? <div className="form-message is-error">{humanizeError(error)}</div> : null}

          {loading ? (
            <div className="content-card profile-panel-card">
              <div className="profile-empty-copy">Загружаем каталог...</div>
            </div>
          ) : apps.length > 0 ? (
            <div className="developer-app-grid developer-app-grid-public">
              {apps.map((app) => (
                <VerifiedAppTile key={app.id || `${app.appName}-${app.platform}`} app={app} />
              ))}
            </div>
          ) : (
            <div className="content-card profile-panel-card">
              <div className="profile-empty-copy">Для этой платформы пока нет опубликованных приложений.</div>
            </div>
          )}
        </div>
      </section>
    </div>
  );
}
