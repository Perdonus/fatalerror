import { FormEvent, useMemo, useState } from 'react';
import { AuthPageLayout } from '../components/AuthPageLayout';
import { PasswordStrengthMeter } from '../components/PasswordStrengthMeter';
import {
  confirmPasswordReset,
  confirmPasswordResetCode,
  evaluatePasswordStrength
} from '../lib/siteAuth';

export function PasswordResetConfirmPage() {
  const params = useMemo(() => new URLSearchParams(window.location.search), []);
  const [mode, setMode] = useState<'token' | 'code'>(params.get('token') ? 'token' : 'code');
  const [email, setEmail] = useState(params.get('email')?.trim() || '');
  const [token, setToken] = useState(params.get('token')?.trim() || '');
  const [code, setCode] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const strength = useMemo(() => evaluatePasswordStrength(password), [password]);
  const ready = password.length >= 6 && confirmPassword === password && email.trim().length > 0 && (mode === 'token' ? token.trim().length > 0 : code.trim().length >= 6);

  async function handleSubmit(event: FormEvent) {
    event.preventDefault();
    if (!ready || loading) {
      return;
    }

    setLoading(true);
    setMessage(null);
    setError(null);

    const result = mode === 'token'
      ? await confirmPasswordReset({ email: email.trim(), token: token.trim(), password })
      : await confirmPasswordResetCode({ email: email.trim(), code: code.trim(), password });

    setLoading(false);

    if (!result.ok) {
      setError(result.error || 'Не удалось обновить пароль.');
      return;
    }

    setMessage(result.data?.message || 'Пароль обновлён.');
  }

  return (
    <AuthPageLayout
      title="Новый пароль"
      description="Страница готова и для deep-link token flow, и для ручного code flow. Parent может повесить её на отдельный маршрут или protected reset flow."
    >
      <form className="auth-form auth-form-reset-confirm" onSubmit={handleSubmit}>
        <div className="auth-segmented">
          <button type="button" className={`segment${mode === 'token' ? ' is-active' : ''}`} onClick={() => setMode('token')}>
            Token
          </button>
          <button type="button" className={`segment${mode === 'code' ? ' is-active' : ''}`} onClick={() => setMode('code')}>
            Код
          </button>
        </div>

        <label className="auth-field">
          <span className="auth-field-label">Почта</span>
          <input className="auth-input" type="email" autoComplete="email" value={email} onChange={(event) => setEmail(event.target.value)} />
        </label>

        {mode === 'token' ? (
          <label className="auth-field">
            <span className="auth-field-label">Token</span>
            <input className="auth-input" type="text" value={token} onChange={(event) => setToken(event.target.value)} />
          </label>
        ) : (
          <label className="auth-field">
            <span className="auth-field-label">Код</span>
            <input className="auth-input auth-code-input" type="text" inputMode="numeric" maxLength={6} value={code} onChange={(event) => setCode(event.target.value.replace(/\D+/g, '').slice(0, 6))} />
          </label>
        )}

        <label className="auth-field">
          <span className="auth-field-label">Новый пароль</span>
          <input className="auth-input" type="password" autoComplete="new-password" value={password} onChange={(event) => setPassword(event.target.value)} />
        </label>

        <PasswordStrengthMeter password={password} />

        <label className="auth-field">
          <span className="auth-field-label">Повтор пароля</span>
          <input className="auth-input" type="password" autoComplete="new-password" value={confirmPassword} onChange={(event) => setConfirmPassword(event.target.value)} />
        </label>

        {confirmPassword.length > 0 && confirmPassword !== password ? <p className="auth-error-text">Пароли не совпадают.</p> : null}
        {strength.label === 'weak' && password.length > 0 ? <p className="hero-support-text">Пароль стоит усилить.</p> : null}
        {message ? <p className="hero-support-text">{message}</p> : null}
        {error ? <p className="auth-error-text">{error}</p> : null}

        <div className="auth-actions auth-actions-primary">
          <button className="nv-button" type="submit" disabled={!ready || loading}>
            {loading ? 'Сохраняем...' : 'Обновить пароль'}
          </button>
        </div>
      </form>
    </AuthPageLayout>
  );
}
