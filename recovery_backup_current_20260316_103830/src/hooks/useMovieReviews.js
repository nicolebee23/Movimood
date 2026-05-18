import { useCallback, useState } from 'react';

const STORAGE_KEY = 'movimood-movie-reviews';
const PROFILE_STORAGE_KEY = 'movimood-local-profile-id';
const SESSION_KEY = 'movimood-session-user';

function loadStoredReviews() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

function buildId() {
  if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
    return crypto.randomUUID();
  }
  return `${Date.now()}-${Math.floor(Math.random() * 100000)}`;
}

function getOrCreateProfileId() {
  try {
    const existing = localStorage.getItem(PROFILE_STORAGE_KEY);
    if (existing) {
      return existing;
    }

    const next = buildId();
    localStorage.setItem(PROFILE_STORAGE_KEY, next);
    return next;
  } catch {
    return 'local-profile';
  }
}

function getSessionProfileId() {
  try {
    const rawSession = localStorage.getItem(SESSION_KEY);
    if (!rawSession) {
      return null;
    }

    const sessionUser = JSON.parse(rawSession);
    return sessionUser?.id || null;
  } catch {
    return null;
  }
}

function sortByNewest(items) {
  return [...items].sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
}

export function useMovieReviews() {
  const [reviews, setReviews] = useState(loadStoredReviews);
  const currentProfileId = getSessionProfileId() || getOrCreateProfileId();

  const addMovieReview = useCallback((movieId, payload) => {
    setReviews((prev) => {
      const now = new Date().toISOString();
      const existing = prev.find(
        (review) => review.movieId === movieId && (review.profileId === currentProfileId || !review.profileId)
      );
      const nextReview = {
        id: existing?.id || buildId(),
        movieId,
        profileId: currentProfileId,
        movie: payload.movie || existing?.movie || null,
        mood: payload.mood || existing?.mood || null,
        author: (payload.author || '').trim(),
        rating: Number(payload.rating) || 5,
        comment: (payload.comment || '').trim(),
        createdAt: existing?.createdAt || now,
        updatedAt: now,
      };
      const next = existing
        ? prev.map((review) =>
            review.id === existing.id ? nextReview : review
          )
        : [...prev, nextReview];
      localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
      return next;
    });
  }, [currentProfileId]);

  const removeMovieReview = useCallback((reviewId) => {
    setReviews((prev) => {
      const next = prev.filter((review) => review.id !== reviewId);
      localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
      return next;
    });
  }, []);

  const getMovieReviewByProfile = useCallback(
    (movieId, profileId = currentProfileId) =>
      sortByNewest(
        reviews.filter(
          (review) => review.movieId === movieId && (review.profileId === profileId || (!review.profileId && profileId === currentProfileId))
        )
      )[0] || null,
    [currentProfileId, reviews]
  );

  const getReviewsByProfile = useCallback(
    (profileId = currentProfileId) =>
      sortByNewest(
        reviews.filter(
          (review) => review.profileId === profileId || (!review.profileId && profileId === currentProfileId)
        )
      ),
    [currentProfileId, reviews]
  );

  // Backward-compatible alias used by stale HMR bundles.
  const getAllReviews = useCallback(
    () => getReviewsByProfile(currentProfileId),
    [currentProfileId, getReviewsByProfile]
  );

  return {
    currentProfileId,
    addMovieReview,
    removeMovieReview,
    getMovieReviewByProfile,
    getReviewsByProfile,
    getAllReviews,
  };
}
