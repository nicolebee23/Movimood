import { Link, useNavigate } from 'react-router-dom';
import { useState } from 'react';
import { useAuth } from '../hooks/useAuth';
import mockupPhone from '../assets/mockup-phone.png';
import mockupComputer from '../assets/mockup-computer.png';
import mockupTablet from '../assets/mockup-tablet.png';
import mockupFirstBoxAurora from '../assets/mockup-first-box-aurora.png';
import mockupSecondBoxEmber from '../assets/mockup-second-box-ember.png';
import mockupSecondBoxPortraitBlue from '../assets/mockup-second-box-portrait-blue.png';
import mockupThirdBoxHeroPortrait from '../assets/mockup-third-box-hero-portrait.png';
import mockupFourthBoxPortraitGreen from '../assets/mockup-fourth-box-portrait-green.png';
import './Home.css';

const menuLinks = [
  { label: 'Inicio', to: '/', icon: '⌂', active: true },
  { label: 'Explorar', to: '/explorar', icon: '◎' },
  { label: 'Cuestionario', to: '/cuestionario', icon: '✦' },
  { label: 'Mi videoteca', to: '/videoteca', icon: '☰' },
  { label: 'Mood', to: '/mood', icon: '◌' },
  { label: 'Perfil', to: '/perfil', icon: '◯' },
];

const stats = [
  { value: '10K+', label: 'Películas' },
  { value: '100%', label: 'Gratis' },
  { value: '2min', label: 'Cuestionario' },
];

const TMDB_POSTER_BASE = 'https://image.tmdb.org/t/p/w500';

const recomendadas = [
  { title: 'Interstellar', year: '2014', genre: 'Ciencia ficción', poster: `${TMDB_POSTER_BASE}/gEU2QniE6E77NI6lCU6MxlNBvIx.jpg`, theme: 'aurora' },
  { title: 'The Batman', year: '2022', genre: 'Acción', poster: `${TMDB_POSTER_BASE}/udDclJoHjfjb8Ekgsd4FDteOkCU.jpg`, theme: 'night' },
  { title: 'Spirited Away', year: '2001', genre: 'Animación', poster: `${TMDB_POSTER_BASE}/dL11DBPcRhWWnJcFXl9A07MrqTI.jpg`, theme: 'sunset' },
  { title: 'Inception', year: '2010', genre: 'Ciencia ficción', poster: `${TMDB_POSTER_BASE}/f89U3ADr1oiB1s9GkdPOEpXUk5H.jpg`, theme: 'blueprint' },
  { title: 'The Dark Knight', year: '2008', genre: 'Acción', poster: `${TMDB_POSTER_BASE}/qJ2tW6WMUDux911r6m7haRef0WH.jpg`, theme: 'ember' },
  { title: 'La La Land', year: '2016', genre: 'Romance', poster: `${TMDB_POSTER_BASE}/uDO8zWDhfWwoFdKS4fzkUJt0Rf0.jpg`, theme: 'violet' },
  { title: 'Parásitos', year: '2019', genre: 'Drama', poster: `${TMDB_POSTER_BASE}/7IiTTgloJzvGI1TAYymCfbfl3vT.jpg`, theme: 'forest' },
  { title: 'Toy Story', year: '1995', genre: 'Animación', poster: `${TMDB_POSTER_BASE}/uXDfjJbdP4ijW5hWSBrPrlKpxab.jpg`, theme: 'teal' },
  { title: 'The Shawshank Redemption', year: '1994', genre: 'Drama', poster: `${TMDB_POSTER_BASE}/lyQBXzOQSuE59IsHyhrp0qIiPAz.jpg`, theme: 'night' },
];

