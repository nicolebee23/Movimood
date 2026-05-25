import { useEffect, useState, useRef } from 'react';
import { createPortal } from 'react-dom';
import { Link, Navigate, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import { useFavoritos, LISTAS } from '../hooks/useFavoritos';
import { useMovieReviews } from '../hooks/useMovieReviews';
import { genreIdToName } from '../utils/recommendations';
import './Videoteca.css';
import useReviewLikes from '../hooks/useReviewLikes';
import './Home.css';
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

// Sidebar menu is provided by `WizardSidebar`; no local `menuLinks` needed here.

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

const TABS = [
  {
    id: LISTAS.VER_LUEGO,
    label: 'Ver más tarde',
    tone: 'later',
    icon: 'clock',
    emptyTitle: 'Nada pendiente aún',
    emptyText: 'Marca películas con el icono de reloj en los resultados para guardarlas aquí.',
  },
  {
    id: LISTAS.YA_VISTA,
    label: 'Ya vistas',
    tone: 'seen',
    icon: 'check',
    emptyTitle: 'Aun no has marcado pelis como vistas',
    emptyText: 'Cuando reseñes una peli de Ver más tarde, pasará aquí automáticamente.',
  },
  {
    id: LISTAS.IMPRESCINDIBLES,
    label: 'Mis imprescindibles',
    tone: 'essential',
    icon: 'heart',
    emptyTitle: 'Tu colección de joyas está vacía',
    emptyText: 'Cuando encuentres una película que ya has visto y amas, márcala como imprescindible.',
  },
  {
    id: 'mis-resenas',
    label: 'Mis reseñas',
    tone: 'reviews',
    icon: 'review',
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

// Helper functions removed (unused) to keep build warnings clean.

function VideotecaEmptyIllustration({ icon }) {
  if (icon === 'clock') {
    return (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
        <circle cx="12" cy="12" r="9" />
        <path d="M12 7v6l4 2" />
      </svg>
    );
  }

  if (icon === 'check') {
    return (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
        <path d="M20 6L10 17l-6-6" />
      </svg>
    );
  }

  if (icon === 'heart') {
    return (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
        <path d="M20.8 4.6a5.5 5.5 0 0 0-7.8 0L12 5.6l-1-1a5.5 5.5 0 1 0-7.8 7.8L12 20.2l8.8-8.8a5.5 5.5 0 0 0 0-6.8Z" />
      </svg>
    );
  }

  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M4 5.5A2.5 2.5 0 0 1 6.5 3h11A2.5 2.5 0 0 1 20 5.5v8A2.5 2.5 0 0 1 17.5 16H11l-5 4v-4H6.5A2.5 2.5 0 0 1 4 13.5v-8Z" />
      <path d="M8 8h8" />
      <path d="M8 11h5" />
    </svg>
  );
}

function VideotecaEmptyState({ meta }) {
  return (
    <div className={`videoteca-empty videoteca-empty-${meta.tone}`}>
      <div className="videoteca-empty-bubble" aria-hidden="true">
        <VideotecaEmptyIllustration icon={meta.icon} />
      </div>
      <h2>{meta.emptyTitle}</h2>
      <p>{meta.emptyText}</p>
      <Link to="/cuestionario" className="videoteca-cta-btn">
        Ir al cuestionario →
      </Link>
    </div>
  );
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
  /* eslint-disable-next-line no-unused-vars */
  const [viewMode, setViewMode] = useState('grid');
  /* eslint-disable-next-line no-unused-vars */
  const [hidePosters, setHidePosters] = useState(false);
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

  const location = useLocation();
  const navigate = useNavigate();

  useEffect(() => {
    const params = new URLSearchParams(location.search || '');
    const view = params.get('view');
    if (!view) return;

    if (view === 'imprescindibles') {
      setActiveTab(LISTAS.IMPRESCINDIBLES);
      setTimeout(() => {
        const el = document.querySelector('.videoteca-seccion');
        if (el) el.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }, 120);
      return;
    }

    if (view === 'ya-vistas' || view === 'ya_vistas' || view === 'seen') {
      setActiveTab(LISTAS.YA_VISTA);
      setTimeout(() => {
        const el = document.querySelector('.videoteca-seccion');
        if (el) el.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }, 120);
      return;
    }

    if (view === 'mis-resenas') {
      setActiveTab('mis-resenas');
      setTimeout(() => {
        const el = document.querySelector('.videoteca-seccion');
        if (el) el.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }, 120);
      return;
    }

    if (view === 'mood') {
      setActiveTab('mood');
      setTimeout(() => {
        const el = document.querySelector('.videoteca-hsection');
        if (el) el.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }, 120);
      return;
    }

    if (view === 'recent') {
      setActiveTab('recent');
      setTimeout(() => {
        const el = document.querySelector('.videoteca-hsection:nth-of-type(2)');
        if (el) el.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }, 120);
    }
  }, [location.search]);

  const reviewLikes = useReviewLikes();

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
  
  const myReviews = getReviewsByProfile();
  const reviewsByMovieId = new Map(myReviews.map((review) => [String(review.movieId), review]));
  const favoritosByMovieId = new Map(favoritos.map((fav) => [fav.movie.id, fav]));
  const uniqueMoodsRated = new Set(myReviews.map((review) => review.mood).filter(Boolean)).size;
  /* eslint-disable-next-line no-unused-vars */
  const moodCoveragePercent = Math.round((uniqueMoodsRated / Object.keys(MOOD_EMOJIS).length) * 100);

  useEffect(() => {
    if (!myReviews || myReviews.length === 0) return;
    (async () => {
      for (const r of myReviews) {
        try {
          await reviewLikes.fetchCount(r.id);
        } catch (e) {
          // ignore
        }
      }
    })();
  }, [myReviews, reviewLikes]);

  const availableMoods = Array.from(
    new Set(tabMovies.flatMap((fav) => fav.questionnaire?.moods || []))
  );

  const moodScrollRef = useRef(null);
  const recentScrollRef = useRef(null);
  const watchLaterScrollRef = useRef(null);

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

  /* eslint-disable-next-line no-unused-vars */
  const hasActiveFilters =
    Boolean(searchQuery.trim()) ||
    reviewStatusFilter !== 'todos' ||
    sortMode !== 'recientes' ||
    activeMood !== 'Todos';

  /* eslint-disable-next-line no-unused-vars */
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

  useEffect(() => {
    if (!isReviewModalOpen || !reviewEditorRef.current) {
      return;
    }

    reviewEditorRef.current.innerHTML = reviewModalDraft.commentRich || '';
  }, [isReviewModalOpen, reviewEditorSeed, reviewModalDraft.commentRich]);

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  

  const displayName = (currentUser?.name || currentUser?.username || 'Perfil').split(' ')[0];
  /* eslint-disable-next-line no-unused-vars */
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
    const nextHtml = event.currentTarget.value || '';
    setReviewModalDraft((prev) => ({
      ...prev,
      commentRich: nextHtml,
      comment: nextHtml,
    }));
  }

  /* eslint-disable-next-line no-unused-vars */
  function applyEditorCommand(command) {
    if (!reviewEditorRef.current) {
      return;
    }

    reviewEditorRef.current.focus();
    document.execCommand(command, false);
    const nextHtml = reviewModalDraft.commentRich || '';
    setReviewModalDraft((prev) => ({
      ...prev,
      commentRich: nextHtml,
      comment: nextHtml,
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
      <WizardSidebar activeLabel="Mi videoteca" footerText="Recomendaciones basadas en tu mood y preferencias." hideLinks={["Resultados"]} />

      <main className="home-main videoteca-main">
        <div className="videoteca-page">
        <header className="videoteca-header-row">
          <div>
            <h1 className="titulo-app videoteca-titulo">Mi Videoteca</h1>
            <p className="videoteca-subtitle">Tu colección organizada por emociones, gustos y momentos.</p>
          </div>
          <div className="videoteca-hero-right">
            <form className="search-form videoteca-search" onSubmit={(e) => e.preventDefault()}>
              <svg className="search-icon" aria-hidden="true" viewBox="0 0 24 24" width="16" height="16" xmlns="http://www.w3.org/2000/svg" focusable="false" role="img">
                <circle cx="11" cy="11" r="7" stroke="currentColor" strokeWidth="1.8" fill="none" />
                <line x1="21" y1="21" x2="16.65" y2="16.65" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
              </svg>
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

      <div className="videoteca-mood-row">
        <div className="videoteca-mood-scroll" role="list" ref={moodScrollRef}>
          <button
            type="button"
            className={`videoteca-mood-chip${activeMood === 'Todos' ? ' activo' : ''}`}
            onClick={() => setActiveMood('Todos')}
          >
            <span className="mood-emoji">◯</span>
            Todos
          </button>
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
                {(() => {
                  const Icon = MOOD_COMPONENTS[m];
                  return Icon ? <Icon className="mood-emoji" aria-hidden /> : <span className="mood-emoji" aria-hidden>{MOOD_EMOJIS[m]}</span>;
                })()}
                <span className="mood-label">{moodLabel}</span>
                {count > 0 && <span className="mood-count">{count}</span>}
              </button>
            );
          })}
        </div>
      </div>

      {!isReviewsTab && (
        (() => {
          // Do not render the "Para tu mood actual" section when viewing any of the main list tabs
          if ([LISTAS.VER_LUEGO, LISTAS.YA_VISTA, LISTAS.IMPRESCINDIBLES, 'mis-resenas'].includes(activeTab)) {
            return null;
          }

          const userMood = activeMood === 'Todos' ? (availableMoods[0] || 'Todos') : activeMood;
          const MoodIcon = MOOD_COMPONENTS[userMood];
          const moodEmoji = MoodIcon ? <MoodIcon className="mood-emoji" aria-hidden /> : (MOOD_EMOJIS[userMood] || '🎬');
          const moodMovies = favoritos.filter((f) => (f.questionnaire?.moods || []).includes(userMood));
          const recentMovies = favoritos.slice().sort((a, b) => new Date(b.savedAt) - new Date(a.savedAt)).slice(0, 24);

          return (
            <div className="videoteca-two-sections">
              <section className="videoteca-hsection">
                <div className="videoteca-hsection-header">
                  <div>
                    <h3>Para tu mood actual: {userMood} {typeof moodEmoji === 'string' ? <span className="mood-emoji" aria-hidden>{moodEmoji}</span> : moodEmoji}</h3>
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
        <VideotecaEmptyState meta={activeTabMeta} />
      )}

      {!isReviewsTab && tabMovies.length > 0 && filteredTabMovies.length === 0 && (
        <div className="videoteca-no-resultados-filtro">
          No hay pelis de mood <strong>{activeMood}</strong> en esta lista.
        </div>
      )}

      {!isReviewsTab && filteredTabMovies.length > 0 && (
        <section className="videoteca-seccion">
          {([LISTAS.VER_LUEGO, LISTAS.YA_VISTA, LISTAS.IMPRESCINDIBLES, 'mis-resenas'].includes(activeTab)) ? (
            <div style={{ position: 'relative' }}>
              <div className="videoteca-hscroll" role="list" ref={watchLaterScrollRef}>
                {filteredTabMovies.map(({ movie, questionnaire }) => {
                  const genres = movie.genre_ids
                    ?.map((id) => genreIdToName[id])
                    .filter(Boolean)
                    .slice(0, 2) || [];
                  const myReview = getMovieReviewByProfile(movie.id);

                  return (
                    <article className="videoteca-hcard" key={movie.id} role="listitem">
                      <div className="videoteca-hposter-wrap">
                        <img className="videoteca-hposter" src={`https://image.tmdb.org/t/p/w500${movie.poster_path}`} alt={movie.title} />
                      </div>
                      <div className="videoteca-hcard-body">
                        <h4 className="videoteca-hcard-title">{movie.title}</h4>
                        <p className="videoteca-hcard-genres">{genres.join(', ') || 'Sin género'}</p>
                        <p className="videoteca-hcard-year">{movie.release_date?.slice(0, 4) || '----'}</p>
                        {activeTab === LISTAS.YA_VISTA && (
                          <button
                            type="button"
                            className="videoteca-hcard-review-btn"
                            onClick={() => openReviewModal({
                              movie,
                              questionnaire,
                              sourceTab: activeTab,
                              existingReview: myReview,
                            })}
                          >
                            {myReview ? 'Editar reseña' : 'Escribir reseña'}
                          </button>
                        )}
                      </div>
                    </article>
                  );
                })}
              </div>
              <button type="button" className="videoteca-arrow left" aria-label="Desplazar izquierda" onClick={() => scrollContainer(watchLaterScrollRef, 'left')}>‹</button>
              <button type="button" className="videoteca-arrow right" aria-label="Desplazar derecha" onClick={() => scrollContainer(watchLaterScrollRef, 'right')}>›</button>
            </div>
          ) : (
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

                      {questionnaire && (
                        <div className="videoteca-card-source">
                          Generado por tu cuestionario
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
          )}
        </section>
      )}

      {isReviewsTab && myReviews.length === 0 && (
        <VideotecaEmptyState meta={activeTabMeta} />
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
              const ratingOutOfFive = Math.max(0, Math.min(5, Math.round((Number(review.rating) || 0) / 2)));
              const likeCount = reviewLikes.counts[String(review.id)] || 0;

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
                    <div className="videoteca-review-card-top">
                      <div className="videoteca-review-card-title-block">
                        <h3 className="videoteca-review-card-title">{title}</h3>
                        <div className="videoteca-review-card-rating-row" aria-label={`Puntuación ${ratingOutOfFive} de 5`}>
                          <div className="videoteca-review-card-stars" aria-hidden="true">
                            {Array.from({ length: 5 }, (_, index) => (
                              <span
                                key={index}
                                className={`videoteca-review-star${index < ratingOutOfFive ? ' active' : ''}`}
                              >
                                ★
                              </span>
                            ))}
                          </div>
                          <span className="videoteca-review-card-rating-value">{ratingOutOfFive}/5</span>
                        </div>
                        <p className="videoteca-review-card-date">{formatReviewDate(review.updatedAt || review.createdAt)}</p>
                      </div>

                      <div className="videoteca-review-card-actions">
                        <button
                          type="button"
                          className="videoteca-review-action-btn"
                          onClick={() => openReviewModal({
                            movie: movieData,
                            questionnaire: relatedFavorite?.questionnaire || null,
                            sourceTab: activeTab,
                            existingReview: review,
                          })}
                          aria-label={`Editar reseña de ${title}`}
                          title="Editar reseña"
                        >
                          <svg viewBox="0 0 24 24" aria-hidden="true">
                            <path d="M3 17.25V21h3.75L18.81 8.94l-3.75-3.75L3 17.25z" />
                            <path d="M14.06 5.19l3.75 3.75" />
                          </svg>
                        </button>
                        <button
                          type="button"
                          className="videoteca-review-action-btn danger"
                          onClick={() => removeMovieReview(review.id)}
                          aria-label={`Eliminar reseña de ${title}`}
                          title="Eliminar reseña"
                        >
                          <svg viewBox="0 0 24 24" aria-hidden="true">
                            <path d="M3 6h18" />
                            <path d="M8 6V4h8v2" />
                            <path d="M10 11v6" />
                            <path d="M14 11v6" />
                            <path d="M6 6l1 14h10l1-14" />
                          </svg>
                        </button>
                      </div>
                    </div>

                    <p className="videoteca-review-card-text">{review.comment || 'Solo puntuaste esta película.'}</p>

                    <div className="videoteca-review-card-meta-row">
                      <p className="videoteca-review-card-mood">
                        {MOOD_EMOJIS[moodAtReview] || '🎬'} {moodAtReview}
                      </p>
                      <p className="videoteca-review-card-likes">
                        <button
                          type="button"
                          className="videoteca-review-like-btn"
                          onClick={async () => {
                            try {
                              await reviewLikes.toggleLike(review.id);
                            } catch (e) {
                              if (e && e.status === 401) {
                                navigate(`/login?returnTo=${encodeURIComponent(window.location.pathname + window.location.search)}`);
                                return;
                              }
                              // ignore other errors
                            }
                          }}
                          aria-label={`Dar like a reseña de ${title}`}
                        >
                          <span className="videoteca-review-card-heart" aria-hidden="true">♥</span>
                          {likeCount} personas les ha gustado
                        </button>
                      </p>
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
                  dir="ltr"
                  style={{ textAlign: 'left' }}
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
                  <button type="button" disabled title="Negrita"><strong>B</strong></button>
                  <button type="button" disabled title="Cursiva"><em>I</em></button>
                  <button type="button" disabled title="Subrayado"><u>U</u></button>
                </div>
                <textarea
                  key={reviewEditorSeed}
                  ref={reviewEditorRef}
                  className="videoteca-review-modal-editor videoteca-review-modal-textarea"
                  dir="ltr"
                  value={reviewModalDraft.commentRich || ''}
                  onChange={handleEditorInput}
                  placeholder="Escribe tu reseña..."
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

      {/* Ignoradas removed per request */}
        </div>
      </main>
    </div>
  );
}

export default Videoteca;

