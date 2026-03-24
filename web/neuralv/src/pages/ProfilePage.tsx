import { FormEvent, useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { AuthPageLayout } from '../components/AuthPageLayout';
import { useSiteAuth } from '../components/SiteAuthProvider';
import { PasswordStrength } from '../components/PasswordStrength';
import {
  humanizeError,
  requestProfileEmailChange,
  requestProfileNameChange,
  requestProfilePasswordChange,
  validatePasswordStrength
} from '../lib/siteAuth';

function ProfileAside({
  name,
  email,
  isPremium
}: {
  name: string;
  email: string;
  isPremium: boolean;
}) {
  return (
    <article className="content-card auth-session-card auth-session-empty">
      <h3>Текущий аккаунт</h3>
      <p>{name || 'Аккаунт NeuralV'}</p>
      <p>{email || 'Почта недоступна'}</p>
      <p>{isPremium ? 'Расширенный доступ активен.' : 'Обычный доступ активен.'}</p>
    </article>
  );
}

export function ProfilePage() {
  const { user, refresh, logout } = useSiteAuth();
  const [name, setName] = useState(user?.name || '');
  const [email, setEmail] = useState(user?.email || '');
  const [focused, setFocused] = useState(false);
  const [demoPassword, setDemoPassword] = useState('');
  const [pending, setPending] = useState<'name' | 'email' | 'password' | 'refresh' | 'logout' | null>(null);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const passwordHint = useMemo(() => validatePasswordStrength(demoPassword), [demoPassword]);

  useEffect(() => {
    setName(user?.name || '');
    setEmail(user?.email || '');
  }, [user?.email, user?.name]);

  async function handleNameChange(event: FormEvent) {
    event.preventDefault();
    if (pending) {
      return;
    }

    setPending('name');
    setMessage('');
    setError('');
    const result = await requestProfileNameChange(name.trim());
    setPending(null);
    if (!result.ok) {
      setError(result.error || 'Не удалось отправить письмо для смены имени.');
      return;
    }
    setMessage(result.data?.message || 'Письмо для подтверждения нового имени отправлено.');
  }

  async function handleEmailChange(event: FormEvent) {
    event.preventDefault();
    if (pending) {
      return;
    }

    setPending('email');
    setMessage('');
    setError('');
    const result = await requestProfileEmailChange(email.trim());
    setPending(null);
    if (!result.ok) {
      setError(result.error || 'Не удалось отправить письмо для смены почты.');
      return;
    }
    setMessage(result.data?.message || 'Письмо для подтверждения новой почты отправлено.');
  }

  async function handlePasswordChange(event: FormEvent) {
    event.preventDefault();
    if (pending) {
      return;
    }

    setPending('password');
    setMessage('');
    setError('');
    const result = await requestProfilePasswordChange();
    setPending(null);
    if (!result.ok) {
      setError(result.error || 'Не удалось отправить письмо для смены пароля.');
      return;
    }
    setMessage(result.data?.message || 'Письмо для смены пароля отправлено.');
  }

  async function handleRefresh() {
    setPending('refresh');
    setMessage('');
    setError('');
    try {
      await refresh();
      setMessage('Профиль обновлён.');
    } catch (refreshError) {
      setError(humanizeError(refreshError, 'Не удалось обновить профиль.'));
    } finally {
      setPending(null);
    }
  }

  async function handleLogout() {
    setPending('logout');
    setMessage('');
    setError('');
    try {
      await logout();
      setMessage('Сессия завершена.');
    } catch (logoutError) {
      setError(humanizeError(logoutError, 'Не удалось завершить сессию.'));
    } finally {
      setPending(null);
    }
  }

  return (
    <AuthPageLayout
      title="Профиль"
      description="Имя, почта и пароль меняются через письмо подтверждения."
      aside={<ProfileAside name={user?.name || ''} email={user?.email || ''} isPremium={Boolean(user?.is_premium)} />}
      footer={(
        <div className="auth-actions auth-actions-wrap">
          <button className="nv-button" type="button" onClick={handleRefresh} disabled={pending !== null}>
            {pending === 'refresh' ? 'Обновляем...' : 'Обновить профиль'}
          </button>
          <button className="shell-chip" type="button" onClick={handleLogout} disabled={pending !== null}>
            {pending === 'logout' ? 'Выходим...' : 'Выйти'}
          </button>
        </div>
      )}
    >
      <div className="auth-profile-shell">
        <section className="auth-copy-block">
          <div>
            <h3>Имя</h3>
            <p className="hero-support-text">Отправим письмо, чтобы подтвердить новое имя.</p>
          </div>
          <form className="auth-form" onSubmit={handleNameChange}>
            <label className="auth-field">
              <span className="auth-field-label">Новое имя</span>
              <input className="auth-input" type="text" value={name} onChange={(event) => setName(event.target.value)} />
            </label>
            <button className="nv-button" type="submit" disabled={pending !== null}>Отправить письмо</button>
          </form>
        </section>

        <section className="auth-copy-block">
          <div>
            <h3>Почта</h3>
            <p className="hero-support-text">Новый адрес подтверждается по ссылке из письма.</p>
          </div>
          <form className="auth-form" onSubmit={handleEmailChange}>
            <label className="auth-field">
              <span className="auth-field-label">Новая почта</span>
              <input className="auth-input" type="email" value={email} onChange={(event) => setEmail(event.target.value)} />
            </label>
            <button className="nv-button" type="submit" disabled={pending !== null}>Отправить письмо</button>
          </form>
        </section>

        <section className="auth-copy-block">
          <div>
            <h3>Пароль</h3>
            <p className="hero-support-text">Новый пароль задаётся после перехода по ссылке из письма.</p>
          </div>
          <form className="auth-form" onSubmit={handlePasswordChange}>
            <label className="auth-field">
              <span className="auth-field-label">Проверить пароль заранее</span>
              <input
                className="auth-input"
                type="password"
                value={demoPassword}
                onChange={(event) => setDemoPassword(event.target.value)}
                onFocus={() => setFocused(true)}
                placeholder="Введите новый пароль"
              />
            </label>
            <PasswordStrength password={demoPassword} visible={focused || demoPassword.length > 0} />
            {passwordHint ? <div className="hero-support-text">Ссылка из письма откроет финальный шаг смены пароля.</div> : null}
            <button className="nv-button" type="submit" disabled={pending !== null}>Отправить письмо</button>
          </form>
        </section>

        {error ? <div className="form-message is-error">{humanizeError(error)}</div> : null}
        {message ? <div className="form-message is-success">{message}</div> : null}

        <div className="auth-footer-note">
          Нужен сброс без входа? <Link to="/reset-password">Открыть страницу сброса</Link>
        </div>
      </div>
    </AuthPageLayout>
  );
}
