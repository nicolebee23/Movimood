const DEFAULT_API_BASE_URL = typeof window !== 'undefined' ? `${window.location.origin}/api` : '/api';
const API_BASE_URL = (process.env.REACT_APP_API_BASE_URL || DEFAULT_API_BASE_URL).replace(/\/$/, '');

const LOCAL_KEYS = {
  users: 'movimood-users',
  sessionUser: 'movimood-session-user',
  favorites: 'movimood-favoritos',
  reviews: 'movimood-movie-reviews',
};

function hasApiBaseUrl() {
  return API_BASE_URL !== '';
}

function buildApiUrl(endpoint, params = {}) {
  if (!hasApiBaseUrl()) {
    throw new Error('Falta REACT_APP_API_BASE_URL en el entorno.');
  }

  const normalizedEndpoint = endpoint.replace(/^\//, '');
  const baseUrl = API_BASE_URL.startsWith('/') ? window.location.origin + API_BASE_URL : API_BASE_URL;
  const url = new URL(`${baseUrl}/${normalizedEndpoint}`);

  Object.entries(params).forEach(([key, value]) => {
    if (value === undefined || value === null || value === '') {
      return;
    }

    url.searchParams.set(key, String(value));
  });

  return url.toString();
}

async function requestJson(endpoint, { method = 'GET', params = {}, body = null, credentials = 'include' } = {}) {
  const normalizedMethod = String(method || 'GET').toUpperCase();
  let requestBody = body;

  if (normalizedMethod !== 'GET' && params?.action) {
    if (body && typeof body === 'object' && !Array.isArray(body)) {
      requestBody = body.action ? body : { ...body, action: params.action };
    } else if (!body) {
      requestBody = { action: params.action };
    }
  }

  const response = await fetch(buildApiUrl(endpoint, params), {
    method: normalizedMethod,
    credentials,
    headers: requestBody ? { 'Content-Type': 'application/json' } : undefined,
    body: requestBody ? JSON.stringify(requestBody) : undefined,
  });

  const text = await response.text();
  let payload = null;

  if (text) {
    try {
      payload = JSON.parse(text);
    } catch {
      payload = { raw: text };
    }
  }

  if (!response.ok) {
    const message = payload?.message || `Request failed with status ${response.status}`;
    const error = new Error(message);
    error.status = response.status;
    error.payload = payload;
    throw error;
  }

  return payload;
}

function parseStoredJson(key, fallback) {
  try {
    const raw = localStorage.getItem(key);
    if (!raw) {
      return fallback;
    }

    const parsed = JSON.parse(raw);
    return parsed ?? fallback;
  } catch {
    return fallback;
  }
}

function buildLocalSyncPayload() {
  const users = Array.isArray(parseStoredJson(LOCAL_KEYS.users, [])) ? parseStoredJson(LOCAL_KEYS.users, []) : [];
  const favorites = Array.isArray(parseStoredJson(LOCAL_KEYS.favorites, [])) ? parseStoredJson(LOCAL_KEYS.favorites, []) : [];
  const reviews = Array.isArray(parseStoredJson(LOCAL_KEYS.reviews, [])) ? parseStoredJson(LOCAL_KEYS.reviews, []) : [];
  const sessionUser = parseStoredJson(LOCAL_KEYS.sessionUser, null);
  const ownerUserId = sessionUser?.id || users[0]?.id || null;

  return {
    ownerUserId,
    users,
    favorites,
    reviews,
  };
}

export { API_BASE_URL, hasApiBaseUrl, buildApiUrl, requestJson, buildLocalSyncPayload };
