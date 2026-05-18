import { useEffect, useMemo, useState } from 'react';
import { Link, Navigate, useParams } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import { useFavoritos, LISTAS } from '../hooks/useFavoritos';
import { useMovieReviews } from '../hooks/useMovieReviews';
import { hasApiBaseUrl, requestJson } from '../utils/movimoodApi';
import { genreIdToName } from '../utils/recommendations';
import './Perfil.css';

const PROFILE_FAVORITES_KEY = 'movimood-profile-favorites';
const REVIEW_LIKES_KEY = 'movimood-review-likes';
const FAVORITOS_STORAGE_KEY = 'movimood-favoritos';
const MAX_PROFILE_FAVORITES = 4;
const REVIEW_PREVIEW_MAX_CHARS = 220;
const PROFILE_TABS = [
  { id: 'general', label: 'General' },
  { id: 'colecciones', label: 'Colecciones' },
  { id: 'actividad', label: 'Actividad' },
  { id: 'seguidos', label: 'Seguidos' },
  { id: 'seguidores', label: 'Seguidores' },
];

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

const MOOD_GLOW_COLORS = {
  Triste: '#7e8dff',
  Nostalgico: '#8aa2ff',
  Relajado: '#49c2c9',
  Ansioso: '#ff8d66',
  Feliz: '#f4c84a',
  Motivado: '#ff7c52',
  Enojado: '#ff5b8b',
  Emocionado: '#b58cff',
};

const MOOD_NORMALIZATION_MAP = {
  triste: 'Triste',
  nostalgico: 'Nostalgico',
  relajado: 'Relajado',
  ansioso: 'Ansioso',
  feliz: 'Feliz',
  motivado: 'Motivado',
  enojado: 'Enojado',
  emocionado: 'Emocionado',
};

function normalizeMovie(movie) {
  const posterPath = movie?.poster_path || movie?.backdrop_path || movie?.posterPath || movie?.backdropPath || '';

  if (!movie?.id || !posterPath) {
    return null;
  }

  return {
    id: movie.id,
    title: movie.title || movie.name || 'Película',
    poster_path: posterPath,
    release_date: movie.release_date || '',
  };
}

function normalizeMovieForActivity(movie, fallbackMovieId = null) {
  const movieId = movie?.id || fallbackMovieId;
  if (!movieId) {
    return null;
  }

  const posterPath = movie?.poster_path || movie?.backdrop_path || movie?.posterPath || movie?.backdropPath || '';

  return {
    id: movieId,
    title: movie?.title || movie?.name || 'Película sin título',
    poster_path: posterPath,
    release_date: movie?.release_date || '',
  };
}

function mergeMovieCandidates(fallbackMovieId, candidates) {
  const movieId = fallbackMovieId || candidates.find((candidate) => candidate?.id)?.id;
  if (!movieId) {
    return null;
  }

  let title = '';
  let posterPath = '';
  let releaseDate = '';

  candidates.forEach((candidate) => {
    if (!candidate) {
      return;
    }
    if (!title && candidate.title && candidate.title !== 'Película sin título') {
      title = candidate.title;
    }
    if (!posterPath && candidate.poster_path) {
      posterPath = candidate.poster_path;
    }
    if (!releaseDate && candidate.release_date) {
      releaseDate = candidate.release_date;
    }
  });

  return {
    id: movieId,
    title: title || 'Película sin título',
    poster_path: posterPath || '',
    release_date: releaseDate || '',
  };
}

function movieKey(movieId) {
  if (movieId === null || movieId === undefined) {
    return '';
  }
  return String(movieId);
}

function getUniqueMoods(moods) {
  return Array.from(new Set((Array.isArray(moods) ? moods : []).filter(Boolean)));
}

function normalizeMoodName(mood) {
  if (!mood) {
    return null;
  }

  const normalized = String(mood)
    .normalize('NFD')
    .replace(/\p{Diacritic}/gu, '')
    .trim()
    .toLowerCase();

  return MOOD_NORMALIZATION_MAP[normalized] || null;
}

function getQuestionnaireMoods(questionnaire) {
  return getUniqueMoods(questionnaire?.moods)
    .map(normalizeMoodName)
    .filter(Boolean);
}

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

function getStarsFromRating(rating) {
  const normalized = Math.max(0, Math.min(10, Number(rating) || 0));
  const stars = normalized / 2;
  const full = Math.floor(stars);
  const hasHalf = stars - full >= 0.5;
  const empty = 5 - full - (hasHalf ? 1 : 0);
  return {
    full,
    hasHalf,
    empty,
  };
}

function getReviewPreview(text, maxChars = REVIEW_PREVIEW_MAX_CHARS) {
  const normalizedText = (text || '').trim();
  if (normalizedText.length <= maxChars) {
    return {
      preview: normalizedText,
      truncated: false,
    };
  }

  const previewSlice = normalizedText.slice(0, maxChars);
  const lastBreak = Math.max(previewSlice.lastIndexOf(' '), previewSlice.lastIndexOf('.'));
  const previewText = (lastBreak > maxChars * 0.55 ? previewSlice.slice(0, lastBreak) : previewSlice).trim();

  return {
    preview: `${previewText}...`,
    truncated: true,
  };
}

function getInitials(name) {
  return (name || 'MM')
    .split(' ')
    .filter(Boolean)
    .slice(0, 2)
    .map((chunk) => chunk[0]?.toUpperCase())
    .join('') || 'MM';
}

function loadProfileFavorites(profileId) {
  if (!profileId) {
    return {
      ids: [],
      movies: [],
    };
  }

  try {
    const raw = localStorage.getItem(PROFILE_FAVORITES_KEY);
    const parsed = raw ? JSON.parse(raw) : {};
    const stored = parsed[profileId];

    if (Array.isArray(stored)) {
      return {
        ids: stored,
        movies: [],
      };
    }

    if (stored && typeof stored === 'object') {
      return {
        ids: Array.isArray(stored.ids) ? stored.ids : [],
        movies: Array.isArray(stored.movies) ? stored.movies.map(normalizeMovie).filter(Boolean) : [],
      };
    }

    return {
      ids: [],
      movies: [],
    };
  } catch {
    return {
      ids: [],
      movies: [],
    };
  }
}

function loadReviewLikesByReviewId() {
  try {
    const raw = localStorage.getItem(REVIEW_LIKES_KEY);
    if (!raw) {
      return new Map();
    }

    const parsed = JSON.parse(raw);

    if (Array.isArray(parsed)) {
      const counts = new Map();
      parsed.forEach((entry) => {
        const reviewId = entry?.reviewId;
        if (!reviewId) {
          return;
        }
        counts.set(reviewId, (counts.get(reviewId) || 0) + 1);
      });
      return counts;
    }

    if (parsed && typeof parsed === 'object') {
      const counts = new Map();

      Object.entries(parsed).forEach(([reviewId, value]) => {
        if (typeof value === 'number' && Number.isFinite(value)) {
          counts.set(reviewId, Math.max(0, Math.round(value)));
          return;
        }

        if (Array.isArray(value)) {
          counts.set(reviewId, value.length);
          return;
        }

        if (value && typeof value === 'object') {
          if (typeof value.count === 'number' && Number.isFinite(value.count)) {
            counts.set(reviewId, Math.max(0, Math.round(value.count)));
            return;
          }

          if (Array.isArray(value.users)) {
            counts.set(reviewId, value.users.length);
          }
        }
      });

      return counts;
    }

    return new Map();
  } catch {
    return new Map();
  }
}

function loadMoviesByIdFromStorage(profileId) {
  const moviesById = new Map();

  try {
    const rawFavoritos = localStorage.getItem(FAVORITOS_STORAGE_KEY);
    const parsedFavoritos = rawFavoritos ? JSON.parse(rawFavoritos) : [];

    if (Array.isArray(parsedFavoritos)) {
      parsedFavoritos.forEach((entry) => {
        const normalized = normalizeMovieForActivity(entry?.movie);
        const key = movieKey(normalized?.id);
        if (key && !moviesById.has(key)) {
          moviesById.set(key, normalized);
        }
      });
    }
  } catch {
    // Ignore optional stored favoritos parsing errors.
  }

  try {
    const rawReviews = localStorage.getItem('movimood-movie-reviews');
    const parsedReviews = rawReviews ? JSON.parse(rawReviews) : [];

    if (Array.isArray(parsedReviews)) {
      parsedReviews.forEach((review) => {
        const normalized = normalizeMovieForActivity(review?.movie);
        const key = movieKey(normalized?.id);
        if (key && !moviesById.has(key)) {
          moviesById.set(key, normalized);
        }
      });
    }
  } catch {
    // Ignore optional stored reviews parsing errors.
  }

  if (profileId) {
    loadProfileFavorites(profileId).movies.forEach((movie) => {
      const normalized = normalizeMovieForActivity(movie);
      const key = movieKey(normalized?.id);
      if (key && !moviesById.has(key)) {
        moviesById.set(key, normalized);
      }
    });
  }

  return moviesById;
}

