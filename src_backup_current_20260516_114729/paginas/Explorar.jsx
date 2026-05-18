import { useEffect, useState, useCallback, useRef } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { createPortal } from 'react-dom';
import { useAuth } from '../hooks/useAuth';
import { useFavoritos, LISTAS } from '../hooks/useFavoritos';
import './Explorar.css';

const API_BASE_URL = (process.env.REACT_APP_API_BASE_URL || '').replace(/\/$/, '');

const TMDB_GENRES_ES = [
  { id: 28, name: 'Acción' },
  { id: 12, name: 'Aventura' },
  { id: 16, name: 'Animación' },
  { id: 35, name: 'Comedia' },
  { id: 80, name: 'Crimen' },
  { id: 99, name: 'Documental' },
  { id: 18, name: 'Drama' },
  { id: 10751, name: 'Familia' },
  { id: 14, name: 'Fantasía' },
  { id: 27, name: 'Terror' },
  { id: 10402, name: 'Música' },
  { id: 9648, name: 'Misterio' },
  { id: 10749, name: 'Romance' },
  { id: 878, name: 'Ciencia ficción' },
  { id: 53, name: 'Thriller' },
  { id: 37, name: 'Western' },
];

const MOODS = [
  { id: 'triste', label: 'Triste', emoji: '🌧️' },
  { id: 'nostalgico', label: 'Nostálgico', emoji: '🌙' },
  { id: 'relajado', label: 'Relajado', emoji: '🌊' },
  { id: 'ansioso', label: 'Ansioso', emoji: '⚡' },
  { id: 'feliz', label: 'Feliz', emoji: '☀️' },
  { id: 'motivado', label: 'Motivado', emoji: '🔥' },
  { id: 'enojado', label: 'Enojado', emoji: '💢' },
  { id: 'emocionado', label: 'Emocionado', emoji: '✨' },
];

const MOOD_GENRE_MAP = {
  triste: [18, 36],
  nostalgico: [10749, 36],
  relajado: [10751, 35],
  ansioso: [53, 27],
  feliz: [35, 10751],
  motivado: [28, 12],
  enojado: [80, 53],
  emocionado: [28, 14, 12],
};

const YEARS = Array.from({ length: 40 }, (_, i) => new Date().getFullYear() - i);
const DURATIONS = [
  { label: '0-60 min', min: 0, max: 60 },
  { label: '60-120 min', min: 60, max: 120 },
  { label: '120+ min', min: 120, max: 9999 },
];

const menuLinks = [
  { label: 'Inicio', to: '/', icon: '⌂', active: false },
  { label: 'Explorar', to: '/explorar', icon: '◎', active: true },
  { label: 'Cuestionario', to: '/cuestionario', icon: '✦', active: false },
  { label: 'Mi lista', to: '/mi-lista', icon: '☰', active: false },
  { label: 'Mood', to: '/mood', icon: '◌', active: false },
  { label: 'Perfil', to: '/perfil', icon: '◯', active: false },
];

