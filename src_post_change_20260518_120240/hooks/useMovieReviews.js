import { useCallback, useEffect, useState } from 'react';
import { useAuth } from './useAuth';
import { hasApiBaseUrl, requestJson } from '../utils/movimoodApi';

const STORAGE_KEY = 'movimood-movie-reviews';
const PROFILE_STORAGE_KEY = 'movimood-local-profile-id';
const SESSION_KEY = 'movimood-session-user';
const REVIEW_CHANGE_EVENT = 'movimood-reviews-change';

function loadStoredReviews() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

function getStoredReviewsRaw() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    const parsed = raw ? JSON.parse(raw) : [];
    return Array.isArray(parsed) ? parsed : [];
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
  const { currentUser } = useAuth();
  const currentProfileId = currentUser?.id || getSessionProfileId() || getOrCreateProfileId();

  useEffect(() => {
    const syncFromStorage = () => {
      setReviews(loadStoredReviews());
    };

    window.addEventListener(REVIEW_CHANGE_EVENT, syncFromStorage);
    window.addEventListener('storage', syncFromStorage);

    return () => {
      window.removeEventListener(REVIEW_CHANGE_EVENT, syncFromStorage);
      window.removeEventListener('storage', syncFromStorage);
    };
  }, []);

  useEffect(() => {
    if (!hasApiBaseUrl() || !currentProfileId) {
      return;
    }

    let cancelled = false;

    void requestJson('movimood.php', {
      params: { resource: 'reviews', user_id: currentProfileId },
    })
      .then((response) => {
        if (cancelled || !Array.isArray(response?.items)) {
          return;
        }

        const remoteReviews = sortByNewest(response.items);
        const localReviews = sortByNewest(getStoredReviewsRaw());

        if (remoteReviews.length > 0) {
          setReviews(remoteReviews);
          localStorage.setItem(STORAGE_KEY, JSON.stringify(remoteReviews));
          return;
        }

        if (localReviews.length > 0) {
          setReviews(localReviews);

          void Promise.all(localReviews.map((review) => requestJson('movimood.php', {
            params: { resource: 'reviews' },
            method: 'POST',
            body: {
              ...review,
              userId: review.userId || currentProfileId,
            },
          }))).then(() => {
            void requestJson('movimood.php', { params: { resource: 'reviews', user_id: currentProfileId } })
              .then((syncResponse) => {
                if (cancelled || !Array.isArray(syncResponse?.items)) {
                  return;
                }

                const hydratedReviews = sortByNewest(syncResponse.items);
                if (hydratedReviews.length > 0) {
                  setReviews(hydratedReviews);
                  localStorage.setItem(STORAGE_KEY, JSON.stringify(hydratedReviews));
                }
              })
              .catch(() => {});
          }).catch(() => {});
          return;
        }

        // Keep existing state/local cache when API has no data.
      })
      .catch(() => {});

    return () => {
      cancelled = true;
    };
  }, [currentProfileId]);

  useEffect(() => {
    if (!hasApiBaseUrl() || !currentUser?.id) {
      return;
    }

    let cancelled = false;
    const currentUserId = String(currentUser.id);

    void requestJson('movimood.php', {
      params: { resource: 'reviews', user_id: currentUserId },
    })
      .then((response) => {
        if (cancelled || !Array.isArray(response?.items)) {
          return;
        }

        const remoteReviews = sortByNewest(response.items);
        if (remoteReviews.length > 0) {
          setReviews(remoteReviews);
          localStorage.setItem(STORAGE_KEY, JSON.stringify(remoteReviews));
        }
      })
      .catch(() => {});

    return () => {
      cancelled = true;
    };
  }, [currentUser?.id]);

  const addMovieReview = useCallback((movieId, payload) => {
    const now = new Date().toISOString();
    const ratingValue = Math.max(1, Math.min(10, Number(payload.rating) || 5));
    const reviewUserId = payload.userId || currentProfileId || getOrCreateProfileId();
    const existing = reviews.find(
      (review) => review.movieId === movieId && (review.profileId === currentProfileId || !review.profileId)
    );

    const nextReview = {
      id: existing?.id || buildId(),
      movieId,
      profileId: reviewUserId,
      movie: payload.movie || existing?.movie || null,
      mood: payload.mood || existing?.mood || null,
      author: (payload.author || '').trim(),
      rating: ratingValue,
      comment: (payload.comment || '').trim(),
      createdAt: existing?.createdAt || now,
      updatedAt: now,
      userId: reviewUserId,
    };

    const nextState = reviews.some((review) => review.id === nextReview.id)
      ? reviews.map((review) => (review.id === nextReview.id ? nextReview : review))
      : [...reviews, nextReview];

    setReviews(nextState);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(nextState));
    window.dispatchEvent(new Event(REVIEW_CHANGE_EVENT));

    if (!hasApiBaseUrl()) {
      return { review: nextReview, savePromise: Promise.resolve({ items: nextState || [] }) };
    }

    console.debug('Guardando reseña en servidor', { nextReview, currentUser, currentProfileId });

    const reviewPayload = {
      id: nextReview.id,
      movieId: nextReview.movieId,
      movie: nextReview.movie,
      mood: nextReview.mood,
      author: nextReview.author,
      rating: nextReview.rating,
      comment: nextReview.comment,
      createdAt: nextReview.createdAt,
      updatedAt: nextReview.updatedAt,
    };

    const savePromise = requestJson('movimood.php', {
      params: { resource: 'reviews' },
      method: 'POST',
      body: reviewPayload,
    })
      .then((response) => {
        if (Array.isArray(response?.items)) {
          const hydratedReviews = sortByNewest(response.items);
          if (hydratedReviews.length > 0) {
            localStorage.setItem(STORAGE_KEY, JSON.stringify(hydratedReviews));
            window.dispatchEvent(new Event(REVIEW_CHANGE_EVENT));
            setReviews(hydratedReviews);
          }
        }

        return response;
      })
      .catch((error) => {
        console.error('Error al guardar la reseña en el servidor:', error.message || error, error.payload || null);
        throw error;
      });

    return { review: nextReview, savePromise };
  }, [currentProfileId, currentUser, reviews]);

  const removeMovieReview = useCallback((reviewId) => {
    setReviews((prev) => {
      const next = prev.filter((review) => review.id !== reviewId);
      localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
      window.dispatchEvent(new Event(REVIEW_CHANGE_EVENT));

      if (hasApiBaseUrl()) {
        requestJson('movimood.php', {
          params: { resource: 'reviews', id: reviewId },
          method: 'DELETE',
        })
          .then((response) => {
            if (Array.isArray(response?.items)) {
              const hydratedReviews = sortByNewest(response.items);
              if (hydratedReviews.length > 0 || next.length === 0) {
                localStorage.setItem(STORAGE_KEY, JSON.stringify(hydratedReviews));
                window.dispatchEvent(new Event(REVIEW_CHANGE_EVENT));
                setReviews(hydratedReviews);
              }
            }
          })
          .catch((error) => {
            console.error('Error al eliminar la reseña del servidor:', error.message || error);
          });
      }

      return next;
    });
  }, []);

  const getMovieReviewByProfile = useCallback(
    (movieId, profileId = currentProfileId) => {
      const movieIdString = movieId != null ? String(movieId) : '';
      const profileIdString = profileId != null ? String(profileId) : '';
      return (
        sortByNewest(
          reviews.filter((review) => {
            const reviewMovieId = review.movieId != null ? String(review.movieId) : '';
            const reviewProfileId = review.profileId ?? review.userId ?? '';
            const reviewProfileIdString = reviewProfileId != null ? String(reviewProfileId) : '';

            return (
              reviewMovieId === movieIdString &&
              (reviewProfileIdString === profileIdString || (!reviewProfileIdString && profileIdString === String(currentProfileId)))
            );
          })
        )[0] || null
      );
    },
    [currentProfileId, reviews]
  );

  const getReviewsByProfile = useCallback(
    (profileId = currentProfileId) => {
      const profileIdString = profileId != null ? String(profileId) : '';
      return sortByNewest(
        reviews.filter((review) => {
          const reviewProfileId = review.profileId ?? review.userId ?? '';
          const reviewProfileIdString = reviewProfileId != null ? String(reviewProfileId) : '';
          return reviewProfileIdString === profileIdString || (!reviewProfileIdString && profileIdString === String(currentProfileId));
        })
      );
    },
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