const pasos = [
  {
    numero: '01', icono: '◎',
    titulo: 'Cuéntanos tu mood',
    descripcion: 'Responde un breve cuestionario sobre tu estado de ánimo y tus preferencias del momento.',
    backgroundImage: mockupPhone,
    preview: (
      <div className="cf-preview cf-preview--image">
        <img src={mockupPhone} alt="Cuestionario de mood" />
      </div>
    ),
  },
  {
    numero: '02', icono: '⊞',
    titulo: 'Analizamos tus preferencias',
    descripcion: 'Nuestro sistema busca entre miles de películas las mejores opciones para ti.',
    backgroundImage: mockupComputer,
    preview: (
      <div className="cf-preview">
        <p className="cf-preview-label">Analizando tus preferencias...</p>
        <div className="cf-movie-grid">
          {['#1a1a2e', '#16213e', '#0f3460', '#533483', '#1a1a2e', '#16213e'].map((c, i) => (
            <div key={i} className="cf-movie-thumb" style={{ background: c }} />
          ))}
        </div>
      </div>
    ),
  },
  {
    numero: '03', icono: '♡',
    titulo: 'Disfruta tu película',
    descripcion: 'Recibe recomendaciones personalizadas y guarda tus favoritas para no perderlas de vista.',
    backgroundImage: mockupTablet,
    preview: (
      <div className="cf-preview">
        <div className="cf-result-card">
          <div className="cf-result-poster" />
          <div className="cf-result-info">
            <p className="cf-result-title">The Batman</p>
            <p className="cf-result-meta">2022 · 2h 56min</p>
            <div className="cf-result-tags">
              <span>Acción</span><span>Crimen</span><span>Drama</span>
            </div>
            <button className="cf-result-btn">Ver ahora</button>
          </div>
        </div>
      </div>
    ),
  },
];

const ventajas = [
  { icono: '⚡', titulo: 'Rápido', descripcion: 'Recibe en 2 minutos recomendaciones para todos al instante.' },
  { icono: '◈', titulo: 'Gratis', descripcion: 'Disfruta de todas las funciones sin pagar nada.' },
  { icono: '◎', titulo: 'Personalizado', descripcion: 'Adaptado a tu estado de ánimo y tus gustos cinematográficos.' },
];

const faqItems = [
  {
    icono: '⚙',
    pregunta: '¿Cómo funcionan las recomendaciones?',
    respuesta: 'Cruzan tu mood, tus gustos y la información de cada película para darte opciones que encajen contigo.',
  },
  {
    icono: '◯',
    pregunta: '¿Necesito registrarme?',
    respuesta: 'No para explorar. Solo hace falta si quieres guardar favoritos, reseñas o sincronizar tu perfil.',
  },
  {
    icono: '⬡',
    pregunta: '¿La app es gratuita?',
    respuesta: 'Sí, las funciones principales de MoviMood son totalmente gratis.',
  },
  {
    icono: '◌',
    pregunta: '¿Qué plataformas soporta?',
    respuesta: 'Funciona en navegador de escritorio y móvil, sin instalar nada.',
  },
  {
    icono: '▣',
    pregunta: '¿Puedo guardar mis favoritas?',
    respuesta: 'Sí. Puedes marcar películas, guardarlas y volver a ellas cuando quieras.',
  },
  {
    icono: '◉',
    pregunta: '¿Cómo analiza mi estado de ánimo?',
    respuesta: 'A partir de tus respuestas del cuestionario y tus elecciones dentro de la app.',
  },
];

const pqPanels = [
  mockupFirstBoxAurora,
  mockupSecondBoxEmber,
  mockupSecondBoxPortraitBlue,
  mockupThirdBoxHeroPortrait,
  mockupFourthBoxPortraitGreen,
];

const pqMoods = [
  { icon: '✿', label: 'Triste' },
  { icon: '☼', label: 'Alegre' },
  { icon: '✿', label: 'Relajado' },
  { icon: '✧', label: 'Motivado' },
  { icon: '✦', label: 'Nostálgico' },
];

