import pako from 'pako';

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

async function requestJson(endpoint, { method = 'GET', params = {}, body = null, credentials = 'include', signal = undefined } = {}) {
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
    signal,
    headers: requestBody ? { 'Content-Type': 'application/json' } : undefined,
    body: requestBody ? JSON.stringify(requestBody) : undefined,
  });

  // Read raw bytes so we can detect/decompress gzipped bodies even if the
  // server doesn't set Content-Encoding correctly.
  let buffer;
  try {
    buffer = await response.arrayBuffer();
  } catch (e) {
    // Fallback to text if arrayBuffer not available
    const txt = await response.text();
    try {
      const parsed = txt ? JSON.parse(txt) : null;
      if (!response.ok) {
        const message = parsed?.message || `Request failed with status ${response.status}`;
        const error = new Error(message);
        error.status = response.status;
        error.payload = parsed;
        throw error;
      }
      return parsed;
    } catch {
      if (!response.ok) {
        const error = new Error(`Request failed with status ${response.status}`);
        error.status = response.status;
        throw error;
      }
      return txt ? { raw: txt } : null;
    }
  }

  const view = new Uint8Array(buffer);
  let text = '';

  const isGzip = view.length >= 2 && view[0] === 0x1f && view[1] === 0x8b;
  if (isGzip) {
    // Try native DecompressionStream
    if (typeof DecompressionStream !== 'undefined') {
      try {
        const ds = new DecompressionStream('gzip');
        const decompressed = await new Response(buffer).body.pipeThrough(ds).arrayBuffer();
        text = new TextDecoder().decode(decompressed);
      } catch {
        // ignore and fallback to pako
      }
    }

    if (!text) {
      try {
        const inflated = pako.inflate(view);
        text = new TextDecoder().decode(inflated);
      } catch {
        // final fallback: try to decode raw buffer
        try {
          text = new TextDecoder().decode(buffer);
        } catch {
          text = '';
        }
      }
    }
  } else {
    try {
      text = new TextDecoder().decode(buffer);
    } catch {
      text = '';
    }
  }

  let payload = null;
  if (text) {
    try {
      payload = JSON.parse(text);
    } catch {
      // Some hosting setups forward compressed bytes without a proper
      // Content-Encoding header. Try multiple pako decoders before giving up.
      const tryDecode = (decoder) => {
        try {
          const decoded = decoder(view);
          return new TextDecoder().decode(decoded);
        } catch {
          return '';
        }
      };

      const fallbackText =
        tryDecode((bytes) => pako.inflate(bytes)) ||
        tryDecode((bytes) => pako.inflateRaw(bytes)) ||
        tryDecode((bytes) => pako.ungzip(bytes)) ||
        '';

      if (fallbackText) {
        try {
          payload = JSON.parse(fallbackText);
        } catch {
          payload = { raw: fallbackText };
        }
      } else {
        payload = { raw: text };
      }
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
