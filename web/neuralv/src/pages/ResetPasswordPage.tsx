import { useEffect, useMemo, useState } from 'react';

function buildDeepLink(base: string, token: string, email: string) {
  const url = new URL(base);
  url.searchParams.set('token', token);
  url.searchParams.set('email', email);
  return url.toString();
}

export function ResetPasswordPage() {
  const [copied, setCopied] = useState(false);
  const [openAttempted, setOpenAttempted] = useState(false);

  const params = useMemo(() => new URLSearchParams(window.location.search), []);
  const token = params.get('token')?.trim() ?? '';
  const email = params.get('email')?.trim() ?? '';
  const valid = token.length > 0 && email.length > 0;

  const primaryDeepLink = useMemo(
    () => (valid ? buildDeepLink('shieldsecurity://auth/reset-password', token, email) : ''),
    [email, token, valid]
  );
  const secondaryDeepLink = useMemo(
    () => (valid ? buildDeepLink('neuralv://auth/reset-password', token, email) : ''),
    [email, token, valid]
  );

  useEffect(() => {
    if (!valid || openAttempted) {
      return;
    }

    setOpenAttempted(true);
    const timer = window.setTimeout(() => {
      window.location.href = primaryDeepLink;
    }, 180);

    return () => window.clearTimeout(timer);
  }, [openAttempted, primaryDeepLink, valid]);

  async function copyDeepLink() {
    if (!primaryDeepLink) {
      return;
    }

    try {
      await navigator.clipboard.writeText(primaryDeepLink);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 2200);
    } catch {
      setCopied(false);
    }
  }

  return (
    <div className="page-stack">
      <section className="hero-card reset-hero">
        <div className="hero-copy reset-copy">
          <h1>Сброс пароля.</h1>
          <p>
            Эта страница нужна только для перехода из письма. Она открывает NeuralV на экране
            сброса пароля с уже готовыми данными.
          </p>
          <div className="hero-actions">
            {valid ? (
              <>
                <a className="nv-button" href={primaryDeepLink}>
                  Открыть в NeuralV
                </a>
                <button className="nv-button tonal" type="button" onClick={copyDeepLink}>
                  {copied ? 'Ссылка скопирована' : 'Скопировать ссылку'}
                </button>
              </>
            ) : (
              <button className="nv-button is-disabled" type="button" disabled>
                Ссылка сброса неполная
              </button>
            )}
          </div>
        </div>

        <article className="content-card reset-card">
          <h3>Если приложение не открылось</h3>
          <p>Нажми кнопку ещё раз или используй резервную ссылку ниже.</p>
          <div className="reset-links">
            {valid ? (
              <>
                <a className="shell-link reset-link" href={primaryDeepLink}>
                  shieldsecurity://auth/reset-password
                </a>
                <a className="shell-link reset-link" href={secondaryDeepLink}>
                  neuralv://auth/reset-password
                </a>
              </>
            ) : (
              <span className="hero-support-text">В письме не хватает token или email.</span>
            )}
          </div>
        </article>
      </section>
    </div>
  );
}
