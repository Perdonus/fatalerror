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
      <header className="topbar surface-card">
        <div className="brand-cluster">
          <div className="brand-mark" aria-hidden="true">
            <span className="brand-core" />
          </div>
          <div>
            <div className="eyebrow">NeuralV</div>
            <h1>Гибридная антивирусная платформа</h1>
          </div>
        </div>
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
      </header>
      <main className="page-frame">
        <Outlet />
      </main>
    </div>
  );
}
