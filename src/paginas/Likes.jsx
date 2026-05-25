import { useEffect, useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useFavoritos, LISTAS } from '../hooks/useFavoritos';
import useReviewLikes from '../hooks/useReviewLikes';
import { requestJson } from '../utils/movimoodApi';
import perfilMovimoodCover from '../assets/perfil-movimood-cover.png';
import './Likes.css';
import WizardSidebar from '../componentes/WizardSidebar';

function formatReviewDate(isoString) {
  try {
    return new Date(isoString).toLocaleDateString('es-ES', { day: 'numeric', month: 'short' });
  } catch {
    return '';
  }
}

export default function Likes() {
  const { favoritos } = useFavoritos();
  const reviewLikes = useReviewLikes();
  const [likedReviews, setLikedReviews] = useState([]);
  const location = useLocation();
  const params = new URLSearchParams(location.search || '');
  const profileUserId = params.get('user_id');
  const initialTab = params.get('tab') || 'todo';
  const [tab, setTab] = useState(initialTab); // 'todo' | 'peliculas' | 'resenas'

  const [profileFavorites, setProfileFavorites] = useState(null);
  const [, setLoadingProfileFavorites] = useState(false);
  const [profileLikedReviews, setProfileLikedReviews] = useState(null);

  const activeFavoritesForCounts = profileFavorites !== null ? profileFavorites : favoritos;
  const yaVistasCount = Array.isArray(activeFavoritesForCounts) ? activeFavoritesForCounts.filter((f) => f && String(f.lista) === String(LISTAS.YA_VISTA)).length : 0;

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const items = await reviewLikes.fetchUserLikedReviews();
        if (!cancelled) setLikedReviews(Array.isArray(items) ? items : []);
      } catch (e) {
        if (!cancelled) setLikedReviews([]);
      }
    })();

    return () => { cancelled = true; };
  }, [reviewLikes]);

  useEffect(() => {
    const nextTab = params.get('tab') || 'todo';
    setTab(nextTab);
  }, [location.search]);

  useEffect(() => {
    let cancelled = false;
    async function loadProfileLikedReviews() {
      if (!profileUserId) {
        setProfileLikedReviews(null);
        return;
      }

      try {
        const resp = await requestJson('movimood.php', { params: { resource: 'review-likes', user_id: profileUserId } });
        const items = Array.isArray(resp?.items) ? resp.items : [];
        if (!cancelled) setProfileLikedReviews(items);
      } catch (e) {
        if (!cancelled) setProfileLikedReviews([]);
      }
    }

    loadProfileLikedReviews();
    return () => { cancelled = true; };
  }, [profileUserId]);

  useEffect(() => {
    let cancelled = false;
    async function loadProfileFavorites() {
      if (!profileUserId) {
        setProfileFavorites(null);
        return;
      }

      setLoadingProfileFavorites(true);
      try {
        const resp = await requestJson('movimood.php', { params: { resource: 'favorites', user_id: profileUserId } });
        const items = Array.isArray(resp?.items) ? resp.items : [];
        if (!cancelled) setProfileFavorites(items);
      } catch (e) {
        if (!cancelled) setProfileFavorites([]);
      } finally {
        if (!cancelled) setLoadingProfileFavorites(false);
      }
    }

    loadProfileFavorites();
    return () => { cancelled = true; };
  }, [profileUserId]);

  return (
    <div className="home-page">
      <WizardSidebar activeLabel="Likes" footerText="Aquí ves lo que te gustó" />

      <main className="home-main videoteca-main likes-page perfil-v3-content">
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
                  <path d="M12 20s-6.716-4.35-9.029-7.01C-0.66 8.94 3.05 4 7.5 6.09 9.23 7.03 10 9 12 11c2-2 2.77-3.97 4.5-4.91C20.95 4 24.66 8.94 21.03 12.99 18.716 15.65 12 20 12 20z" stroke="#42e6ff" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              </span>
              Likes
            </h1>
            {profileUserId ? (
              <p className="likes-subtitle">{(Array.isArray(profileFavorites) ? profileFavorites.filter((f) => Boolean(f.flags?.imprescindible) && f.lista !== LISTAS.NO_INTERESA).length : 0)} imprescindibles · {(Array.isArray(profileLikedReviews) ? profileLikedReviews.length : 0)} reseñas que le gustaron</p>
            ) : (
              <p className="likes-subtitle">Aquí puedes ver las películas y reseñas<br/>que te han gustado.</p>
            )}
            <div className="likes-tabs">
              <button className={`likes-tab${tab === 'todo' ? ' activo' : ''}`} onClick={() => setTab('todo')}>Todo</button>
              <button className={`likes-tab${tab === 'peliculas' ? ' activo' : ''}`} onClick={() => setTab('peliculas')}>Películas</button>
              <button className={`likes-tab${tab === 'resenas' ? ' activo' : ''}`} onClick={() => setTab('resenas')}>Reseñas</button>
            </div>
            <div className="likes-hero-actions-bottom">
              <Link to={profileUserId ? `/perfil/${encodeURIComponent(profileUserId)}` : '/perfil'} className="volver-perfil">← Volver al perfil</Link>
            </div>
          </div>
        </div>

        {/* tabs moved into hero copy for precise vertical placement */}

        { (tab === 'todo' || tab === 'peliculas') && (
          <section className="likes-section">
            <div className="section-header">
              <h2>Películas que te gustan {`(${yaVistasCount})`}</h2>
              {!profileUserId && (
                <Link to="/videoteca?view=imprescindibles" className="ver-todas">Ver todas</Link>
              )}
            </div>
            <div className="likes-movies-row">
              {(profileFavorites !== null ? profileFavorites : favoritos)
                .filter((f) => Boolean(f.flags?.imprescindible) && f.lista !== LISTAS.NO_INTERESA)
                .slice(0, 12)
                .map((fav) => {
                const movie = fav.movie || {};
                const poster = movie.poster_path ? `https://image.tmdb.org/t/p/w300${movie.poster_path}` : null;
                return (
                  <article className="likes-movie-card" key={movie.id || JSON.stringify(movie)}>
                    <div className="likes-movie-poster">
                      {poster ? <img src={poster} alt={movie.title || movie.name} /> : <div className="poster-placeholder">Sin poster</div>}
                      <span className="likes-heart" aria-hidden>♥</span>
                    </div>
                    <div className="likes-movie-body">
                      <h3 className="likes-movie-title">{movie.title || movie.name}</h3>
                      <div className="likes-movie-meta">{movie.release_date ? movie.release_date.slice(0,4) : ''} · ⭐ {(movie.vote_average || '').toString().slice(0,3)}</div>
                    </div>
                  </article>
                );
              })}
            </div>
          </section>
        )}

        { (tab === 'todo' || tab === 'resenas') && (
          <section className="likes-section">
            <div className="section-header">
              <h2>Reseñas que te han gustado</h2>
            </div>
            <div className="likes-reviews-list">
              {((profileUserId ? (profileLikedReviews || []) : likedReviews) || []).length === 0 ? (
                <div className="videoteca-empty">No hay reseñas con like aún.</div>
              ) : (profileUserId ? (profileLikedReviews || []) : likedReviews).map((item) => {
                const reviewObj = item.review || null;
                const title = reviewObj?.movie?.title || `Reseña ${item.reviewId}`;
                const likeCount = reviewLikes.counts[String(reviewObj?.id || item.reviewId)] || 0;
                return (
                  <article className="likes-review-row" key={item.reviewId}>
                    <div className="likes-review-avatar">{(reviewObj?.author && reviewObj.author[0]) || 'U'}</div>
                    <div className="likes-review-body">
                      <div className="likes-review-header">
                        <strong className="likes-review-author">{reviewObj?.author || 'Usuario'}</strong>
                        <span className="likes-review-movie">{title}</span>
                        <span className="likes-review-rating">{reviewObj?.rating ? `${(Number(reviewObj.rating)||0)/2} ★` : ''}</span>
                      </div>
                      <p className="likes-review-text">{reviewObj?.comment || 'Sin comentario'}</p>
                      <div className="likes-review-meta">
                        <button type="button" className="videoteca-review-like-btn" aria-label="likes">
                          <span className="videoteca-review-card-heart" aria-hidden>♥</span>
                          {likeCount}
                        </button>
                        <time className="likes-review-time">{item.likedAt ? formatReviewDate(item.likedAt) : (reviewObj?.updatedAt ? formatReviewDate(reviewObj.updatedAt) : '')}</time>
                      </div>
                    </div>
                  </article>
                );
              })}
            </div>
          </section>
        )}
      </main>
    </div>
  );
}
