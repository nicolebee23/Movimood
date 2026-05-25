import { useEffect, useState } from 'react';
import { Link, Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import { requestJson } from '../utils/movimoodApi';
import WizardSidebar from '../componentes/WizardSidebar';
import './Seguidores.css';

function getUserLabel(user) {
  return user?.name || user?.username || 'Usuario';
}

export default function Seguidores() {
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
        const followers = Array.isArray(resp?.followers) ? resp.followers : [];

        if (!cancelled) {
          setList(followers);
        }

        followers.forEach((user) => {
          (async (follower) => {
            try {
              const [favResp, revResp, rlikesResp] = await Promise.all([
                requestJson('movimood.php', { params: { resource: 'favorites', user_id: follower.id } }),
                requestJson('movimood.php', { params: { resource: 'reviews', user_id: follower.id } }),
                requestJson('movimood.php', { params: { resource: 'review-likes', user_id: follower.id } }),
              ]);

              const favorites = Array.isArray(favResp?.items) ? favResp.items : [];
              const imprescindibleCount = favorites.filter((favorite) => Boolean(favorite.flags?.imprescindible) && favorite.lista !== undefined).length;
              const yaVistas = favorites.filter((favorite) => favorite.lista === 'YA_VISTA' || favorite.lista === 'ya_vista' || favorite.lista === 2).length;
              const reviews = Array.isArray(revResp?.items) ? revResp.items : [];
              const likedReviews = Array.isArray(rlikesResp?.items) ? rlikesResp.items : [];

              setList((prev) => prev.map((entry) => (
                entry.id === follower.id
                  ? {
                      ...entry,
                      likesCount: imprescindibleCount,
                      moviesCount: yaVistas,
                      reviewsCount: reviews.length,
                      likedReviewsCount: likedReviews.length,
                    }
                  : entry
              )));
            } catch {
              // keep the follower card even if metrics fail
            }
          })(user);
        });
      } catch {
        if (!cancelled) {
          setError('No se pudieron cargar los seguidores.');
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    }

    load();
    return () => {
      cancelled = true;
    };
  }, [profileUserId]);

  if (!currentUser) return <Navigate to="/login" replace />;

  return (
    <div className="home-page seguidores-page">
      <WizardSidebar activeLabel="Seguidores" footerText={profileUserId === currentUser?.id ? 'Personas que te siguen' : 'Personas que siguen a este usuario'} />
      <main className="home-main seguidores-main">
        <div className="seguidores-hero">
          <div className="seguidores-hero-head">
            <div className="seguidores-hero-copy">
              <Link to={backProfileTo} className="seguidores-back-link" aria-label="Volver al perfil">
                ←
              </Link>
              <div>
                <h1>Seguidores</h1>
                <p>{profileUserId === currentUser?.id ? 'Las personas y cuentas que te siguen en MoviMood.' : 'Las personas y cuentas que siguen a este usuario en MoviMood.'}</p>
              </div>
            </div>
          </div>
        </div>

        <section className="seguidores-list">
          {loading && <div className="seguidores-empty">Cargando seguidores...</div>}
          {error && <div className="seguidores-empty" style={{ color: 'salmon' }}>{error}</div>}
          {!loading && list.length === 0 && (
            <div className="seguidores-empty">Aún no hay seguidores para este usuario.</div>
          )}

          {list.map((user) => (
            <article className="seguido-card" key={user.id}>
              <div className="seguido-left">
                <div className="seguido-avatar">{getUserLabel(user).charAt(0)}</div>
                <div className="seguido-meta">
                  <strong className="seguido-name">{getUserLabel(user)}</strong>
                  <div className="seguido-handle">@{user.username}</div>
                  {user.bio && <div className="seguido-bio">{user.bio}</div>}
                </div>
              </div>
              <div className="seguido-right">
                <div className="seguido-stats">
                  <div><strong>{user.likesCount || 0}</strong><span>Likes</span></div>
                  <div><strong>{user.moviesCount || 0}</strong><span>Películas</span></div>
                  <div><strong>{user.reviewsCount || 0}</strong><span>Reseñas</span></div>
                  <div><strong>{user.likedReviewsCount || 0}</strong><span>Likes recibidos</span></div>
                </div>
                <div className="seguido-actions">
                  <button type="button" className="seguir-btn">Seguidor</button>
                  <Link to={`/perfil/${encodeURIComponent(user.id)}`} className="ver-perfil">→</Link>
                </div>
              </div>
            </article>
          ))}
        </section>
      </main>
    </div>
  );
}