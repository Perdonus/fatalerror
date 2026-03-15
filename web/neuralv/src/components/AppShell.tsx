import { useEffect, useMemo, useState } from 'react';
import { NavLink, Outlet } from 'react-router-dom';

type ThemePreference = 'system' | 'light' | 'dark';

type ThemeOption = {
  value: ThemePreference;
  label: string;
};

const THEME_STORAGE_KEY = 'neuralv-site-theme';
const MEDIA_QUERY = '(prefers-color-scheme: dark)';

const navItems = [
  { to: '/', label: 'Главная' },
  { to: '/android', label: 'Android' },
  { to: '/windows', label: 'Windows' },
  { to: '/linux', label: 'Linux' }
];

const themeOptions: ThemeOption[] = [
  { value: 'system', label: 'Авто' },
  { value: 'light', label: 'Светлая' },
  { value: 'dark', label: 'Тёмная' }
];

function readStoredPreference(): ThemePreference {
  if (typeof window === 'undefined') {
    return 'system';
  }

  const stored = window.localStorage.getItem(THEME_STORAGE_KEY);
  return stored === 'light' || stored === 'dark' || stored === 'system' ? stored : 'system';
}

function getSystemTheme(): 'light' | 'dark' {
  if (typeof window === 'undefined' || typeof window.matchMedia !== 'function') {
    return 'light';
  }

  return window.matchMedia(MEDIA_QUERY).matches ? 'dark' : 'light';
}

export function AppShell() {
  const [themePreference, setThemePreference] = useState<ThemePreference>(() => readStoredPreference());
  const [systemTheme, setSystemTheme] = useState<'light' | 'dark'>(() => getSystemTheme());

  useEffect(() => {
    if (typeof window === 'undefined' || typeof window.matchMedia !== 'function') {
      return undefined;
    }

    const media = window.matchMedia(MEDIA_QUERY);
    const handleChange = (event: MediaQueryListEvent) => {
      setSystemTheme(event.matches ? 'dark' : 'light');
    };

    setSystemTheme(media.matches ? 'dark' : 'light');

    if (typeof media.addEventListener === 'function') {
      media.addEventListener('change', handleChange);
      return () => media.removeEventListener('change', handleChange);
    }

    media.addListener(handleChange);
    return () => media.removeListener(handleChange);
  }, []);

  const resolvedTheme = useMemo(
    () => (themePreference === 'system' ? systemTheme : themePreference),
    [systemTheme, themePreference]
  );

  useEffect(() => {
    if (typeof document === 'undefined') {
      return;
    }

    const root = document.documentElement;
    root.dataset.theme = resolvedTheme;
    root.dataset.themePreference = themePreference;
    root.style.colorScheme = resolvedTheme;

    if (typeof window !== 'undefined') {
      window.localStorage.setItem(THEME_STORAGE_KEY, themePreference);
    }
  }, [resolvedTheme, themePreference]);

  const themeLabel = themeOptions.find((option) => option.value === themePreference)?.label ?? 'Авто';

  return (
    <div className="app-shell">
      <header className="shell-header">
        <div className="shell-header-inner">
          <a className="brand-link" href="/neuralv/" aria-label="NeuralV home">
            <span className="brand-badge" aria-hidden="true">
              <span className="brand-badge-core" />
            </span>
            <span className="brand-text">
              <span className="brand-name">NeuralV</span>
              <span className="brand-tagline">Проверка для Android, Windows и Linux</span>
            </span>
          </a>

          <nav className="shell-nav" aria-label="Навигация NeuralV">
            {navItems.map((item) => (
              <NavLink
                key={item.to}
                to={item.to}
                end={item.to === '/'}
                className={({ isActive }) => `shell-nav-link${isActive ? ' is-active' : ''}`}
              >
                {item.label}
              </NavLink>
            ))}
          </nav>

          <div className="theme-picker" aria-label="Тема сайта">
            <span className="theme-current">Тема: {themeLabel}</span>
            <div className="theme-options" role="group" aria-label="Выбор темы">
              {themeOptions.map((option) => (
                <button
                  key={option.value}
                  type="button"
                  className={`theme-pill${themePreference === option.value ? ' is-active' : ''}`}
                  aria-pressed={themePreference === option.value}
                  onClick={() => setThemePreference(option.value)}
                >
                  {option.label}
                </button>
              ))}
            </div>
          </div>
        </div>
      </header>

      <main className="page-frame">
        <Outlet />
      </main>

      <footer className="site-footer">
        <div>
          <strong>NeuralV</strong>
          <p>Скачал, вошёл, проверил.</p>
        </div>
        <div className="site-footer-links">
          <a href="/neuralv/android">Android</a>
          <a href="/neuralv/windows">Windows</a>
          <a href="/neuralv/linux">Linux</a>
        </div>
      </footer>
    </div>
  );
}
