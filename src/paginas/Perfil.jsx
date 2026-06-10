import { useEffect, useMemo, useState } from 'react';
import { Link, Navigate, useParams, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import { useFavoritos, LISTAS } from '../hooks/useFavoritos';
import { useMovieReviews } from '../hooks/useMovieReviews';
import { hasApiBaseUrl, requestJson } from '../utils/movimoodApi';
import { genreIdToName } from '../utils/recommendations';
import useReviewLikes from '../hooks/useReviewLikes';
import './Perfil.css';
import './Likes.css';
import WizardSidebar from '../componentes/WizardSidebar';
import perfilMovimoodCover from '../assets/perfil-movimood-cover.png';
import { Heart, User, Users, Film, Star } from 'lucide-react';
import { normalizeMoodName, getQuestionnaireMoods, getMoodDisplayName, getUniqueMoods } from '../utils/moods';

const PROFILE_FAVORITES_KEY = 'movimood-profile-favorites';
const REVIEW_LIKES_KEY = 'movimood-review-likes';
const FAVORITOS_STORAGE_KEY = 'movimood-favoritos';
const MAX_PROFILE_FAVORITES = 4;
const REVIEW_PREVIEW_MAX_CHARS = 220;

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

function getMovieGenreNames(movie) {
  if (!movie) {
    return [];
  }

  if (Array.isArray(movie.genre_ids) && movie.genre_ids.length) {
    const mapped = movie.genre_ids
      .map((id) => genreIdToName[id] || genreIdToName[Number(id)])
      .filter(Boolean);
    if (mapped.length > 0) {
      return mapped;
    }
  }

  if (Array.isArray(movie.genres) && movie.genres.length) {
    const mapped = movie.genres
      .map((genre) => (typeof genre === 'string' ? genre : (genre && (genre.name || genre.title)) || null))
      .filter(Boolean);
    if (mapped.length > 0) {
      return mapped;
    }
  }

  if (movie.genre_names && typeof movie.genre_names === 'string') {
    const mapped = movie.genre_names.split(',').map((part) => part.trim()).filter(Boolean);
    if (mapped.length > 0) {
      return mapped;
    }
  }

  if (movie.genres && typeof movie.genres === 'string') {
    const mapped = movie.genres.split(',').map((part) => part.trim()).filter(Boolean);
    if (mapped.length > 0) {
      return mapped;
    }
  }

  return [];
}

function MovieGenreLabel({ movie }) {
  const movieId = movie?.id || movie?.tmdb_id || movie?.movie_id || null;
  const [genres, setGenres] = useState(() => getMovieGenreNames(movie));

  useEffect(() => {
    let cancelled = false;
    const localGenres = getMovieGenreNames(movie);
    if (localGenres.length > 0) {
      setGenres(localGenres);
      return undefined;
    }

    if (!movieId) {
      setGenres([]);
      return undefined;
    }

    requestJson('/tmdb-movie.php', { params: { id: movieId } })
      .then((data) => {
        if (cancelled) {
          return;
        }
        const remoteGenres = getMovieGenreNames(data);
        setGenres(remoteGenres);
      })
      .catch(() => {
        if (!cancelled) {
          setGenres([]);
        }
      });

    return () => {
      cancelled = true;
    };
  }, [movieId, movie]);

  return (
    <span className="likes-review-genres">
      {genres.length > 0 ? genres.slice(0, 2).join(' · ') : 'Sin género'}
    </span>
  );
}

function StatCard({ onClick, Icon, label, value, ariaLabel, disabled }) {
  return (
    <button
      type="button"
      className="perfil-v3-card perfil-v3-stat-card perfil-v3-stat-card-interactive"
      onClick={onClick}
      aria-label={ariaLabel}
      disabled={disabled}
    >
      <div className="perfil-v3-stat-head">
        <span className="perfil-v3-stat-icon" aria-hidden="true">
          {Icon ? <Icon size={18} color="#00e5ff" style={{ filter: 'drop-shadow(0 0 8px rgba(0,229,255,0.20))' }} aria-hidden="true" /> : null}
        </span>
        <span>{label}</span>
      </div>
      <strong>{value}</strong>
    </button>
  );
}

function ReviewRow({ item, movieGenresCache, likesByReviewId, likedReviewIds, reviewLikes, currentUserId, isOwnProfile, onLikeChange, navigate, location }) {
  const movie = item.movie || {};
  const poster = movie.poster_path ? `https://image.tmdb.org/t/p/w92${movie.poster_path}` : null;
  const likeCount = reviewLikes.counts[String(item.id)] || likesByReviewId.get(item.id) || 0;
  const year = movie.release_date ? movie.release_date.slice(0, 4) : (movie.first_air_date ? movie.first_air_date.slice(0, 4) : '');
  const stars = getStarsFromRating(item.rating);
  const isLiked = likedReviewIds.has(String(item.id));
  const reviewOwnerId = item.user_id ?? item.userId ?? null;
  const isOwnReview = Boolean(currentUserId && (String(reviewOwnerId) === String(currentUserId) || isOwnProfile));
  const canLike = Boolean(currentUserId) && !isOwnReview;

  async function handleToggleLike() {
    if (!currentUserId) {
      navigate(`/login?returnTo=${encodeURIComponent(location.pathname + location.search)}`);
      return;
    }

    if (!canLike) {
      return;
    }

    try {
      if (isLiked) {
        await reviewLikes.unlike(item.id);
        onLikeChange(item.id, false);
      } else {
        await reviewLikes.toggleLike(item.id);
        onLikeChange(item.id, true);
      }
    } catch (e) {
      if (e && e.status === 401) {
        navigate(`/login?returnTo=${encodeURIComponent(location.pathname + location.search)}`);
      }
    }
  }

  return (
    <article className="likes-review-row" key={item.id}>
      {poster ? (
        <div className="likes-review-poster"><img src={poster} alt={movie.title || movie.name} /></div>
      ) : (
        <div className="likes-review-poster poster-placeholder-small">Sin poster</div>
      )}

      <div className="likes-review-body">
        <div className="likes-review-header">
          <div className="likes-review-title-block">
            <span className="likes-review-movie">{movie.title || movie.name}</span>
            <div className="likes-review-subline">
              <span className="likes-review-year">{year}</span>
              <MovieGenreLabel movie={movie} />
            </div>
          </div>
          <div className="likes-review-meta-top">
            <span className="likes-review-stars" aria-hidden>
              {Array(stars.full).fill('★').join('')}{stars.hasHalf ? '½' : ''}{Array(stars.empty).fill('☆').join('')}
            </span>
          </div>
        </div>
        <p className="likes-review-text">{(item.comment || '').slice(0, REVIEW_PREVIEW_MAX_CHARS)}</p>
      </div>

      <div className="likes-review-meta">
        <button
          type="button"
          className={`videoteca-review-like-btn${isLiked ? ' liked' : ''}`}
          aria-label={
            !currentUserId
              ? `Inicia sesión para dar like a la reseña de ${movie.title || movie.name}`
              : isOwnReview
                ? 'No puedes dar like a tu propia reseña'
                : isLiked
                  ? `Quitar like a la reseña de ${movie.title || movie.name}`
                  : `Dar like a la reseña de ${movie.title || movie.name}`
          }
          onClick={handleToggleLike}
          disabled={isOwnReview}
        >
          <span className="videoteca-review-card-heart" aria-hidden>♥</span>
          <span className="videoteca-review-like-count">{likeCount}</span>
        </button>

        <div className="likes-review-meta-bottom">
          <span className="likes-review-date">{formatDate(item.date)}</span>
        </div>
      </div>
    </article>
  );
}

function movieKey(movieId) {
  if (movieId === null || movieId === undefined) {
    return '';
  }
  return String(movieId);
}

// Use shared mood utilities from ../utils/moods

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
  const { currentUser, getUserById, updateCurrentUser } = useAuth();
  const location = useLocation();
  const query = new URLSearchParams(location.search);
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
  const [isFollowLoading, setIsFollowLoading] = useState(true);
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
  const [remoteUser, setRemoteUser] = useState(null);

  const resolvedProfileId = routeProfileId || query.get('user_id') || currentUser?.id || null;
const viewedUser = resolvedProfileId
  ? (getUserById(resolvedProfileId) || remoteUser || (currentUser?.id === resolvedProfileId ? currentUser : null))
  : null;
  const isOwnProfile = Boolean(currentUser?.id && viewedUser?.id === currentUser.id);

  const myReviews = getReviewsByProfile(resolvedProfileId || undefined);
  const profileStoredReviews = useMemo(() => loadReviewsFromStorage(viewedUser?.id || resolvedProfileId || null), [viewedUser?.id, resolvedProfileId]);
useEffect(() => {
  if (!resolvedProfileId || getUserById(resolvedProfileId) || currentUser?.id === resolvedProfileId) {
    setRemoteUser(null);
    return;
  }
  let cancelled = false;
  requestJson('movimood.php', {
    params: { resource: 'profile', user_id: resolvedProfileId }
  })
    .then(data => {
      if (!cancelled) setRemoteUser(data?.user || null);
    })
    .catch(() => {
      if (!cancelled) setRemoteUser(null);
    });
  return () => { cancelled = true; };
}, [resolvedProfileId, currentUser?.id]);

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
      setIsFollowLoading(false);
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
        setIsFollowLoading(false);
      })
      .catch(() => {
        if (!cancelled) {
          setIsFollowingProfile(false);
          setIsFollowLoading(false);
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
    const previousFollowingCount = Number(
      currentUser?.followingCount ?? currentUser?.seguidosCount ?? currentUser?.following?.length ?? 0
    );
    const nextFollowingCount = previousFollowing ? Math.max(0, previousFollowingCount - 1) : previousFollowingCount + 1;

    setIsFollowingProfile(!previousFollowing);
    setProfileFollowersCount(previousFollowing ? Math.max(0, previousFollowersCount - 1) : previousFollowersCount + 1);

    if (currentUser) {
      const currentFollowing = Array.isArray(currentUser.following) ? currentUser.following : [];
      const nextFollowing = previousFollowing
        ? currentFollowing.filter((user) => String(user?.id) !== String(viewedUser.id))
        : [
            ...currentFollowing,
            {
              id: viewedUser.id,
              username: viewedUser.username || viewedUser.name || 'usuario',
              name: viewedUser.name || viewedUser.username || 'Usuario',
              avatar: viewedUser.avatar || '',
            },
          ];

      updateCurrentUser({
        followingCount: nextFollowingCount,
        seguidosCount: nextFollowingCount,
        following: nextFollowing,
      });
    }

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

      if (currentUser) {
        updateCurrentUser({
          followingCount: previousFollowingCount,
          seguidosCount: previousFollowingCount,
          following: Array.isArray(currentUser.following) ? currentUser.following : [],
        });
      }

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

    activeFavorites
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
  }, [activeFavorites]);

  const watchedFavorites = useMemo(
    () => activeFavorites.filter((fav) => fav.lista === LISTAS.YA_VISTA && fav.movie?.id),
    [activeFavorites]
  );

  // Count moods from movies marked as "YA_VISTA" (watched favorites)
  // Use SAME LOGIC as Videoteca: prefer review mood, then questionnaire mood
  const moodStats = useMemo(() => {
    const moodKeys = Object.keys(MOOD_EMOJIS);
    const counts = moodKeys.reduce((accumulator, mood) => {
      accumulator[mood] = 0;
      return accumulator;
    }, {});

    // Build maps for quick lookup
    const reviewsByMovieId = new Map();
    if (Array.isArray(activeReviews)) {
      activeReviews.forEach((review) => {
        if (review?.movieId) {
          reviewsByMovieId.set(review.movieId, review);
        }
      });
    }

    // Count each watched favorite exactly once
    watchedFavorites.forEach((fav) => {
      const movieId = fav?.movie?.id;
      if (!movieId) {
        return;
      }

      // Try to get mood from review first
      const review = reviewsByMovieId.get(movieId);
      if (review && review.mood) {
        const normalizedReviewMood = normalizeMoodName(review.mood);
        if (normalizedReviewMood && normalizedReviewMood in counts) {
          counts[normalizedReviewMood] += 1;
          return;
        }
      }

      // If no review mood, use questionnaire mood (getQuestionnaireMoods already normalizes)
      const questionnaireMoods = getQuestionnaireMoods(fav?.questionnaire);
      if (questionnaireMoods.length > 0) {
        // Count ALL moods from questionnaire (same logic as Videoteca)
        questionnaireMoods.forEach((mood) => {
          if (mood in counts) {
            counts[mood] += 1;
          }
        });
      }
    });

    return counts;
  }, [watchedFavorites, activeReviews]);

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
    const topTitles = watchedActivity
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
  }, [moodRadarData, selectedRadarMood, watchedActivity]);

  const moviesSeenCount = useMemo(() => {
    const seenIds = new Set();

    activeFavorites.forEach((fav) => {
      if (fav.lista === LISTAS.YA_VISTA && fav.movie?.id) {
        seenIds.add(fav.movie.id);
      }
    });

    return seenIds.size;
  }, [activeFavorites]);
  const [movieGenresCache, setMovieGenresCache] = useState({});
  const navigate = useNavigate();
  const reviewLikes = useReviewLikes();
  const { fetchUserLikedReviews } = reviewLikes;
  const [likesByReviewId, setLikesByReviewId] = useState(() => loadReviewLikesByReviewId());
  const [likedReviewIds, setLikedReviewIds] = useState(new Set());
  const [profileLikedReviewsCount, setProfileLikedReviewsCount] = useState(0);

  useEffect(() => {
    let cancelled = false;
    async function loadLikedReviews() {
      if (!currentUser?.id || !hasApiBaseUrl()) {
        if (!cancelled) {
          setLikedReviewIds(new Set());
        }
        return;
      }

      try {
        const items = await fetchUserLikedReviews();
        if (!cancelled) {
          setLikedReviewIds(new Set((Array.isArray(items) ? items : []).map((item) => String(item.reviewId))));
        }
      } catch (e) {
        if (!cancelled) {
          setLikedReviewIds(new Set());
        }
      }
    }

    loadLikedReviews();
    return () => { cancelled = true; };
  }, [currentUser?.id, fetchUserLikedReviews]);

  function updateLikedReviewState(reviewId, liked) {
    setLikedReviewIds((prev) => {
      const next = new Set(prev);
      if (liked) {
        next.add(String(reviewId));
      } else {
        next.delete(String(reviewId));
      }
      return next;
    });
  }

  // Keep likesByReviewId in sync with localStorage fallback and reviewLikes.counts
  useEffect(() => {
    // update from hook counts first
    try {
      setLikesByReviewId(loadReviewLikesByReviewId());
    } catch (e) {
      // ignore
    }

    const onStorage = (ev) => {
      if (ev.key === REVIEW_LIKES_KEY || ev.key === null) {
        setLikesByReviewId(loadReviewLikesByReviewId());
      }
    };

    window.addEventListener('storage', onStorage);

    return () => window.removeEventListener('storage', onStorage);
  }, [reviewLikes.counts]);

  // Load count of reviews this profile has liked (public) or current user's liked reviews
  useEffect(() => {
    let cancelled = false;

    async function loadLikedCount() {
      if (!viewedUser?.id) {
        setProfileLikedReviewsCount(0);
        return;
      }

      try {
        if (isOwnProfile) {
          const items = await fetchUserLikedReviews();
          if (!cancelled) setProfileLikedReviewsCount(Array.isArray(items) ? items.length : 0);
        } else {
          const resp = await requestJson('movimood.php', { params: { resource: 'review-likes', user_id: viewedUser.id } });
          const items = Array.isArray(resp?.items) ? resp.items : [];
          if (!cancelled) setProfileLikedReviewsCount(items.length);
        }
      } catch (e) {
        if (!cancelled) setProfileLikedReviewsCount(0);
      }
    }

    loadLikedCount();

    return () => { cancelled = true; };
  }, [viewedUser?.id, isOwnProfile, fetchUserLikedReviews]);
  const backToProfile = viewedUser?.id ? `/perfil/${encodeURIComponent(viewedUser.id)}` : (resolvedProfileId ? `/perfil/${encodeURIComponent(resolvedProfileId)}` : '/perfil');

  useEffect(() => {
    if (location.state?.resetTab === 'general') {
      setActiveTab('general');
      navigate(location.pathname, { replace: true, state: {} });
    }
  }, [location.pathname, location.state, navigate]);
  const likesCount = useMemo(() => {
      // count only favorite movies marked as 'imprescindible'
      const movieIds = new Set();
      (Array.isArray(activeFavorites) ? activeFavorites : []).forEach((fav) => {
        if (!fav || !fav.movie || !fav.movie.id) return;
        if (!fav.flags?.imprescindible) return;
        movieIds.add(fav.movie.id);
      });

      const moviesTotal = movieIds.size;

      // count reviews that this profile has liked
      const reviewsTotal = Number(profileLikedReviewsCount || 0);

      return moviesTotal + reviewsTotal;
    }, [profileLikedReviewsCount, activeFavorites]);
  const followingCount = Number(
    viewedUser?.followingCount || viewedUser?.seguidosCount || viewedUser?.following?.length || 0
  );
  const followersCount = Number(profileFollowersCount ?? viewedUser?.followersCount ?? 0);

  const likedActivity = useMemo(
    () => recentActivity.filter((item) => (likesByReviewId.get(item.id) || 0) > 0),
    [likesByReviewId, recentActivity]
  );

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

  // Fetch genres for movies that don't include them in the activity payload.
  useEffect(() => {
    const idsToFetch = Array.from(new Set(
      activityItems
        .map((it) => it.movie && (it.movie.id || it.movie.tmdb_id || it.movie.movie_id))
        .filter(Boolean)
        .filter((id) => !movieGenresCache[id])
    ));

    if (idsToFetch.length === 0) return;

    let cancelled = false;

    Promise.all(idsToFetch.map((id) =>
      requestJson('/tmdb-movie.php', { params: { id } })
        .then((data) => {
          const names = (data && data.genres && Array.isArray(data.genres))
            ? data.genres.map((g) => (typeof g === 'string' ? g : g.name)).filter(Boolean)
            : [];
          return [id, names];
        })
        .catch(() => [id, []])
    ))
      .then((pairs) => {
        if (cancelled) return;
        setMovieGenresCache((prev) => {
          const copy = { ...prev };
          pairs.forEach(([id, names]) => { copy[id] = names; });
          return copy;
        });
      });

    return () => { cancelled = true; };
  }, [activityItems, movieGenresCache]);

  function openMetricDestination(metric) {
    if (metric === 'seguidos') {
      try {
        if (isOwnProfile) {
          navigate('/seguidos');
        } else if (viewedUser?.id) {
          navigate(`/seguidos?user_id=${encodeURIComponent(viewedUser.id)}`);
        } else {
          navigate('/seguidos');
        }
        return;
      } catch (e) {
        setActiveTab('seguidos');
        return;
      }
    }

    if (metric === 'seguidores') {
      try {
        if (isOwnProfile) {
          navigate('/seguidores');
        } else if (viewedUser?.id) {
          navigate(`/seguidores?user_id=${encodeURIComponent(viewedUser.id)}`);
        } else {
          navigate('/seguidores');
        }
        return;
      } catch (e) {
        setActiveTab('seguidores');
        return;
      }
    }

    setActiveTab('actividad');
    setActivityMoodFilter('all');

    if (metric === 'likes') {
      // open dedicated Likes page for viewed user (or own likes if own profile)
      try {
        if (isOwnProfile) {
          navigate('/likes');
        } else if (viewedUser?.id) {
          navigate(`/likes?user_id=${encodeURIComponent(viewedUser.id)}`);
        } else {
          navigate('/likes');
        }
        return;
      } catch (e) {
        // fallback to current behavior
        setActivityFilter('likes');
        return;
      }
    }

    if (metric === 'vistas') {
      try {
        if (isOwnProfile) {
          navigate('/vistas');
        } else if (viewedUser?.id) {
          navigate(`/vistas?user_id=${encodeURIComponent(viewedUser.id)}`);
        } else {
          navigate('/vistas');
        }
        return;
      } catch (e) {
        setActivityFilter('vistas');
        return;
      }
    }

    if (metric === 'resenas') {
      setActivityFilter('resenas');
      return;
    }

    setActivityFilter('all');
  }

  function openMoodActivity(mood) {
    navigate(`/videoteca?view=ya-vistas&mood=${encodeURIComponent(mood)}`);
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
    <div className="home-page perfil-page perfil-v3-page">
      <WizardSidebar
        activeLabel="Perfil"
        footerText="Tu perfil"
        sidebarClassName={!isOwnProfile && activeTab === 'actividad' ? 'perfil-activity-sidebar' : ''}
      />

      <main className="home-main perfil-v3-content likes-page">
          {activeTab === 'general' && (
            <section className="perfil-v3-tab-panel">
              {isOwnProfile && !moodRadarData.hasData && (
                <article className="perfil-v3-card perfil-v3-radar-callout">
                  <div className="perfil-v3-section-head">
                    <h3>Activa tu Mood Radar</h3>
                    <p>Empieza a entrenar tu perfil con tu actividad.</p>
                  </div>
                  <p className="perfil-v3-radar-callout-copy">
                    El radar se rellena cuando marcas películas como ya vistas desde tu videoteca. Si no quieres escribir,
                    puedes guardar solo una puntuación y el mood quedará registrado igualmente.
                  </p>
                  <div className="perfil-v3-radar-callout-actions">
                    <Link to="/videoteca" className="perfil-v3-link-main">Ir a videoteca</Link>
                  </div>
                </article>
              )}

              {/* Page hero cover: full-width background image that sits behind the content */}
              <div
                className="perfil-v3-page-cover likes-hero"
                style={{
                  backgroundImage: "url('/assets/perfil/perfil-movimood-cover.png')",
                  backgroundRepeat: 'no-repeat',
                  backgroundSize: 'cover',
                  backgroundPosition: 'center',
                }}
              >
                <picture>
                  <source srcSet="/assets/perfil/perfil-movimood-cover.webp" type="image/webp" />
                  <source srcSet="/assets/perfil/perfil-movimood-cover.png" type="image/png" />
                  <img
                    className="perfil-v3-page-cover-image"
                    src={perfilMovimoodCover}
                    onError={(e) => { e.currentTarget.style.display = 'none'; }}
                    alt=""
                    aria-hidden="true"
                  />
                </picture>
                <div className="perfil-v3-page-cover-shade" aria-hidden="true" />

                {/* Hero copy positioned like Likes */}
                <div className="likes-hero-copy" aria-hidden="false">
                  <div className="perfil-v3-hero-title-row">
                    <h1 className="likes-title">{isOwnProfile ? 'Mi perfil' : viewedUser?.name}</h1>
                    {!isOwnProfile && currentUser?.id && (
                      <div className="perfil-v3-hero-inline-actions" aria-hidden="false">
                        {!isBlockedProfile && (
                          <button
                            type="button"
                            className={`perfil-v3-follow-btn${isFollowingProfile ? ' is-following' : ''}`}
                            onClick={handleToggleFollow}
                            disabled={isFollowSaving || isFollowLoading}
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
                      </div>
                    )}
                  </div>
                  {viewedUser?.username && <p className="likes-subtitle">@{viewedUser.username}</p>}
                  {/* Pestañas eliminadas por solicitud (Todo / Películas / Reseñas) */}
                {!isOwnProfile && (
                  <div className="likes-hero-actions-bottom">
                    <Link to={currentUser?.id ? `/perfil/${encodeURIComponent(currentUser.id)}` : '/perfil'} className="volver-perfil">← Volver al perfil</Link>
                  </div>
                )}
                </div>
              </div>

              {blockError && (
                <div className="perfil-v3-error-message" style={{ color: 'red', fontSize: '14px', marginTop: '5px' }}>
                  {blockError}
                </div>
              )}

              <section className="perfil-v3-stats-grid">
                {[
                  { key: 'likes', label: 'Likes', Icon: Heart, value: likesCount, onClick: () => openMetricDestination('likes') },
                  { key: 'seguidos', label: 'Seguidos', Icon: User, value: followingCount, onClick: () => openMetricDestination('seguidos') },
                  { key: 'seguidores', label: 'Seguidores', Icon: Users, value: followersCount, onClick: () => openMetricDestination('seguidores') },
                  { key: 'vistas', label: 'Películas vistas', Icon: Film, value: moviesSeenCount, onClick: () => openMetricDestination('vistas') },
                  { key: 'resenas', label: 'Reseñas', Icon: Star, value: activeReviews.length, onClick: () => openMetricDestination('resenas') },
                ].map((s) => (
                  <StatCard key={s.key} Icon={s.Icon} label={s.label} value={s.value} onClick={s.onClick} />
                ))}
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
                              <span>{MOOD_EMOJIS[mood]} {getMoodDisplayName(mood)}</span>
                              <strong>{moodRadarData.counts[index]}</strong>
                            </button>
                          </li>
                        ))}
                      </ul>

                      {selectedRadarMoodInfo && (
                        <div className="perfil-v3-radar-detail">
                          <p className="perfil-v3-radar-detail-title">
                            Mood activo: {MOOD_EMOJIS[selectedRadarMoodInfo.mood]} {getMoodDisplayName(selectedRadarMoodInfo.mood)}
                          </p>
                          <p className="perfil-v3-radar-detail-copy">
                            {selectedRadarMoodInfo.count} película(s) vistas, {selectedRadarMoodInfo.percentage}% de tu radar.
                          </p>
                          {selectedRadarMoodInfo.topTitles.length > 0 && (
                            <p className="perfil-v3-radar-detail-copy">
                              Ejemplos: {selectedRadarMoodInfo.topTitles.join(', ')}.
                            </p>
                          )}
                          {isOwnProfile && (
                            <button
                              type="button"
                              className="perfil-v3-radar-detail-btn"
                              onClick={() => openMoodActivity(selectedRadarMoodInfo.mood)}
                            >
                              Ver películas vistas de este mood
                            </button>
                          )}
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
                        Tu Mood Radar se activa cuando marcas películas como ya vistas desde la videoteca.
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
                    <div className="perfil-v3-favorites-empty">
                      <div className="perfil-v3-favorites-empty-stack" role="img" aria-label="Sin favoritas">
                        <div className="fav-stack">
                          <div className="fav-card fav-card-back" />
                          <div className="fav-card fav-card-mid" />
                          <div className="fav-card fav-card-front">
                            <svg width="64" height="64" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
                              <path d="M3 7h5l2-3 4 3h5v10a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V7z" stroke="#9be8ff" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round" opacity="0.95"/>
                              <path d="M7 21V9" stroke="#9be8ff" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round" opacity="0.95"/>
                            </svg>
                          </div>
                        </div>
                      </div>
                      <p className="perfil-v3-empty-copy">Todavía no hay favoritas fijadas en este perfil.</p>
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
                            <strong>{MOOD_EMOJIS[collection.mood]} {getMoodDisplayName(collection.mood)}</strong>
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
                        {MOOD_EMOJIS[collection.mood]} {getMoodDisplayName(collection.mood)} ({collection.count})
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
                  // If filtering by reviews, render using Likes-style review list for consistent appearance
                  activityFilter === 'resenas' ? (
                    <div className="perfil-resenas-hero-wrap">
                      <div className="perfil-v3-page-cover likes-hero" style={{ marginBottom: '18px' }}>
                        <picture>
                          <source srcSet={perfilMovimoodCover} type="image/png" />
                          <img className="perfil-v3-page-cover-image" src={perfilMovimoodCover} alt="" aria-hidden="true" />
                        </picture>
                        <div className="perfil-v3-page-cover-shade" aria-hidden="true" />
                        <div className="likes-hero-copy">
                          <h1 className="likes-title">
                            <span className="likes-neon-heart" aria-hidden>
                              <svg width="22" height="22" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden>
                                <path d="M12 17.27L18.18 21l-1.64-7.03L22 9.24l-7.19-.61L12 2 9.19 8.63 2 9.24l5.46 4.73L5.82 21z" stroke="#42e6ff" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" fill="none" />
                              </svg>
                            </span>
                            Reseñas
                          </h1>
                          <p className="likes-subtitle">Últimas reseñas publicadas en este perfil.</p>
                          <div className="likes-hero-actions-bottom">
                            <Link
                              to={backToProfile}
                              className="volver-perfil"
                              onClick={(e) => { e.preventDefault(); navigate(backToProfile, { state: { resetTab: 'general' } }); }}
                            >
                              ← Volver al perfil
                            </Link>
                          </div>
                        </div>
                      </div>
                      <section className="likes-section">
                      <div className="section-header">
                        <h2>Reseñas</h2>
                        {isOwnProfile ? null : (
                          <Link
                            to={backToProfile}
                            className="volver-perfil"
                            onClick={(e) => { e.preventDefault(); navigate(backToProfile, { state: { resetTab: 'general' } }); }}
                          >
                            ← Volver al perfil
                          </Link>
                        )}
                      </div>
                      <div className="likes-reviews-list">
                        {activityItems.map((item) => (
                          <ReviewRow
                            key={item.id}
                            item={item}
                            movieGenresCache={movieGenresCache}
                            likesByReviewId={likesByReviewId}
                            likedReviewIds={likedReviewIds}
                            reviewLikes={reviewLikes}
                            currentUserId={currentUser?.id}
                            isOwnProfile={isOwnProfile}
                            onLikeChange={updateLikedReviewState}
                            navigate={navigate}
                            location={location}
                          />
                        ))}
                      </div>
                    </section>
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
                                  <button
                                    type="button"
                                    className="perfil-v3-like-btn"
                                    onClick={async () => {
                                      try {
                                        await reviewLikes.toggleLike(item.id);
                                      } catch (e) {
                                        if (e && e.status === 401) {
                                          navigate(`/login?returnTo=${encodeURIComponent(location.pathname + location.search)}`);
                                        }
                                      }
                                    }}
                                    aria-label="Dar like a reseña"
                                  >
                                    ❤ {(reviewLikes.counts[String(item.id)] || likesByReviewId.get(item.id) || 0) > 0
                                      ? `${reviewLikes.counts[String(item.id)] || likesByReviewId.get(item.id)} likes`
                                      : 'No likes yet'}
                                  </button>
                                </p>

                                <span className="perfil-v3-activity-mood-chip">{MOOD_EMOJIS[item.mood] || '🎬'} {item.mood}</span>
                              </>
                            )}
                          </div>
                        </article>
                        );
                      })}
                    </div>
                  )
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
  );
}

export default Perfil;



