import { NavLink, Outlet } from 'react-router-dom';

const navItems = [
  { to: '/', label: 'Главная' },
  { to: '/android', label: 'Android' },
  { to: '/windows', label: 'Windows' },
  { to: '/linux', label: 'Linux' }
];

export function AppShell() {
  return (
    <div className="app-shell">
      <div className="ambient-stage" aria-hidden="true">
        <div className="ambient-gradient ambient-gradient-a" />
        <div className="ambient-gradient ambient-gradient-b" />
        <div className="ambient-gradient ambient-gradient-c" />
        <div className="ambient-grid" />
        <div className="ambient-shape shape-orb shape-orb-a" />
        <div className="ambient-shape shape-orb shape-orb-b" />
        <div className="ambient-shape shape-panel shape-panel-a" />
        <div className="ambient-shape shape-panel shape-panel-b" />
        <div className="ambient-shape shape-ring shape-ring-a" />
        <div className="ambient-shape shape-ring shape-ring-b" />
      </div>

      <header className="topbar surface-card">
        <div className="brand-cluster">
          <div className="brand-mark" aria-hidden="true">
            <span className="brand-core" />
            <span className="brand-core-shadow" />
          </div>
          <div className="brand-copy">
            <div className="eyebrow eyebrow-bright">NeuralV platform</div>
            <h1>Один контур защиты для Android, Windows и Linux</h1>
            <p>Локальные движки, серверный triage, единый manifest и единая авторизация.</p>
          </div>
        </div>

        <div className="topbar-side">
          <nav className="tab-nav" aria-label="Навигация NeuralV">
            {navItems.map((item) => (
              <NavLink
                key={item.to}
                to={item.to}
                end={item.to === '/'}
                className={({ isActive }) => `nav-pill${isActive ? ' is-active' : ''}`}
              >
                {item.label}
              </NavLink>
            ))}
          </nav>

          <div className="topbar-actions">
            <a className="micro-pill" href="/basedata/api/releases/manifest" target="_blank" rel="noreferrer">
              Release manifest
            </a>
            <a className="micro-pill accent" href="/neuralv/install/linux.sh">
              Linux install
            </a>
          </div>
        </div>
      </header>

      <main className="page-frame">
        <Outlet />
      </main>

      <footer className="footer-shell surface-card">
        <div>
          <div className="eyebrow">NeuralV</div>
          <strong>Unified security surface</strong>
        </div>
        <div className="footer-links">
          <a href="/basedata/api/releases/manifest" target="_blank" rel="noreferrer">Manifest</a>
          <a href="/neuralv/install/linux.sh">Install script</a>
          <a href="/basedata/health" target="_blank" rel="noreferrer">Backend health</a>
        </div>
      </footer>
    </div>
  );
}
