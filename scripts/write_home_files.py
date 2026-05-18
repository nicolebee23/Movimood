from pathlib import Path

home_js = Path('src/paginas/Home.jsx')
home_css = Path('src/paginas/Home.css')

home_js_content = '''import { Link } from 'react-router-dom';
import './Home.css';

const menuLinks = [
  { label: 'Inicio', to: '/' },
  { label: 'Explorar', to: '/explorar' },
  { label: 'Mi lista', to: '/mi-lista' },
  { label: 'Mood', to: '/mood' },
  { label: 'Perfil', to: '/perfil' },
];

const stats = [
  { value: '10K+', label: 'Películas' },
  { value: '100%', label: 'Gratis' },
  { value: '2min', label: 'Cuestionario' },
];

const recomendadas = [
  { title: 'Interstellar', year: '2014', genre: 'Ciencia ficción', poster: 'https://image.tmdb.org/t/p/w500/gEU2QniE6E77NI6lCU6MxlNBvIx.jpg' },
  { title: 'The Batman', year: '2022', genre: 'Acción', poster: 'https://image.tmdb.org/t/p/w500/8RyPqNFEzdrGMRw6Qp4Hm7em7zG.jpg' },
  { title: 'Spirited Away', year: '2001', genre: 'Animación', poster: 'https://image.tmdb.org/t/p/w500/dL11DBPcRhWWnJcFXl9A07MrqTI.jpg' },
  { title: 'Inception', year: '2010', genre: 'Ciencia ficción', poster: 'https://image.tmdb.org/t/p/w500/qmDpIHrmpJINaRKAfWQfftjCdyi.jpg' },
  { title: 'La La Land', year: '2016', genre: 'Romance', poster: 'https://image.tmdb.org/t/p/w500/uDO8zWDhfWwoFdKS4fzkUJt0Rf0.jpg' },
  { title: 'The Grand Budapest Hotel', year: '2014', genre: 'Comedia', poster: 'https://image.tmdb.org/t/p/w500/nX5XotM9yprCKarRH4fzOq1VM1J.jpg' },
];

function Home() {
  return (
    <div className="home-page">
      <aside className="home-sidebar">
        <div>
          <div className="sidebar-brand">
            <div className="brand-mark">M</div>
            <div>
              <p className="brand-title">MoviMood</p>
              <p className="brand-subtitle">Tu cine personalizado</p>
            </div>
          </div>
          <nav className="sidebar-nav" aria-label="Navegación principal">
            {menuLinks.map((link) => (
              <Link key={link.label} to={link.to} className="sidebar-link">
                {link.label}
              </Link>
            ))}
          </nav>
        </div>
        <div className="sidebar-footer">
          <p>Recomendaciones basadas en tu mood y preferencias.</p>
        </div>
      </aside>

      <main className="home-main">
        <section className="hero-section">
          <div className="hero-copy">
            <span className="hero-eyebrow">Inicio</span>
            <h1 className="hero-title">
              Descubre películas para cada <span className="accent-text">momento</span>
            </h1>
            <p className="hero-text">
              Cuestionario rápido. Recomendaciones que encajan contigo, con estilo oscuro y elegante.
            </p>
            <div className="hero-actions">
              <Link to="/cuestionario" className="btn btn-primary">
                Comenzar
              </Link>
              <Link to="/explorar" className="btn btn-secondary">
                Explorar
              </Link>
            </div>
            <div className="hero-stats">
              {stats.map((item) => (
                <div key={item.label} className="stat-card">
                  <p className="stat-value">{item.value}</p>
                  <p className="stat-label">{item.label}</p>
                </div>
              ))}
            </div>
          </div>

          <div className="hero-visual">
            <div className="visual-card">
              <img
                src="https://images.unsplash.com/photo-1517602302552-471fe67acf66?auto=format&fit=crop&w=900&q=80"
                alt="Persona viendo televisión en una sala oscura"
              />
            </div>
          </div>
        </section>

        <section className="recommendations-section">
          <div className="section-header">
            <h2>Recomendadas para ti</h2>
            <Link to="/explorar" className="view-all">
              Ver todo →
            </Link>
          </div>
          <div className="recommendation-carousel">
            {recomendadas.map((movie) => (
              <article key={movie.title} className="recommendation-card">
                <img className="recommendation-poster" src={movie.poster} alt={movie.title} />
                <div className="recommendation-info">
                  <h3 className="recommendation-title">{movie.title}</h3>
                  <p className="recommendation-meta">{movie.year} · {movie.genre}</p>
                </div>
              </article>
            ))}
          </div>
        </section>
      </main>
    </div>
  );
}

export default Home;
'''

