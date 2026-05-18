import { useEffect, useState, useRef } from 'react';
import { createPortal } from 'react-dom';
import { Link, Navigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import { useFavoritos, LISTAS } from '../hooks/useFavoritos';
import { useMovieReviews } from '../hooks/useMovieReviews';
import { genreIdToName } from '../utils/recommendations';
import './Videoteca.css';

const MOOD_EMOJIS = {
  Triste: '🌧️',
  Nostalgico: '🌙',
  Relajado: '🌊',
  Ansioso: '⚡',
  Feliz: '☀️',
  Motivado: '🔥',
  Enojado: '💢',
  Emocionado: '✨',
};

const TABS = [
  {
    id: LISTAS.VER_LUEGO,
    label: 'Ver más tarde',
    emptyTitle: 'Nada pendiente aún',
    emptyText: 'Marca películas con el icono de reloj en los resultados para guardarlas aquí.',
  },
  {
    id: LISTAS.YA_VISTA,
    label: 'Ya vistas',
    emptyTitle: 'Aun no has marcado pelis como vistas',
    emptyText: 'Cuando reseñes una peli de Ver más tarde, pasará aquí automáticamente.',
  },
  {
    id: LISTAS.IMPRESCINDIBLES,
    label: 'Mis imprescindibles',
    emptyTitle: 'Tu colección de joyas está vacía',
    emptyText: 'Cuando encuentres una película que ya has visto y amas, márcala como imprescindible.',
  },
  {
    id: 'mis-resenas',
    label: 'Mis reseñas',
    emptyTitle: 'Aun no has escrito reseñas',
    emptyText: 'Abre una peli de tu videoteca y escribe tu primera reseña para verla aquí.',
  },
];

function formatDate(isoString) {
  try {
    return new Date(isoString).toLocaleDateString('es-ES', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
    });
  } catch {
    return '';
  }
}

function getTrailerUrl(movie) {
  const year = movie.release_date?.slice(0, 4) || '';
  return `https://www.youtube.com/results?search_query=${encodeURIComponent(`${movie.title} ${year} trailer oficial`)}`;
}

function formatReviewDate(isoString) {
  try {
    return new Date(isoString).toLocaleDateString('es-ES', {
      day: 'numeric',
      month: 'short',
    });
  } catch {
    return '';
  }
}

function htmlToPlainText(html) {
  if (!html) {
    return '';
  }

  try {
    const parser = new DOMParser();
    const documentNode = parser.parseFromString(html, 'text/html');
    return (documentNode.body.textContent || '').replace(/\s+/g, ' ').trim();
  } catch {
    return String(html).replace(/<[^>]*>/g, ' ').replace(/\s+/g, ' ').trim();
  }
}

