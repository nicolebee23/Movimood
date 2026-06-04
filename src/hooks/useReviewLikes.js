import { useCallback, useEffect, useState, useRef } from 'react';
import { requestJson } from '../utils/movimoodApi';

const REVIEW_LIKES_KEY = 'movimood-review-likes';
const USER_LIKED_REVIEWS_KEY = 'movimood-user-liked-reviews';

function parseLocalLikes() {
  try {
    const raw = localStorage.getItem(REVIEW_LIKES_KEY);
    if (!raw) return {};
    const parsed = JSON.parse(raw);
    if (Array.isArray(parsed)) {
      // older format: array of { review_id, count }
      const map = {};
      parsed.forEach((it) => {
        if (it && it.review_id) map[String(it.review_id)] = Number(it.count) || 0;
      });
      return map;
    }
    if (typeof parsed === 'object' && parsed !== null) return parsed;
    return {};
  } catch {
    return {};
  }
}

function saveLocalLikes(obj) {
  try {
    localStorage.setItem(REVIEW_LIKES_KEY, JSON.stringify(obj));
  } catch {
    // ignore
  }
}

export default function useReviewLikes() {
  const [counts, setCounts] = useState(() => parseLocalLikes());
  const pendingRef = useRef(new Set());
  const countsRef = useRef(counts);
  // Track in-flight fetch promises to coalesce duplicate fetches
  const inFlightRef = useRef(new Map());
  // timestamps of last successful fetch per review id (ms)
  const lastFetchedRef = useRef({});
  const FETCH_TTL_MS = 30 * 1000; // 30 seconds

  useEffect(() => {
    countsRef.current = counts;
  }, [counts]);

  useEffect(() => {
    saveLocalLikes(counts);
  }, [counts]);

  const fetchCount = useCallback(async (reviewId) => {
    const key = String(reviewId);
    // If we recently fetched this review, return cached value
    const last = lastFetchedRef.current[key];
    if (last && (Date.now() - last) < FETCH_TTL_MS) {
      return countsRef.current[key] || 0;
    }
    // If a fetch for this review is already in-flight, return the same promise
    const existing = inFlightRef.current.get(key);
    if (existing) return existing;
    try {
      const promise = requestJson('movimood.php', { params: { resource: 'review-likes', review_id: reviewId } })
        .then((payload) => {
          if (payload && typeof payload.count === 'number') {
            lastFetchedRef.current[key] = Date.now();
            setCounts((s) => ({ ...s, [key]: payload.count }));
            return payload.count;
          }
          return countsRef.current[key] || 0;
        })
        .catch(() => {
          return countsRef.current[key] || 0;
        })
        .finally(() => {
          inFlightRef.current.delete(key);
        });

      inFlightRef.current.set(key, promise);
      return promise;
    } catch (e) {
      // ignore network errors, fallback to local
    }
    return countsRef.current[key] || 0;
  }, []);

  const toggleLike = useCallback(async (reviewId) => {
    const key = String(reviewId);
    const current = Number(countsRef.current[key] || 0);
    // optimistic: increment locally
    setCounts((s) => ({ ...s, [key]: current + 1 }));
    pendingRef.current.add(key);

    // optimistic: mark as liked in local per-user cache
    try {
      const raw = localStorage.getItem(USER_LIKED_REVIEWS_KEY);
      const parsed = raw ? JSON.parse(raw) : [];
      const set = Array.isArray(parsed) ? new Set(parsed.map(String)) : new Set();
      set.add(key);
      localStorage.setItem(USER_LIKED_REVIEWS_KEY, JSON.stringify(Array.from(set)));
    } catch (e) {
      // ignore
    }

    try {
      // try to POST like. If we have a local session user, include user_id as fallback
      let body = { review_id: reviewId };
      try {
        const rawSession = localStorage.getItem('movimood-session-user');
        if (rawSession) {
          const parsedSession = JSON.parse(rawSession);
          if (parsedSession && parsedSession.id) {
            body.user_id = parsedSession.id;
          }
        }
      } catch (e) {
        // ignore
      }

      const payload = await requestJson('movimood.php', { method: 'POST', params: { resource: 'review-likes' }, body });
      if (payload && typeof payload.count === 'number') {
        setCounts((s) => ({ ...s, [key]: payload.count }));
      }
    } catch (e) {
      // if POST failed, try to undo optimistic and save to local fallback
      setCounts((s) => ({ ...s, [key]: current }));
      // persist fallback
      const local = parseLocalLikes();
      local[key] = (local[key] || 0) + 1;
      saveLocalLikes(local);
    } finally {
      pendingRef.current.delete(key);
    }
  }, []);

  const unlike = useCallback(async (reviewId) => {
    const key = String(reviewId);
    const current = Number(countsRef.current[key] || 0);
    if (current <= 0) return;
    // optimistic decrement
    setCounts((s) => ({ ...s, [key]: Math.max(0, current - 1) }));
    pendingRef.current.add(key);

    // optimistic: unmark from local per-user cache
    try {
      const raw = localStorage.getItem(USER_LIKED_REVIEWS_KEY);
      const parsed = raw ? JSON.parse(raw) : [];
      const set = Array.isArray(parsed) ? new Set(parsed.map(String)) : new Set();
      set.delete(key);
      localStorage.setItem(USER_LIKED_REVIEWS_KEY, JSON.stringify(Array.from(set)));
    } catch (e) {
      // ignore
    }

    try {
      let body = { review_id: reviewId };
      try {
        const rawSession = localStorage.getItem('movimood-session-user');
        if (rawSession) {
          const parsedSession = JSON.parse(rawSession);
          if (parsedSession && parsedSession.id) {
            body.user_id = parsedSession.id;
          }
        }
      } catch (e) {
        // ignore
      }

      const payload = await requestJson('movimood.php', { method: 'DELETE', params: { resource: 'review-likes' }, body });
      if (payload && typeof payload.count === 'number') {
        setCounts((s) => ({ ...s, [key]: payload.count }));
      }
    } catch (e) {
      // revert optimistic and persist fallback negative action
      setCounts((s) => ({ ...s, [key]: current }));
      const local = parseLocalLikes();
      local[key] = Math.max(0, (local[key] || 0) - 1);
      saveLocalLikes(local);
    } finally {
      pendingRef.current.delete(key);
    }
  }, []);

  // Stable fetchUserLikedReviews so components depending on the returned
  // object don't trigger effects in a loop.
  const fetchUserLikedReviews = useCallback(async () => {
    // prefer server-side list of liked reviews for the authenticated user
    try {
      // If we have a local session user, pass user_id so server can return public list
      let params = { resource: 'review-likes' };
      try {
        const rawSession = localStorage.getItem('movimood-session-user');
        if (rawSession) {
          const parsed = JSON.parse(rawSession);
          if (parsed && parsed.id) params.user_id = parsed.id;
        }
      } catch (err) {
        // ignore parsing errors
      }

      const payload = await requestJson('movimood.php', { params });
      if (payload && Array.isArray(payload.items)) {
        return payload.items;
      }
    } catch (e) {
      // fall through to local fallback
    }

    try {
      const raw = localStorage.getItem(USER_LIKED_REVIEWS_KEY);
      const parsed = raw ? JSON.parse(raw) : [];
      if (!Array.isArray(parsed)) return [];
      return parsed.map((id) => ({ reviewId: String(id), likedAt: null, review: null }));
    } catch (e) {
      return [];
    }
  }, []);

  const fetchLikers = useCallback(async (reviewId) => {
    try {
      const payload = await requestJson('movimood.php', {
        params: { resource: 'review-likes', review_id: reviewId, include_users: 1 },
      });
      if (payload && Array.isArray(payload.users)) {
        return payload.users;
      }
    } catch (e) {
      // ignore errors and return empty list
    }
    return [];
  }, []);

  return {
    counts,
    fetchCount,
    fetchLikers,
    toggleLike,
    unlike,
    isPending: (reviewId) => pendingRef.current.has(String(reviewId)),
    fetchUserLikedReviews,
    isLiked: (reviewId) => {
      // check server side by fetching user's liked reviews (synchronous fallback: local cache)
      try {
        const raw = localStorage.getItem(USER_LIKED_REVIEWS_KEY);
        const parsed = raw ? JSON.parse(raw) : [];
        if (!Array.isArray(parsed)) return false;
        return parsed.map(String).includes(String(reviewId));
      } catch (e) {
        return false;
      }
    },
  };
}
