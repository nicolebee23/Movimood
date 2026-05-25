import { useEffect, useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useFavoritos, LISTAS } from '../hooks/useFavoritos';
import { requestJson } from '../utils/movimoodApi';
import perfilMovimoodCover from '../assets/perfil-movimood-cover.png';
import WizardSidebar from '../componentes/WizardSidebar';
import './Likes.css';

export default function Vistas() {
  const { favoritos } = useFavoritos();
  const location = useLocation();
  const params = new URLSearchParams(location.search || '');
  const profileUserId = params.get('user_id');

  const [profileFavorites, setProfileFavorites] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    let cancelled = false;

    async function load() {
      if (!profileUserId) {
        setProfileFavorites(null);
        return;
      }

      setLoading(true);
      setError('');
      try {
        const resp = await requestJson('movimood.php', { params: { resource: 'favorites', user_id: profileUserId } });
        const items = Array.isArray(resp?.items) ? resp.items : [];
        if (!cancelled) setProfileFavorites(items);
      } catch (e) {
        if (!cancelled) setError('No se pudieron cargar las películas vistas.');
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    load();
    return () => { cancelled = true; };
  }, [profileUserId]);

  const activeFavorites = profileFavorites !== null ? profileFavorites : favoritos;
  const vistas = Array.isArray(activeFavorites) ? activeFavorites.filter((f) => String(f.lista) === String(LISTAS.YA_VISTA) || f.lista === 'YA_VISTA' || f.lista === 'ya_vista' || f.lista === 2) : [];

  // if the app requires auth for this page, guard like other pages
  // We'll mirror Likes behavior: allow protected route wrapper to handle auth; still render if unauthenticated

  return (
    <div className="home-page">
      <WizardSidebar activeLabel="Películas vistas" footerText="Películas marcadas como vistas" />

      <main className="home-main videoteca-main likes-page vistas-page perfil-v3-content">
        <div className="perfil-v3-page-cover likes-hero">
          <picture>
            <source srcSet={perfilMovimoodCover} type="image/png" />
            <img className="perfil-v3-page-cover-image" src={perfilMovimoodCover} alt="" />
          </picture>
          <div className="perfil-v3-page-cover-shade" aria-hidden="true" />
          <div className="likes-hero-copy">
              <h1 className="likes-title">
              <span className="likes-neon-heart" aria-hidden>
                <svg width="22" height="22" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden>
                  <rect x="2" y="7" width="20" height="11" rx="1" stroke="#42e6ff" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
                  <path d="M2 7l4-4 6 4 6-4" stroke="#42e6ff" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
                  <path d="M3.5 9.2l3.5-2.1M10 9.2l3.5-2.1M16.5 9.2l3.0-2.1" stroke="#42e6ff" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              </span>
              Películas vistas
            </h1>
            <p className="likes-subtitle">Todas las películas que has marcado como vistas</p>

            <div className="likes-hero-actions-bottom">
              <Link to={profileUserId ? `/perfil/${encodeURIComponent(profileUserId)}` : '/perfil'} className="volver-perfil">← Volver al perfil</Link>
            </div>
          </div>
        </div>

        <section className="likes-section">
          <div className="section-header">
            <h2>Películas vistas <small>({vistas.length})</small></h2>
            {!profileUserId && (
              <Link to="/videoteca?view=ya-vistas" className="ver-todas">Ver todas</Link>
            )}
          </div>

          {loading && <div className="vistas-empty">Cargando películas...</div>}
          {error && <div className="vistas-empty" style={{ color: 'salmon' }}>{error}</div>}

          <div className="likes-movies-row">
            {vistas.slice(0, 12).map((fav) => {
              const movie = fav.movie || {};
              const poster = movie.poster_path ? `https://image.tmdb.org/t/p/w300${movie.poster_path}` : null;
              const rating = fav.rating || movie.vote_average || null;

              return (
                <article className="likes-movie-card" key={movie.id || JSON.stringify(movie)}>
                  <div className="likes-movie-poster">
                        {poster ? <img src={poster} alt={movie.title || movie.name} /> : <div className="poster-placeholder">Sin poster</div>}
                      </div>
                  <div className="likes-movie-body">
                    <h3 className="likes-movie-title">{movie.title || movie.name}</h3>
                    <div className="likes-movie-meta">{movie.release_date ? movie.release_date.slice(0,4) : ''}{rating ? ` · ⭐ ${(movie.vote_average || '').toString().slice(0,3)}` : ''}</div>
                  </div>
                </article>
              );
            })}
          </div>
        </section>
      </main>
    </div>
  );
}
