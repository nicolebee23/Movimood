import { useEffect, useState } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import { useFavoritos, LISTAS } from '../hooks/useFavoritos';
import { useMovieReviews } from '../hooks/useMovieReviews';
import './Pelicula.css';
import WizardSidebar from '../componentes/WizardSidebar';
import {
  SadIcon,
  NostalgicIcon,
  RelaxedIcon,
  AnxiousIcon,
  HappyIcon,
  MotivatedIcon,
  AngryIcon,
  EmotionalIcon,
} from '../components/mood-icons/MoodIcons';

const API_BASE_URL = (process.env.REACT_APP_API_BASE_URL || (typeof window !== 'undefined' ? `${window.location.origin}/api` : '/api')).replace(/\/$/, '');

const MOOD_EMOJIS = {
  Triste: '🙁',
  Nostalgico: '🏺',
  Relajado: '☁️',
  Ansioso: '😰',
  Feliz: '😄',
  Motivado: '🔥',
  Enojado: '😠',
  Emocionado: '🤩',
};

const MOOD_COMPONENTS = {
  Triste: SadIcon,
  Nostalgico: NostalgicIcon,
  Relajado: RelaxedIcon,
  Ansioso: AnxiousIcon,
  Feliz: HappyIcon,
  Motivado: MotivatedIcon,
  Enojado: AngryIcon,
  Emocionado: EmotionalIcon,
};

const MOOD_LABELS = {
  Nostalgico: 'Nostálgico',
  Enojado: 'Enfadado',
};