function Videoteca() {
  const { currentUser } = useAuth();
  const isAuthenticated = Boolean(currentUser);
  const { favoritos, setLista, getMovieState, toggleSeen, toggleEssential } = useFavoritos();
  const { addMovieReview, removeMovieReview, getMovieReviewByProfile, getReviewsByProfile } = useMovieReviews();
  const [activeTab, setActiveTab] = useState(LISTAS.VER_LUEGO);
  const [activeMood, setActiveMood] = useState('Todos');
  const [searchQuery, setSearchQuery] = useState('');
  const [reviewStatusFilter, setReviewStatusFilter] = useState('todos');
  const [sortMode, setSortMode] = useState('recientes');
  const [viewMode, setViewMode] = useState('grid');
  const [ignoradasOpen, setIgnoradasOpen] = useState(false);
  const [openMoveMenuMovieId, setOpenMoveMenuMovieId] = useState(null);
  const [isReviewModalOpen, setIsReviewModalOpen] = useState(false);
  const [reviewEditorSeed, setReviewEditorSeed] = useState(0);
  const [reviewModalContext, setReviewModalContext] = useState(null);
  const [isRatingDragging, setIsRatingDragging] = useState(false);
  const reviewEditorRef = useRef(null);
  const [reviewModalDraft, setReviewModalDraft] = useState({
    author: '',
    rating: 5,
    mood: '',
    comment: '',
    commentRich: '',
  });
  const isReviewsTab = activeTab === 'mis-resenas';

  const tabMovies = isReviewsTab
    ? []
    : favoritos.filter((fav) => {
        if (fav.lista === LISTAS.NO_INTERESA) {
          return false;
        }

        if (activeTab === LISTAS.VER_LUEGO) {
          return fav.lista === LISTAS.VER_LUEGO;
        }

        if (activeTab === LISTAS.YA_VISTA) {
          return fav.lista === LISTAS.YA_VISTA;
        }

        if (activeTab === LISTAS.IMPRESCINDIBLES) {
          return Boolean(fav.flags?.imprescindible);
        }

        return false;
      });
  const ignoradas = favoritos.filter((f) => f.lista === LISTAS.NO_INTERESA);
  const myReviews = getReviewsByProfile();
  const reviewsByMovieId = new Map(myReviews.map((review) => [review.movieId, review]));
  const favoritosByMovieId = new Map(favoritos.map((fav) => [fav.movie.id, fav]));
  const uniqueMoodsRated = new Set(myReviews.map((review) => review.mood).filter(Boolean)).size;
  const moodCoveragePercent = Math.round((uniqueMoodsRated / Object.keys(MOOD_EMOJIS).length) * 100);

  const availableMoods = Array.from(
    new Set(tabMovies.flatMap((fav) => fav.questionnaire?.moods || []))
  );

  const filteredTabMovies = tabMovies
    .filter((fav) => {
      if (activeMood === 'Todos') {
        return true;
      }
      return (fav.questionnaire?.moods || []).includes(activeMood);
    })
    .filter((fav) => {
      const normalizedQuery = searchQuery.trim().toLowerCase();
      if (!normalizedQuery) {
        return true;
      }

      const title = (fav.movie?.title || '').toLowerCase();
      return title.includes(normalizedQuery);
    })
    .filter((fav) => {
      const review = reviewsByMovieId.get(fav.movie.id);
      const hasReview = Boolean(review);
      const hasComment = Boolean((review?.comment || '').trim());

      if (reviewStatusFilter === 'con-resena') {
        return hasReview && hasComment;
      }

      if (reviewStatusFilter === 'solo-puntuacion') {
        return hasReview && !hasComment;
      }

      if (reviewStatusFilter === 'sin-actividad') {
        return !hasReview;
      }

      return true;
    })
    .sort((left, right) => {
      if (sortMode === 'antiguas') {
        return new Date(left.savedAt) - new Date(right.savedAt);
      }

      if (sortMode === 'rating-tmdb') {
        return (right.movie?.vote_average || 0) - (left.movie?.vote_average || 0);
      }

      if (sortMode === 'mejor-puntuadas') {
        const leftReview = reviewsByMovieId.get(left.movie.id);
        const rightReview = reviewsByMovieId.get(right.movie.id);
        return (Number(rightReview?.rating) || 0) - (Number(leftReview?.rating) || 0);
      }

      return new Date(right.savedAt) - new Date(left.savedAt);
    });

  const hasActiveFilters =
    Boolean(searchQuery.trim()) ||
    reviewStatusFilter !== 'todos' ||
    sortMode !== 'recientes' ||
    activeMood !== 'Todos';

  function clearAllFilters() {
    setSearchQuery('');
    setReviewStatusFilter('todos');
    setSortMode('recientes');
    setActiveMood('Todos');
  }

  useEffect(() => {
    if (activeMood !== 'Todos' && !availableMoods.includes(activeMood)) {
      setActiveMood('Todos');
    }
  }, [activeMood, availableMoods]);

  useEffect(() => {
    if (!isRatingDragging) {
      return undefined;
    }

    function stopDragging() {
      setIsRatingDragging(false);
    }

    window.addEventListener('mouseup', stopDragging);
    return () => {
      window.removeEventListener('mouseup', stopDragging);
    };
  }, [isRatingDragging]);

  useEffect(() => {
    if (!isReviewModalOpen) {
      return undefined;
    }

    function handleEscape(event) {
      if (event.key === 'Escape') {
        setIsReviewModalOpen(false);
        setReviewModalContext(null);
        setIsRatingDragging(false);
      }
    }

    window.addEventListener('keydown', handleEscape);
    return () => {
      window.removeEventListener('keydown', handleEscape);
    };
  }, [isReviewModalOpen]);

  useEffect(() => {
    if (!isReviewModalOpen || typeof document === 'undefined') {
      return undefined;
    }

    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';

    return () => {
      document.body.style.overflow = previousOverflow;
    };
  }, [isReviewModalOpen]);

  useEffect(() => {
    if (openMoveMenuMovieId === null) {
      return undefined;
    }

    function closeMenu(event) {
      const targetNode = event.target;
      if (targetNode && targetNode.closest && targetNode.closest('.videoteca-move-wrap')) {
        return;
      }
      setOpenMoveMenuMovieId(null);
    }

    window.addEventListener('mousedown', closeMenu);
    return () => {
      window.removeEventListener('mousedown', closeMenu);
    };
  }, [openMoveMenuMovieId]);

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  const activeTabMeta = TABS.find((t) => t.id === activeTab);
  function openReviewModal({ movie, questionnaire, sourceTab, existingReview }) {
    const normalizedMovie = movie || existingReview?.movie || (existingReview?.movieId ? { id: existingReview.movieId } : null);
    if (!normalizedMovie?.id) {
      return;
    }

    const assignedMoods = Array.from(new Set((questionnaire?.moods || []).filter(Boolean)));
    const selectedMood = existingReview?.mood && assignedMoods.includes(existingReview.mood)
      ? existingReview.mood
      : (existingReview?.mood || assignedMoods[0] || '');
    const nextDraft = {
      author: existingReview?.author || '',
      rating: Number(existingReview?.rating) || 5,
      mood: selectedMood,
      comment: existingReview?.comment || '',
      commentRich: existingReview?.commentRich || existingReview?.comment || '',
    };

    setReviewModalContext({
      movie: normalizedMovie,
      questionnaire,
      sourceTab,
      existingReview,
      assignedMoods,
    });
    setReviewModalDraft(nextDraft);
    setReviewEditorSeed((prev) => prev + 1);
    setIsReviewModalOpen(true);
  }

  function closeReviewModal() {
    setIsReviewModalOpen(false);
    setReviewModalContext(null);
    setIsRatingDragging(false);
  }

  function handleEditorInput(event) {
    const nextHtml = event.currentTarget.innerHTML || '';
    setReviewModalDraft((prev) => ({
      ...prev,
      commentRich: nextHtml,
      comment: htmlToPlainText(nextHtml),
    }));
  }

  function applyEditorCommand(command) {
    if (!reviewEditorRef.current) {
      return;
    }

    reviewEditorRef.current.focus();
    document.execCommand(command, false);
    const nextHtml = reviewEditorRef.current.innerHTML || '';
    setReviewModalDraft((prev) => ({
      ...prev,
      commentRich: nextHtml,
      comment: htmlToPlainText(nextHtml),
    }));
  }

  function setRatingValue(value) {
    const nextValue = Math.max(1, Math.min(10, Number(value) || 1));
    setReviewModalDraft((prev) => ({
      ...prev,
      rating: nextValue,
    }));
  }

  function saveReviewFromModal(event) {
    event.preventDefault();

    if (!reviewModalContext?.movie?.id) {
      return;
    }

    const normalizedComment = (reviewModalDraft.comment || '').trim();

    addMovieReview(reviewModalContext.movie.id, {
      movie: reviewModalContext.movie,
      mood: reviewModalDraft.mood || null,
      author: reviewModalDraft.author,
      rating: Number(reviewModalDraft.rating) || 5,
      comment: normalizedComment,
      commentRich: normalizedComment ? (reviewModalDraft.commentRich || normalizedComment) : '',
    });

    if (reviewModalContext.sourceTab === LISTAS.VER_LUEGO) {
      setLista(reviewModalContext.movie, reviewModalContext.questionnaire, LISTAS.YA_VISTA);
    }

    closeReviewModal();
  }

  function handleSetWatchLater(movie, questionnaire) {
    setLista(movie, questionnaire, LISTAS.VER_LUEGO);
    setOpenMoveMenuMovieId(null);
  }

  function handleToggleSeen(movie, questionnaire) {
    toggleSeen(movie, questionnaire);
    setOpenMoveMenuMovieId(null);
  }

  function handleToggleEssential(movie, questionnaire) {
    toggleEssential(movie, questionnaire);
    setOpenMoveMenuMovieId(null);
  }

  return (
    <div className="pagina-principal videoteca-page">
      <div className="videoteca-hero">
        <div>
          <p className="videoteca-kicker">Colección personal</p>
          <h1 className="titulo-app videoteca-titulo">Mi Videoteca</h1>
          <p className="videoteca-copy">
            Películas que guardaste, con filtros por mood para ver solo el estado que te apetece.
          </p>
          <div className="videoteca-radar-progress" aria-label="Progreso de moods para el radar">
            <div className="videoteca-radar-progress-head">
              <span>Progreso Mood Radar</span>
              <strong>{uniqueMoodsRated}/{Object.keys(MOOD_EMOJIS).length} moods</strong>
            </div>
            <div className="videoteca-radar-progress-track">
              <span style={{ width: `${Math.max(0, Math.min(100, moodCoveragePercent))}%` }} />
            </div>
          </div>
        </div>
        <Link to="/cuestionario" className="videoteca-cta-btn">
          Descubrir más →
        </Link>
      </div>

      {/* Tab bar */}
      <div className="videoteca-tabs" role="tablist">
        {TABS.map((tab) => {
          const count = tab.id === 'mis-resenas'
            ? myReviews.length
            : tab.id === LISTAS.VER_LUEGO
              ? favoritos.filter((f) => f.lista === LISTAS.VER_LUEGO).length
              : tab.id === LISTAS.YA_VISTA
                ? favoritos.filter((f) => f.lista === LISTAS.YA_VISTA).length
                : favoritos.filter((f) => Boolean(f.flags?.imprescindible) && f.lista !== LISTAS.NO_INTERESA).length;
          return (
            <button
              key={tab.id}
              type="button"
              role="tab"
              aria-selected={activeTab === tab.id}
              className={`videoteca-tab${activeTab === tab.id ? ' activo' : ''}`}
              onClick={() => setActiveTab(tab.id)}
            >
              {tab.id === LISTAS.VER_LUEGO ? (
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" aria-hidden="true"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>
              ) : tab.id === LISTAS.YA_VISTA ? (
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M20 6L9 17l-5-5"/></svg>
              ) : (
                <svg viewBox="0 0 24 24" fill={activeTab === tab.id ? 'currentColor' : 'none'} stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/></svg>
              )}
              {tab.label}
              {count > 0 && <span className="videoteca-tab-count">{count}</span>}
            </button>
          );
        })}
      </div>

      {!isReviewsTab && tabMovies.length > 0 && availableMoods.length > 0 && (
        <div className="videoteca-mood-filtros" aria-label="Filtrar por mood">
          <button
            type="button"
            className={`videoteca-mood-filtro-btn${activeMood === 'Todos' ? ' activo' : ''}`}
            onClick={() => setActiveMood('Todos')}
          >
            Todos
            <span className="videoteca-mood-filtro-count">{tabMovies.length}</span>
          </button>

          {availableMoods.map((mood) => {
            const moodCount = tabMovies.filter((fav) => (fav.questionnaire?.moods || []).includes(mood)).length;
            return (
              <button
                key={mood}
                type="button"
                className={`videoteca-mood-filtro-btn${activeMood === mood ? ' activo' : ''}`}
                onClick={() => setActiveMood(mood)}
              >
                <span aria-hidden="true">{MOOD_EMOJIS[mood] || '🎬'}</span>
                {mood}
                <span className="videoteca-mood-filtro-count">{moodCount}</span>
              </button>
            );
          })}
        </div>
      )}

      {!isReviewsTab && tabMovies.length > 0 && (
        <div className="videoteca-tools" aria-label="Buscar, filtrar y ordenar videoteca">
          <div className="videoteca-tools-meta">
            <p className="videoteca-tools-result-count">
              {filteredTabMovies.length} resultado{filteredTabMovies.length !== 1 ? 's' : ''}
              {filteredTabMovies.length !== tabMovies.length ? ` de ${tabMovies.length}` : ''}
            </p>
          </div>

          <input
            type="text"
            className="videoteca-tools-search"
            placeholder="Buscar por título..."
            value={searchQuery}
            onChange={(event) => setSearchQuery(event.target.value)}
          />

          <select
            className="videoteca-tools-select"
            value={reviewStatusFilter}
            onChange={(event) => setReviewStatusFilter(event.target.value)}
          >
            <option value="todos">Todas</option>
            <option value="con-resena">Con reseña</option>
            <option value="solo-puntuacion">Solo puntuación</option>
            <option value="sin-actividad">Sin actividad</option>
          </select>

          <select
            className="videoteca-tools-select"
            value={sortMode}
            onChange={(event) => setSortMode(event.target.value)}
          >
            <option value="recientes">Más recientes</option>
            <option value="antiguas">Más antiguas</option>
            <option value="rating-tmdb">Mejor valoradas (TMDB)</option>
            <option value="mejor-puntuadas">Mejor puntuadas por ti</option>
          </select>

          <div className="videoteca-tools-actions" role="group" aria-label="Vista y limpieza de filtros">
            <div className="videoteca-view-toggle" role="group" aria-label="Cambiar vista">
              <button
                type="button"
                className={`videoteca-view-btn${viewMode === 'grid' ? ' active' : ''}`}
                onClick={() => setViewMode('grid')}
              >
                Grid
              </button>
              <button
                type="button"
                className={`videoteca-view-btn${viewMode === 'list' ? ' active' : ''}`}
                onClick={() => setViewMode('list')}
              >
                Lista
              </button>
            </div>

            <button
              type="button"
              className="videoteca-clear-filters-btn"
              onClick={clearAllFilters}
              disabled={!hasActiveFilters}
            >
              Limpiar filtros
            </button>
          </div>
        </div>
      )}

      {/* Empty state */}
      {!isReviewsTab && tabMovies.length === 0 && (
        <div className="videoteca-empty">
          <div className="videoteca-empty-icon" aria-hidden="true">
            {activeTab === LISTAS.VER_LUEGO ? (
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>
            ) : activeTab === LISTAS.YA_VISTA ? (
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round"><path d="M20 6L9 17l-5-5"/></svg>
            ) : (
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round"><path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/></svg>
            )}
          </div>
          <h2>{activeTabMeta.emptyTitle}</h2>
          <p>{activeTabMeta.emptyText}</p>
          <Link to="/cuestionario" className="videoteca-cta-btn">
            Ir al cuestionario →
          </Link>
        </div>
      )}

      {!isReviewsTab && tabMovies.length > 0 && filteredTabMovies.length === 0 && (
        <div className="videoteca-no-resultados-filtro">
          No hay pelis de mood <strong>{activeMood}</strong> en esta lista.
        </div>
      )}

      {!isReviewsTab && filteredTabMovies.length > 0 && (
        <section className="videoteca-seccion">
          <div className={`videoteca-grid${viewMode === 'list' ? ' list' : ''}`}>
            {filteredTabMovies.map(({ movie, questionnaire, savedAt }) => {
              const genres = movie.genre_ids
                ?.map((id) => genreIdToName[id])
                .filter(Boolean)
                .slice(0, 2) || [];
              const myReview = getMovieReviewByProfile(movie.id);
              const movieState = getMovieState(movie.id);

              return (
                <article className="videoteca-card" key={movie.id}>
                  <div className="videoteca-poster-wrap">
                    <img
                      className="videoteca-poster"
                      src={`https://image.tmdb.org/t/p/w500${movie.poster_path}`}
                      alt={movie.title}
                    />
                    <div className="videoteca-move-wrap videoteca-move-wrap-poster">
                      <button
                        type="button"
                        className={`videoteca-remove-btn${openMoveMenuMovieId === movie.id ? ' abierto' : ''}`}
                        onClick={(event) => {
                          event.stopPropagation();
                          setOpenMoveMenuMovieId((prev) => (prev === movie.id ? null : movie.id));
                        }}
                        aria-expanded={openMoveMenuMovieId === movie.id}
                        aria-label={`Actualizar estado de ${movie.title}`}
                        title="Actualizar estado"
                      >
                        <svg viewBox="0 0 24 24" fill="currentColor" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                          <path d="M19 21l-7-5-7 5V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2z" />
                        </svg>
                      </button>

                      {openMoveMenuMovieId === movie.id && (
                        <div className="videoteca-move-menu" role="menu" onClick={(event) => event.stopPropagation()}>
                          <button
                            type="button"
                            className={`videoteca-move-option${!movieState.isSeen && !movieState.isIgnored ? ' active' : ''}`}
                            onClick={() => handleSetWatchLater(movie, questionnaire)}
                          >
                            <span>Ver más tarde</span>
                            {!movieState.isSeen && !movieState.isIgnored ? <span className="videoteca-move-check">✓</span> : null}
                          </button>
                          <button
                            type="button"
                            className={`videoteca-move-option${movieState.isSeen ? ' active' : ''}`}
                            onClick={() => handleToggleSeen(movie, questionnaire)}
                          >
                            <span>Ya vistas</span>
                            {movieState.isSeen ? <span className="videoteca-move-check">✓</span> : null}
                          </button>
                          <button
                            type="button"
                            className={`videoteca-move-option${movieState.isEssential ? ' active' : ''}`}
                            onClick={() => handleToggleEssential(movie, questionnaire)}
                          >
                            <span>Mis imprescindibles</span>
                            {movieState.isEssential ? <span className="videoteca-move-check">✓</span> : null}
                          </button>
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="videoteca-card-body">
                    <h3 className="videoteca-card-title">{movie.title}</h3>
                    <p className="videoteca-card-meta">
                      {movie.release_date?.slice(0, 4) || '—'}
                      {genres.length > 0 && ` · ${genres.join(' · ')}`}
                    </p>
                    <p className="videoteca-card-rating">
                      ★ {movie.vote_average?.toFixed(1) || 'N/A'}
                    </p>

                    {questionnaire?.moods?.length > 0 && (
                      <div className="videoteca-card-moods">
                        {questionnaire.moods.map((m) => (
                          <span className="videoteca-card-mood-chip" key={m}>{m}</span>
                        ))}
                      </div>
                    )}

                    <div className="videoteca-card-footer">
                      <span className="videoteca-card-date">Guardada el {formatDate(savedAt)}</span>
                      <a
                        className="videoteca-card-trailer"
                        href={getTrailerUrl(movie)}
                        target="_blank"
                        rel="noreferrer"
                      >
                        Tráiler ↗
                      </a>
                    </div>

                    <button
                      type="button"
                      className="videoteca-review-toggle"
                      onClick={() => openReviewModal({
                        movie,
                        questionnaire,
                        sourceTab: activeTab,
                        existingReview: myReview,
                      })}
                    >
                      {myReview ? 'Editar puntuación / reseña' : 'Puntuar / reseñar'}
                    </button>

                    <p className="videoteca-review-hint">
                      Tu puntuación o reseña alimenta el Mood Radar del perfil.
                      {activeTab === LISTAS.VER_LUEGO && !myReview ? ' Al publicar se mueve automaticamente a Ya vistas.' : ''}
                    </p>
                  </div>
                </article>
              );
            })}
          </div>
        </section>
      )}

      {isReviewsTab && myReviews.length === 0 && (
        <div className="videoteca-empty">
          <div className="videoteca-empty-icon" aria-hidden="true">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/></svg>
          </div>
          <h2>{activeTabMeta.emptyTitle}</h2>
          <p>{activeTabMeta.emptyText}</p>
          <Link to="/cuestionario" className="videoteca-cta-btn">
            Ir al cuestionario →
          </Link>
        </div>
      )}

      {isReviewsTab && myReviews.length > 0 && (
        <section className="videoteca-seccion">
          <div className="videoteca-reviews-grid">
            {myReviews.map((review) => {
              const relatedFavorite = favoritosByMovieId.get(review.movieId);
              const movieData = review.movie || relatedFavorite?.movie || null;
              const title = movieData?.title || 'Pelicula';
              const posterPath = movieData?.poster_path || null;
              const moodAtReview = review.mood || relatedFavorite?.questionnaire?.moods?.[0] || 'Sin mood';

              return (
                <article className="videoteca-review-card" key={review.id}>
                  <div className="videoteca-review-card-media">
                    {posterPath ? (
                      <img
                        className="videoteca-review-card-poster"
                        src={`https://image.tmdb.org/t/p/w500${posterPath}`}
                        alt={title}
                      />
                    ) : (
                      <div className="videoteca-review-card-poster-placeholder">Sin poster</div>
                    )}
                  </div>

                  <div className="videoteca-review-card-body">
                    <h3 className="videoteca-review-card-title">{title}</h3>
                    <p className="videoteca-review-card-score">Puntuacion: {Number(review.rating) || 0}/10</p>
                    <p className="videoteca-review-card-mood">
                      Mood: <span>{MOOD_EMOJIS[moodAtReview] || '🎬'} {moodAtReview}</span>
                    </p>
                    <p className="videoteca-review-card-text">{review.comment || 'Solo puntuaste esta película.'}</p>
                    <div className="videoteca-review-card-footer">
                      <span>{review.author || 'Anonimo'}</span>
                      <div className="videoteca-review-card-actions">
                        <span>{formatReviewDate(review.updatedAt || review.createdAt)}</span>
                        <button
                          type="button"
                          className="videoteca-review-edit"
                          onClick={() => openReviewModal({
                            movie: movieData,
                            questionnaire: relatedFavorite?.questionnaire || null,
                            sourceTab: activeTab,
                            existingReview: review,
                          })}
                        >
                          Editar
                        </button>
                        <button
                          type="button"
                          className="videoteca-review-delete"
                          onClick={() => removeMovieReview(review.id)}
                        >
                          Eliminar
                        </button>
                      </div>
                    </div>
                  </div>
                </article>
              );
            })}
          </div>
        </section>
      )}

      {typeof document !== 'undefined' && isReviewModalOpen && reviewModalContext && createPortal((
        <div
          className="videoteca-review-modal-overlay"
          onMouseDown={(event) => {
            if (event.target === event.currentTarget) {
              closeReviewModal();
            }
          }}
          role="presentation"
        >
          <div className="videoteca-review-modal" role="dialog" aria-modal="true" aria-label="Crear o editar reseña">
            <button
              type="button"
              className="videoteca-review-modal-close"
              onClick={closeReviewModal}
              aria-label="Cerrar"
            >
              ×
            </button>

            <header className="videoteca-review-modal-header">
              <p className="videoteca-review-modal-kicker">
                {reviewModalContext.existingReview ? 'Editar reseña' : 'Nueva reseña'}
              </p>
              <h3>{reviewModalContext.movie?.title || 'Reseña de película'}</h3>
              <p>
                Puntúa, elige uno de los moods asignados y añade reseña solo si quieres.
              </p>
            </header>

            <form className="videoteca-review-modal-form" onSubmit={saveReviewFromModal}>
              <label className="videoteca-review-modal-field">
                <span>Nombre</span>
                <input
                  type="text"
                  className="videoteca-review-modal-input"
                  value={reviewModalDraft.author}
                  maxLength={24}
                  placeholder="Tu nombre (opcional)"
                  onChange={(event) => {
                    const value = event.target.value;
                    setReviewModalDraft((prev) => ({
                      ...prev,
                      author: value,
                    }));
                  }}
                />
              </label>

              <div className="videoteca-review-modal-rating" aria-label="Puntuación de 1 a 10">
                <div className="videoteca-review-modal-rating-head">
                  <span>Puntuación</span>
                  <strong>{reviewModalDraft.rating}/10</strong>
                </div>
                <div className="videoteca-review-modal-rating-track" role="radiogroup" aria-label="Seleccionar puntuación">
                  {Array.from({ length: 10 }, (_, index) => index + 1).map((value) => {
                    const isActive = value <= Number(reviewModalDraft.rating || 0);
                    return (
                      <button
                        key={value}
                        type="button"
                        role="radio"
                        aria-checked={Number(reviewModalDraft.rating) === value}
                        className={`videoteca-review-modal-rating-dot${isActive ? ' active' : ''}`}
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

              <div className="videoteca-review-modal-field">
                <span>Mood asignado</span>
                {(reviewModalContext.assignedMoods || []).length > 1 ? (
                  <div className="videoteca-review-modal-mood-options" role="radiogroup" aria-label="Seleccionar mood de la peli">
                    {reviewModalContext.assignedMoods.map((mood) => (
                      <button
                        key={mood}
                        type="button"
                        role="radio"
                        aria-checked={reviewModalDraft.mood === mood}
                        className={`videoteca-review-modal-mood-option${reviewModalDraft.mood === mood ? ' active' : ''}`}
                        onClick={() => {
                          setReviewModalDraft((prev) => ({
                            ...prev,
                            mood,
                          }));
                        }}
                      >
                        {MOOD_EMOJIS[mood] || '🎬'} {mood}
                      </button>
                    ))}
                  </div>
                ) : (
                  <p className="videoteca-review-modal-mood-locked">
                    {MOOD_EMOJIS[reviewModalDraft.mood] || '🎬'} {reviewModalDraft.mood || 'Sin mood'}
                  </p>
                )}
              </div>

              <div className="videoteca-review-modal-editor-wrap">
                <div className="videoteca-review-modal-toolbar" role="toolbar" aria-label="Formato de texto">
                  <button type="button" onClick={() => applyEditorCommand('bold')} title="Negrita"><strong>B</strong></button>
                  <button type="button" onClick={() => applyEditorCommand('italic')} title="Cursiva"><em>I</em></button>
                  <button type="button" onClick={() => applyEditorCommand('underline')} title="Subrayado"><u>U</u></button>
                </div>
                <div
                  key={reviewEditorSeed}
                  ref={reviewEditorRef}
                  className="videoteca-review-modal-editor"
                  contentEditable
                  suppressContentEditableWarning
                  onInput={handleEditorInput}
                  data-placeholder="Escribe tu reseña..."
                  dangerouslySetInnerHTML={{ __html: reviewModalDraft.commentRich || '' }}
                />
              </div>

              <footer className="videoteca-review-modal-actions">
                <button type="button" className="videoteca-review-modal-cancel" onClick={closeReviewModal}>
                  Cancelar
                </button>
                <button type="submit" className="videoteca-review-modal-submit">
                  {(reviewModalDraft.comment || '').trim()
                    ? (reviewModalContext.existingReview ? 'Guardar reseña' : 'Publicar reseña')
                    : (reviewModalContext.existingReview ? 'Guardar puntuación' : 'Guardar puntuación')}
                </button>
              </footer>
            </form>
          </div>
        </div>
      ), document.body)}

      {/* Ignoradas — collapsible at the bottom */}
      {!isReviewsTab && ignoradas.length > 0 && (
        <div className="videoteca-ignoradas">
          <button
            type="button"
            className={`videoteca-ignoradas-toggle${ignoradasOpen ? ' abierto' : ''}`}
            onClick={() => setIgnoradasOpen((v) => !v)}
          >
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" aria-hidden="true"><circle cx="12" cy="12" r="10"/><line x1="15" y1="9" x2="9" y2="15"/><line x1="9" y1="9" x2="15" y2="15"/></svg>
            Películas ignoradas
            <span className="videoteca-ignoradas-count">{ignoradas.length}</span>
            <svg className="videoteca-ignoradas-chevron" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" aria-hidden="true"><polyline points="6 9 12 15 18 9"/></svg>
          </button>

          {ignoradasOpen && (
            <ul className="videoteca-ignoradas-lista">
              {ignoradas.map(({ movie, questionnaire }) => (
                <li key={movie.id} className="videoteca-ignorada-fila">
                  <img
                    className="videoteca-ignorada-thumb"
                    src={`https://image.tmdb.org/t/p/w500${movie.poster_path}`}
                    alt={movie.title}
                  />
                  <div className="videoteca-ignorada-info">
                    <p className="videoteca-ignorada-titulo">{movie.title}</p>
                    <p className="videoteca-ignorada-meta">{movie.release_date?.slice(0, 4) || '—'}</p>
                  </div>
                  <div className="videoteca-ignorada-acciones">
                    <button
                      type="button"
                      className="videoteca-ignorada-btn"
                      onClick={() => setLista(movie, questionnaire, LISTAS.VER_LUEGO)}
                      title="Mover a Ver más tarde"
                    >
                      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" aria-hidden="true"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>
                    </button>
                    <button
                      type="button"
                      className="videoteca-ignorada-btn videoteca-ignorada-btn-quitar"
                      onClick={() => setLista(movie, questionnaire, LISTAS.NO_INTERESA)}
                      title="Quitar de ignoradas"
                    >
                      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" aria-hidden="true"><polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14H6L5 6"/><path d="M10 11v6"/><path d="M14 11v6"/><path d="M9 6V4h6v2"/></svg>
                    </button>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>
      )}
    </div>
  );
}

export default Videoteca;

