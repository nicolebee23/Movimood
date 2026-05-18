import { useEffect, useRef, useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import './Resultados.css';
import { fetchRecommendedMovies, genreIdToName, getRecommendationReasons } from '../utils/recommendations';
import { useFavoritos, LISTAS } from '../hooks/useFavoritos';

const MOVIES_PER_BATCH = 3;

function getStoredQuestionnaire() {
  try {
    const rawQuestionnaire = localStorage.getItem('movimood-cuestionario');
    return rawQuestionnaire ? JSON.parse(rawQuestionnaire) : null;
  } catch {
    return null;
  }
}

function Resultados() {
  const location = useLocation();
  const questionnaire = location.state?.questionnaire || getStoredQuestionnaire();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [movies, setMovies] = useState([]);
  const [normalizedQuestionnaire, setNormalizedQuestionnaire] = useState(null);
  const [batchIndex, setBatchIndex] = useState(0);
  const [isBatchLeaving, setIsBatchLeaving] = useState(false);
  const batchTransitionTimeoutRef = useRef(null);
  const { setLista, getLista, getNoInteresaIds, getMovieState, toggleSeen, toggleEssential } = useFavoritos();
  const [openMenuId, setOpenMenuId] = useState(null);

  const noInteresaIds = getNoInteresaIds();
  const filteredMovies = movies.filter((m) => !noInteresaIds.has(m.id));
  const visibleMovies = filteredMovies.slice(
    batchIndex * MOVIES_PER_BATCH,
    (batchIndex + 1) * MOVIES_PER_BATCH
  );
  const totalBatches = Math.ceil(filteredMovies.length / MOVIES_PER_BATCH);
  const currentBatch = totalBatches > 0 ? batchIndex + 1 : 0;
  const batchStart = filteredMovies.length > 0 ? (batchIndex * MOVIES_PER_BATCH) + 1 : 0;
  const batchEnd = filteredMovies.length > 0 ? batchStart + visibleMovies.length - 1 : 0;

  function getTrailerUrl(movie) {
    const year = movie.release_date?.slice(0, 4) || '';
    const searchQuery = encodeURIComponent(`${movie.title} ${year} trailer oficial`);
    return `https://www.youtube.com/results?search_query=${searchQuery}`;
  }

  function mostrarSiguienteTanda() {
    if (totalBatches <= 1 || isBatchLeaving) {
      return;
    }

    setIsBatchLeaving(true);

    if (batchTransitionTimeoutRef.current) {
      window.clearTimeout(batchTransitionTimeoutRef.current);
    }

    batchTransitionTimeoutRef.current = window.setTimeout(() => {
      setBatchIndex((currentBatch) => (currentBatch + 1) % totalBatches);
      setIsBatchLeaving(false);
      batchTransitionTimeoutRef.current = null;
    }, 230);
  }

  useEffect(() => {
    let isMounted = true;

    async function loadRecommendations() {
      if (!questionnaire) {
        setError('No hay respuestas del cuestionario para generar recomendaciones.');
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        setError('');
        const result = await fetchRecommendedMovies(questionnaire);

        if (!isMounted) {
          return;
        }

        setMovies(result.movies);
        setNormalizedQuestionnaire(result.questionnaire);
        setBatchIndex(0);
      } catch (loadError) {
        if (!isMounted) {
          return;
        }

        setError(loadError.message || 'No se pudieron cargar las películas recomendadas.');
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    }

    loadRecommendations();

    return () => {
      isMounted = false;

      if (batchTransitionTimeoutRef.current) {
        window.clearTimeout(batchTransitionTimeoutRef.current);
      }
    };
  }, [questionnaire]);

  useEffect(() => {
    if (openMenuId === null) return;
    function handleOutsideClick() { setOpenMenuId(null); }
    document.addEventListener('click', handleOutsideClick);
    return () => document.removeEventListener('click', handleOutsideClick);
  }, [openMenuId]);

  return (
    <div className="pagina-principal resultados-page">
      <div className="resultados-hero">
        <div>
          <p className="resultados-kicker">Resultados personalizados</p>
          <h1 className="titulo-app resultados-title">Tus películas para hoy</h1>
          <p className="resultados-copy">
            Combinamos tu mood, la época, la duración y los géneros elegidos para priorizar las recomendaciones.
          </p>
        </div>

        <div className="resultados-actions">
          <Link to="/cuestionario" className="resultados-link-secundario">
            Ajustar cuestionario
          </Link>
        </div>
      </div>

      {normalizedQuestionnaire && (
        <div className="resultados-filtros">
          {normalizedQuestionnaire.moods.map((mood) => (
            <span className="resultado-chip" key={mood}>{mood}</span>
          ))}
          <span className="resultado-chip">{normalizedQuestionnaire.anios.min}-{normalizedQuestionnaire.anios.max}</span>
          <span className="resultado-chip">{normalizedQuestionnaire.duracion}</span>
          {normalizedQuestionnaire.generos.map((genre) => (
            <span className="resultado-chip" key={genre}>{genre}</span>
          ))}
        </div>
      )}

      {loading && (
        <div className="resultados-panel resultados-state-panel">
          <h2>Buscando recomendaciones</h2>
          <p>Consultando TMDB y priorizando las películas que mejor encajan contigo.</p>
        </div>
      )}

      {!loading && error && (
        <div className="resultados-panel resultados-state-panel resultados-error-panel">
          <h2>No pudimos generar las recomendaciones</h2>
          <p>{error}</p>
          <Link to="/cuestionario" className="resultados-link-primario">
            Volver al cuestionario
          </Link>
        </div>
      )}

      {!loading && !error && movies.length === 0 && (
        <div className="resultados-panel resultados-state-panel">
          <h2>No encontramos resultados</h2>
          <p>Prueba a ampliar el rango de años o elegir más géneros para abrir la búsqueda.</p>
          <Link to="/cuestionario" className="resultados-link-primario">
            Ajustar respuestas
          </Link>
        </div>
      )}

      {!loading && !error && movies.length > 0 && (
        <>
          <div className="resultados-toolbar">
            <div className="resultados-toolbar-meta">
              <p className="resultados-count">
                Mostrando {batchStart}-{batchEnd} de {filteredMovies.length} recomendaciones
                {noInteresaIds.size > 0 && (
                  <span className="resultados-count-ignoradas">{noInteresaIds.size} ignorada{noInteresaIds.size !== 1 ? 's' : ''}</span>
                )}
              </p>
              <p className="resultados-batch-text">Tanda {currentBatch} de {totalBatches}</p>
            </div>

            <div className="resultados-batch-dots" aria-label={`Tanda actual ${currentBatch} de ${totalBatches}`}>
              {Array.from({ length: totalBatches }).map((_, dotIndex) => {
                const isActiveDot = dotIndex === batchIndex;
                return (
                  <button
                    key={`batch-dot-${dotIndex}`}
                    type="button"
                    className={`resultados-batch-dot ${isActiveDot ? 'activo' : ''}`}
                    onClick={() => {
                      if (isBatchLeaving || dotIndex === batchIndex) {
                        return;
                      }

                      setIsBatchLeaving(true);

                      if (batchTransitionTimeoutRef.current) {
                        window.clearTimeout(batchTransitionTimeoutRef.current);
                      }

                      batchTransitionTimeoutRef.current = window.setTimeout(() => {
                        setBatchIndex(dotIndex);
                        setIsBatchLeaving(false);
                        batchTransitionTimeoutRef.current = null;
                      }, 230);
                    }}
                    disabled={isBatchLeaving}
                    aria-label={`Ir a la tanda ${dotIndex + 1}`}
                  ></button>
                );
              })}
            </div>

            <button
              type="button"
              className="resultados-refresh-btn"
              onClick={mostrarSiguienteTanda}
              disabled={totalBatches <= 1 || isBatchLeaving}
            >
              Refrescar tarjetas
            </button>
          </div>

          <section
            key={`batch-${batchIndex}`}
            className={`resultados-grid ${isBatchLeaving ? 'resultados-grid-leaving' : 'resultados-grid-entering'}`}
            aria-label="Películas recomendadas"
          >
            {visibleMovies.map((movie, index) => {
            const genres = movie.genre_ids
              .map((genreId) => genreIdToName[genreId])
              .filter(Boolean)
              .slice(0, 3);
            const reasons = normalizedQuestionnaire ? getRecommendationReasons(movie, normalizedQuestionnaire) : [];
            const visibleRanking = (batchIndex * MOVIES_PER_BATCH) + index + 1;
            const movieState = getMovieState(movie.id);
            const currentList = getLista(movie.id);

            return (
              <article className="resultado-card" key={movie.id} style={{ '--stagger-index': index }}>
                <div className="resultado-poster-wrap">
                  <img
                    className="resultado-poster"
                    src={`https://image.tmdb.org/t/p/w500${movie.poster_path}`}
                    alt={movie.title}
                  />
                  <span className="resultado-ranking">#{visibleRanking}</span>
                  <div className="resultado-lista-wrap">
                    <button
                      type="button"
                      className={`resultado-lista-btn lista-${currentList || 'none'}`}
                      onClick={(e) => {
                        e.stopPropagation();
                        setOpenMenuId((prev) => (prev === movie.id ? null : movie.id));
                      }}
                      aria-label="Gestionar listas"
                      aria-expanded={openMenuId === movie.id}
                    >
                      {movieState.isEssential ? (
                        <svg viewBox="0 0 24 24" fill="currentColor" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                          <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/>
                        </svg>
                      ) : movieState.isIgnored ? (
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" aria-hidden="true">
                          <circle cx="12" cy="12" r="10"/><line x1="15" y1="9" x2="9" y2="15"/><line x1="9" y1="9" x2="15" y2="15"/>
                        </svg>
                      ) : movieState.isSeen ? (
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                          <path d="M20 6L9 17l-5-5"/>
                        </svg>
                      ) : currentList === LISTAS.VER_LUEGO ? (
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" aria-hidden="true">
                          <circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/>
                        </svg>
                      ) : (
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                          <path d="M19 21l-7-5-7 5V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2z"/>
                        </svg>
                      )}
                    </button>

                    {openMenuId === movie.id && (
                      <div className="resultado-lista-menu" role="menu" onClick={(e) => e.stopPropagation()}>
                        <button
                          type="button"
                          className={`resultado-lista-opcion${!movieState.isSeen && !movieState.isIgnored ? ' activa' : ''}`}
                          role="menuitem"
                          onClick={() => { setLista(movie, normalizedQuestionnaire, LISTAS.VER_LUEGO); setOpenMenuId(null); }}
                        >
                          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" aria-hidden="true"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>
                          Ver más tarde
                        </button>
                        <button
                          type="button"
                          className={`resultado-lista-opcion${movieState.isSeen ? ' activa' : ''}`}
                          role="menuitem"
                          onClick={() => { toggleSeen(movie, normalizedQuestionnaire); setOpenMenuId(null); }}
                        >
                          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M20 6L9 17l-5-5"/></svg>
                          Ya vista
                        </button>
                        <button
                          type="button"
                          className={`resultado-lista-opcion${movieState.isEssential ? ' activa' : ''}`}
                          role="menuitem"
                          onClick={() => { toggleEssential(movie, normalizedQuestionnaire); setOpenMenuId(null); }}
                        >
                          <svg viewBox="0 0 24 24" fill={movieState.isEssential ? 'currentColor' : 'none'} stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/></svg>
                          Imprescindible
                        </button>
                        <div className="resultado-lista-menu-divider" />
                        <button
                          type="button"
                          className={`resultado-lista-opcion resultado-lista-opcion-ignorar${movieState.isIgnored ? ' activa' : ''}`}
                          role="menuitem"
                          onClick={() => { setLista(movie, normalizedQuestionnaire, LISTAS.NO_INTERESA); setOpenMenuId(null); }}
                        >
                          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" aria-hidden="true"><circle cx="12" cy="12" r="10"/><line x1="15" y1="9" x2="9" y2="15"/><line x1="9" y1="9" x2="15" y2="15"/></svg>
                          No me interesa
                        </button>
                      </div>
                    )}
                  </div>
                  <a
                    className="resultado-trailer-btn"
                    href={getTrailerUrl(movie)}
                    target="_blank"
                    rel="noreferrer"
                  >
                    Ver tráiler
                  </a>
                </div>

                <div className="resultado-body">
                  <div className="resultado-heading-row">
                    <h2>{movie.title}</h2>
                    <span className="resultado-rating">{movie.vote_average?.toFixed(1) || 'N/A'}</span>
                  </div>

                  <p className="resultado-meta">
                    {movie.release_date?.slice(0, 4) || 'Sin fecha'}
                    {genres.length > 0 ? ` • ${genres.join(' • ')}` : ''}
                  </p>

                  {reasons.length > 0 && (
                    <div className="resultado-reasons">
                      {reasons.map((reason) => (
                        <span className="resultado-why" key={`${movie.id}-${reason}`}>{reason}</span>
                      ))}
                    </div>
                  )}
                </div>
              </article>
            );
            })}
          </section>
        </>
      )}
    </div>
  );
}

export default Resultados;