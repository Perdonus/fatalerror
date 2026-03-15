import { Link } from 'react-router-dom';

export function HeroSection() {
  return (
    <section className="hero-grid">
      <div className="hero-copy surface-card hero-card">
        <div className="eyebrow">NeuralV / md3 expressive</div>
        <h2>Один стек защиты для Android, Windows и Linux.</h2>
        <p>
          NeuralV объединяет локальные движки, серверную перепроверку и единый release manifest для
          всех клиентских поверхностей.
        </p>
        <div className="hero-actions">
          <Link to="/android">
            <md-filled-button>Android</md-filled-button>
          </Link>
          <Link to="/windows">
            <md-filled-tonal-button>Windows</md-filled-tonal-button>
          </Link>
          <Link to="/linux">
            <md-outlined-button>Linux</md-outlined-button>
          </Link>
        </div>
      </div>
      <div className="surface-card showcase-card">
        <div className="showcase-orbit orbit-a" />
        <div className="showcase-orbit orbit-b" />
        <div className="showcase-orbit orbit-c" />
        <div className="showcase-panel">
          <div className="showcase-chip">Unified auth</div>
          <div className="showcase-chip">Desktop GUI</div>
          <div className="showcase-chip">Shell installer</div>
          <div className="showcase-chip">Server triage</div>
        </div>
      </div>
    </section>
  );
}
