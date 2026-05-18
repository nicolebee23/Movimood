import { useEffect, useState, useRef } from 'react';
import { createPortal } from 'react-dom';
import { Link, Navigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import { useFavoritos, LISTAS } from '../hooks/useFavoritos';
import { useMovieReviews } from '../hooks/useMovieReviews';
import { genreIdToName } from '../utils/recommendations';
import './Videoteca.css';
import './Home.css';

const menuLinks = [
  { label: 'Inicio', to: '/', icon: '⌂' },
  { label: 'Explorar', to: '/explorar', icon: '◎' },
  { label: 'Cuestionario', to: '/cuestionario', icon: '✦' },
  { label: 'Mi videoteca', to: '/videoteca', icon: '☰', active: true, authOnly: true },
  { label: 'Perfil', to: '/perfil', icon: '◯', authOnly: true },
];

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

const MOOD_LABELS = {
  Nostalgico: 'Nostálgico',
  Enojado: 'Enfadado',
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
  const [isCompactTabs, setIsCompactTabs] = useState(() => typeof window !== 'undefined' && window.innerWidth <= 700);
  const [activeMood, setActiveMood] = useState('Todos');
  const [searchQuery, setSearchQuery] = useState('');
  const [reviewStatusFilter, setReviewStatusFilter] = useState('todos');
  const [sortMode, setSortMode] = useState('recientes');
  const [viewMode, setViewMode] = useState('grid');
  const [hidePosters, setHidePosters] = useState(false);
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

  useEffect(() => {
    function handleResize() {
      setIsCompactTabs(window.innerWidth <= 700);
    }

    handleResize();
    window.addEventListener('resize', handleResize);

    return () => {
      window.removeEventListener('resize', handleResize);
    };
  }, []);

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
  const reviewsByMovieId = new Map(myReviews.map((review) => [String(review.movieId), review]));
  const favoritosByMovieId = new Map(favoritos.map((fav) => [fav.movie.id, fav]));
  const uniqueMoodsRated = new Set(myReviews.map((review) => review.mood).filter(Boolean)).size;
  const moodCoveragePercent = Math.round((uniqueMoodsRated / Object.keys(MOOD_EMOJIS).length) * 100);

  const availableMoods = Array.from(
    new Set(tabMovies.flatMap((fav) => fav.questionnaire?.moods || []))
  );

  const moodScrollRef = useRef(null);
  const recentScrollRef = useRef(null);

  function scrollContainer(containerRef, direction = 'right') {
    const el = containerRef?.current;
    if (!el) return;
    const amount = Math.round(el.clientWidth * 0.7) || 320;
    el.scrollBy({ left: direction === 'right' ? amount : -amount, behavior: 'smooth' });
  }

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

  const visibleMenuLinks = menuLinks.filter(
    (link) => !link.authOnly || currentUser
  );

  const displayName = (currentUser?.name || currentUser?.username || 'Perfil').split(' ')[0];
  const avatarInitial = displayName.charAt(0).toUpperCase() || 'M';

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

  async function saveReviewFromModal(event) {
    event.preventDefault();

    if (!reviewModalContext?.movie?.id) {
      return;
    }

    const normalizedComment = (reviewModalDraft.comment || '').trim();

    const saveResult = addMovieReview(reviewModalContext.movie.id, {
      movie: reviewModalContext.movie,
      mood: reviewModalDraft.mood || null,
      author: reviewModalDraft.author,
      rating: Number(reviewModalDraft.rating) || 5,
      comment: normalizedComment,
      commentRich: normalizedComment ? (reviewModalDraft.commentRich || normalizedComment) : '',
    });

    try {
      await saveResult.savePromise;
    } catch (error) {
      alert(error?.message || 'No se pudo guardar la reseña en la base de datos.');
      return;
    }

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
    <div className="home-page">
      <aside className="home-sidebar">
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

      <main className="home-main videoteca-main">
        <div className="videoteca-page">
        <header className="videoteca-header-row">
          <div>
            <h1 className="titulo-app videoteca-titulo">Mi Videoteca</h1>
            <p className="videoteca-subtitle">Tu colección organizada por emociones, gustos y momentos.</p>
            {/* Tabs and content only - status summary and mood radar removed per user request */}
          </div>
          <div className="videoteca-hero-right">
            <form className="search-form videoteca-search" onSubmit={(e) => e.preventDefault()}>
              <span className="search-icon" aria-hidden="true">🔍</span>
              <input
                className="search-input"
                placeholder="Buscar películas..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
              <button type="button" className="search-filter-inside" aria-label="Filtros">≡</button>
            </form>
          </div>
        </header>

      {/* Tab bar */}
      {isCompactTabs ? (
        <div className="videoteca-tabs-mobile" aria-label="Secciones de videoteca">
          <label className="videoteca-tabs-mobile-label" htmlFor="videoteca-tabs-select">
            Sección
          </label>
          <select
            id="videoteca-tabs-select"
            className="videoteca-tabs-select"
            value={activeTab}
            onChange={(event) => setActiveTab(event.target.value)}
          >
            {TABS.map((tab) => {
              const count = tab.id === 'mis-resenas'
                ? myReviews.length
                : tab.id === LISTAS.VER_LUEGO
                  ? favoritos.filter((f) => f.lista === LISTAS.VER_LUEGO).length
                  : tab.id === LISTAS.YA_VISTA
                    ? favoritos.filter((f) => f.lista === LISTAS.YA_VISTA).length
                    : favoritos.filter((f) => Boolean(f.flags?.imprescindible) && f.lista !== LISTAS.NO_INTERESA).length;

              return (
                <option key={tab.id} value={tab.id}>
                  {tab.label}{count > 0 ? ` (${count})` : ''}
                </option>
              );
            })}
          </select>
        </div>
      ) : (
        <div className="videoteca-tabs-container">
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
        </div>
      )}

      <div className="videoteca-mood-section-header">
        <h2 className="videoteca-mood-title">Para los distintos moods</h2>
      </div>

      {/* Mood chips row (scrollable) */}
      <div className="videoteca-mood-row">
        <div className="videoteca-mood-scroll" role="list" ref={moodScrollRef}>
          {/* 'Todos' chip removed per design: only specific mood chips shown */}
          {Object.keys(MOOD_EMOJIS).map((m) => {
            const count = favoritos.filter((f) => (f.questionnaire?.moods || []).includes(m)).length;
            const moodLabel = MOOD_LABELS[m] || m;
            return (
              <button
                key={m}
                type="button"
                role="listitem"
                className={`videoteca-mood-chip${activeMood === m ? ' activo' : ''}`}
                onClick={() => setActiveMood(m)}
                title={m}
              >
                <span className="mood-emoji" aria-hidden>{MOOD_EMOJIS[m]}</span>
                <span className="mood-label">{moodLabel}</span>
                {count > 0 && <span className="mood-count">{count}</span>}
              </button>
            );
          })}
        </div>
        <button type="button" className="videoteca-mood-arrow" aria-label="Desplazar moods" onClick={() => scrollContainer(moodScrollRef, 'right')}>›</button>
      </div>

      {/* New layout: two horizontal scrollers: mood-specific and latest added */}
      {!isReviewsTab && (
        (() => {
          const userMood = activeMood === 'Todos' ? (availableMoods[0] || 'Todos') : activeMood;
          const moodEmoji = MOOD_EMOJIS[userMood] || '🎬';
          const moodMovies = favoritos.filter((f) => (f.questionnaire?.moods || []).includes(userMood));
          const recentMovies = favoritos.slice().sort((a, b) => new Date(b.savedAt) - new Date(a.savedAt)).slice(0, 24);

          return (
            <div className="videoteca-two-sections">
              <section className="videoteca-hsection">
                <div className="videoteca-hsection-header">
                  <div>
                    <h3>Para tu mood actual: {userMood} <span className="mood-emoji" aria-hidden>{moodEmoji}</span></h3>
                    <p className="videoteca-hsection-sub">Películas guardadas que coinciden con tu estado.</p>
                  </div>
                  <div className="videoteca-hsection-actions">
                    <Link to="/videoteca?view=mood" className="videoteca-ver-todo">Ver todo</Link>
                  </div>
                </div>

                <div className="videoteca-hscroll" role="list" ref={moodScrollRef}>
                  {moodMovies.length === 0 ? (
                    <div className="videoteca-empty-inline">No hay películas para este mood.</div>
                  ) : (
                    moodMovies.map(({ movie }) => {
                      const genres = movie.genre_ids
                        ?.map((id) => genreIdToName[id])
                        .filter(Boolean)
                        .slice(0, 2) || [];

                      return (
                        <article className="videoteca-hcard" key={movie.id} role="listitem">
                          <div className="videoteca-hposter-wrap">
                            <img className="videoteca-hposter" src={`https://image.tmdb.org/t/p/w500${movie.poster_path}`} alt={movie.title} />
                          </div>
                          <div className="videoteca-hcard-body">
                            <h4 className="videoteca-hcard-title">{movie.title}</h4>
                            <p className="videoteca-hcard-genres">{genres.join(', ') || 'Sin género'}</p>
                            <p className="videoteca-hcard-year">{movie.release_date?.slice(0, 4) || '----'}</p>
                          </div>
                        </article>
                      );
                    })
                  )}
                </div>
                <button
                  type="button"
                  className="videoteca-arrow left"
                  aria-label="Desplazar izquierda"
                  onClick={() => scrollContainer(moodScrollRef, 'left')}
                >
                  ‹
                </button>
                <button
                  type="button"
                  className="videoteca-arrow right"
                  aria-label="Desplazar derecha"
                  onClick={() => scrollContainer(moodScrollRef, 'right')}
                >
                  ›
                </button>
              </section>

              <section className="videoteca-hsection">
                <div className="videoteca-hsection-header">
                  <div>
                    <h3>Últimas añadidas</h3>
                    <p className="videoteca-hsection-sub">Las incorporaciones más recientes a tu videoteca.</p>
                  </div>
                  <div className="videoteca-hsection-actions">
                    <Link to="/videoteca?view=recent" className="videoteca-ver-todo">Ver todo</Link>
                  </div>
                </div>

                <div className="videoteca-hscroll" role="list" ref={recentScrollRef}>
                  {recentMovies.length === 0 ? (
                    <div className="videoteca-empty-inline">Aún no has añadido películas.</div>
                  ) : (
                    recentMovies.map(({ movie }) => {
                      const genres = movie.genre_ids
                        ?.map((id) => genreIdToName[id])
                        .filter(Boolean)
                        .slice(0, 2) || [];

                      return (
                        <article className="videoteca-hcard" key={movie.id} role="listitem">
                          <div className="videoteca-hposter-wrap">
                            <img className="videoteca-hposter" src={`https://image.tmdb.org/t/p/w500${movie.poster_path}`} alt={movie.title} />
                          </div>
                          <div className="videoteca-hcard-body">
                            <h4 className="videoteca-hcard-title">{movie.title}</h4>
                            <p className="videoteca-hcard-genres">{genres.join(', ') || 'Sin género'}</p>
                            <p className="videoteca-hcard-year">{movie.release_date?.slice(0, 4) || '----'}</p>
                          </div>
                        </article>
                      );
                    })
                  )}
                </div>
                <button
                  type="button"
                  className="videoteca-arrow left"
                  aria-label="Desplazar izquierda"
                  onClick={() => scrollContainer(recentScrollRef, 'left')}
                >
                  ‹
                </button>
                <button
                  type="button"
                  className="videoteca-arrow right"
                  aria-label="Desplazar derecha"
                  onClick={() => scrollContainer(recentScrollRef, 'right')}
                >
                  ›
                </button>
              </section>
            </div>
          );
        })()
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
          <div className={`videoteca-grid${viewMode === 'list' ? ' list' : ''}${hidePosters ? ' no-posters' : ''}`}>
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
                    <div className="videoteca-poster-placeholder" aria-hidden="true">{(movie.title || '').charAt(0)}</div>
                    <div className="videoteca-poster-overlay" aria-hidden="true">
                      <div className="videoteca-poster-title">{movie.title}</div>
                    </div>
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
                      {genres.join(', ') || 'Sin género'}
                      {movie.release_date?.slice(0, 4) ? ` · ${movie.release_date.slice(0, 4)}` : ''}
                    </p>

                    {questionnaire?.moods?.length > 0 && (
                      <div className="videoteca-card-source">Generado por tu cuestionario</div>
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
      </main>
    </div>
  );
}

export default Videoteca;