function createPosterArtwork(title, year, genre, theme) {
  const themeStops = {
    aurora: ['#111d2e', '#64d9de', '#f2fbff'],
    night: ['#0f1320', '#25324a', '#8fb9ff'],
    sunset: ['#1c0f2c', '#ff7b5c', '#ffd27f'],
    blueprint: ['#07111f', '#245a8f', '#6ed4ff'],
    ember: ['#100b12', '#d63f28', '#ffb347'],
    violet: ['#170f31', '#8e5cff', '#f2a7ff'],
    forest: ['#0d1c15', '#2e7c55', '#9ee6bc'],
    teal: ['#0d1a22', '#2bcfd1', '#9af7ef'],
  };
  const [base, accent, highlight] = themeStops[theme] || themeStops.teal;
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 500 750"><defs><linearGradient id="g" x1="0%" y1="0%" x2="100%" y2="100%"><stop offset="0%" stop-color="${base}" /><stop offset="58%" stop-color="${accent}" /><stop offset="100%" stop-color="${highlight}" /></linearGradient></defs><rect width="500" height="750" fill="url(#g)" /></svg>`;
  return `data:image/svg+xml;charset=UTF-8,${encodeURIComponent(svg)}`;
}

function Home() {
  const [query, setQuery] = useState('');
  const [openFaqIndex, setOpenFaqIndex] = useState(-1);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const navigate = useNavigate();
  const { currentUser } = useAuth();

  const visibleMenuLinks = menuLinks.filter((link) => {
    if (['Mood'].includes(link.label)) {
      return false;
    }

    if (!currentUser && ['Mi videoteca', 'Perfil'].includes(link.label)) {
      return false;
    }

    return true;
  });

  function handleSearch(e) {
    e.preventDefault();
    if (query.trim()) {
      navigate(`/buscar?q=${encodeURIComponent(query.trim())}`);
    }
  }

  return (
    <div className="home-page">
      <aside className={`home-sidebar${isSidebarOpen ? ' open' : ''}`}>
        <div className="sidebar-shell">
          <div className="sidebar-top">
            <div className="sidebar-brand">
              <div className="brand-mark">M</div>
              <div>
                <p className="brand-title">MoviMood</p>
                <p className="brand-subtitle">Tu cine personalizado</p>
              </div>
            </div>
            <button
              type="button"
              className="sidebar-toggle"
              aria-expanded={isSidebarOpen}
              aria-controls="home-sidebar-panel"
              onClick={() => setIsSidebarOpen((value) => !value)}
            >
              <span className="sidebar-toggle-icon" aria-hidden="true">☰</span>
              <span className="sidebar-toggle-text">Menú</span>
            </button>
          </div>
          <div id="home-sidebar-panel" className={`sidebar-panel${isSidebarOpen ? ' open' : ''}`}>
            <nav className="sidebar-nav" aria-label="Navegación principal">
              {visibleMenuLinks.map((link) => (
                <Link
                  key={link.label}
                  to={link.to}
                  className={`sidebar-link${link.active ? ' active' : ''}`}
                  aria-current={link.active ? 'page' : undefined}
                  onClick={() => setIsSidebarOpen(false)}
                >
                  <span className="sidebar-link-icon" aria-hidden="true">{link.icon}</span>
                  <span>{link.label}</span>
                </Link>
              ))}
            </nav>
            <div className="sidebar-footer">
              <p>Recomendaciones basadas en tu mood y preferencias.</p>
            </div>
          </div>
        </div>
      </aside>

      <main className="home-main">

        {/* ── HERO ── */}
        <section className="hero-section">
          <nav className="home-navbar">
            <form className="search-form" onSubmit={handleSearch} role="search">
              <span className="search-icon">🔍</span>
              <input
                className="search-input"
                type="search"
                placeholder="Buscar películas, actores, géneros..."
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                aria-label="Buscar"
              />
              <span className="search-filter-icon">⚙</span>
            </form>
            <div className="navbar-auth" role="navigation" aria-label="Autenticación">
              {!currentUser && (
                <>
                  <Link to="/login" className="btn-auth btn-auth--login">Iniciar sesión</Link>
                  <Link to="/register" className="btn-auth btn-auth--register">Registrarse</Link>
                </>
              )}
            </div>
          </nav>

          <div className="hero-copy">
            <h1 className="hero-title" style={{ fontSize: '1.3rem' }}>
              Descubre películas
              <br />
              para cada <span className="accent-text">momento.</span>
            </h1>
            <p className="hero-text">Cuestionario rápido. Recomendaciones que encajan contigo.</p>
            <div className="hero-actions">
              <Link to="/cuestionario" className="btn btn-primary">Comenzar →</Link>
              <Link to="/explorar" className="btn btn-secondary">Explorar</Link>
            </div>
            <div className="hero-stats">
              {stats.map((item) => (
                <div key={item.label} className="stat-item">
                  <p className="stat-value">{item.value}</p>
                  <p className="stat-label">{item.label}</p>
                </div>
              ))}
            </div>
          </div>

          <section className="recommendations-section">
            <div className="section-header">
              <div className="section-header-copy"><h2>Recomendadas para ti</h2></div>
              <Link to="/explorar" className="view-all">Ver todo</Link>
            </div>
            <div className="recommendation-carousel">
              {recomendadas.map((movie) => (
                <article key={movie.title} className="recommendation-card">
                  <img
                    className="recommendation-image"
                    src={movie.poster}
                    alt={movie.title}
                    loading="lazy"
                    decoding="async"
                    onError={(e) => {
                      e.currentTarget.onerror = null;
                      e.currentTarget.src = createPosterArtwork(movie.title, movie.year, movie.genre, movie.theme);
                    }}
                  />
                </article>
              ))}
            </div>
          </section>
        </section>

        {/* ── CÓMO FUNCIONA ── */}
        <section className="cf-section">
          <div className="cf-header">
            <span className="cf-label">✦ FUNCIONAMIENTO</span>
            <h2 className="cf-title">¿Cómo <span className="cf-accent">funciona?</span></h2>
            <p className="cf-subtitle">Descubre una experiencia de recomendaciones visual y personalizada inspirada en tu estado de ánimo.</p>
          </div>
          <div className="cf-steps">
            {pasos.map((paso) => (
              <div
                key={paso.numero}
                className={`cf-step${paso.backgroundImage ? ' cf-step--image-bg' : ''}`}
                style={paso.backgroundImage ? { '--cf-step-bg-image': `url(${paso.backgroundImage})` } : undefined}
              >
                <div className="cf-step-top">
                  <span className="cf-step-number">{paso.numero}</span>
                  <span className="cf-step-icon">{paso.icono}</span>
                </div>
                {!paso.backgroundImage && <div className="cf-step-preview">{paso.preview}</div>}
                <div className="cf-step-bottom">
                  <div className="cf-step-line" />
                  <h3 className="cf-step-title">{paso.titulo}</h3>
                  <p className="cf-step-desc">{paso.descripcion}</p>
                </div>
              </div>
            ))}
          </div>
          <div className="cf-footer-badge">
            <span>✦</span>
            <span>Rápido, visual y 100% personalizado para ti.</span>
          </div>
        </section>

        {/* ── POR QUÉ MOVIMOOD ── */}
        <section className="pq-section">
          <div className="pq-inner">
            <div className="pq-left">
              <span className="pq-label">POR QUÉ MOVIMOOD</span>
              <h2 className="pq-title">Por qué <span className="pq-accent">MoviMood</span></h2>
              <p className="pq-subtitle">Descubre una experiencia de recomendaciones visual y personalizada inspirada en tu estado de ánimo.</p>
              <div className="pq-ventajas">
                {ventajas.map((v) => (
                  <div key={v.titulo} className="pq-ventaja">
                    <div className="pq-ventaja-icon">{v.icono}</div>
                    <div>
                      <p className="pq-ventaja-titulo">{v.titulo}</p>
                      <p className="pq-ventaja-desc">{v.descripcion}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
            <div className="pq-right">
              <div className="pq-showcase">
                <div className="pq-showcase-panels">
                  {pqPanels.map((url, i) => (
                    <div key={i} className="pq-showcase-panel">
                      <img src={url} alt="" className="pq-showcase-img" onError={(e) => { e.currentTarget.style.background = '#1a1a2e'; e.currentTarget.src = ''; }} />
                    </div>
                  ))}
                </div>
                <div className="pq-moods">
                  {pqMoods.map((m) => (
                    <span key={m.label} className="pq-mood-tag"><span aria-hidden="true">{m.icon}</span>{m.label}</span>
                  ))}
                </div>
              </div>
              <div className="pq-resultado">
                <span className="pq-resultado-label">◷ Resultado en 2 minutos</span>
                <div className="pq-resultado-bar"><div className="pq-resultado-fill" /></div>
              </div>
            </div>
          </div>
        </section>

        {/* ── FAQ ── */}
        <section className="faq-section">
          <div className="faq-inner">
            <div className="faq-topline">
              <span className="faq-topline-bar" />
            </div>

            <div className="faq-header">
              <span className="faq-label">FAQ</span>
              <h2 className="faq-title">Preguntas <span className="faq-accent">frecuentes</span></h2>
              <p className="faq-subtitle">Encuentra respuestas rápidas a tus dudas.</p>
            </div>

            <div className="faq-grid">
              {faqItems.map((item, index) => {
                const isOpen = openFaqIndex === index;

                return (
                  <article key={item.pregunta} className={`faq-card${isOpen ? ' abierto' : ''}`}>
                    <button
                      type="button"
                      className="faq-card-toggle"
                      onClick={() => setOpenFaqIndex(isOpen ? -1 : index)}
                      aria-expanded={isOpen}
                    >
                      <div className="faq-card-icon" aria-hidden="true">{item.icono}</div>
                      <p className="faq-card-question">{item.pregunta}</p>
                      <span className="faq-card-plus" aria-hidden="true">{isOpen ? '−' : '+'}</span>
                    </button>
                    <div className="faq-card-answer" aria-hidden={!isOpen}>
                      <p>{item.respuesta}</p>
                    </div>
                  </article>
                );
              })}
            </div>

            <div className="faq-footer">
              <button type="button" className="faq-button">Ver todas las preguntas</button>
            </div>
          </div>
        </section>

      </main>
    </div>
  );
}

export default Home;