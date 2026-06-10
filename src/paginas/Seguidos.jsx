import { useEffect, useState } from 'react';
import { Link, Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import { requestJson } from '../utils/movimoodApi';
import WizardSidebar from '../componentes/WizardSidebar';
import './Seguidos.css';

function normalizeFavoriteListName(value) {
  return String(value || '')
    .trim()
    .toLowerCase()
    .replace(/_/g, '-')
    .replace(/\s+/g, '-');
}

function countUniqueFavoriteMovies(favorites, acceptedLists = null) {
  const uniqueMovieIds = new Set();

  for (const favorite of Array.isArray(favorites) ? favorites : []) {
    if (!favorite) continue;

    const listName = normalizeFavoriteListName(favorite.lista || favorite.listType || favorite.list_type);
    if (listName === 'no-interesa') continue;
    if (acceptedLists && !acceptedLists.includes(listName)) continue;

    const movieId = favorite.movie?.id ?? favorite.movie_id ?? favorite.movieId ?? favorite.id;
    if (movieId !== undefined && movieId !== null && movieId !== '') {
      uniqueMovieIds.add(String(movieId));
    }
  }

  return uniqueMovieIds.size;
}

function countEssentialFavorites(favorites) {
  return (Array.isArray(favorites) ? favorites : []).filter((favorite) => Boolean(favorite?.flags?.imprescindible)).length;
}

async function sumReviewLikes(reviews) {
  const totals = await Promise.all(
    (Array.isArray(reviews) ? reviews : []).map(async (review) => {
      try {
        const countResp = await requestJson('movimood.php', { params: { resource: 'review-likes', review_id: review.id } });
        return Number(countResp?.count || 0);
      } catch {
        return 0;
      }
    })
  );

  return totals.reduce((sum, value) => sum + value, 0);
}

export default function Seguidos() {
  const { currentUser } = useAuth();
  const location = useLocation();
  const params = new URLSearchParams(location.search || '');
  const profileUserId = params.get('user_id') || currentUser?.id || null;
  const backProfileTo = profileUserId === currentUser?.id ? '/perfil' : `/perfil/${encodeURIComponent(profileUserId || '')}`;
  const [list, setList] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    let cancelled = false;
    async function load() {
      if (!profileUserId) return;
      setLoading(true);
      setError('');
      try {
        const resp = await requestJson('movimood.php', { params: { resource: 'follows', user_id: profileUserId } });
        const following = Array.isArray(resp?.following) ? resp.following : [];
        if (!cancelled) setList(following);
        // fetch metrics for each followed user
        (async () => {
          for (const u of following) {
            (async (user) => {
              try {
                const [favResp, revResp, likedResp] = await Promise.all([
                  requestJson('movimood.php', { params: { resource: 'favorites', user_id: user.id } }),
                  requestJson('movimood.php', { params: { resource: 'reviews', user_id: user.id } }),
                  requestJson('movimood.php', { params: { resource: 'review-likes', user_id: user.id } }),
                ]);

                const favorites = Array.isArray(favResp?.items) ? favResp.items : [];
                const reviews = Array.isArray(revResp?.items) ? revResp.items : [];
                const likedReviews = Array.isArray(likedResp?.items) ? likedResp.items : [];
                const likesCount = countEssentialFavorites(favorites) + likedReviews.length;
                const moviesCount = countUniqueFavoriteMovies(favorites, ['ya-vista', 'ya-vistas', 'vistas', 'seen']);
                const reviewsCount = reviews.length;

                setList((prev) => prev.map((p) => (p.id === user.id ? {
                  ...p,
                  likesCount,
                  moviesCount,
                  reviewsCount,
                  likedReviewsCount: reviewsCount,
                } : p)));
              } catch (e) {
                // ignore per-user errors
              }
            })(u);
          }
        })();
      } catch (e) {
        if (!cancelled) setError('No se pudieron cargar los usuarios seguidos.');
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    load();
    return () => { cancelled = true; };
  }, [profileUserId]);

  if (!currentUser) return <Navigate to="/login" replace />;

  return (
    <div className="home-page seguidores-page">
      <WizardSidebar activeLabel="Seguidos" footerText={profileUserId === currentUser?.id ? 'Personas que sigues' : 'Personas que sigue este usuario'} />
      <main className="home-main seguidores-main">
        <div className="seguidores-hero">
          <div className="seguidores-hero-head">
            <div className="seguidores-hero-copy">
              <Link to={backProfileTo} className="seguidores-back-link" aria-label="Volver al perfil">
                ←
              </Link>
              <h1>Seguidos</h1>
              <p>{profileUserId === currentUser?.id ? 'Las personas y cuentas que sigues en MoviMood.' : 'Las personas y cuentas que sigue este usuario en MoviMood.'}</p>
            </div>
          </div>
        </div>

        <section className="seguidores-list">
          {loading && <div className="seguidores-empty">Cargando seguidos...</div>}
          {error && <div className="seguidores-empty" style={{ color: 'salmon' }}>{error}</div>}
          {!loading && list.length === 0 && (
            <div className="seguidores-empty">Aún no hay cuentas seguidas para este usuario.</div>
          )}

          {list.map((user) => (
            <article className="seguido-card" key={user.id}>
              <div className="seguido-left">
                <div className="seguido-avatar">{(user.name || user.username || 'U').charAt(0)}</div>
                <div className="seguido-meta">
                  <strong className="seguido-name">{user.name || user.username}</strong>
                  <div className="seguido-handle">@{user.username}</div>
                  {user.bio && <div className="seguido-bio">{user.bio}</div>}
                </div>
              </div>
              <div className="seguido-right">
                <div className="seguido-stats">
                  <div><strong>{user.likesCount || 0}</strong><span>Likes</span></div>
                  <div><strong>{user.moviesCount || 0}</strong><span>Vistas</span></div>
                  <div><strong>{user.reviewsCount || 0}</strong><span>Reseñas que ha escrito</span></div>
                </div>
                <div className="seguido-actions">
                  <button type="button" className="seguir-btn">Siguiendo</button>
                  <Link to={`/perfil/${user.id}`} className="ver-perfil">→</Link>
                </div>
              </div>
            </article>
          ))}
        </section>
      </main>
    </div>
  );
}
