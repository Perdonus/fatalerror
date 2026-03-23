import { useEffect, useState } from 'react';
import { AuthPageLayout } from '../components/AuthPageLayout';
import { SessionSummaryCard } from '../components/SessionSummaryCard';
import {
  SiteAuthSession,
  fetchCurrentSiteUser,
  logoutSiteSession,
  readStoredSiteSession,
  refreshStoredSiteSession
} from '../lib/siteAuth';

export function AccountActionsPage() {
  const [session, setSession] = useState<SiteAuthSession | null>(() => readStoredSiteSession());
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    setSession(readStoredSiteSession());
  }, []);

  async function handleSyncProfile() {
    setLoading(true);
    setError(null);
    setMessage(null);
    const result = await fetchCurrentSiteUser();
    setLoading(false);
    if (!result.ok || !result.data) {
      setError(result.error || 'Не удалось загрузить профиль.');
      return;
    }
    setSession(result.data);
    setMessage('Профиль обновлён.');
  }

  async function handleRefresh() {
    setLoading(true);
    setError(null);
    setMessage(null);
    const result = await refreshStoredSiteSession();
    setLoading(false);
    if (!result.ok || !result.data) {
      setError(result.error || 'Не удалось обновить access token.');
      return;
    }
    setSession(result.data);
    setMessage('Access token обновлён.');
  }

  async function handleLogout() {
    setLoading(true);
    setError(null);
    setMessage(null);
    await logoutSiteSession();
    setLoading(false);
    setSession(null);
    setMessage('Сессия очищена.');
  }

  return (
    <AuthPageLayout
      title="Account actions"
      description="Набор готовых web-форм для protected слоя: sync profile, refresh token и logout."
      aside={<SessionSummaryCard session={session} title="Состояние local session" />}
    >
      <div className="auth-form auth-account-actions">
        <div className="auth-actions auth-actions-stacked auth-actions-primary">
          <button className="nv-button" type="button" onClick={handleSyncProfile} disabled={loading || !session}>
            {loading ? 'Синхронизация...' : 'Синхронизировать профиль'}
          </button>
          <button className="nv-button tonal" type="button" onClick={handleRefresh} disabled={loading || !session}>
            Обновить access token
          </button>
          <button className="nv-button tonal" type="button" onClick={handleLogout} disabled={loading}>
            Выйти и очистить session
          </button>
        </div>

        {message ? <p className="hero-support-text">{message}</p> : null}
        {error ? <p className="auth-error-text">{error}</p> : null}
      </div>
    </AuthPageLayout>
  );
}
