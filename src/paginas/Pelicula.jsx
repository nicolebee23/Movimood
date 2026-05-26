import { useEffect, useState } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import { useFavoritos, LISTAS } from '../hooks/useFavoritos';
import { useMovieReviews } from '../hooks/useMovieReviews';
import './Pelicula.css';
import WizardSidebar from '../componentes/WizardSidebar';

const API_BASE_URL = (process.env.REACT_APP_API_BASE_URL || (typeof window !== 'undefined' ? `${window.location.origin}/api` : '/api')).replace(/\/$/, '');

function Pelicula() {
  const { id } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  const { currentUser } = useAuth();
  const { favoritos, setLista } = useFavoritos();
  const { addMovieReview, currentProfileId } = useMovieReviews();
  const [movie, setMovie] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [watched, setWatched] = useState(false);
  const [watchLater, setWatchLater] = useState(false);
  const [showReviewForm, setShowReviewForm] = useState(false);
  const [isRatingDragging, setIsRatingDragging] = useState(false);
  const [communityReviews, setCommunityReviews] = useState([]);
  const [communityReviewsLoading, setCommunityReviewsLoading] = useState(false);
  const [reviewDraft, setReviewDraft] = useState({
    author: '',
    rating: 5,
    text: '',
    textRich: '',
  });

  // Cargar reseñas de la comunidad con fallback a localStorage
  function loadCommunityReviews() {
    if (!id) return;
    setCommunityReviewsLoading(true);

    // Leer localStorage primero siempre
    const getLocalReviews = () => {
      try {
        const raw = localStorage.getItem('movimood-movie-reviews');
        const all = raw ? JSON.parse(raw) : [];
        return Array.isArray(all)
          ? all.filter((r) => String(r.movieId) === String(id))
          : [];
      } catch {
        return [];
      }
    };

    fetch(`${API_BASE_URL}/movimood.php?resource=reviews&movie_id=${id}`, { credentials: 'include' })
      .then((res) => {
        if (!res.ok) throw new Error('API error');
        return res.json();
      })
      .then((data) => {
        const apiReviews = Array.isArray(data?.items) ? data.items : [];
        const localReviews = getLocalReviews();
        // Combinar: API + locales que no estén ya en la API
        const apiIds = new Set(apiReviews.map((r) => r.id));
        const onlyLocal = localReviews.filter((r) => !apiIds.has(r.id));
        setCommunityReviews([...apiReviews, ...onlyLocal]);
      })
      .catch(() => {
        setCommunityReviews(getLocalReviews());
      })
      .finally(() => setCommunityReviewsLoading(false));
  }

  useEffect(() => {
    loadCommunityReviews();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  useEffect(() => {
    function syncCommunityReviews() {
      loadCommunityReviews();
    }

    window.addEventListener('movimood-reviews-change', syncCommunityReviews);
    return () => window.removeEventListener('movimood-reviews-change', syncCommunityReviews);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  // Check favoritos to see if movie is in watch later or ya vista
  useEffect(() => {
    if (movie && id && favoritos.length > 0) {
      const favorite = favoritos.find((f) => f.movie.id === parseInt(id));
      if (favorite) {
        setWatched(favorite.lista === LISTAS.YA_VISTA);
        setWatchLater(favorite.lista === LISTAS.VER_LUEGO);
      } else {
        setWatched(false);
        setWatchLater(false);
      }
    }
  }, [favoritos, id, movie]);

  // Handle watched toggle
  const handleWatchedToggle = () => {
    if (!movie) return;
    const newState = !watched;
    
    // Add to ya vista or remove if already there
    if (newState) {
      setLista(movie, null, LISTAS.YA_VISTA);
      setWatched(true);
      if (watchLater) {
        setWatchLater(false);
      }
    } else {
      // Remove from ya vista by moving to ver luego
      setLista(movie, null, LISTAS.VER_LUEGO);
      setWatched(false);
    }
  };

  // Handle watch later toggle
  const handleWatchLaterToggle = () => {
    if (!movie) return;
    const newState = !watchLater;
    
    if (newState) {
      setLista(movie, null, LISTAS.VER_LUEGO);
      setWatchLater(true);
    } else {
      // Remove completely
      const favorite = favoritos.find((f) => f.movie.id === parseInt(id));
      if (favorite) {
        setLista(movie, favorite.questionnaire, LISTAS.VER_LUEGO);
      }
      setWatchLater(false);
    }
  };

  const setRatingValue = (value) => {
    const nextValue = Math.max(1, Math.min(10, Number(value) || 1));
    setReviewDraft((prev) => ({
      ...prev,
      rating: nextValue,
    }));
  };

  // Handle review submission
  const handleReviewSubmit = async (e) => {
    e.preventDefault();
    if (!movie) return;

    const normalizedText = (reviewDraft.text || '').trim();

    const saveResult = addMovieReview(parseInt(id), {
      movie,
      mood: null,
      author: reviewDraft.author,
      rating: reviewDraft.rating,
      comment: normalizedText,
      commentRich: normalizedText,
      userId: currentUser?.id || currentProfileId,
    });

    try {
      await saveResult.savePromise;
    } catch (error) {
      alert(error?.payload?.message || error?.message || 'No se pudo guardar la reseña en la base de datos.');
      return;
    }

    if (!watched) {
      setLista(movie, null, LISTAS.YA_VISTA);
      setWatched(true);
    }

    setReviewDraft({ author: '', rating: 5, text: '', textRich: '' });
    setShowReviewForm(false);
    alert('Reseña guardada correctamente');
  };

  // Handle escape key to close review form
  useEffect(() => {
    if (!showReviewForm) return;

    const handleEscape = (e) => {
      if (e.key === 'Escape') {
        setShowReviewForm(false);
        setReviewDraft({ author: '', rating: 5, text: '', textRich: '' });
        setIsRatingDragging(false);
      }
    };

    window.addEventListener('keydown', handleEscape);
    return () => window.removeEventListener('keydown', handleEscape);
  }, [showReviewForm]);

  // Handle rating drag
  useEffect(() => {
    if (!isRatingDragging) return;

    const stopDragging = () => setIsRatingDragging(false);
    window.addEventListener('mouseup', stopDragging);
    return () => window.removeEventListener('mouseup', stopDragging);
  }, [isRatingDragging]);

  useEffect(() => {
    if (!id) {
      setError('ID de película no especificado');
      return;
    }

    setIsLoading(true);
    setError('');

    async function fetchMovieDetails() {
      try {
        // Try to get from location state first
        if (location.state?.movieData) {
          setMovie(location.state.movieData);
          setIsLoading(false);
          return;
        }

        // Fetch from backend proxy
        const params = new URLSearchParams({
          id: id,
          language: 'es-ES',
        });

        const response = await fetch(`${API_BASE_URL}/tmdb-movie.php?${params.toString()}`);

        if (!response.ok) {
          throw new Error('Error al cargar detalles de la película');
        }

        const data = await response.json();
        setMovie(data);
      } catch (err) {
        setError(err.message || 'Error al cargar la película');
      } finally {
        setIsLoading(false);
      }
    }

    fetchMovieDetails();
  }, [id, location.state]);

  if (isLoading) {
    return (
      <div className="pelicula-page">
        <div className="pelicula-loading">
          <div className="spinner"></div>
          <p>Cargando película...</p>
        </div>
      </div>
    );
  }

  if (error || !movie) {
    return (
      <div className="pelicula-page">
        <div className="pelicula-error">
          <p>{error}</p>
          <button type="button" onClick={() => navigate('/')}>
            Volver a inicio
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="pelicula-page">
      <WizardSidebar />
      <main className="pelicula-main">
        <div className="pelicula-hero" style={{
          backgroundImage: movie.backdrop_path
            ? `url('https://image.tmdb.org/t/p/w1280${movie.backdrop_path}')`
            : 'none',
        }}>
          <div className="pelicula-hero-overlay"></div>
        </div>

          <div className="pelicula-content">
          <button type="button" className="pelicula-back-btn" onClick={() => navigate(-1)}>
          ← Volver
        </button>

          <div className="pelicula-main-grid">
          {movie.poster_path && (
            <img
              src={`https://image.tmdb.org/t/p/w342${movie.poster_path}`}
              alt={movie.title || movie.name}
              className="pelicula-poster"
            />
          )}

          <div className="pelicula-info">
            <h1 className="pelicula-title">{movie.title || movie.name}</h1>

            {/* Géneros y Duración */}
            <div className="pelicula-header-meta">
              {movie.genres && movie.genres.length > 0 && (
                <div className="pelicula-genres">
                  {movie.genres.map((genre) => (
                    <span key={genre.id} className="pelicula-genre-tag">
                      {genre.name}
                    </span>
                  ))}
                </div>
              )}
              {movie.runtime && (
                <div className="pelicula-duration">
                  ⏱️ {movie.runtime} min
                </div>
              )}
            </div>

            {movie.tagline && (
              <p className="pelicula-tagline">"{movie.tagline}"</p>
            )}

            {/* Rating y Año */}
            <div className="pelicula-meta">
              {movie.vote_average && (
                <div className="pelicula-rating">
                  <span className="pelicula-rating-star">⭐</span>
                  <span className="pelicula-rating-value">{movie.vote_average.toFixed(1)}/10</span>
                </div>
              )}

              {movie.release_date && (
                <div className="pelicula-year">
                  📅 {movie.release_date.split('-')[0]}
                </div>
              )}
            </div>

            {/* Sinopsis */}
            {movie.overview && (
              <div className="pelicula-description">
                <h2>Sinopsis</h2>
                <p>{movie.overview}</p>
              </div>
            )}

            {/* Botones de Acción */}
            <div className="pelicula-actions">
              <button
                type="button"
                className={`pelicula-action-btn ${watched ? 'active' : ''}`}
                onClick={handleWatchedToggle}
              >
                ✓ {watched ? 'Ya vista' : 'Marcar como vista'}
              </button>
              <button
                type="button"
                className={`pelicula-action-btn ${watchLater ? 'active' : ''}`}
                onClick={handleWatchLaterToggle}
              >
                🕐 {watchLater ? 'En tu lista' : 'Ver más tarde'}
              </button>
              <button
                type="button"
                className="pelicula-action-btn pelicula-review-btn"
                onClick={() => setShowReviewForm(!showReviewForm)}
              >
                ✏️ {showReviewForm ? 'Cancelar' : 'Escribir reseña'}
              </button>
            </div>

            {/* Review Form */}
            {showReviewForm && (
              <div className="pelicula-review-form">
                <div className="pelicula-review-form-header">
                  <h3>Tu reseña</h3>
                  <p>{movie?.title || movie?.name}</p>
                </div>

                <form className="pelicula-review-form-content" onSubmit={handleReviewSubmit}>
                  {/* Author Name */}
                  <label className="pelicula-review-form-field">
                    <span>Nombre (opcional)</span>
                    <input
                      type="text"
                      className="pelicula-review-form-input"
                      value={reviewDraft.author}
                      maxLength={24}
                      placeholder="Tu nombre"
                      onChange={(e) => setReviewDraft((prev) => ({ ...prev, author: e.target.value }))}
                    />
                  </label>

                  {/* Rating */}
                  <div className="pelicula-review-form-rating">
                    <div className="pelicula-review-form-rating-head">
                      <span>Calificación</span>
                      <strong>{reviewDraft.rating}/10</strong>
                    </div>
                    <div className="pelicula-review-form-rating-track" role="radiogroup">
                      {Array.from({ length: 10 }, (_, i) => i + 1).map((value) => {
                        const isActive = value <= reviewDraft.rating;
                        return (
                          <button
                            key={value}
                            type="button"
                            role="radio"
                            aria-checked={reviewDraft.rating === value}
                            className={`pelicula-review-form-rating-dot${isActive ? ' active' : ''}`}
                            onMouseDown={() => {
                              setIsRatingDragging(true);
                              setRatingValue(value);
                            }}
                            onMouseEnter={() => {
                              if (isRatingDragging) {
                                setRatingValue(value);
                              }
                            }}
                            onClick={() => setRatingValue(value)}
                          >
                            {value}
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  {/* Texto de la reseña */}
                  <label className="pelicula-review-form-field">
                    <span>Reseña (opcional)</span>
                    <textarea
                      className="pelicula-review-form-input"
                      placeholder="Escribe tu reseña..."
                      value={reviewDraft.text}
                      rows={4}
                      style={{ resize: 'vertical', fontFamily: 'inherit', fontSize: '14px', padding: '10px' }}
                      onChange={(e) => setReviewDraft((prev) => ({ ...prev, text: e.target.value }))}
                    />
                  </label>

                  {/* Actions */}
                  <div className="pelicula-review-form-actions">
                    <button
                      type="button"
                      className="pelicula-review-form-cancel"
                      onClick={() => {
                        setShowReviewForm(false);
                        setReviewDraft({ author: '', rating: 5, text: '', textRich: '' });
                      }}
                    >
                      Cancelar
                    </button>
                    <button
                      type="submit"
                      className="pelicula-review-form-submit"
                    >
                      Guardar reseña
                    </button>
                  </div>
                </form>
              </div>
            )}

            {/* Productoras */}
            {movie.production_companies && movie.production_companies.length > 0 && (
              <div className="pelicula-production">
                <h3>Productoras</h3>
                <div className="pelicula-production-list">
                  {movie.production_companies.map((company) => (
                    <p key={company.id}>{company.name}</p>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Community Reviews Section */}
      <div className="pelicula-reviews-section">
        <div className="pelicula-reviews-container">
          <div className="pelicula-reviews-separator"></div>
          <div className="pelicula-reviews">
            <h2>Reseñas de la Comunidad</h2>

            {communityReviewsLoading && (
              <p style={{ color: 'rgba(255,255,255,0.5)', fontSize: '14px' }}>Cargando reseñas...</p>
            )}

            {!communityReviewsLoading && communityReviews.length === 0 && (
              <p className="pelicula-reviews-placeholder">
                Sé el primero en escribir una reseña sobre esta película.
              </p>
            )}

            {!communityReviewsLoading && communityReviews.length > 0 && (
              <div className="pelicula-reviews-list">
                {communityReviews.map((review, index) => {
                  const displayName = review.authorName || review.author || 'Anónimo';
                  const initials = displayName
                    .split(' ')
                    .slice(0, 2)
                    .map((w) => w[0]?.toUpperCase())
                    .join('') || '?';
                  return (
                    <div key={review.id || index} className="pelicula-review-card">
                      <div className="pelicula-review-header">
                        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                          {review.authorAvatar ? (
                            <img
                              src={review.authorAvatar}
                              alt={displayName}
                              style={{ width: '36px', height: '36px', borderRadius: '50%', objectFit: 'cover' }}
                            />
                          ) : (
                            <div style={{
                              width: '36px', height: '36px', borderRadius: '50%',
                              background: 'linear-gradient(135deg, #667eea, #764ba2)',
                              display: 'flex', alignItems: 'center', justifyContent: 'center',
                              fontSize: '13px', fontWeight: '600', color: 'white', flexShrink: 0,
                            }}>
                              {initials}
                            </div>
                          )}
                          <div className="pelicula-review-meta">
                            <strong className="pelicula-review-author">{displayName}</strong>
                            {review.authorUsername && (
                              <span style={{ fontSize: '12px', color: 'rgba(255,255,255,0.4)', display: 'block' }}>
                                @{review.authorUsername}
                              </span>
                            )}
                            <div className="pelicula-review-rating">
                              <span className="pelicula-review-stars">
                                {'⭐'.repeat(Math.round((review.rating || 5) / 2))}
                              </span>
                              <span className="pelicula-review-score">{review.rating || 5}/10</span>
                            </div>
                          </div>
                        </div>
                        {review.mood && (
                          <div className="pelicula-review-mood">{review.mood}</div>
                        )}
                      </div>
                      {review.comment && (
                        <div className="pelicula-review-body">
                          <p>{review.comment}</p>
                        </div>
                      )}
                      {review.createdAt && (
                        <div style={{ fontSize: '12px', color: 'rgba(255,255,255,0.35)', marginTop: '8px' }}>
                          {new Date(review.createdAt).toLocaleDateString('es-ES', { day: 'numeric', month: 'long', year: 'numeric' })}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
        </div>
      </main>
    </div>
  );
}

export default Pelicula;