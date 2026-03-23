import { FormEvent, useState } from 'react';
import { AuthPageLayout } from '../components/AuthPageLayout';
import { requestPasswordResetCode, requestPasswordResetLink } from '../lib/siteAuth';

export function PasswordResetRequestPage() {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [mode, setMode] = useState<'link' | 'code'>('link');

  async function handleSubmit(event: FormEvent) {
    event.preventDefault();
    if (!email.trim() || loading) {
      return;
    }

    setLoading(true);
    setMessage(null);
    setError(null);

    const result = mode === 'link'
      ? await requestPasswordResetLink({ email: email.trim() })
      : await requestPasswordResetCode({ email: email.trim() });

    setLoading(false);

    if (!result.ok) {
      setError(result.error || 'Не удалось отправить запрос.');
      return;
    }

    setMessage(result.data?.message || 'Инструкция отправлена.');
  }

  return (
    <AuthPageLayout
      title="Сброс пароля"
      description="Web-страница для запроса reset-ссылки или reset-кода через тот же backend auth route."
    >
      <form className="auth-form auth-form-reset-request" onSubmit={handleSubmit}>
        <div className="auth-segmented">
          <button
            type="button"
            className={`segment${mode === 'link' ? ' is-active' : ''}`}
            onClick={() => setMode('link')}
          >
            Ссылка
          </button>
          <button
            type="button"
            className={`segment${mode === 'code' ? ' is-active' : ''}`}
            onClick={() => setMode('code')}
          >
            Код
          </button>
        </div>

        <label className="auth-field">
          <span className="auth-field-label">Почта</span>
          <input className="auth-input" type="email" autoComplete="email" value={email} onChange={(event) => setEmail(event.target.value)} />
        </label>

        {message ? <p className="hero-support-text">{message}</p> : null}
        {error ? <p className="auth-error-text">{error}</p> : null}

        <div className="auth-actions auth-actions-primary">
          <button className="nv-button" type="submit" disabled={loading || !email.trim()}>
            {loading ? 'Отправляем...' : mode === 'link' ? 'Отправить ссылку' : 'Отправить код'}
          </button>
        </div>
      </form>
    </AuthPageLayout>
  );
}