function FilterDropdown({
  label,
  placeholder,
  valueLabel,
  isOpen,
  onToggle,
  onSelect,
  options,
  formatOptionLabel,
}) {
  return (
    <div className="explorar-filter-group">
      <label className="explorar-filter-label">{label}</label>
      <div className="explorar-filter-dropdown">
        <button
          type="button"
          className="explorar-filter-trigger"
          aria-expanded={isOpen}
          onClick={onToggle}
        >
          <span className={`explorar-filter-trigger-text${valueLabel ? '' : ' placeholder'}`}>
            {valueLabel || placeholder}
          </span>
          <span className={`explorar-filter-trigger-icon${isOpen ? ' abierto' : ''}`}>⌄</span>
        </button>

        {isOpen && (
          <div className="explorar-filter-menu" role="listbox">
            {options.map((option) => (
              <button
                key={option.key}
                type="button"
                className={`explorar-filter-option${option.active ? ' active' : ''}`}
                onClick={() => onSelect(option.value)}
              >
                {formatOptionLabel ? formatOptionLabel(option) : option.label}
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

function Explorar() {
  const navigate = useNavigate();
  const { currentUser } = useAuth();
  const { getMovieState, setLista } = useFavoritos();
  const runtimeCacheRef = useRef(new Map());
  const filtersRef = useRef(null);
  const [section, setSection] = useState('tendencias');
  const [genre, setGenre] = useState(null);
  const [year, setYear] = useState(null);
  const [duration, setDuration] = useState(null);
  const [mood, setMood] = useState(null);
  const [openFilter, setOpenFilter] = useState(null);

  const [movies, setMovies] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(false);
  const [error, setError] = useState('');

  const [showLoginModal, setShowLoginModal] = useState(false);
  const [selectedMovieForFav, setSelectedMovieForFav] = useState(null);

  const genreLabel = genre ? TMDB_GENRES_ES.find((item) => item.id === genre)?.name : '';
  const yearLabel = year ? String(year) : '';
  const durationLabel = duration ? duration.label : '';
  const moodLabel = mood ? `${(MOODS.find((item) => item.id === mood)?.emoji || '')} ${MOODS.find((item) => item.id === mood)?.label || ''}`.trim() : '';
  const visibleMenuLinks = menuLinks.filter(
    (link) => !['Mi lista', 'Mood', 'Perfil'].includes(link.label)
  );

  useEffect(() => {
    const handleOutsideClick = (event) => {
      if (filtersRef.current && !filtersRef.current.contains(event.target)) {
        setOpenFilter(null);
      }
    };

    document.addEventListener('mousedown', handleOutsideClick);
    return () => document.removeEventListener('mousedown', handleOutsideClick);
  }, []);

  useEffect(() => {
    setOpenFilter(null);
  }, [genre, year, duration, mood]);

  const fetchMovies = useCallback(
    async (pageNum = 1, append = false, signal) => {
      setError('');
      if (!append) {
        setIsLoading(true);
      }

      try {
        const params = new URLSearchParams();

        params.set('page', String(pageNum));
        params.set('language', 'es-ES');
        params.set('include_adult', 'false');

        if (section === 'tendencias') {
          params.set('sort_by', 'popularity.desc');
        } else if (section === 'novedades') {
          params.set('sort_by', 'release_date.desc');
        } else if (section === 'mejor_valoradas') {
          params.set('sort_by', 'vote_average.desc');
          params.set('vote_count.gte', '100');
        }

        const selectedGenres = [];
        if (genre) {
          selectedGenres.push(genre);
        }

        const moodGenres = mood ? (MOOD_GENRE_MAP[mood] || []) : [];
        moodGenres.forEach((moodGenreId) => {
          if (!selectedGenres.includes(moodGenreId)) {
            selectedGenres.push(moodGenreId);
          }
        });

        if (selectedGenres.length > 0) {
          params.set('with_genres', selectedGenres.join(','));
        }

        if (year) {
          params.set('primary_release_year', String(year));
        }

        if (duration) {
          params.set('with_runtime.gte', String(duration.min));
          params.set('with_runtime.lte', String(duration.max));
        }

        console.log('Fetching from:', `${API_BASE_URL}/tmdb-discover.php?${params.toString()}`);

        const url = `${API_BASE_URL}/tmdb-discover.php?${params.toString()}`;
        const response = await fetch(url, { signal });

        if (!response.ok) {
          throw new Error('Error al cargar películas');
        }

        const data = await response.json();
        const baseMovies = Array.isArray(data?.results)
          ? data.results.filter((movie) => movie?.id && movie?.poster_path)
          : [];

        if (!duration || baseMovies.length === 0) {
          setMovies((prev) => (append ? [...prev, ...baseMovies] : baseMovies));
          setHasMore((data?.page || 0) < (data?.total_pages || 1));
          setPage(pageNum);
          return;
        }

        setMovies((prev) => (append ? [...prev, ...baseMovies] : baseMovies));
        setHasMore((data?.page || 0) < (data?.total_pages || 1));
        setPage(pageNum);

        const runtimeChecks = await Promise.all(
          baseMovies.map(async (movie) => {
            if (runtimeCacheRef.current.has(movie.id)) {
              return runtimeCacheRef.current.get(movie.id);
            }

            try {
              const runtimeResponse = await fetch(
                `${API_BASE_URL}/tmdb-movie.php?id=${movie.id}&language=es-ES`,
                { signal }
              );

              if (!runtimeResponse.ok) {
                return null;
              }

              const runtimeData = await runtimeResponse.json();
              const runtime = typeof runtimeData?.runtime === 'number' ? runtimeData.runtime : null;
              runtimeCacheRef.current.set(movie.id, runtime);
              return runtime;
            } catch (runtimeError) {
              if (runtimeError.name === 'AbortError') {
                throw runtimeError;
              }
              return null;
            }
          })
        );

        const filteredMovies = baseMovies.filter((movie, index) => {
          const runtime = runtimeChecks[index];
          if (typeof runtime !== 'number') {
            return false;
          }

          return runtime >= duration.min && runtime <= duration.max;
        });

        setMovies((prev) => {
          if (append) {
            return [...prev.filter((movie) => !baseMovies.some((candidate) => candidate.id === movie.id)), ...filteredMovies];
          }

          return filteredMovies;
        });
      } catch (err) {
        if (err.name === 'AbortError') {
          return;
        }
        console.error('Error fetching movies:', err);
        setError(err.message || 'Error al cargar películas');
      } finally {
        setIsLoading(false);
      }
    },
    [section, genre, year, duration, mood]
  );

  useEffect(() => {
    const controller = new AbortController();

    setPage(1);
    setMovies([]);
    fetchMovies(1, false, controller.signal);

    return () => {
      controller.abort();
    };
  }, [fetchMovies]);

  const handleMovieClick = (movie) => {
    navigate(`/pelicula/${movie.id}`, {
      state: { movie },
    });
  };

  const handleSaveFavorite = (e, movie, list) => {
    e.stopPropagation();

    if (!currentUser) {
      setSelectedMovieForFav(movie);
      setShowLoginModal(true);
      return;
    }

    setLista(movie.id, list);
  };

  const handleLoadMore = () => {
    fetchMovies(page + 1, true);
  };

  const loginModal = showLoginModal && !currentUser ? (
    <div className="explorar-modal-overlay" onClick={() => setShowLoginModal(false)} role="presentation">
      <div
        className="explorar-modal"
        role="dialog"
        aria-modal="true"
        onClick={(e) => e.stopPropagation()}
      >
        <button
          type="button"
          className="explorar-modal-close"
          aria-label="Cerrar"
          onClick={() => setShowLoginModal(false)}
        >
          ×
        </button>

        <div className="explorar-modal-content">
          <p className="explorar-modal-icon">🔐</p>
          <h3>Inicia sesión para guardar</h3>
          <p>
            Para guardar "{selectedMovieForFav?.title}" en tus favoritos necesitas estar logueado.
          </p>

          <div className="explorar-modal-actions">
            <button
              type="button"
              className="explorar-modal-btn primary"
              onClick={() => navigate('/login')}
            >
              Iniciar sesión
            </button>
            <button
              type="button"
              className="explorar-modal-btn secondary"
              onClick={() => navigate('/registro')}
            >
              Crear cuenta
            </button>
          </div>
        </div>
      </div>
    </div>
  ) : null;

  return (
    <div className="explorar-page">
      <aside className="explorar-sidebar">
        <div>
          <div className="sidebar-brand">
            <div className="brand-mark">M</div>
            <div>
              <p className="brand-title">MoviMood</p>
              <p className="brand-subtitle">Tu cine personalizado</p>
            </div>
          </div>
          <nav className="sidebar-nav" aria-label="Navegación principal">
            {visibleMenuLinks.map((link) => (
              <Link
                key={link.label}
                to={link.to}
                className={`sidebar-link${link.active ? ' active' : ''}`}
                aria-current={link.active ? 'page' : undefined}
              >
                <span className="sidebar-link-icon" aria-hidden="true">{link.icon}</span>
                <span>{link.label}</span>
              </Link>
            ))}
          </nav>
        </div>
        <div className="sidebar-footer">
          <p>Recomendaciones basadas en tu mood y preferencias.</p>
        </div>
      </aside>

      <main className="explorar-main">
        <div className="explorar">
          <header className="explorar-header">
            <h1>Explorar películas</h1>
            <p>Descubre el cine que te encanta</p>
          </header>

          <div className="explorar-filters" ref={filtersRef}>
            <FilterDropdown
              label="Género"
              placeholder="Todos los géneros"
              valueLabel={genreLabel}
              isOpen={openFilter === 'genre'}
              onToggle={() => setOpenFilter((current) => (current === 'genre' ? null : 'genre'))}
              onSelect={(value) => {
                setGenre(value);
                setOpenFilter(null);
              }}
              options={[
                { key: 'all', value: null, label: 'Todos los géneros', active: !genre },
                ...TMDB_GENRES_ES.map((item) => ({
                  key: item.id,
                  value: item.id,
                  label: item.name,
                  active: genre === item.id,
                })),
              ]}
            />

            <FilterDropdown
              label="Año"
              placeholder="Todos los años"
              valueLabel={yearLabel}
              isOpen={openFilter === 'year'}
              onToggle={() => setOpenFilter((current) => (current === 'year' ? null : 'year'))}
              onSelect={(value) => {
                setYear(value);
                setOpenFilter(null);
              }}
              options={[
                { key: 'all', value: null, label: 'Todos los años', active: !year },
                ...YEARS.map((item) => ({
                  key: item,
                  value: item,
                  label: String(item),
                  active: year === item,
                })),
              ]}
            />

            <FilterDropdown
              label="Duración"
              placeholder="Cualquier duración"
              valueLabel={durationLabel}
              isOpen={openFilter === 'duration'}
              onToggle={() => setOpenFilter((current) => (current === 'duration' ? null : 'duration'))}
              onSelect={(value) => {
                setDuration(value);
                setOpenFilter(null);
              }}
              options={[
                { key: 'all', value: null, label: 'Cualquier duración', active: !duration },
                ...DURATIONS.map((item) => ({
                  key: item.label,
                  value: item,
                  label: item.label,
                  active: duration?.label === item.label,
                })),
              ]}
            />

            <FilterDropdown
              label="Mood"
              placeholder="Cualquier mood"
              valueLabel={moodLabel}
              isOpen={openFilter === 'mood'}
              onToggle={() => setOpenFilter((current) => (current === 'mood' ? null : 'mood'))}
              onSelect={(value) => {
                setMood(value);
                setOpenFilter(null);
              }}
              options={[
                { key: 'all', value: null, label: 'Cualquier mood', active: !mood },
                ...MOODS.map((item) => ({
                  key: item.id,
                  value: item.id,
                  label: `${item.emoji} ${item.label}`,
                  active: mood === item.id,
                })),
              ]}
              formatOptionLabel={(option) => option.label}
            />

            {(genre || year || duration || mood) && (
              <button
                type="button"
                className="explorar-clear-filters"
                onClick={() => {
                  setGenre(null);
                  setYear(null);
                  setDuration(null);
                  setMood(null);
                }}
              >
                Limpiar filtros
              </button>
            )}
          </div>

          <div className="explorar-sections">
            <button
              type="button"
              className={`explorar-section-btn${section === 'tendencias' ? ' activa' : ''}`}
              onClick={() => setSection('tendencias')}
            >
              📈 Tendencias
            </button>
            <button
              type="button"
              className={`explorar-section-btn${section === 'novedades' ? ' activa' : ''}`}
              onClick={() => setSection('novedades')}
            >
              🆕 Novedades
            </button>
            <button
              type="button"
              className={`explorar-section-btn${section === 'mejor_valoradas' ? ' activa' : ''}`}
              onClick={() => setSection('mejor_valoradas')}
            >
              ⭐ Mejor valoradas
            </button>
          </div>

          <div className="explorar-content">
            {error && <div className="explorar-error">{error}</div>}

            {isLoading && movies.length === 0 ? (
              <div className="explorar-loading">
                <div className="explorar-spinner" />
                <p>Cargando películas...</p>
              </div>
            ) : movies.length === 0 ? (
              <div className="explorar-empty">
                <p className="explorar-empty-icon">🎬</p>
                <p>No se encontraron películas con estos filtros.</p>
              </div>
            ) : (
              <>
                <div className="explorar-grid">
                  {movies.map((movie) => {
                    const favState = getMovieState(movie.id);
                    const isSaved = favState?.lista !== undefined;

                    return (
                      <div
                        key={movie.id}
                        className="explorar-movie-card"
                        onClick={() => handleMovieClick(movie)}
                        role="button"
                        tabIndex={0}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter' || e.key === ' ') {
                            handleMovieClick(movie);
                          }
                        }}
                      >
                        <div className="explorar-movie-poster">
                          {movie.poster_path ? (
                            <img
                              src={`https://image.tmdb.org/t/p/w300${movie.poster_path}`}
                              alt={movie.title}
                              loading="lazy"
                            />
                          ) : (
                            <div className="explorar-movie-placeholder">
                              {movie.title}
                            </div>
                          )}

                          <div className="explorar-movie-overlay">
                            <p className="explorar-movie-detail-text">Ver detalles</p>

                            <div className="explorar-movie-actions">
                              <button
                                type="button"
                                className={`explorar-movie-btn${isSaved ? ' guardado' : ''}`}
                                onClick={(e) => {
                                  e.stopPropagation();
                                  if (isSaved) {
                                    setLista(movie.id, null);
                                  } else {
                                    handleSaveFavorite(e, movie, LISTAS.VER_LUEGO);
                                  }
                                }}
                                title={isSaved ? 'Quitar de favoritos' : 'Ver más tarde'}
                              >
                                {isSaved ? '✓ Guardado' : '🕐'}
                              </button>
                            </div>
                          </div>
                        </div>

                        <div className="explorar-movie-info">
                          <h3>{movie.title}</h3>
                          <div className="explorar-movie-meta">
                            <span>{movie.release_date?.slice(0, 4)}</span>
                            {movie.vote_average && (
                              <span className="explorar-movie-rating">
                                ⭐ {movie.vote_average.toFixed(1)}
                              </span>
                            )}
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>

                {hasMore && (
                  <div className="explorar-load-more-container">
                    <button
                      type="button"
                      className="explorar-load-more"
                      onClick={handleLoadMore}
                      disabled={isLoading}
                    >
                      {isLoading ? 'Cargando...' : 'Cargar más'}
                    </button>
                  </div>
                )}
              </>
            )}
          </div>

          {typeof document !== 'undefined' ? createPortal(loginModal, document.body) : null}
        </div>
      </main>
    </div>
  );
}

export default Explorar;