const ALL_MOODS = ['Triste', 'Nostalgico', 'Relajado', 'Ansioso', 'Feliz', 'Motivado', 'Enojado', 'Emocionado'];

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
  
  const [reviewDraft, setReviewDraft] = useState({
    author: '',
    rating: 5,
    mood: '',
    text: '',
    textRich: '',
  });

  

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
      mood: reviewDraft.mood || null,
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

    setReviewDraft({ author: '', rating: 5, mood: '', text: '', textRich: '' });
    setShowReviewForm(false);
    alert('Reseña guardada correctamente');
  };

  // Handle escape key to close review form
  useEffect(() => {
    if (!showReviewForm) return;

    const handleEscape = (e) => {
      if (e.key === 'Escape') {
        setShowReviewForm(false);
        setReviewDraft({ author: '', rating: 5, mood: '', text: '', textRich: '' });
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

  const movieDataFromState = location.state?.movieData;

  useEffect(() => {
    if (!id) {
      setError('ID de película no especificado');
      return;
    }

    setError('');

    // If we have movie data from navigation state, show it immediately
    // and avoid showing the global loading spinner to prevent a visual
    // flash when navigating from a list that already has the poster/title.
    if (movieDataFromState) {
      setMovie(movieDataFromState);
    } else {
      setIsLoading(true);
    }

    async function fetchMovieDetails() {
      try {
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
  }, [id, movieDataFromState]);

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

  const releaseYear = movie.release_date ? movie.release_date.split('-')[0] : '';
  const genreNames = Array.isArray(movie.genres) && movie.genres.length > 0
    ? movie.genres.map((genre) => genre.name).filter(Boolean).join(', ')
    : '';
  const durationLabel = movie.runtime ? `${Math.floor(movie.runtime / 60)}h ${movie.runtime % 60}m` : '';
  const releaseDateLong = movie.release_date
    ? new Date(movie.release_date).toLocaleDateString('es-ES', { day: 'numeric', month: 'long', year: 'numeric' })
    : '';
  const languageName = Array.isArray(movie.spoken_languages) && movie.spoken_languages.length > 0
    ? movie.spoken_languages[0]?.name
    : (movie.original_language || '');
  const directorNames = Array.isArray(movie?.credits?.crew)
    ? movie.credits.crew.filter((crewMember) => crewMember.job === 'Director').map((director) => director.name).filter(Boolean)
    : [];
  const directorName = directorNames.length > 0
    ? directorNames.join(', ')
    : (movie?.credits?.director || movie?.director || '');

  const movieFacts = [
    {
      key: 'duration',
      label: 'Duración',
      value: durationLabel,
      icon: (
        <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
          <circle cx="12" cy="12" r="9" stroke="currentColor" strokeWidth="1.6" />
          <path d="M12 7V12L15.5 14.5" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      ),
    },
    {
      key: 'director',
      label: 'Director',
      value: directorName,
      icon: (
        <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
          <path d="M12 11.5C14.4853 11.5 16.5 9.48528 16.5 7C16.5 4.51472 14.4853 2.5 12 2.5C9.51472 2.5 7.5 4.51472 7.5 7C7.5 9.48528 9.51472 11.5 12 11.5Z" stroke="currentColor" strokeWidth="1.6" />
          <path d="M4.5 21C4.5 16.8579 7.85786 13.5 12 13.5C16.1421 13.5 19.5 16.8579 19.5 21" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
        </svg>
      ),
    },
    {
      key: 'genre',
      label: 'Género',
      value: genreNames,
      icon: (
        <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
          <path d="M6 21H18" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
          <path d="M7 20V10.5C7 9.11929 8.11929 8 9.5 8H14.5C15.8807 8 17 9.11929 17 10.5V20" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
          <path d="M7 10H17" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
        </svg>
      ),
    },
    {
      key: 'language',
      label: 'Idioma',
      value: languageName,
      icon: (
        <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
          <path d="M4 4H20V16H12L8 20V16H4V4Z" stroke="currentColor" strokeWidth="1.6" strokeLinejoin="round" />
          <path d="M7 8H17" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
          <path d="M7 12H13" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
        </svg>
      ),
    },
    {
      key: 'release',
      label: 'Estreno',
      value: releaseDateLong,
      icon: (
        <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
          <rect x="4" y="5" width="16" height="15" rx="3" stroke="currentColor" strokeWidth="1.6" />
          <path d="M4 9H20" stroke="currentColor" strokeWidth="1.6" />
          <path d="M8 3V7" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
          <path d="M16 3V7" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
        </svg>
      ),
    },
  ];

  return (
    <div className="pelicula-page">
      <WizardSidebar />
      <main className="pelicula-main">
        <div
          className="pelicula-hero"
          style={{
            backgroundImage: 'none',
            background: 'linear-gradient(180deg, #070c16 0%, #0b1424 100%)',
          }}
        >
          <div className="pelicula-hero-overlay"></div>
        </div>

        <button type="button" className="pelicula-back-btn" onClick={() => navigate(-1)}>
          ← Volver
        </button>

        <div className="pelicula-content">
          <div className="pelicula-main-grid">
            {movie.poster_path && (
              <div className="pelicula-poster-card">
                <img
                  src={`https://image.tmdb.org/t/p/w342${movie.poster_path}`}
                  alt={movie.title || movie.name}
                  className="pelicula-poster"
                />
                <div className="pelicula-poster-overlay"></div>
              </div>
            )}

            <div className="pelicula-info">
              <div className="pelicula-info-top">
                <div>
                  <h1 className="pelicula-title">{movie.title || movie.name}</h1>
                  {movie.tagline && <p className="pelicula-tagline">{movie.tagline}</p>}
                </div>

                <div className="pelicula-detail-badges">
                  {movie.vote_average && (
                    <span className="pelicula-detail-badge pelicula-rating-badge">
                      <span>★</span>
                      {movie.vote_average.toFixed(1)}/10
                    </span>
                  )}
                  {genreNames && (
                    <span className="pelicula-detail-badge pelicula-genre-badge">
                      {genreNames}
                    </span>
                  )}
                  {releaseYear && (
                    <span className="pelicula-detail-badge pelicula-year-badge">
                      {releaseYear}
                    </span>
                  )}
                </div>
              </div>

              {movie.overview && (
                <div className="pelicula-description">
                  <h2>Sinopsis</h2>
                  <p>{movie.overview}</p>
                </div>
              )}

              <div className="pelicula-actions">
                <button
                  type="button"
                  className={`pelicula-action-btn ${watched ? 'active' : ''}`}
                  onClick={handleWatchedToggle}
                >
                  ▶ {watched ? 'Ya vista' : 'Marcar como vista'}
                </button>
                <button
                  type="button"
                  className={`pelicula-action-btn ${watchLater ? 'active' : ''}`}
                  onClick={handleWatchLaterToggle}
                >
                  ⏱ {watchLater ? 'En tu lista' : 'Ver más tarde'}
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

                    {/* Mood Selection */}
                    <div className="pelicula-review-form-mood">
                      <span className="pelicula-review-form-mood-label">Mood (opcional)</span>
                      <div className="pelicula-review-form-mood-options" role="radiogroup" aria-label="Seleccionar mood">
                        {ALL_MOODS.map((mood) => {
                          const MoodIcon = MOOD_COMPONENTS[mood];
                          const displayLabel = MOOD_LABELS[mood] || mood;

                          return (
                            <button
                              key={mood}
                              type="button"
                              role="radio"
                              aria-checked={reviewDraft.mood === mood}
                              className={`pelicula-review-form-mood-option${reviewDraft.mood === mood ? ' active' : ''}`}
                              onClick={() => {
                                setReviewDraft((prev) => ({
                                  ...prev,
                                  mood: prev.mood === mood ? '' : mood,
                                }));
                              }}
                              title={displayLabel}
                            >
                              {MoodIcon ? (
                                <MoodIcon className="pelicula-review-form-mood-icon" aria-hidden="true" />
                              ) : (
                                <span className="pelicula-review-form-mood-icon" aria-hidden="true">{MOOD_EMOJIS[mood] || '🎬'}</span>
                              )}
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
                          setReviewDraft({ author: '', rating: 5, mood: '', text: '', textRich: '' });
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

            <div className="pelicula-facts-bar">
              {movieFacts.map((fact) => (
                <div key={fact.key} className="pelicula-fact-item">
                  <span className="pelicula-fact-icon" aria-hidden="true">{fact.icon}</span>
                  <div className="pelicula-fact-content">
                    <span className="pelicula-fact-label">{fact.label}</span>
                    <span className="pelicula-fact-value">{fact.value || '—'}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

      {/* Community reviews removed as requested */}
      </main>
    </div>
  );
}

export default Pelicula;