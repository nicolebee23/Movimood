import { useEffect, useRef, useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import WizardSidebar from '../componentes/WizardSidebar';
import './Resultados.css';
import '../App.css';
import { fetchRecommendedMovies, genreIdToName, getRecommendationReasons } from '../utils/recommendations';
import { useFavoritos, LISTAS } from '../hooks/useFavoritos';

const MOVIES_PER_BATCH = 4;
const RESULT_POOL_SIZE = 20;
const DISCOVER_PAGES = 5;

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
  const navigate = useNavigate();
  const { currentUser } = useAuth();
  const questionnaire = location.state?.questionnaire || getStoredQuestionnaire();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [movies, setMovies] = useState([]);
  const [normalizedQuestionnaire, setNormalizedQuestionnaire] = useState(null);
  const [batchIndex, setBatchIndex] = useState(0);
  const [isBatchLeaving, setIsBatchLeaving] = useState(false);
  const batchTransitionTimeoutRef = useRef(null);
  const { favoritos, setLista, getLista, getNoInteresaIds, getMovieState, toggleEssential } = useFavoritos();
  const [openMenuId, setOpenMenuId] = useState(null);

  const displayName = (currentUser?.name || currentUser?.username || 'Perfil').split(' ')[0];
  const avatarInitial = displayName.charAt(0).toUpperCase() || 'M';

  const noInteresaIds = getNoInteresaIds();
  const yaVistaIds = new Set(
    favoritos
      .filter((fav) => fav.lista === LISTAS.YA_VISTA)
      .map((fav) => fav.movie.id)
  );
  const filteredMovies = movies.filter((m) => !noInteresaIds.has(m.id) && !yaVistaIds.has(m.id)).slice(0, 12);
  const hasVisibleMovies = filteredMovies.length > 0;
  const questionnaireForSave = normalizedQuestionnaire || questionnaire || getStoredQuestionnaire() || null;
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
        const result = await fetchRecommendedMovies(questionnaire, {
          outputLimit: RESULT_POOL_SIZE,
          discoverPages: DISCOVER_PAGES,
        });

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

  useEffect(() => {
    if (totalBatches === 0) {
      if (batchIndex !== 0) {
        setBatchIndex(0);
      }
      return;
    }

    if (batchIndex > totalBatches - 1) {
      setBatchIndex(totalBatches - 1);
    }
  }, [batchIndex, totalBatches]);

  return (
    <div className="cuestionario-page">
      <WizardSidebar activeLabel="Resultados" footerText="Tus recomendaciones personalizadas basadas en tu mood y preferencias." hideLinks={['Resultados', 'Mi lista']} />

      {/* MAIN CONTENT */}
      <main className="cuestionario-main">
        {/* User profile chip */}
        {currentUser && (
          <button
            type="button"
            className="wizard-user-chip-fixed"
            onClick={() => navigate('/perfil')}
            aria-label="Ir a mi perfil"
          >
            {currentUser.avatar ? (
              <img className="wizard-user-avatar" src={currentUser.avatar} alt={`Avatar de ${displayName}`} />
            ) : (
              <span className="wizard-user-avatar wizard-user-avatar-fallback" aria-hidden="true">{avatarInitial}</span>
            )}
            <span className="wizard-user-name">{displayName}</span>
            <span className="wizard-user-caret" aria-hidden="true">▾</span>
          </button>
        )}

        {/* Main content area */}
        <div className="wizard-contenedor wizard-contenedor--sin-card resultados-contenedor">
          <div className="resultados-header">
            <span className="wizard-step-chip">RESULTADOS • PELÍCULAS PERSONALIZADAS PARA TI</span>
          </div>

          <h1 className="resultados-page-title">Tus películas para hoy</h1>
          <p className="resultados-page-subtitle">
            Combinamos tu mood, la época, la duración y los géneros elegidos para priorizar las recomendaciones.
          </p>

          {normalizedQuestionnaire && (
            <div className="resultados-filtros-wrapper">
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
              <button
                type="button"
                className="resultados-edit-btn"
                onClick={() => navigate('/cuestionario', { state: { questionnaire: normalizedQuestionnaire || questionnaire } })}
              >
                ⚙️ Editar preferencias
              </button>
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

          {!loading && !error && movies.length > 0 && !hasVisibleMovies && (
            <div className="resultados-panel resultados-state-panel">
              <h2>Estas recomendaciones ya las tienes gestionadas</h2>
              <p>
                Las peliculas sugeridas estan marcadas como vistas o no te interesan.
                Prueba con otros moods, generos o anos para descubrir titulos nuevos.
              </p>
              <Link to="/cuestionario" className="resultados-link-primario">
                Volver al cuestionario
              </Link>
            </div>
          )}

          {!loading && !error && movies.length > 0 && hasVisibleMovies && (
            <>
              <div className="resultados-toolbar">
                <div className="resultados-toolbar-meta">
                  <p className="resultados-count">
                    Mostrando {batchStart}-{batchEnd} de {filteredMovies.length} recomendaciones
                    {yaVistaIds.size > 0 && (
                      <span className="resultados-count-ignoradas">{yaVistaIds.size} ya vista{yaVistaIds.size !== 1 ? 's' : ''}</span>
                    )}
                  </p>
                </div>
              </div>

              <section
                key={`batch-${batchIndex}`}
                className={`resultados-list ${isBatchLeaving ? 'resultados-grid-leaving' : 'resultados-grid-entering'}`}
                aria-label="Películas recomendadas"
              >
                {visibleMovies.map((movie, index) => {
                  const number = (batchIndex * MOVIES_PER_BATCH) + index + 1;
                  const genres = movie.genre_ids
                    .map((genreId) => genreIdToName[genreId])
                    .filter(Boolean)
                    .slice(0, 3);
                  const reasons = normalizedQuestionnaire ? getRecommendationReasons(movie, normalizedQuestionnaire) : [];
                  const movieState = getMovieState(movie.id);
                  const currentList = getLista(movie.id);

                  const stars = Math.round((movie.vote_average || 0) / 2); // 0-5

                  return (
                    <div className="resultado-item" key={movie.id} style={{ '--stagger-index': index }}>
                      <div className="resultado-number-col" aria-hidden="true">
                        <div className="result-number">
                          <span className="result-number-circle">{number}</span>
                        </div>
                      </div>

                      <article className="resultado-row">
                        <div className="resultado-row-poster">
                          <img
                            className="resultado-row-poster-img"
                            src={`https://image.tmdb.org/t/p/w500${movie.poster_path}`}
                            alt={movie.title}
                          />
                        </div>

                        <div className="resultado-row-body">
                          <div className="resultado-heading-row">
                            <h2>{movie.title}</h2>
                          </div>

                          <div className="resultado-stars" aria-hidden="true">
                            {Array.from({ length: 5 }).map((_, i) => (
                              <span key={i} className={i < stars ? 'star filled' : 'star'}>★</span>
                            ))}
                          </div>

                          <p className="resultado-meta">
                            {movie.release_date?.slice(0, 4) || 'Sin fecha'}{genres.length > 0 ? ` • ${genres.join(' • ')}` : ''}
                          </p>

                          {reasons.length > 0 && (
                            <div className="resultado-reasons">
                              {reasons.map((reason, idx) => (
                                <div key={idx} className="resultado-reason-line">{reason}</div>
                              ))}
                            </div>
                          )}
                        </div>

                        <div className="resultado-row-actions">
                          <a
                            className="resultado-cta"
                            href={getTrailerUrl(movie)}
                            target="_blank"
                            rel="noreferrer"
                          >Ver tráiler</a>

                          <div className="resultado-lista-wrapper">
                            <button
                              type="button"
                              className={`resultado-lista-btn lista-${currentList || 'none'}`}
                              onClick={(e) => { e.stopPropagation(); setOpenMenuId((prev) => (prev === movie.id ? null : movie.id)); }}
                              aria-label="Gestionar listas"
                              aria-expanded={openMenuId === movie.id}
                            >
                              {movieState.isEssential ? (
                                <>
                                  <svg viewBox="0 0 24 24" fill="currentColor" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                                    <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/>
                                  </svg>
                                  <span>Imprescindible</span>
                                </>
                              ) : movieState.isIgnored ? (
                                <>
                                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" aria-hidden="true">
                                    <circle cx="12" cy="12" r="10"/><line x1="15" y1="9" x2="9" y2="15"/><line x1="9" y1="9" x2="15" y2="15"/>
                                  </svg>
                                  <span>No me interesa</span>
                                </>
                              ) : movieState.isSeen ? (
                                <>
                                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                                    <path d="M20 6L9 17l-5-5"/>
                                  </svg>
                                  <span>Ya vista</span>
                                </>
                              ) : currentList === LISTAS.VER_LUEGO ? (
                                <>
                                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" aria-hidden="true">
                                    <circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/>
                                  </svg>
                                  <span>Ver más tarde</span>
                                </>
                              ) : (
                                <span>+ Mi lista</span>
                              )}
                            </button>

                            {openMenuId === movie.id && (
                              <div className="resultado-lista-menu" role="menu" onClick={(e) => e.stopPropagation()}>
                              <button
                                type="button"
                                className={`resultado-lista-opcion${!movieState.isSeen && !movieState.isIgnored ? ' activa' : ''}`}
                                role="menuitem"
                                onClick={() => { setLista(movie, questionnaireForSave, LISTAS.VER_LUEGO); setOpenMenuId(null); }}
                              >
                                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" aria-hidden="true"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>
                                Ver más tarde
                              </button>
                              <button
                                type="button"
                                className={`resultado-lista-opcion${movieState.isSeen ? ' activa' : ''}`}
                                role="menuitem"
                                onClick={() => { setLista(movie, questionnaireForSave, LISTAS.YA_VISTA); setOpenMenuId(null); }}
                              >
                                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M20 6L9 17l-5-5"/></svg>
                                Ya vista
                              </button>
                              <button
                                type="button"
                                className={`resultado-lista-opcion${movieState.isEssential ? ' activa' : ''}`}
                                role="menuitem"
                                onClick={() => { toggleEssential(movie, questionnaireForSave); setOpenMenuId(null); }}
                              >
                                <svg viewBox="0 0 24 24" fill={movieState.isEssential ? 'currentColor' : 'none'} stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/></svg>
                                Imprescindible
                              </button>
                              <div className="resultado-lista-menu-divider" />
                              <button
                                type="button"
                                className={`resultado-lista-opcion resultado-lista-opcion-ignorar${movieState.isIgnored ? ' activa' : ''}`}
                                role="menuitem"
                                onClick={() => { setLista(movie, questionnaireForSave, LISTAS.NO_INTERESA); setOpenMenuId(null); }}
                              >
                                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" aria-hidden="true"><circle cx="12" cy="12" r="10"/><line x1="15" y1="9" x2="9" y2="15"/><line x1="9" y1="9" x2="15" y2="15"/></svg>
                                No me interesa
                              </button>
                              </div>
                            )}
                          </div>
                        </div>
                      </article>
                    </div>
                  );
                })}
              </section>

              {totalBatches > 1 && batchIndex < totalBatches - 1 && (
                <div className="resultados-refresh-container">
                  <button
                    className="resultados-refresh-btn"
                    onClick={mostrarSiguienteTanda}
                    disabled={isBatchLeaving}
                  >
                    Refrescar tarjetas
                  </button>
                </div>
              )}
            </>
          )}
        </div>
      </main>
    </div>
  );
}

export default Resultados;