function loadWatchedFavoritesFromStorage() {
  try {
    const raw = localStorage.getItem(FAVORITOS_STORAGE_KEY);
    const parsed = raw ? JSON.parse(raw) : [];
    return Array.isArray(parsed) ? parsed.filter((item) => item?.movie?.id).map((item) => item) : [];
  } catch {
    return [];
  }
}

function loadReviewsFromStorage(profileId) {
  try {
    const raw = localStorage.getItem('movimood-movie-reviews');
    const parsed = raw ? JSON.parse(raw) : [];

    if (!Array.isArray(parsed)) {
      return [];
    }

    const profileIdString = profileId != null ? String(profileId) : '';
    return parsed.filter((review) => {
      const reviewProfileId = review?.profileId ?? review?.userId ?? '';
      const reviewProfileIdString = reviewProfileId != null ? String(reviewProfileId) : '';
      return reviewProfileIdString === profileIdString;
    });
  } catch {
    return [];
  }
}

function Perfil() {
  const { id: routeProfileId } = useParams();
  const { currentUser, getUserById } = useAuth();
  const { favoritos } = useFavoritos();
  const { getReviewsByProfile } = useMovieReviews();

  const [activeTab, setActiveTab] = useState('general');
  const [activityFilter, setActivityFilter] = useState('all');
  const [activityMoodFilter, setActivityMoodFilter] = useState('all');
  const [viewsSearchTerm, setViewsSearchTerm] = useState('');
  const [viewsSortBy, setViewsSortBy] = useState('recent');
  const [reviewsSearchTerm, setReviewsSearchTerm] = useState('');
  const [reviewsSortBy, setReviewsSortBy] = useState('recent');
  const [selectedRadarMood, setSelectedRadarMood] = useState(null);
  const [selectedCollectionMood, setSelectedCollectionMood] = useState(null);
  const [expandedReviews, setExpandedReviews] = useState({});
  const [favoriteMovieIds, setFavoriteMovieIds] = useState([]);
  const [favoriteMoviePool, setFavoriteMoviePool] = useState([]);
  const [profileFavorites, setProfileFavorites] = useState([]);
  const [profileReviews, setProfileReviews] = useState([]);
  const [isFollowingProfile, setIsFollowingProfile] = useState(false);
  const [isFollowSaving, setIsFollowSaving] = useState(false);
  const [isBlockedProfile, setIsBlockedProfile] = useState(false);
  const [didBlockViewedUser, setDidBlockViewedUser] = useState(false);
  const [isBlockedByViewedUser, setIsBlockedByViewedUser] = useState(false);
  const [isBlockSaving, setIsBlockSaving] = useState(false);
  const [blockError, setBlockError] = useState('');
  const [profileFollowersCount, setProfileFollowersCount] = useState(null);
  const [profileFollowersList, setProfileFollowersList] = useState([]);
  const [profileFollowingList, setProfileFollowingList] = useState([]);
  const [isLoadingFollows, setIsLoadingFollows] = useState(false);
  const [followsError, setFollowsError] = useState('');
  const [posterFallbackByMovieId, setPosterFallbackByMovieId] = useState({});
  const [hasAnimatedRadarData, setHasAnimatedRadarData] = useState(false);
  const [hasAnimatedRadarGhost, setHasAnimatedRadarGhost] = useState(false);

  const resolvedProfileId = routeProfileId || currentUser?.id || null;
  const viewedUser = resolvedProfileId
    ? (getUserById(resolvedProfileId) || (currentUser?.id === resolvedProfileId ? currentUser : null))
    : null;
  const isOwnProfile = Boolean(currentUser?.id && viewedUser?.id === currentUser.id);

  const myReviews = getReviewsByProfile(resolvedProfileId || undefined);
  const storedWatchedFavorites = useMemo(() => (isOwnProfile ? loadWatchedFavoritesFromStorage() : []), [isOwnProfile]);
  const profileStoredReviews = useMemo(() => loadReviewsFromStorage(viewedUser?.id || resolvedProfileId || null), [viewedUser?.id, resolvedProfileId]);

  useEffect(() => {
    if (!viewedUser?.id) {
      setProfileFavorites([]);
      setProfileReviews([]);
      return;
    }

    if (isOwnProfile) {
      setProfileFavorites([]);
      setProfileReviews(profileStoredReviews);
      return;
    }

    if (!hasApiBaseUrl()) {
      setProfileFavorites([]);
      setProfileReviews(profileStoredReviews);
      return;
    }

    let cancelled = false;

    void Promise.all([
      requestJson('movimood.php', { params: { resource: 'favorites', user_id: viewedUser.id } }),
      requestJson('movimood.php', { params: { resource: 'reviews', user_id: viewedUser.id } }),
    ])
      .then(([favoritesResponse, reviewsResponse]) => {
        if (cancelled) {
          return;
        }

        setProfileFavorites(Array.isArray(favoritesResponse?.items) ? favoritesResponse.items : []);
        setProfileReviews(Array.isArray(reviewsResponse?.items) ? reviewsResponse.items : profileStoredReviews);
      })
      .catch(() => {
        if (!cancelled) {
          setProfileFavorites([]);
          setProfileReviews(profileStoredReviews);
        }
      });

    return () => {
      cancelled = true;
    };
  }, [isOwnProfile, profileStoredReviews, viewedUser?.id]);

  const activeFavorites = isOwnProfile ? favoritos : profileFavorites;
  const activeReviews = isOwnProfile ? myReviews : profileReviews;

  useEffect(() => {
    setProfileFollowersCount(viewedUser?.followersCount ?? 0);
  }, [viewedUser?.followersCount, viewedUser?.id]);

  useEffect(() => {
    // Load followers/following when viewing the corresponding tabs
    async function loadFollows() {
      if (!viewedUser?.id || !hasApiBaseUrl()) {
        setProfileFollowersList([]);
        setProfileFollowingList([]);
        return;
      }

      setIsLoadingFollows(true);
      setFollowsError('');

      try {
        const response = await requestJson('movimood.php', { params: { resource: 'follows', user_id: viewedUser.id } });
        const followers = Array.isArray(response?.followers) ? response.followers : [];
        const following = Array.isArray(response?.following) ? response.following : [];
        setProfileFollowersList(followers);
        setProfileFollowingList(following);
      } catch (err) {
        setFollowsError('No se pudieron cargar seguidores/seguidos.');
        setProfileFollowersList([]);
        setProfileFollowingList([]);
      } finally {
        setIsLoadingFollows(false);
      }
    }

    loadFollows();
  }, [viewedUser?.id]);

  useEffect(() => {
    if (!currentUser?.id || !viewedUser?.id || isOwnProfile) {
      setIsFollowingProfile(false);
      return undefined;
    }

    let cancelled = false;

    void requestJson('movimood.php', {
      params: { resource: 'follows', user_id: currentUser.id },
    })
      .then((response) => {
        if (cancelled) {
          return;
        }

        const following = Array.isArray(response?.following) ? response.following : [];
        setIsFollowingProfile(following.some((user) => String(user?.id) === String(viewedUser.id)));
      })
      .catch(() => {
        if (!cancelled) {
          setIsFollowingProfile(false);
        }
      });

    return () => {
      cancelled = true;
    };
  }, [currentUser?.id, isOwnProfile, viewedUser?.id]);

  useEffect(() => {
    if (!currentUser?.id || !viewedUser?.id || isOwnProfile || !hasApiBaseUrl()) {
      setIsBlockedProfile(false);
      setDidBlockViewedUser(false);
      setIsBlockedByViewedUser(false);
      return undefined;
    }

    let cancelled = false;

    void requestJson('movimood.php', {
      params: { resource: 'blocks', user_id: currentUser.id },
    })
      .then((response) => {
        if (cancelled) {
          return;
        }

        const blocked = Array.isArray(response?.blocked) ? response.blocked : [];
        const blockedBy = Array.isArray(response?.blockedBy) ? response.blockedBy : [];

        const blockedByMe = blocked.some((user) => String(user?.id) === String(viewedUser.id));
        const blockedMe = blockedBy.some((user) => String(user?.id) === String(viewedUser.id));
        const isBlocked = blockedByMe || blockedMe;

        setDidBlockViewedUser(blockedByMe);
        setIsBlockedByViewedUser(blockedMe);
        setIsBlockedProfile(isBlocked);
      })
      .catch(() => {
        if (!cancelled) {
          setIsBlockedProfile(false);
          setDidBlockViewedUser(false);
          setIsBlockedByViewedUser(false);
        }
      });

    return () => {
      cancelled = true;
    };
  }, [currentUser?.id, isOwnProfile, viewedUser?.id]);

  async function handleToggleFollow() {
    if (!currentUser?.id || !viewedUser?.id || isOwnProfile || isFollowSaving || isBlockedProfile) {
      return;
    }

    setIsFollowSaving(true);
    const previousFollowing = isFollowingProfile;
    const previousFollowersCount = Number(profileFollowersCount ?? followersCount);

    setIsFollowingProfile(!previousFollowing);
    setProfileFollowersCount(previousFollowing ? Math.max(0, previousFollowersCount - 1) : previousFollowersCount + 1);

    try {
      await requestJson('movimood.php', {
        params: { resource: 'follows' },
        method: previousFollowing ? 'DELETE' : 'POST',
        body: {
          user_id: currentUser.id,
          followed_user_id: viewedUser.id,
        },
      });
    } catch (error) {
      setIsFollowingProfile(previousFollowing);
      setProfileFollowersCount(previousFollowersCount);
      
      // Si es error de bloqueo, actualizar el estado
      if (error?.status === 422 && error?.payload?.message?.includes('bloqueo')) {
        console.warn('No puedes seguir a este usuario porque existe un bloqueo.');
      }
    } finally {
      setIsFollowSaving(false);
    }
  }

  async function handleToggleBlock() {
    if (!currentUser?.id || !viewedUser?.id || isOwnProfile || isBlockSaving) {
      return;
    }

    setIsBlockSaving(true);
    setBlockError('');
    const previousBlockedByMe = didBlockViewedUser;
    const previousBlocked = isBlockedProfile;

    setDidBlockViewedUser(!previousBlockedByMe);
    setIsBlockedProfile(!previousBlockedByMe || isBlockedByViewedUser);
    if (!previousBlockedByMe) {
      setIsFollowingProfile(false);
    }

    try {
      await requestJson('movimood.php', {
        params: { resource: 'blocks' },
        method: previousBlocked ? 'DELETE' : 'POST',
        body: {
          user_id: currentUser.id,
          blocked_user_id: viewedUser.id,
        },
      });
    } catch (error) {
      console.error('Error al bloquear/desbloquear:', error);
      setDidBlockViewedUser(previousBlockedByMe);
      setIsBlockedProfile(previousBlocked);
      setBlockError(previousBlocked ? 'Error al desbloquear usuario' : 'Error al bloquear usuario');
    } finally {
      setIsBlockSaving(false);
    }
  }

  useEffect(() => {
    setActiveTab('general');
    setActivityFilter('all');
    setActivityMoodFilter('all');
    setViewsSearchTerm('');
    setViewsSortBy('recent');
    setReviewsSearchTerm('');
    setReviewsSortBy('recent');
    setSelectedRadarMood(null);
    setSelectedCollectionMood(null);
    setExpandedReviews({});
  }, [resolvedProfileId]);

  useEffect(() => {
    setHasAnimatedRadarData(false);
    setHasAnimatedRadarGhost(false);
  }, [resolvedProfileId]);

  useEffect(() => {
    if (!viewedUser?.id) {
      return;
    }

    if (!isOwnProfile && profileFavorites.length > 0) {
      const nextFavoriteMovies = profileFavorites
        .map((entry) => normalizeMovieForActivity(entry.movie, entry.movie?.id))
        .filter(Boolean);

      setFavoriteMovieIds(profileFavorites.slice(0, MAX_PROFILE_FAVORITES).map((entry) => entry.movie?.id).filter(Boolean));
      setFavoriteMoviePool(nextFavoriteMovies);
      return;
    }

    const storedFavorites = loadProfileFavorites(viewedUser.id);
    setFavoriteMovieIds(storedFavorites.ids.slice(0, MAX_PROFILE_FAVORITES));
    setFavoriteMoviePool(storedFavorites.movies);
  }, [isOwnProfile, profileFavorites, viewedUser?.id]);

  useEffect(() => {
    if (!hasApiBaseUrl() || !viewedUser?.id) {
      return undefined;
    }

    const movieIdsToHydrate = new Set();

    favoriteMoviePool.forEach((movie) => {
      if (movie?.id && !movie.poster_path) {
        movieIdsToHydrate.add(movie.id);
      }
    });

    activeReviews.forEach((review) => {
      const movieId = review.movieId || review.movie?.id;
      const hasPoster = Boolean(review.movie?.poster_path || review.movie?.backdrop_path);
      if (movieId && !hasPoster) {
        movieIdsToHydrate.add(movieId);
      }
    });

    if (movieIdsToHydrate.size === 0) {
      return undefined;
    }

    let cancelled = false;

    void Promise.all(
      Array.from(movieIdsToHydrate).map(async (movieId) => {
        try {
          const response = await requestJson('tmdb-movie.php', {
            params: { id: movieId, language: 'es-ES' },
          });

          if (cancelled || !response?.id) {
            return null;
          }

          return {
            id: response.id,
            title: response.title || response.name || '',
            poster_path: response.poster_path || response.backdrop_path || '',
            backdrop_path: response.backdrop_path || '',
            release_date: response.release_date || '',
          };
        } catch {
          return null;
        }
      })
    ).then((hydratedMovies) => {
      if (cancelled) {
        return;
      }

      const nextFallbackByMovieId = {};

      hydratedMovies.filter(Boolean).forEach((movie) => {
        nextFallbackByMovieId[movie.id] = movie;
      });

      if (Object.keys(nextFallbackByMovieId).length > 0) {
        setPosterFallbackByMovieId((prev) => ({
          ...prev,
          ...nextFallbackByMovieId,
        }));
      }
    });

    return () => {
      cancelled = true;
    };
  }, [favoriteMoviePool, activeReviews, viewedUser?.id]);

  const reviewMovies = useMemo(() => {
    const moviesById = new Map();
    activeReviews.forEach((review) => {
      if (review.movie?.id && review.movie.poster_path && !moviesById.has(review.movie.id)) {
        moviesById.set(review.movie.id, review.movie);
      }
    });
    return Array.from(moviesById.values());
  }, [activeReviews]);

  const selectedFavoriteMovies = useMemo(() => {
    const movieMap = new Map();

    favoriteMoviePool.forEach((movie) => {
      if (movie?.id && movie.poster_path) {
        movieMap.set(movie.id, movie);
      }
    });

    reviewMovies.forEach((movie) => {
      if (movie?.id && movie.poster_path && !movieMap.has(movie.id)) {
        movieMap.set(movie.id, movie);
      }
    });

    return favoriteMovieIds.map((movieId) => movieMap.get(movieId)).filter(Boolean).slice(0, MAX_PROFILE_FAVORITES);
  }, [favoriteMovieIds, favoriteMoviePool, reviewMovies]);

  const storedMoviesById = useMemo(() => {
    const allMovies = loadMoviesByIdFromStorage(viewedUser?.id || null);

    favoriteMoviePool.forEach((movie) => {
      const normalized = normalizeMovieForActivity(movie);
      const key = movieKey(normalized?.id);
      if (key) {
        allMovies.set(key, normalized);
      }
    });

    activeReviews.forEach((review) => {
      const normalized = normalizeMovieForActivity(review.movie);
      const key = movieKey(normalized?.id);
      if (key) {
        allMovies.set(key, normalized);
      }
    });

    return allMovies;
  }, [favoriteMoviePool, activeReviews, viewedUser?.id]);

  const recentActivity = useMemo(
    () => [...activeReviews]
      .sort((left, right) => new Date(right.updatedAt || right.createdAt) - new Date(left.updatedAt || left.createdAt))
      .slice(0, 8)
      .map((review) => {
        const reviewMovieKey = movieKey(review.movieId);
        const relatedFavorite = activeFavorites.find((fav) => movieKey(fav?.movie?.id) === reviewMovieKey) || null;
        const resolvedMovie = mergeMovieCandidates(review.movieId, [
          normalizeMovieForActivity(review.movie),
          normalizeMovieForActivity(relatedFavorite?.movie),
          storedMoviesById.get(reviewMovieKey),
        ]) || normalizeMovieForActivity(null, review.movieId);

        return {
          id: review.id,
          movie: resolvedMovie,
          mood: review.mood || relatedFavorite?.questionnaire?.moods?.[0] || 'Sin mood',
          action: 'Reseñada',
          date: review.updatedAt || review.createdAt,
          rating: Number(review.rating) || 0,
          comment: (review.comment || '').trim(),
        };
      }),
    [activeFavorites, activeReviews, storedMoviesById]
  );

  const genreCounts = useMemo(() => {
    const uniqueMovies = new Map();
    const counts = new Map();

    [...activeFavorites, ...storedWatchedFavorites]
      .filter((fav) => fav.lista === LISTAS.YA_VISTA)
      .forEach((fav) => {
        if (fav.movie?.id && !uniqueMovies.has(fav.movie.id)) {
          uniqueMovies.set(fav.movie.id, fav.movie);
        }
      });

    uniqueMovies.forEach((movie) => {
      (movie.genre_ids || []).forEach((genreId) => {
        const genreName = genreIdToName[genreId];
        if (!genreName) {
          return;
        }
        counts.set(genreName, (counts.get(genreName) || 0) + 1);
      });
    });

    return Array.from(counts.entries())
      .map(([name, count]) => ({ name, count }))
      .sort((left, right) => right.count - left.count || left.name.localeCompare(right.name));
  }, [activeFavorites, storedWatchedFavorites]);

  const watchedFavorites = useMemo(
    () => [...activeFavorites, ...storedWatchedFavorites].filter((fav) => fav.lista === LISTAS.YA_VISTA && fav.movie?.id),
    [activeFavorites, storedWatchedFavorites]
  );

  const moodStats = useMemo(() => {
    const moodKeys = Object.keys(MOOD_EMOJIS);
    const counts = moodKeys.reduce((accumulator, mood) => {
      accumulator[mood] = 0;
      return accumulator;
    }, {});
    const countedMoodPairs = new Set();

    function addMoodCount(movieId, moods) {
      const uniqueMoods = getUniqueMoods(moods)
        .map(normalizeMoodName)
        .filter(Boolean);

      uniqueMoods.forEach((mood) => {
        if (!(mood in counts)) {
          return;
        }

        const pairKey = `${movieKey(movieId)}::${mood}`;
        if (countedMoodPairs.has(pairKey)) {
          return;
        }

        countedMoodPairs.add(pairKey);
        counts[mood] += 1;
      });
    }

    watchedFavorites.forEach((fav) => {
      const movieId = fav?.movie?.id;
      addMoodCount(movieId, getQuestionnaireMoods(fav?.questionnaire));
    });

    return counts;
  }, [watchedFavorites]);

  const moodRadarData = useMemo(() => {
    const moods = Object.keys(MOOD_EMOJIS);
    const counts = moods.map((mood) => moodStats[mood] || 0);
    const totalCount = counts.reduce((accumulator, currentValue) => accumulator + currentValue, 0);
    const maxValue = Math.max(...counts, 1);
    const center = 130;
    const radius = 94;

    const coordinates = moods
      .map((mood, index) => {
        const value = (moodStats[mood] || 0) / maxValue;
        const angle = ((Math.PI * 2) / moods.length) * index - Math.PI / 2;
        const x = center + Math.cos(angle) * radius * value;
        const y = center + Math.sin(angle) * radius * value;
        return {
          mood,
          value: moodStats[mood] || 0,
          x,
          y,
        };
      });

    const polylinePoints = coordinates.map((point) => `${point.x.toFixed(1)},${point.y.toFixed(1)}`).join(' ');

    return {
      moods,
      counts,
      totalCount,
      hasData: totalCount > 0,
      maxValue,
      center,
      coordinates,
      polylinePoints,
    };
  }, [moodStats]);

  const moodCollections = useMemo(() => {
    return Object.keys(MOOD_EMOJIS)
      .map((mood) => ({
        mood,
        count: moodStats[mood] || 0,
      }))
      .filter((item) => item.count > 0)
      .sort((left, right) => right.count - left.count);
  }, [moodStats]);

  const moodCollectionCards = useMemo(() => {
    const postersByMood = new Map();
    const seenFavoritesSorted = [...watchedFavorites]
      .sort((left, right) => new Date(right.savedAt || right.updatedAt || 0) - new Date(left.savedAt || left.updatedAt || 0));

    seenFavoritesSorted.forEach((fav) => {
      const movieId = fav?.movie?.id;
      const moodsToAssign = getQuestionnaireMoods(fav?.questionnaire);

      if (!movieId || moodsToAssign.length === 0) {
        return;
      }

      const resolvedMovie = mergeMovieCandidates(movieId, [
        normalizeMovieForActivity(fav.movie),
        normalizeMovieForActivity(posterFallbackByMovieId[movieId], movieId),
        storedMoviesById.get(movieKey(movieId)),
      ]);

      if (!resolvedMovie?.poster_path) {
        return;
      }

      moodsToAssign.forEach((mood) => {
        if (!MOOD_EMOJIS[mood]) {
          return;
        }

        const current = postersByMood.get(mood) || [];
        if (!current.some((movie) => movie.id === resolvedMovie.id)) {
          postersByMood.set(mood, [...current, resolvedMovie]);
        }
      });
    });

    return moodCollections.map((collection) => ({
      ...collection,
      glowColor: MOOD_GLOW_COLORS[collection.mood] || '#8aa2ff',
      posters: (postersByMood.get(collection.mood) || []).slice(0, 3),
    }));
  }, [moodCollections, posterFallbackByMovieId, storedMoviesById, watchedFavorites]);

  // `moodCollectionMovies` logic removed: expanded collection detail view was removed

  useEffect(() => {
    if (activeTab !== 'colecciones') {
      return;
    }

    const hasCurrentMood = moodCollectionCards.some((collection) => collection.mood === selectedCollectionMood);
    if (!hasCurrentMood) {
      setSelectedCollectionMood(moodCollectionCards[0]?.mood || null);
    }
  }, [activeTab, moodCollectionCards, selectedCollectionMood]);

  // Note: expanded collection movie list is not used; collections render only as summary cards.

  const maxGenreCount = useMemo(
    () => Math.max(1, ...genreCounts.map((genre) => genre.count)),
    [genreCounts]
  );

  const selectedRadarMoodInfo = useMemo(() => {
    if (!moodRadarData.hasData) {
      return null;
    }

    const sortedByCount = [...moodRadarData.coordinates]
      .filter((point) => point.value > 0)
      .sort((left, right) => right.value - left.value);
    const fallbackMood = sortedByCount[0]?.mood || null;
    const selectedPoint = moodRadarData.coordinates.find((point) => point.mood === selectedRadarMood);
    const activeMood = selectedPoint && selectedPoint.value > 0
      ? selectedPoint.mood
      : fallbackMood;

    if (!activeMood) {
      return null;
    }

    const activePoint = moodRadarData.coordinates.find((point) => point.mood === activeMood);
    const count = activePoint?.value || 0;
    const percentage = moodRadarData.totalCount > 0
      ? Math.round((count / moodRadarData.totalCount) * 100)
      : 0;
    const topTitles = recentActivity
      .filter((item) => item.mood === activeMood)
      .slice(0, 3)
      .map((item) => item.movie?.title)
      .filter(Boolean);

    return {
      mood: activeMood,
      count,
      percentage,
      topTitles,
    };
  }, [moodRadarData, recentActivity, selectedRadarMood]);

  const moviesSeenCount = useMemo(() => {
    const seenIds = new Set();

    activeFavorites.forEach((fav) => {
      if (fav.lista === LISTAS.YA_VISTA && fav.movie?.id) {
        seenIds.add(fav.movie.id);
      }
    });

    return seenIds.size;
  }, [activeFavorites]);
  const likesByReviewId = useMemo(() => loadReviewLikesByReviewId(), []);
  const likesCount = useMemo(() => {
    return activeReviews.reduce((total, review) => total + (likesByReviewId.get(review.id) || 0), 0);
  }, [activeReviews, likesByReviewId]);
  const followingCount = Number(
    viewedUser?.followingCount || viewedUser?.seguidosCount || viewedUser?.following?.length || 0
  );
  const followersCount = Number(profileFollowersCount ?? viewedUser?.followersCount ?? 0);

  const likedActivity = useMemo(
    () => recentActivity.filter((item) => (likesByReviewId.get(item.id) || 0) > 0),
    [likesByReviewId, recentActivity]
  );

  const watchedActivity = useMemo(() => {
    const moviesById = new Map();
    const seenFavorites = [...activeFavorites]
      .filter((fav) => fav.lista === LISTAS.YA_VISTA)
      .sort((left, right) => new Date(right.savedAt || 0) - new Date(left.savedAt || 0));

    seenFavorites.forEach((fav) => {
      const movieId = fav.movie?.id;
      if (!movieId || moviesById.has(movieId)) {
        return;
      }

      moviesById.set(movieId, {
        id: `vista-${movieId}`,
        movie: normalizeMovieForActivity(fav.movie, movieId),
        mood: fav?.questionnaire?.moods?.[0] || 'Sin mood',
        action: 'Vista',
        date: fav.savedAt || '',
        rating: 0,
        comment: '',
      });
    });

    return Array.from(moviesById.values());
  }, [activeFavorites]);

  const activityItems = useMemo(() => {
    let baseItems;

    if (activityFilter === 'likes') {
      baseItems = likedActivity;
    } else if (activityFilter === 'vistas') {
      const query = viewsSearchTerm.trim().toLowerCase();
      const filteredViews = query
        ? watchedActivity.filter((item) => {
          const title = (item.movie?.title || item.movie?.name || '').toLowerCase();
          return title.includes(query);
        })
        : watchedActivity;

      baseItems = [...filteredViews].sort((left, right) => {
        if (viewsSortBy === 'title-asc') {
          const leftTitle = left.movie?.title || left.movie?.name || '';
          const rightTitle = right.movie?.title || right.movie?.name || '';
          return leftTitle.localeCompare(rightTitle, 'es', { sensitivity: 'base' });
        }

        if (viewsSortBy === 'title-desc') {
          const leftTitle = left.movie?.title || left.movie?.name || '';
          const rightTitle = right.movie?.title || right.movie?.name || '';
          return rightTitle.localeCompare(leftTitle, 'es', { sensitivity: 'base' });
        }

        return new Date(right.date || 0) - new Date(left.date || 0);
      });
    } else if (activityFilter === 'resenas') {
      const query = reviewsSearchTerm.trim().toLowerCase();
      const filteredReviews = query
        ? recentActivity.filter((item) => {
          const title = (item.movie?.title || item.movie?.name || '').toLowerCase();
          return title.includes(query);
        })
        : recentActivity;

      baseItems = [...filteredReviews].sort((left, right) => {
        if (reviewsSortBy === 'title-asc') {
          const leftTitle = left.movie?.title || left.movie?.name || '';
          const rightTitle = right.movie?.title || right.movie?.name || '';
          return leftTitle.localeCompare(rightTitle, 'es', { sensitivity: 'base' });
        }

        if (reviewsSortBy === 'title-desc') {
          const leftTitle = left.movie?.title || left.movie?.name || '';
          const rightTitle = right.movie?.title || right.movie?.name || '';
          return rightTitle.localeCompare(leftTitle, 'es', { sensitivity: 'base' });
        }

        return new Date(right.date || 0) - new Date(left.date || 0);
      });
    } else {
      baseItems = recentActivity;
    }

    if (activityMoodFilter !== 'all') {
      return baseItems.filter((item) => item.mood === activityMoodFilter);
    }

    return baseItems;
  }, [
    activityFilter,
    activityMoodFilter,
    likedActivity,
    recentActivity,
    reviewsSearchTerm,
    reviewsSortBy,
    viewsSearchTerm,
    viewsSortBy,
    watchedActivity,
  ]);

  function openMetricDestination(metric) {
    if (metric === 'seguidos') {
      setActiveTab('seguidos');
      return;
    }

    if (metric === 'seguidores') {
      setActiveTab('seguidores');
      return;
    }

    setActiveTab('actividad');
    setActivityMoodFilter('all');

    if (metric === 'likes') {
      setActivityFilter('likes');
      return;
    }

    if (metric === 'vistas') {
      setActivityFilter('vistas');
      return;
    }

    if (metric === 'resenas') {
      setActivityFilter('resenas');
      return;
    }

    setActivityFilter('all');
  }

  function openMoodActivity(mood) {
    setActiveTab('actividad');
    setActivityFilter('resenas');
    setActivityMoodFilter(mood);
  }

  function toggleRadarMood(mood) {
    setSelectedRadarMood((prev) => (prev === mood ? null : mood));
  }

  function toggleReviewExpanded(reviewId) {
    setExpandedReviews((prev) => ({
      ...prev,
      [reviewId]: !prev[reviewId],
    }));
  }

  if (!currentUser && !routeProfileId) {
    return <Navigate to="/login" replace />;
  }

  if (!resolvedProfileId) {
    return <Navigate to="/login" replace />;
  }

  if (!viewedUser || (!isOwnProfile && isBlockedByViewedUser && !didBlockViewedUser)) {
    return (
      <div className="pagina-principal perfil-page perfil-v3-page">
        <section className="perfil-v3-card perfil-v3-not-found">
          <h2>Este perfil no esta disponible</h2>
          <p>No existe ningun usuario con ese identificador.</p>
          <div className="perfil-v3-not-found-actions">
            <Link to="/" className="perfil-v3-link-ghost">Volver a inicio</Link>
            {currentUser ? (
              <Link to="/configuracion" className="perfil-v3-link-main">Ir a configuracion</Link>
            ) : (
              <Link to="/login" className="perfil-v3-link-main">Iniciar sesion</Link>
            )}
          </div>
        </section>
      </div>
    );
  }

  if (!isOwnProfile && didBlockViewedUser) {
    return (
      <div className="pagina-principal perfil-page perfil-v3-page">
        <section className="perfil-v3-card perfil-v3-not-found">
          <h2>Has bloqueado a este usuario</h2>
          <p>Su contenido esta oculto mientras el bloqueo este activo.</p>
          <div className="perfil-v3-not-found-actions">
            <button
              type="button"
              className="perfil-v3-link-main"
              onClick={handleToggleBlock}
              disabled={isBlockSaving}
            >
              {isBlockSaving ? 'Procesando...' : 'Desbloquear usuario'}
            </button>
            <Link to="/" className="perfil-v3-link-ghost">Volver a inicio</Link>
          </div>
          {blockError && (
            <div className="perfil-v3-error-message" style={{ color: 'red', marginTop: '10px' }}>
              {blockError}
            </div>
          )}
        </section>
      </div>
    );
  }

  return (
    <div className="pagina-principal perfil-page perfil-v3-page">
      <div className="perfil-v3-shell">
        <aside className="perfil-v3-sidebar">
          <div className="perfil-v3-sidebar-head">
            <p className="perfil-v3-kicker">{isOwnProfile ? 'Mi espacio' : 'Perfil publico'}</p>
            <h1>{isOwnProfile ? 'Mi perfil' : viewedUser.name}</h1>
            {viewedUser.username && <p className="perfil-v3-handle">@{viewedUser.username}</p>}
          </div>

          <nav className="perfil-v3-nav" aria-label="Secciones del perfil">
            {PROFILE_TABS.map((tab) => (
              <button
                key={tab.id}
                type="button"
                className={`perfil-v3-nav-item${activeTab === tab.id ? ' active' : ''}`}
                onClick={() => setActiveTab(tab.id)}
              >
                {tab.label}
              </button>
            ))}
          </nav>

          <div className="perfil-v3-sidebar-foot">
            <Link to="/" className="perfil-v3-link-ghost">Inicio</Link>
            {isOwnProfile && <Link to="/configuracion" className="perfil-v3-link-main">Configuracion</Link>}
          </div>
        </aside>

        <main className="perfil-v3-content">
          {activeTab === 'general' && (
            <section className="perfil-v3-tab-panel">
              {isOwnProfile && !moodRadarData.hasData && (
                <article className="perfil-v3-card perfil-v3-radar-callout">
                  <div className="perfil-v3-section-head">
                    <h3>Activa tu Mood Radar</h3>
                    <p>Empieza a entrenar tu perfil con tu actividad.</p>
                  </div>
                  <p className="perfil-v3-radar-callout-copy">
                    El radar se rellena cuando puntúas o reseñas películas desde tu videoteca. Si no quieres escribir,
                    puedes guardar solo una puntuación y el mood quedará registrado igualmente.
                  </p>
                  <div className="perfil-v3-radar-callout-actions">
                    <Link to="/videoteca" className="perfil-v3-link-main">Ir a videoteca</Link>
                  </div>
                </article>
              )}

              <article className="perfil-v3-card perfil-v3-profile-card">
                <div className="perfil-v3-profile-head">
                  {viewedUser.avatar ? (
                    <img className="perfil-v3-avatar" src={viewedUser.avatar} alt={`Avatar de ${viewedUser.name}`} />
                  ) : (
                    <div className="perfil-v3-avatar perfil-v3-avatar-fallback">{getInitials(viewedUser.name)}</div>
                  )}

                  <div className="perfil-v3-profile-copy">
                    <p className="perfil-v3-kicker">General</p>
                    <div className="perfil-v3-profile-title-row">
                      <div className="perfil-v3-profile-title-block">
                        <h2>{viewedUser.name}</h2>
                        {didBlockViewedUser && (
                          <span className="perfil-v3-profile-badge">Perfil bloqueado</span>
                        )}
                      </div>
                      {!isOwnProfile && currentUser?.id && (
                        <div className="perfil-v3-profile-actions">
                          {!isBlockedProfile && (
                            <button
                              type="button"
                              className={`perfil-v3-follow-btn${isFollowingProfile ? ' is-following' : ''}`}
                              onClick={handleToggleFollow}
                              disabled={isFollowSaving}
                              aria-pressed={isFollowingProfile}
                            >
                              {isFollowingProfile ? 'Siguiendo' : 'Seguir'}
                            </button>
                          )}
                          <button
                            type="button"
                            className={`perfil-v3-block-btn${didBlockViewedUser ? ' is-blocked' : ''}`}
                            onClick={handleToggleBlock}
                            disabled={isBlockSaving}
                            aria-pressed={didBlockViewedUser}
                          >
                            {didBlockViewedUser ? 'Desbloquear' : 'Bloquear'}
                          </button>
                          {blockError && (
                            <div className="perfil-v3-error-message" style={{ color: 'red', fontSize: '14px', marginTop: '5px' }}>
                              {blockError}
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                    <p className="perfil-v3-bio">
                      Perfil cinéfilo en MoviMood: moods, reseñas y películas que definen su estilo.
                    </p>
                    {didBlockViewedUser && (
                      <div className="perfil-v3-block-status">
                        Has bloqueado a este usuario. Ya no podrá seguirte ni ver tu actividad.
                      </div>
                    )}
                  </div>
                </div>
              </article>

              <section className="perfil-v3-stats-grid">
                <button
                  type="button"
                  className="perfil-v3-card perfil-v3-stat-card perfil-v3-stat-card-interactive"
                  onClick={() => openMetricDestination('likes')}
                >
                  <div className="perfil-v3-stat-head">
                    <span className="perfil-v3-stat-icon" aria-hidden="true">❤</span>
                    <span>Likes</span>
                  </div>
                  <strong>{likesCount}</strong>
                </button>
                <button
                  type="button"
                  className="perfil-v3-card perfil-v3-stat-card perfil-v3-stat-card-interactive"
                  onClick={() => openMetricDestination('seguidos')}
                >
                  <div className="perfil-v3-stat-head">
                    <span className="perfil-v3-stat-icon" aria-hidden="true">➡</span>
                    <span>Seguidos</span>
                  </div>
                  <strong>{followingCount}</strong>
                </button>
                <button
                  type="button"
                  className="perfil-v3-card perfil-v3-stat-card perfil-v3-stat-card-interactive"
                  onClick={() => openMetricDestination('seguidores')}
                >
                  <div className="perfil-v3-stat-head">
                    <span className="perfil-v3-stat-icon" aria-hidden="true">👥</span>
                    <span>Seguidores</span>
                  </div>
                  <strong>{followersCount}</strong>
                </button>
                <button
                  type="button"
                  className="perfil-v3-card perfil-v3-stat-card perfil-v3-stat-card-interactive"
                  onClick={() => openMetricDestination('vistas')}
                >
                  <div className="perfil-v3-stat-head">
                    <span className="perfil-v3-stat-icon" aria-hidden="true">🎬</span>
                    <span>Películas vistas</span>
                  </div>
                  <strong>{moviesSeenCount}</strong>
                </button>
                <button
                  type="button"
                  className="perfil-v3-card perfil-v3-stat-card perfil-v3-stat-card-interactive"
                  onClick={() => openMetricDestination('resenas')}
                >
                  <div className="perfil-v3-stat-head">
                    <span className="perfil-v3-stat-icon" aria-hidden="true">✍</span>
                    <span>Reseñas</span>
                  </div>
                  <strong>{activeReviews.length}</strong>
                </button>
              </section>

              <section className="perfil-v3-general-grid">
                <article className="perfil-v3-card perfil-v3-radar-card">
                  <div className="perfil-v3-section-head">
                    <h3>Mood Radar</h3>
                    <p>Resumen visual de tus moods mas usados.</p>
                  </div>

                  {moodRadarData.hasData && (
                    <p className="perfil-v3-radar-help">
                      Haz clic en un punto con actividad para explorar ese mood. Los moods con 0 no se pueden seleccionar.
                    </p>
                  )}

                  {moodRadarData.hasData ? (
                    <div className="perfil-v3-radar-wrap">
                      <svg viewBox="0 0 260 260" aria-label="Grafico de mood radar">
                        <defs>
                          <linearGradient id="perfil-v3-radar-gradient" x1="0%" y1="0%" x2="100%" y2="100%">
                            <stop offset="0%" stopColor="rgba(162, 116, 255, 0.7)" />
                            <stop offset="100%" stopColor="rgba(98, 188, 255, 0.45)" />
                          </linearGradient>
                        </defs>
                        <g className="perfil-v3-radar-grid">
                          <polygon points="130,28 202,58 232,130 202,202 130,232 58,202 28,130 58,58" />
                          <polygon points="130,50 186,74 210,130 186,186 130,210 74,186 50,130 74,74" />
                          <polygon points="130,72 170,90 188,130 170,170 130,188 90,170 72,130 90,90" />
                          <polygon points="130,94 154,106 166,130 154,154 130,166 106,154 94,130 106,106" />
                        </g>
                        <g
                          className={`perfil-v3-radar-data${!hasAnimatedRadarData ? ' perfil-v3-radar-enter' : ''}`}
                          onAnimationEnd={() => setHasAnimatedRadarData(true)}
                        >
                          <circle
                            className="perfil-v3-radar-center-hub"
                            cx={moodRadarData.center}
                            cy={moodRadarData.center}
                            r="4.4"
                          />

                          <polygon className="perfil-v3-radar-fill" points={moodRadarData.polylinePoints} />
                          <polyline className="perfil-v3-radar-trace" points={moodRadarData.polylinePoints} />
                          {moodRadarData.coordinates.filter((point) => point.value > 0).map((point) => (
                            <g
                              key={`point-${point.mood}`}
                              className="perfil-v3-radar-point-interactive"
                              role="button"
                              tabIndex={0}
                              aria-label={`Seleccionar mood ${point.mood}`}
                              onClick={() => toggleRadarMood(point.mood)}
                              onKeyDown={(event) => {
                                if (event.key === 'Enter' || event.key === ' ') {
                                  event.preventDefault();
                                  toggleRadarMood(point.mood);
                                }
                              }}
                            >
                              <line
                                className={`perfil-v3-radar-axis${selectedRadarMoodInfo?.mood === point.mood ? ' is-active' : ''}`}
                                x1={moodRadarData.center}
                                y1={moodRadarData.center}
                                x2={point.x}
                                y2={point.y}
                              />
                              <circle
                                className="perfil-v3-radar-hit-area"
                                cx={point.x}
                                cy={point.y}
                                r="13"
                              />
                              <circle
                                className={`perfil-v3-radar-dot${selectedRadarMoodInfo?.mood === point.mood ? ' is-active' : ''}`}
                                cx={point.x}
                                cy={point.y}
                                r="3.8"
                              />
                            </g>
                          ))}
                        </g>
                      </svg>

                      <ul className="perfil-v3-radar-legend">
                        {moodRadarData.moods.map((mood, index) => (
                          <li key={mood}>
                            <button
                              type="button"
                              className={`perfil-v3-radar-legend-btn${selectedRadarMoodInfo?.mood === mood ? ' active' : ''}`}
                              disabled={moodRadarData.counts[index] === 0}
                              onClick={() => toggleRadarMood(mood)}
                            >
                              <span>{MOOD_EMOJIS[mood]} {mood}</span>
                              <strong>{moodRadarData.counts[index]}</strong>
                            </button>
                          </li>
                        ))}
                      </ul>

                      {selectedRadarMoodInfo && (
                        <div className="perfil-v3-radar-detail">
                          <p className="perfil-v3-radar-detail-title">
                            Mood activo: {MOOD_EMOJIS[selectedRadarMoodInfo.mood]} {selectedRadarMoodInfo.mood}
                          </p>
                          <p className="perfil-v3-radar-detail-copy">
                            {selectedRadarMoodInfo.count} reseña(s), {selectedRadarMoodInfo.percentage}% de tu radar.
                          </p>
                          {selectedRadarMoodInfo.topTitles.length > 0 && (
                            <p className="perfil-v3-radar-detail-copy">
                              Ejemplos: {selectedRadarMoodInfo.topTitles.join(', ')}.
                            </p>
                          )}
                          <button
                            type="button"
                            className="perfil-v3-radar-detail-btn"
                            onClick={() => openMoodActivity(selectedRadarMoodInfo.mood)}
                          >
                            Ver reseñas de este mood
                          </button>
                        </div>
                      )}
                    </div>
                  ) : (
                    <div
                      className={`perfil-v3-radar-empty${!hasAnimatedRadarGhost ? ' perfil-v3-radar-empty-enter' : ''}`}
                      onAnimationEnd={() => setHasAnimatedRadarGhost(true)}
                    >
                      <svg viewBox="0 0 260 260" aria-label="Mood radar pendiente de completar">
                        <g className="perfil-v3-radar-ghost-grid">
                          <polygon points="130,28 202,58 232,130 202,202 130,232 58,202 28,130 58,58" />
                          <polygon points="130,50 186,74 210,130 186,186 130,210 74,186 50,130 74,74" />
                          <polygon points="130,72 170,90 188,130 170,170 130,188 90,170 72,130 90,90" />
                          <polygon points="130,94 154,106 166,130 154,154 130,166 106,154 94,130 106,106" />
                        </g>
                        <g className="perfil-v3-radar-ghost-axis">
                          <line x1="130" y1="130" x2="130" y2="28" />
                          <line x1="130" y1="130" x2="202" y2="58" />
                          <line x1="130" y1="130" x2="232" y2="130" />
                          <line x1="130" y1="130" x2="202" y2="202" />
                          <line x1="130" y1="130" x2="130" y2="232" />
                          <line x1="130" y1="130" x2="58" y2="202" />
                          <line x1="130" y1="130" x2="28" y2="130" />
                          <line x1="130" y1="130" x2="58" y2="58" />
                        </g>
                        <circle className="perfil-v3-radar-ghost-core" cx="130" cy="130" r="4" />
                      </svg>
                      <p>
                        Tu Mood Radar se activa cuando puntúas o reseñas películas desde la videoteca.
                        Puedes dejar solo una puntuación si no quieres escribir comentario.
                      </p>
                      {isOwnProfile && (
                        <div className="perfil-v3-radar-empty-actions">
                          <Link to="/videoteca" className="perfil-v3-link-main">Puntuar películas</Link>
                        </div>
                      )}
                    </div>
                  )}
                </article>

                <article className="perfil-v3-card perfil-v3-favorites-card">
                  <div className="perfil-v3-section-head">
                    <h3>Top 4 Favoritos</h3>
                    <p>Estas peliculas se muestran en el escaparate del perfil.</p>
                  </div>

                  {selectedFavoriteMovies.length === 0 ? (
                    <div className="perfil-v3-empty">
                      <p>Todavia no hay favoritas fijadas en este perfil.</p>
                    </div>
                  ) : (
                    <div className="perfil-v3-favorites-grid">
                      {selectedFavoriteMovies.map((movie) => (
                        <article key={movie.id} className="perfil-v3-favorite-card">
                          <img src={`https://image.tmdb.org/t/p/w500${movie.poster_path}`} alt={movie.title || 'Pelicula'} />
                        </article>
                      ))}
                    </div>
                  )}
                </article>
              </section>
            </section>
          )}

          {activeTab === 'colecciones' && (
            <section className="perfil-v3-tab-panel">
              <article className="perfil-v3-card">
                <div className="perfil-v3-section-head">
                  <h3>Colecciones por mood</h3>
                  <p>Tu libreria organizada segun el estado de animo registrado.</p>
                </div>

                {moodCollectionCards.length === 0 ? (
                  <div className="perfil-v3-empty">
                    <p>Aun no hay colecciones. Completa el cuestionario y guarda resenas para empezar.</p>
                  </div>
                ) : (
                  <>
                    <div className="perfil-v3-collection-list">
                      {moodCollectionCards.map((collection) => (
                        <button
                          key={collection.mood}
                          type="button"
                          className={`perfil-v3-collection-item${selectedCollectionMood === collection.mood ? ' active' : ''}`}
                          style={{ '--mood-glow-color': collection.glowColor }}
                          onClick={() => setSelectedCollectionMood(collection.mood)}
                        >
                          <div className="perfil-v3-collection-head">
                            <strong>{MOOD_EMOJIS[collection.mood]} {collection.mood}</strong>
                            <span>{collection.count}</span>
                          </div>
                          <p>{collection.count} pelicula(s) en esta coleccion.</p>
                          <div className="perfil-v3-collection-posters" aria-label={`Ultimos posters en ${collection.mood}`}>
                            {collection.posters.length > 0 ? collection.posters.map((movie, posterIndex) => (
                              <img
                                key={`${collection.mood}-${movie.id}`}
                                src={`https://image.tmdb.org/t/p/w500${movie.poster_path}`}
                                alt={movie.title || 'Poster'}
                                className="perfil-v3-collection-poster"
                                style={{ '--stack-index': posterIndex }}
                              />
                            )) : (
                              <div className="perfil-v3-collection-poster-empty">Sin posters recientes</div>
                            )}
                          </div>
                        </button>
                      ))}
                    </div>

                    {/* Expanded collection view removed to avoid duplicate rendering.
                        Collections are shown only as summary cards with miniatures above. */}
                  </>
                )}
              </article>

              <article className="perfil-v3-card">
                <div className="perfil-v3-section-head">
                  <h3>Generos explorados</h3>
                  <p>Calculado con peliculas marcadas como Ya vista.</p>
                </div>
                {genreCounts.length === 0 ? (
                  <div className="perfil-v3-empty">
                    <p>Aun no hay generos registrados.</p>
                  </div>
                ) : (
                  <div className="perfil-v3-chip-row">
                    {genreCounts.map((genre) => {
                      const intensity = genre.count / maxGenreCount;
                      return (
                        <span
                          className="perfil-v3-chip perfil-v3-chip-neon"
                          key={genre.name}
                          style={{
                            '--genre-border-alpha': (0.24 + (intensity * 0.56)).toFixed(2),
                            '--genre-glow-alpha': (0.14 + (intensity * 0.34)).toFixed(2),
                            fontSize: `${12 + (intensity * 3)}px`,
                          }}
                        >
                          {genre.name}
                          <small>{genre.count}</small>
                        </span>
                      );
                    })}
                  </div>
                )}
              </article>
            </section>
          )}

          {activeTab === 'actividad' && (
            <section className="perfil-v3-tab-panel">
              <article className="perfil-v3-card">
                <div className="perfil-v3-section-head">
                  <h3>Actividad reciente</h3>
                  <p>Últimas reseñas publicadas en este perfil.</p>
                </div>

                <div className="perfil-v3-activity-filters" role="tablist" aria-label="Filtros de actividad">
                  <button
                    type="button"
                    className={`perfil-v3-filter-pill${activityFilter === 'all' ? ' active' : ''}`}
                    onClick={() => {
                      setActivityFilter('all');
                      setActivityMoodFilter('all');
                    }}
                  >
                    Todo
                  </button>
                  <button
                    type="button"
                    className={`perfil-v3-filter-pill${activityFilter === 'likes' ? ' active' : ''}`}
                    onClick={() => {
                      setActivityFilter('likes');
                      setActivityMoodFilter('all');
                    }}
                  >
                    Con likes
                  </button>
                  <button
                    type="button"
                    className={`perfil-v3-filter-pill${activityFilter === 'vistas' ? ' active' : ''}`}
                    onClick={() => {
                      setActivityFilter('vistas');
                      setActivityMoodFilter('all');
                    }}
                  >
                    Películas vistas
                  </button>
                  <button
                    type="button"
                    className={`perfil-v3-filter-pill${activityFilter === 'resenas' ? ' active' : ''}`}
                    onClick={() => {
                      setActivityFilter('resenas');
                      setActivityMoodFilter('all');
                    }}
                  >
                    Reseñas
                  </button>

                  <select
                    className="perfil-v3-filter-select"
                    value={activityMoodFilter}
                    onChange={(event) => {
                      const nextMood = event.target.value;
                      setActivityMoodFilter(nextMood);
                      if (nextMood !== 'all') {
                        setActivityFilter('resenas');
                      }
                    }}
                    aria-label="Filtrar actividad por mood"
                  >
                    <option value="all">Todos los moods</option>
                    {moodCollections.map((collection) => (
                      <option key={collection.mood} value={collection.mood}>
                        {MOOD_EMOJIS[collection.mood]} {collection.mood} ({collection.count})
                      </option>
                    ))}
                  </select>

                  {activityFilter === 'vistas' && (
                    <>
                      <input
                        type="search"
                        className="perfil-v3-filter-input"
                        value={viewsSearchTerm}
                        onChange={(event) => setViewsSearchTerm(event.target.value)}
                        placeholder="Buscar película..."
                        aria-label="Buscar en películas vistas"
                      />
                      <select
                        className="perfil-v3-filter-select"
                        value={viewsSortBy}
                        onChange={(event) => setViewsSortBy(event.target.value)}
                        aria-label="Ordenar películas vistas"
                      >
                        <option value="recent">Más recientes</option>
                        <option value="title-asc">Título A-Z</option>
                        <option value="title-desc">Título Z-A</option>
                      </select>
                    </>
                  )}

                  {activityFilter === 'resenas' && (
                    <>
                      <input
                        type="search"
                        className="perfil-v3-filter-input"
                        value={reviewsSearchTerm}
                        onChange={(event) => setReviewsSearchTerm(event.target.value)}
                        placeholder="Buscar reseña por película..."
                        aria-label="Buscar en reseñas"
                      />
                      <select
                        className="perfil-v3-filter-select"
                        value={reviewsSortBy}
                        onChange={(event) => setReviewsSortBy(event.target.value)}
                        aria-label="Ordenar reseñas"
                      >
                        <option value="recent">Más recientes</option>
                        <option value="title-asc">Título A-Z</option>
                        <option value="title-desc">Título Z-A</option>
                      </select>
                    </>
                  )}
                </div>

                {activityItems.length === 0 ? (
                  <div className="perfil-v3-empty">
                    <p>No hay actividad disponible para este filtro.</p>
                  </div>
                ) : (
                  <div className="perfil-v3-activity-grid">
                    {activityItems.map((item) => {
                      const isViewsOnly = activityFilter === 'vistas';
                      const moodColor = MOOD_GLOW_COLORS[item.mood] || '#8aa2ff';

                      return (
                      <article
                        className="perfil-v3-activity-card"
                        key={item.id}
                        style={{ '--activity-mood-color': moodColor }}
                      >
                        <div className="perfil-v3-activity-poster">
                          {item.movie?.poster_path ? (
                            <img src={`https://image.tmdb.org/t/p/w500${item.movie.poster_path}`} alt={item.movie.title || 'Película'} />
                          ) : (
                            <div className="perfil-v3-no-poster" aria-label="Poster no disponible">🎞</div>
                          )}
                          <span className="perfil-v3-activity-poster-meta">
                            {item.action}{item.date ? ` · ${formatDate(item.date)}` : ''}
                          </span>
                        </div>
                        <div className="perfil-v3-activity-body">
                          <h3>
                            {item.movie?.title || item.movie?.name || 'Película sin título'}
                            {item.movie?.release_date ? (
                              <span className="perfil-v3-activity-year"> {item.movie.release_date.slice(0, 4)}</span>
                            ) : null}
                          </h3>

                          {!isViewsOnly && (
                            <p className="perfil-v3-activity-meta-line">
                              <span className="perfil-v3-activity-stars" aria-hidden="true">
                                {'★'.repeat(getStarsFromRating(item.rating).full)}
                                {getStarsFromRating(item.rating).hasHalf ? '½' : ''}
                                {'☆'.repeat(getStarsFromRating(item.rating).empty)}
                              </span>
                            </p>
                          )}

                          {!isViewsOnly && (
                            <>
                              <p className="perfil-v3-activity-review-text">
                                {(() => {
                                  const reviewText = item.comment || 'Solo puntuó esta película.';
                                  const isExpanded = Boolean(expandedReviews[item.id]);
                                  const { preview, truncated } = getReviewPreview(reviewText);

                                  if (!truncated) {
                                    return reviewText;
                                  }

                                  return (
                                    <>
                                      {isExpanded ? reviewText : preview}{' '}
                                      <button
                                        type="button"
                                        className="perfil-v3-review-more-btn"
                                        onClick={() => toggleReviewExpanded(item.id)}
                                        aria-expanded={isExpanded}
                                      >
                                        {isExpanded ? 'less' : 'more'}
                                      </button>
                                    </>
                                  );
                                })()}
                              </p>

                              <p className="perfil-v3-activity-likes-line">
                                ❤ {(likesByReviewId.get(item.id) || 0) > 0 ? `${likesByReviewId.get(item.id)} likes` : 'No likes yet'}
                              </p>

                              <span className="perfil-v3-activity-mood-chip">{MOOD_EMOJIS[item.mood] || '🎬'} {item.mood}</span>
                            </>
                          )}
                        </div>
                      </article>
                      );
                    })}
                  </div>
                )}
              </article>
            </section>
          )}

          {activeTab === 'seguidores' && (
            <section className="perfil-v3-tab-panel">
              <article className="perfil-v3-card">
                <div className="perfil-v3-section-head">
                  <h3>Seguidores</h3>
                  <p>Comunidad que sigue este perfil.</p>
                </div>

                {isLoadingFollows ? (
                  <p className="perfil-v3-followers-copy">Cargando seguidores...</p>
                ) : followsError ? (
                  <div className="perfil-v3-empty"><p>{followsError}</p></div>
                ) : (profileFollowersList && profileFollowersList.length > 0) ? (
                  <div className="perfil-v3-follow-grid">
                    {profileFollowersList.map((user) => (
                      <div key={user.id} className="perfil-v3-follow-card">
                        <div className="perfil-v3-follow-main">
                          <div className="perfil-v3-follow-avatar">
                            {user.avatar ? (
                              <img src={user.avatar} alt={user.name || user.username} loading="lazy" />
                            ) : (
                              <div className="perfil-v3-follow-avatar-fallback">{getInitials(user.name || user.username)}</div>
                            )}
                          </div>
                          <div className="perfil-v3-follow-info">
                            <div className="perfil-v3-follow-name">{user.name || user.username}</div>
                            <div className="perfil-v3-follow-username">@{user.username}</div>
                          </div>
                        </div>
                        <div className="perfil-v3-follow-actions">
                          <Link to={`/perfil/${encodeURIComponent(user.id)}`} className="perfil-v3-follow-btn">Ver perfil</Link>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="perfil-v3-empty">
                    <p>
                      Aun no hay seguidores visibles. Completa tu perfil y comparte tus listas para atraer mas personas.
                    </p>
                  </div>
                )}
              </article>
            </section>
          )}

          {activeTab === 'seguidos' && (
            <section className="perfil-v3-tab-panel">
              <article className="perfil-v3-card">
                <div className="perfil-v3-section-head">
                  <h3>Seguidos</h3>
                  <p>Cuentas que sigue este perfil.</p>
                </div>

                {isLoadingFollows ? (
                  <p className="perfil-v3-followers-copy">Cargando seguidos...</p>
                ) : followsError ? (
                  <div className="perfil-v3-empty"><p>{followsError}</p></div>
                ) : (profileFollowingList && profileFollowingList.length > 0) ? (
                  <div className="perfil-v3-follow-grid">
                    {profileFollowingList.map((user) => (
                      <div key={user.id} className="perfil-v3-follow-card">
                        <div className="perfil-v3-follow-main">
                          <div className="perfil-v3-follow-avatar">
                            {user.avatar ? (
                              <img src={user.avatar} alt={user.name || user.username} loading="lazy" />
                            ) : (
                              <div className="perfil-v3-follow-avatar-fallback">{getInitials(user.name || user.username)}</div>
                            )}
                          </div>
                          <div className="perfil-v3-follow-info">
                            <div className="perfil-v3-follow-name">{user.name || user.username}</div>
                            <div className="perfil-v3-follow-username">@{user.username}</div>
                          </div>
                        </div>
                        <div className="perfil-v3-follow-actions">
                          <Link to={`/perfil/${encodeURIComponent(user.id)}`} className="perfil-v3-follow-btn">Ver perfil</Link>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="perfil-v3-empty">
                    <p>
                      Aún no hay cuentas seguidas visibles en este perfil.
                    </p>
                  </div>
                )}
              </article>
            </section>
          )}
        </main>
      </div>
    </div>
  );
}

export default Perfil;