home_css_content = '''
:root {
  --bg: #0f0f0f;
  --panel: #121212;
  --panel-soft: #1a1a1a;
  --text: #ffffff;
  --muted: #9fbace;
  --accent: #00d4b4;
  --accent-soft: rgba(0, 212, 180, 0.14);
  --border: rgba(255, 255, 255, 0.08);
  --shadow: 0 24px 80px rgba(0, 0, 0, 0.45);
}

body {
  background: var(--bg);
}

.home-page {
  min-height: 100vh;
  display: grid;
  grid-template-columns: 280px minmax(0, 1fr);
  gap: 28px;
  padding: 28px;
  color: var(--text);
  background: linear-gradient(180deg, #0f0f0f 0%, #090909 100%);
}

.home-sidebar {
  position: sticky;
  top: 24px;
  align-self: start;
  display: flex;
  flex-direction: column;
  justify-content: space-between;
  padding: 28px 22px;
  border-radius: 32px;
  background: rgba(15, 15, 15, 0.96);
  border: 1px solid var(--border);
  box-shadow: var(--shadow);
}

.sidebar-brand {
  display: flex;
  align-items: center;
  gap: 14px;
  margin-bottom: 36px;
}

.brand-mark {
  width: 54px;
  height: 54px;
  border-radius: 18px;
  display: grid;
  place-items: center;
  font-size: 1.45rem;
  font-weight: 900;
  color: var(--accent);
  background: linear-gradient(135deg, rgba(0, 212, 180, 0.18), rgba(0, 212, 180, 0.05));
  border: 1px solid rgba(0, 212, 180, 0.25);
}

.brand-title {
  margin: 0;
  font-size: 1.15rem;
  font-weight: 700;
}

.brand-subtitle {
  margin: 4px 0 0;
  color: var(--muted);
  font-size: 0.92rem;
}

.sidebar-nav {
  display: grid;
  gap: 12px;
}

.sidebar-link {
  display: block;
  padding: 14px 16px;
  border-radius: 18px;
  background: rgba(255, 255, 255, 0.03);
  border: 1px solid transparent;
  color: var(--text);
  text-decoration: none;
  font-weight: 600;
  transition: background 0.24s ease, border-color 0.24s ease, transform 0.24s ease;
}

.sidebar-link:hover,
.sidebar-link:focus-visible {
  background: rgba(0, 212, 180, 0.12);
  border-color: rgba(0, 212, 180, 0.25);
  transform: translateX(2px);
}

.sidebar-footer {
  margin-top: 32px;
  color: var(--muted);
  font-size: 0.95rem;
  line-height: 1.75;
}

.home-main {
  display: flex;
  flex-direction: column;
  gap: 28px;
}

.hero-section {
  display: grid;
  grid-template-columns: minmax(0, 1fr) 420px;
  gap: 32px;
  padding: 36px;
  border-radius: 36px;
  background: linear-gradient(180deg, #161616 0%, #0f0f0f 100%);
  border: 1px solid var(--border);
  box-shadow: var(--shadow);
}

.hero-copy {
  display: flex;
  flex-direction: column;
  gap: 24px;
}

.hero-eyebrow {
  display: inline-flex;
  align-items: center;
  padding: 10px 16px;
  border-radius: 999px;
  background: rgba(0, 212, 180, 0.12);
  color: var(--accent);
  font-size: 0.86rem;
  font-weight: 700;
  letter-spacing: 0.08em;
  text-transform: uppercase;
}

.hero-title {
  margin: 0;
  font-size: clamp(3rem, 5vw, 4.6rem);
  line-height: 0.95;
  letter-spacing: -0.04em;
  max-width: 720px;
}

.accent-text {
  color: var(--accent);
}

.hero-text {
  margin: 0;
  color: var(--muted);
  line-height: 1.85;
  font-size: 1rem;
  max-width: 620px;
}

.hero-actions {
  display: flex;
  flex-wrap: wrap;
  gap: 16px;
}

.btn {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  min-width: 160px;
  padding: 16px 24px;
  border-radius: 999px;
  font-weight: 700;
  text-decoration: none;
  transition: transform 0.22s ease, box-shadow 0.22s ease, background 0.22s ease;
}

.btn-primary {
  background: linear-gradient(135deg, #00d4b4, #11e3c1);
  color: #081414;
  box-shadow: 0 18px 40px rgba(0, 212, 180, 0.22);
}

.btn-secondary {
  border: 1px solid rgba(255, 255, 255, 0.12);
  background: rgba(255, 255, 255, 0.04);
  color: var(--text);
}

.btn:hover {
  transform: translateY(-2px);
}

.hero-stats {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 16px;
  margin-top: 12px;
}

.stat-card {
  padding: 20px;
  border-radius: 24px;
  background: rgba(255, 255, 255, 0.03);
  border: 1px solid rgba(255, 255, 255, 0.08);
}

.stat-value {
  margin: 0;
  font-size: 1.8rem;
  font-weight: 800;
}

.stat-label {
  margin: 8px 0 0;
  color: var(--muted);
  font-size: 0.95rem;
}

.hero-visual {
  display: flex;
  align-items: center;
  justify-content: center;
}

.visual-card {
  width: 100%;
  max-width: 420px;
  min-height: 520px;
  border-radius: 32px;
  overflow: hidden;
  background: linear-gradient(180deg, #111111 0%, #0a0a0a 100%);
  border: 1px solid rgba(255, 255, 255, 0.08);
  box-shadow: var(--shadow);
}

.visual-card img {
  width: 100%;
  height: 100%;
  object-fit: cover;
  display: block;
}

.recommendations-section {
  padding: 28px;
  border-radius: 32px;
  background: rgba(17, 17, 17, 0.98);
  border: 1px solid rgba(255, 255, 255, 0.08);
  box-shadow: var(--shadow);
}

.section-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 16px;
  margin-bottom: 24px;
}

.section-header h2 {
  margin: 0;
  font-size: clamp(2rem, 3vw, 2.4rem);
}

.view-all {
  color: var(--accent);
  text-decoration: none;
  font-weight: 700;
}

.recommendation-carousel {
  display: grid;
  grid-auto-flow: column;
  grid-auto-columns: minmax(220px, 1fr);
  gap: 18px;
  overflow-x: auto;
  padding-bottom: 6px;
  scroll-snap-type: x mandatory;
}

.recommendation-card {
  scroll-snap-align: start;
  min-width: 220px;
  border-radius: 28px;
  overflow: hidden;
  background: rgba(255, 255, 255, 0.04);
  border: 1px solid rgba(255, 255, 255, 0.08);
  box-shadow: inset 0 0 0 1px rgba(255, 255, 255, 0.02);
}

.recommendation-poster {
  width: 100%;
  aspect-ratio: 2 / 3;
  object-fit: cover;
  display: block;
}

.recommendation-info {
  padding: 16px;
}

.recommendation-title {
  margin: 0;
  font-size: 1.05rem;
  font-weight: 700;
}

.recommendation-meta {
  margin: 8px 0 0;
  color: var(--muted);
  font-size: 0.92rem;
}

@media (max-width: 1120px) {
  .home-page {
    grid-template-columns: 1fr;
  }

  .home-sidebar {
    position: relative;
    top: auto;
    min-height: auto;
    width: 100%;
  }

  .hero-section {
    grid-template-columns: 1fr;
  }

  .hero-visual {
    order: -1;
  }
}

@media (max-width: 768px) {
  .home-page {
    padding: 18px;
  }

  .hero-section {
    padding: 24px;
    gap: 24px;
  }

  .hero-title {
    font-size: 2.8rem;
  }

  .hero-stats {
    grid-template-columns: 1fr;
  }

  .recommendation-carousel {
    grid-auto-columns: minmax(180px, 1fr);
  }

  .visual-card {
    min-height: 320px;
  }
}
'''

home_js.write_text(home_js_content, encoding='utf-8')
home_css.write_text(home_css_content, encoding='utf-8')
print('FILES WRITTEN')
