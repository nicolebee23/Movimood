import { useEffect, useMemo, useState } from 'react';
import Cropper from 'react-easy-crop';
import { Link, Navigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import { useFavoritos } from '../hooks/useFavoritos';
import { useMovieReviews } from '../hooks/useMovieReviews';
import { hasApiBaseUrl, requestJson } from '../utils/movimoodApi';
import './Configuracion.css';

const MAX_AVATAR_SIZE = 2 * 1024 * 1024;
const ALLOWED_AVATAR_TYPES = ['image/jpeg', 'image/png', 'image/webp'];
const PROFILE_FAVORITES_KEY = 'movimood-profile-favorites';
const MAX_PROFILE_FAVORITES = 4;
const API_BASE_URL = (process.env.REACT_APP_API_BASE_URL || '').replace(/\/$/, '');

function normalizeMovie(movie) {
  if (!movie?.id || !movie?.poster_path) {
    return null;
  }

  return {
    id: movie.id,
    title: movie.title || movie.name || 'Pelicula',
    poster_path: movie.poster_path,
    release_date: movie.release_date || '',
  };
}

function fileToDataUrl(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result);
    reader.onerror = () => reject(new Error('No se pudo leer la imagen seleccionada.'));
    reader.readAsDataURL(file);
  });
}

function cropImageByArea(dataUrl, cropPixels, outputType) {
  return new Promise((resolve, reject) => {
    const image = new Image();

    image.onload = () => {
      if (!cropPixels?.width || !cropPixels?.height) {
        reject(new Error('No se pudo recortar la imagen seleccionada.'));
        return;
      }

      const outputSize = Math.min(640, Math.round(Math.min(cropPixels.width, cropPixels.height)));

      const canvas = document.createElement('canvas');
      canvas.width = outputSize;
      canvas.height = outputSize;

      const context = canvas.getContext('2d');
      if (!context) {
        reject(new Error('No se pudo preparar el recorte de imagen.'));
        return;
      }

      context.drawImage(
        image,
        Math.round(cropPixels.x),
        Math.round(cropPixels.y),
        Math.round(cropPixels.width),
        Math.round(cropPixels.height),
        0,
        0,
        outputSize,
        outputSize
      );

      const normalizedType = ALLOWED_AVATAR_TYPES.includes(outputType) ? outputType : 'image/jpeg';
      const quality = normalizedType === 'image/png' ? undefined : 0.92;
      const croppedDataUrl = canvas.toDataURL(normalizedType, quality);
      resolve(croppedDataUrl);
    };

    image.onerror = () => reject(new Error('No se pudo procesar la imagen seleccionada.'));
    image.src = dataUrl;
  });
}

function normalizeBlockedUser(user) {
  const id = user?.id ?? user?.user_id ?? user?.blocked_user_id;
  if (!id) {
    return null;
  }

  return {
    id,
    name: user?.name || user?.username || `Usuario ${id}`,
    username: user?.username || '',
    avatar: user?.avatar || '',
  };
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

function persistProfileFavorites(profileId, payload) {
  if (!profileId) {
    return;
  }

  try {
    const raw = localStorage.getItem(PROFILE_FAVORITES_KEY);
    const parsed = raw ? JSON.parse(raw) : {};
    parsed[profileId] = {
      ids: Array.isArray(payload?.ids) ? payload.ids.slice(0, MAX_PROFILE_FAVORITES) : [],
      movies: Array.isArray(payload?.movies) ? payload.movies.map(normalizeMovie).filter(Boolean) : [],
    };
    localStorage.setItem(PROFILE_FAVORITES_KEY, JSON.stringify(parsed));
  } catch {
    // Ignore optional personalization persistence failures.
  }
}

function Configuracion() {
  const { currentUser, updateAccountSettings, changeCurrentUserPassword } = useAuth();
  const { favoritos } = useFavoritos();
  const { getReviewsByProfile } = useMovieReviews();
  const [activeTab, setActiveTab] = useState('profile');

  const [accountDraft, setAccountDraft] = useState({
    name: '',
    username: '',
    email: '',
    avatar: '',
    notifications: {
      app: true,
      email: false,
    },
  });
  const [accountStatus, setAccountStatus] = useState('');
  const [accountError, setAccountError] = useState('');
  const [avatarStatus, setAvatarStatus] = useState('');
  const [notificationsStatus, setNotificationsStatus] = useState('');

  const [passwordDraft, setPasswordDraft] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: '',
  });
  const [passwordStatus, setPasswordStatus] = useState('');
  const [passwordError, setPasswordError] = useState('');

  const [favoriteMovieIds, setFavoriteMovieIds] = useState([]);
  const [favoriteMoviePool, setFavoriteMoviePool] = useState([]);
  const [draggingFavoriteId, setDraggingFavoriteId] = useState(null);
  const [dragOverFavoriteId, setDragOverFavoriteId] = useState(null);
  const [avatarEditorOpen, setAvatarEditorOpen] = useState(false);
  const [avatarSourceImage, setAvatarSourceImage] = useState('');
  const [avatarSourceType, setAvatarSourceType] = useState('image/jpeg');
  const [avatarCrop, setAvatarCrop] = useState({ x: 0, y: 0 });
  const [avatarZoom, setAvatarZoom] = useState(1);
  const [avatarCropPixels, setAvatarCropPixels] = useState(null);
  const [avatarApplying, setAvatarApplying] = useState(false);
  const [favoriteQuery, setFavoriteQuery] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [searchLoading, setSearchLoading] = useState(false);
  const [searchError, setSearchError] = useState('');
  const [favoriteNotice, setFavoriteNotice] = useState('');
  const [favoritesHydrated, setFavoritesHydrated] = useState(false);
  const [blockedUsers, setBlockedUsers] = useState([]);
  const [blockedLoading, setBlockedLoading] = useState(false);
  const [blockedError, setBlockedError] = useState('');
  const [blockedStatus, setBlockedStatus] = useState('');
  const [unblockingUserId, setUnblockingUserId] = useState(null);

  const tabs = [
    { id: 'profile', label: 'Perfil' },
    { id: 'auth', label: 'Seguridad' },
    { id: 'avatar', label: 'Avatar' },
    { id: 'notifications', label: 'Notificaciones' },
    { id: 'blocked', label: 'Bloqueados' },
  ];

  useEffect(() => {
    if (!currentUser) {
      setFavoritesHydrated(false);
      return;
    }

    setAccountDraft({
      name: currentUser.name || '',
      username: currentUser.username || '',
      email: currentUser.email || '',
      avatar: currentUser.avatar || '',
      notifications: currentUser.notifications || {
        app: true,
        email: false,
      },
    });

    const storedFavorites = loadProfileFavorites(currentUser.id);
    setFavoriteMovieIds(storedFavorites.ids.slice(0, MAX_PROFILE_FAVORITES));
    setFavoriteMoviePool(storedFavorites.movies);
    setFavoritesHydrated(true);
  }, [currentUser]);

  useEffect(() => {
    if (!currentUser || !favoritesHydrated) {
      return;
    }
    persistProfileFavorites(currentUser.id, {
      ids: favoriteMovieIds,
      movies: favoriteMoviePool,
    });
  }, [currentUser, favoriteMovieIds, favoriteMoviePool, favoritesHydrated]);

  const currentUserId = currentUser?.id;
  const myReviews = getReviewsByProfile(currentUserId || undefined);

  const candidateMovies = useMemo(() => {
    const moviesById = new Map();

    favoriteMoviePool.forEach((movie) => {
      if (movie?.id && movie.poster_path && !moviesById.has(movie.id)) {
        moviesById.set(movie.id, movie);
      }
    });

    myReviews.forEach((review) => {
      if (review.movie?.id && review.movie.poster_path && !moviesById.has(review.movie.id)) {
        moviesById.set(review.movie.id, review.movie);
      }
    });

    favoritos.forEach((fav) => {
      if (fav.movie?.id && fav.movie.poster_path && !moviesById.has(fav.movie.id)) {
        moviesById.set(fav.movie.id, fav.movie);
      }
    });

    return Array.from(moviesById.values());
  }, [favoriteMoviePool, favoritos, myReviews]);

  const selectedFavoriteMovies = useMemo(() => {
    const movieMap = new Map(candidateMovies.map((movie) => [movie.id, movie]));
    return favoriteMovieIds.map((movieId) => movieMap.get(movieId)).filter(Boolean).slice(0, MAX_PROFILE_FAVORITES);
  }, [candidateMovies, favoriteMovieIds]);

  useEffect(() => {
    if (favoriteMovieIds.length === 0 || candidateMovies.length === 0) {
      return;
    }

    const candidateMap = new Map(candidateMovies.map((movie) => [movie.id, movie]));

    setFavoriteMoviePool((prevPool) => {
      const existingIds = new Set(prevPool.map((movie) => movie.id));
      const missingSelectedMovies = favoriteMovieIds
        .map((movieId) => normalizeMovie(candidateMap.get(movieId)))
        .filter((movie) => movie && !existingIds.has(movie.id));

      if (missingSelectedMovies.length === 0) {
        return prevPool;
      }

      return [...prevPool, ...missingSelectedMovies];
    });
  }, [candidateMovies, favoriteMovieIds]);

  useEffect(() => {
    const query = favoriteQuery.trim();

    if (query.length < 2) {
      setSearchResults([]);
      setSearchError('');
      setSearchLoading(false);
      return undefined;
    }

    if (!API_BASE_URL) {
      setSearchResults([]);
      setSearchError('Falta REACT_APP_API_BASE_URL para buscar peliculas.');
      setSearchLoading(false);
      return undefined;
    }

    let cancelled = false;
    const timer = window.setTimeout(async () => {
      setSearchLoading(true);
      setSearchError('');

      try {
        const params = new URLSearchParams({
          query,
          page: '1',
          language: 'es-ES',
          include_adult: 'false',
        });
        const response = await fetch(`${API_BASE_URL}/tmdb-search.php?${params.toString()}`);

        if (!response.ok) {
          throw new Error('No se pudo buscar en TMDB.');
        }

        const data = await response.json();
        const parsedMovies = Array.isArray(data?.results)
          ? data.results.map(normalizeMovie).filter(Boolean).slice(0, 16)
          : [];

        if (!cancelled) {
          setSearchResults(parsedMovies);
        }
      } catch (error) {
        if (!cancelled) {
          setSearchResults([]);
          setSearchError(error.message || 'No se pudo completar la busqueda.');
        }
      } finally {
        if (!cancelled) {
          setSearchLoading(false);
        }
      }
    }, 320);

    return () => {
      cancelled = true;
      window.clearTimeout(timer);
    };
  }, [favoriteQuery]);

  useEffect(() => {
    if (activeTab !== 'blocked') {
      return undefined;
    }

    if (!currentUser?.id) {
      setBlockedUsers([]);
      setBlockedLoading(false);
      setBlockedError('');
      return undefined;
    }

    if (!hasApiBaseUrl()) {
      setBlockedUsers([]);
      setBlockedLoading(false);
      setBlockedError('No se puede cargar la lista de bloqueados: falta la URL de API.');
      return undefined;
    }

    let cancelled = false;
    setBlockedLoading(true);
    setBlockedError('');
    setBlockedStatus('');

    void requestJson('movimood.php', {
      params: { resource: 'blocks', user_id: currentUser.id },
    })
      .then((response) => {
        if (cancelled) {
          return;
        }

        const blocked = Array.isArray(response?.blocked) ? response.blocked : [];
        setBlockedUsers(blocked.map(normalizeBlockedUser).filter(Boolean));
      })
      .catch(() => {
        if (!cancelled) {
          setBlockedUsers([]);
          setBlockedError('No se pudo cargar la lista de usuarios bloqueados.');
        }
      })
      .finally(() => {
        if (!cancelled) {
          setBlockedLoading(false);
        }
      });

    return () => {
      cancelled = true;
    };
  }, [activeTab, currentUser?.id]);

  if (!currentUser) {
    return <Navigate to="/login" replace />;
  }

  function updateAccountField(field, value) {
    setAccountDraft((prev) => ({ ...prev, [field]: value }));
  }

  function toggleNotificationSetting(settingKey) {
    setAccountDraft((prev) => ({
      ...prev,
      notifications: {
        ...prev.notifications,
        [settingKey]: !prev.notifications[settingKey],
      },
    }));
  }

  async function handleAvatarChange(event) {
    const file = event.target.files?.[0];
    event.target.value = '';

    if (!file) {
      return;
    }

    if (!ALLOWED_AVATAR_TYPES.includes(file.type)) {
      setAccountError('Formato no soportado. Usa JPG, PNG o WEBP.');
      return;
    }

    if (file.size > MAX_AVATAR_SIZE) {
      setAccountError('La imagen supera 2MB. Usa un archivo mas ligero.');
      return;
    }

    try {
      setAccountError('');
      setAccountStatus('');
      setAvatarStatus('');
      const avatarDataUrl = await fileToDataUrl(file);
      setAvatarSourceImage(avatarDataUrl);
      setAvatarSourceType(file.type || 'image/jpeg');
      setAvatarCrop({ x: 0, y: 0 });
      setAvatarZoom(1);
      setAvatarCropPixels(null);
      setAvatarEditorOpen(true);
    } catch (error) {
      setAccountError(error.message || 'No se pudo procesar la imagen.');
    }
  }

  function handleAvatarCropComplete(_croppedArea, croppedAreaPixels) {
    setAvatarCropPixels(croppedAreaPixels);
  }

  async function applyAvatarCrop() {
    if (!avatarSourceImage || !avatarCropPixels) {
      setAccountError('No se pudo aplicar el recorte. Intenta mover la imagen y vuelve a probar.');
      return;
    }

    try {
      setAvatarApplying(true);
      setAccountError('');
      setAvatarStatus('');
      const croppedAvatarDataUrl = await cropImageByArea(avatarSourceImage, avatarCropPixels, avatarSourceType);
      updateAccountField('avatar', croppedAvatarDataUrl);
      setAvatarEditorOpen(false);
      setAvatarStatus('Recorte aplicado. Pulsa Guardar avatar para confirmar los cambios.');
    } catch (error) {
      setAccountError(error.message || 'No se pudo aplicar el recorte del avatar.');
    } finally {
      setAvatarApplying(false);
    }
  }

  function cancelAvatarCrop() {
    setAvatarEditorOpen(false);
    setAvatarApplying(false);
    setAvatarSourceImage('');
    setAvatarCropPixels(null);
  }

  function removeAvatar() {
    updateAccountField('avatar', '');
  }

  function toggleFavoriteMovie(movieId, movieData) {
    setFavoriteMovieIds((prevIds) => {
      if (prevIds.includes(movieId)) {
        setFavoriteNotice('');
        return prevIds.filter((id) => id !== movieId);
      }

      if (prevIds.length >= MAX_PROFILE_FAVORITES) {
        setFavoriteNotice('Puedes elegir hasta 4 peliculas favoritas.');
        return prevIds;
      }

      setFavoriteNotice('');
      return [...prevIds, movieId];
    });

    const normalized = normalizeMovie(movieData);
    if (normalized) {
      setFavoriteMoviePool((prevPool) => {
        if (prevPool.some((movie) => movie.id === normalized.id)) {
          return prevPool;
        }
        return [...prevPool, normalized];
      });
    }
  }

  function handleFavoriteDragStart(movieId) {
    setDraggingFavoriteId(movieId);
    setDragOverFavoriteId(movieId);
  }

  function handleFavoriteDragEnter(movieId) {
    if (draggingFavoriteId === null || draggingFavoriteId === movieId) {
      return;
    }
    setDragOverFavoriteId(movieId);
  }

  function handleFavoriteDrop(targetMovieId) {
    if (!draggingFavoriteId || !targetMovieId || draggingFavoriteId === targetMovieId) {
      setDraggingFavoriteId(null);
      setDragOverFavoriteId(null);
      return;
    }

    setFavoriteMovieIds((prevIds) => {
      const sourceIndex = prevIds.indexOf(draggingFavoriteId);
      const targetIndex = prevIds.indexOf(targetMovieId);

      if (sourceIndex === -1 || targetIndex === -1) {
        return prevIds;
      }

      const reordered = [...prevIds];
      const [moved] = reordered.splice(sourceIndex, 1);
      reordered.splice(targetIndex, 0, moved);
      return reordered;
    });

    setDraggingFavoriteId(null);
    setDragOverFavoriteId(null);
    setFavoriteNotice('Orden actualizado. Este sera el orden en tu perfil publico.');
  }

  function handleFavoriteDragEnd() {
    setDraggingFavoriteId(null);
    setDragOverFavoriteId(null);
  }

  function saveAccountSettings(event) {
    event.preventDefault();
    setAccountError('');
    setAccountStatus('');

    try {
      updateAccountSettings({
        name: accountDraft.name,
        username: accountDraft.username,
        email: accountDraft.email,
        avatar: accountDraft.avatar,
        notifications: accountDraft.notifications,
      });
      setAccountStatus('Cambios guardados correctamente.');
    } catch (error) {
      setAccountError(error.message || 'No se pudo guardar la cuenta.');
    }
  }

  function savePassword(event) {
    event.preventDefault();
    setPasswordError('');
    setPasswordStatus('');

    try {
      const promise = changeCurrentUserPassword(passwordDraft);
      
      if (promise && typeof promise.then === 'function') {
        promise
          .then(() => {
            setPasswordStatus('Contrasena actualizada correctamente.');
            setPasswordDraft({
              currentPassword: '',
              newPassword: '',
              confirmPassword: '',
            });
          })
          .catch((error) => {
            setPasswordError(error.message || 'No se pudo actualizar la contrasena.');
          });
      } else {
        setPasswordStatus('Contrasena actualizada correctamente.');
        setPasswordDraft({
          currentPassword: '',
          newPassword: '',
          confirmPassword: '',
        });
      }
    } catch (error) {
      setPasswordError(error.message || 'No se pudo actualizar la contrasena.');
    }
  }

  function saveNotifications() {
    setAccountError('');
    setNotificationsStatus('');
    setAvatarStatus('');

    try {
      updateAccountSettings({
        name: accountDraft.name,
        username: accountDraft.username,
        email: accountDraft.email,
        avatar: accountDraft.avatar,
        notifications: accountDraft.notifications,
      });
      setNotificationsStatus('Preferencias de notificacion guardadas.');
    } catch (error) {
      setAccountError(error.message || 'No se pudieron guardar las notificaciones.');
    }
  }

  function saveAvatar() {
    setAccountError('');
    setAvatarStatus('');

    try {
      updateAccountSettings({
        name: accountDraft.name,
        username: accountDraft.username,
        email: accountDraft.email,
        avatar: accountDraft.avatar,
        notifications: accountDraft.notifications,
      });
      setAvatarStatus('Avatar guardado correctamente.');
    } catch (error) {
      setAccountError(error.message || 'No se pudo guardar el avatar.');
    }
  }

  async function handleUnblockUser(blockedUserId) {
    if (!currentUser?.id || !blockedUserId || unblockingUserId) {
      return;
    }

    setBlockedError('');
    setBlockedStatus('');
    setUnblockingUserId(blockedUserId);

    try {
      await requestJson('movimood.php', {
        params: { resource: 'blocks' },
        method: 'DELETE',
        body: {
          user_id: currentUser.id,
          blocked_user_id: blockedUserId,
        },
      });

      setBlockedUsers((prev) => prev.filter((user) => String(user.id) !== String(blockedUserId)));
      setBlockedStatus('Usuario desbloqueado correctamente.');
    } catch {
      setBlockedError('No se pudo desbloquear al usuario. Intenta de nuevo.');
    } finally {
      setUnblockingUserId(null);
    }
  }

  return (
    <div className="pagina-principal config-page">
      <section className="config-hero">
        <div className="config-hero-copy">
          <p className="config-kicker">Configuración</p>
          <h1>Configura tu experiencia MoviMood</h1>
          <p>
            Ajusta tu perfil, avatar, notificaciones y el bloque de favoritas públicas con una interfaz visual,
            clara y alineada con el estilo de la web.
          </p>
        </div>

        <div className="config-hero-aside">
          <div className="config-user-badge">
            {currentUser?.avatar ? (
              <img src={currentUser.avatar} alt={`Avatar de ${currentUser.name || currentUser.username || 'usuario'}`} />
            ) : (
              <span>{(currentUser?.name || currentUser?.username || 'MM').slice(0, 2).toUpperCase()}</span>
            )}
            <div>
              <strong>{currentUser?.name || currentUser?.username || 'MoviMood'}</strong>
              <small>Tu panel personal</small>
            </div>
          </div>

          <div className="config-hero-actions">
            <p className="config-pro-copy">Tu escaparate público vive en tu perfil y toma tus favoritas desde aquí.</p>
            <Link to={`/perfil/${currentUser.id}`} className="config-public-link">
              Ver perfil público
            </Link>
          </div>
        </div>
      </section>

      <section className="config-summary-grid">
        <article className="config-summary-card">
          <span className="config-summary-label">Estado</span>
          <strong>Personalización activa</strong>
          <p>Perfil, avatar y notificaciones listos para editar.</p>
        </article>
        <article className="config-summary-card">
          <span className="config-summary-label">Favoritas públicas</span>
          <strong>{selectedFavoriteMovies.length}/4</strong>
          <p>Ordena las 4 películas que se verán en tu perfil.</p>
        </article>
        <article className="config-summary-card">
          <span className="config-summary-label">Cuenta</span>
          <strong>{currentUser?.email ? 'Sincronizada' : 'Pendiente'}</strong>
          <p>Datos de acceso y seguridad centralizados.</p>
        </article>
      </section>

      <section className="config-shell">
        <div className="config-tabs" role="tablist" aria-label="Secciones de configuracion">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              type="button"
              role="tab"
              aria-selected={activeTab === tab.id}
              className={`config-tab${activeTab === tab.id ? ' active' : ''}`}
              onClick={() => setActiveTab(tab.id)}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {activeTab === 'profile' && (
          <section className="config-panel config-profile-layout">
            <article className="config-card">
              <h2>Perfil</h2>
              <form onSubmit={saveAccountSettings} className="config-form">
                <label>
                  Usuario
                  <input
                    type="text"
                    value={accountDraft.username}
                    onChange={(event) => updateAccountField('username', event.target.value)}
                    required
                  />
                </label>

                <div className="config-split-fields">
                  <label>
                    Nombre
                    <input
                      type="text"
                      value={accountDraft.name}
                      onChange={(event) => updateAccountField('name', event.target.value)}
                      required
                      minLength={2}
                    />
                  </label>

                  <label>
                    Correo electrónico
                    <input
                      type="email"
                      value={accountDraft.email}
                      onChange={(event) => updateAccountField('email', event.target.value)}
                      required
                    />
                  </label>
                </div>

                {accountError && <p className="config-error">{accountError}</p>}
                {accountStatus && <p className="config-success">{accountStatus}</p>}

                <button type="submit" className="config-submit">Guardar perfil</button>
              </form>
            </article>

            <article className="config-card config-card-side">
              <div className="config-favorites-head">
                <h2>Películas favoritas</h2>
                <p>Esto es lo que saldrá en tu perfil público.</p>
              </div>

              {selectedFavoriteMovies.length > 0 ? (
                <div className="config-favorites-preview">
                  {selectedFavoriteMovies.map((movie) => (
                    <article
                      key={movie.id}
                      className={`config-fav-poster${draggingFavoriteId === movie.id ? ' arrastrando' : ''}${dragOverFavoriteId === movie.id && draggingFavoriteId !== movie.id ? ' destino' : ''}`}
                      draggable
                      onDragStart={() => handleFavoriteDragStart(movie.id)}
                      onDragEnter={() => handleFavoriteDragEnter(movie.id)}
                      onDragOver={(event) => event.preventDefault()}
                      onDrop={() => handleFavoriteDrop(movie.id)}
                      onDragEnd={handleFavoriteDragEnd}
                    >
                      <img src={`https://image.tmdb.org/t/p/w500${movie.poster_path}`} alt={movie.title || 'Pelicula'} />
                      <button
                        type="button"
                        className="config-fav-remove-icon"
                        aria-label={`Quitar ${movie.title || 'pelicula'} del top 4`}
                        onClick={() => toggleFavoriteMovie(movie.id, movie)}
                      >
                        ×
                      </button>
                    </article>
                  ))}
                </div>
              ) : (
                <p className="config-empty">Aún no has fijado favoritas.</p>
              )}

              <div className="config-fav-manage">
                <p className="config-fav-manage-copy">Elige las 4 que quieres mostrar buscando por nombre.</p>

                <label className="config-search-label">
                  Buscar película
                  <input
                    type="text"
                    value={favoriteQuery}
                    onChange={(event) => setFavoriteQuery(event.target.value)}
                    placeholder="Ej: Interstellar"
                  />
                </label>

                {searchLoading && <p className="config-empty">Buscando peliculas...</p>}
                {searchError && <p className="config-error">{searchError}</p>}

                {!searchLoading && !searchError && favoriteQuery.trim().length >= 2 && searchResults.length === 0 && (
                  <p className="config-empty">No encontramos resultados para esa busqueda.</p>
                )}

                {!searchLoading && !searchError && searchResults.length > 0 && (
                  <div className="config-fav-manage-grid">
                    {searchResults.map((movie) => (
                      <button
                        key={`search-${movie.id}`}
                        type="button"
                        className={`config-fav-select-card${favoriteMovieIds.includes(movie.id) ? ' activo' : ''}`}
                        onClick={() => toggleFavoriteMovie(movie.id, movie)}
                      >
                        <img src={`https://image.tmdb.org/t/p/w500${movie.poster_path}`} alt={movie.title || 'Pelicula'} />
                        <span>{favoriteMovieIds.includes(movie.id) ? 'Quitar' : 'Añadir'}</span>
                      </button>
                    ))}
                  </div>
                )}
              </div>

              {favoriteNotice && <p className="config-error">{favoriteNotice}</p>}
            </article>
          </section>
        )}

        {activeTab === 'auth' && (
          <section className="config-panel config-auth-layout">
            <article className="config-card config-card-narrow">
              <h2>Cambiar contraseña</h2>
              <form onSubmit={savePassword} className="config-form">
                <label>
                  Contraseña actual
                  <input
                    type="password"
                    value={passwordDraft.currentPassword}
                    onChange={(event) => setPasswordDraft((prev) => ({ ...prev, currentPassword: event.target.value }))}
                    required
                  />
                </label>

                <label>
                  Nueva contraseña
                  <input
                    type="password"
                    value={passwordDraft.newPassword}
                    onChange={(event) => setPasswordDraft((prev) => ({ ...prev, newPassword: event.target.value }))}
                    required
                  />
                </label>

                <label>
                  Confirmar nueva contraseña
                  <input
                    type="password"
                    value={passwordDraft.confirmPassword}
                    onChange={(event) => setPasswordDraft((prev) => ({ ...prev, confirmPassword: event.target.value }))}
                    required
                  />
                </label>

                {passwordError && <p className="config-error">{passwordError}</p>}
                {passwordStatus && <p className="config-success">{passwordStatus}</p>}

                <button type="submit" className="config-submit">Cambiar</button>
              </form>
            </article>

            <article className="config-card config-card-side">
              <h2>Seguridad</h2>
              <p className="config-side-copy">
                Tu cuenta usa validaciones fuertes de contraseña. Si quieres, después podemos añadir recuperación de contraseña o verificación en dos pasos.
              </p>
            </article>
          </section>
        )}

        {activeTab === 'avatar' && (
          <section className="config-panel config-avatar-layout">
            <article className="config-card config-avatar-card">
              <h2>Avatar</h2>
              <div className="config-avatar-editor">
                <div className="config-avatar-preview-panel">
                  {accountDraft.avatar ? (
                    <img className="config-avatar config-avatar-xl" src={accountDraft.avatar} alt={`Avatar de ${accountDraft.name}`} />
                  ) : (
                    <div className="config-avatar config-avatar-fallback config-avatar-xl">
                      {(accountDraft.name || 'MM').slice(0, 2).toUpperCase()}
                    </div>
                  )}

                  <p className="config-avatar-caption">Vista previa del perfil público</p>
                  <p className="config-avatar-name">{accountDraft.name || 'Usuario MoviMood'}</p>
                </div>

                <div className="config-avatar-controls-panel">
                  <h3>Personaliza tu foto</h3>
                  <p className="config-avatar-copy">
                    Sube una imagen cuadrada en JPG, PNG o WEBP. El tamaño máximo permitido es de 2MB.
                  </p>

                  <div className="config-avatar-meta-grid">
                    <div className="config-avatar-meta-item">
                      <span>Formato</span>
                      <strong>JPG, PNG, WEBP</strong>
                    </div>
                    <div className="config-avatar-meta-item">
                      <span>Tamaño máximo</span>
                      <strong>2MB</strong>
                    </div>
                  </div>

                  <div className="config-avatar-actions">
                    <label className="config-avatar-upload-btn">
                      <input type="file" accept="image/jpeg,image/png,image/webp" onChange={handleAvatarChange} />
                      Subir foto
                    </label>
                    {accountDraft.avatar && (
                      <button type="button" className="config-avatar-remove-btn" onClick={removeAvatar}>
                        Quitar
                      </button>
                    )}
                  </div>

                  {accountError && <p className="config-error">{accountError}</p>}
                  {avatarStatus && <p className="config-success">{avatarStatus}</p>}

                  <button type="button" className="config-submit config-avatar-save-btn" onClick={saveAvatar}>
                    Guardar avatar
                  </button>
                </div>

                {avatarEditorOpen && avatarSourceImage && (
                  <div className="config-avatar-crop-overlay" role="dialog" aria-modal="true" aria-label="Editor de recorte de avatar">
                    <div className="config-avatar-crop-modal">
                      <h3>Ajusta tu avatar</h3>
                      <p>Mueve y acerca la imagen hasta que el encuadre quede como quieres.</p>

                      <div className="config-avatar-crop-area">
                        <Cropper
                          image={avatarSourceImage}
                          crop={avatarCrop}
                          zoom={avatarZoom}
                          aspect={1}
                          cropShape="round"
                          showGrid={false}
                          onCropChange={setAvatarCrop}
                          onZoomChange={setAvatarZoom}
                          onCropComplete={handleAvatarCropComplete}
                        />
                      </div>

                      <label className="config-avatar-zoom-label">
                        Zoom
                        <input
                          type="range"
                          min={1}
                          max={3}
                          step={0.01}
                          value={avatarZoom}
                          onChange={(event) => setAvatarZoom(Number(event.target.value))}
                        />
                      </label>

                      <div className="config-avatar-crop-actions">
                        <button type="button" className="config-pill-btn secondary" onClick={cancelAvatarCrop}>
                          Cancelar
                        </button>
                        <button type="button" className="config-submit config-avatar-save-btn" onClick={applyAvatarCrop} disabled={avatarApplying}>
                          {avatarApplying ? 'Aplicando...' : 'Aplicar recorte'}
                        </button>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </article>
          </section>
        )}

        {activeTab === 'notifications' && (
          <section className="config-panel config-notifications-layout">
            <article className="config-card config-card-narrow">
              <h2>Notificaciones</h2>
              <div className="config-notifications config-notifications-panel">
                <label className="config-check config-check-card">
                  <input
                    type="checkbox"
                    checked={Boolean(accountDraft.notifications?.app)}
                    onChange={() => toggleNotificationSetting('app')}
                  />
                  <div>
                    <strong>Alertas dentro de la app</strong>
                    <span>Recordatorios y avisos sobre tu actividad.</span>
                  </div>
                </label>

                <label className="config-check config-check-card">
                  <input
                    type="checkbox"
                    checked={Boolean(accountDraft.notifications?.email)}
                    onChange={() => toggleNotificationSetting('email')}
                  />
                  <div>
                    <strong>Resumen por email</strong>
                    <span>Notificaciones puntuales sobre tu cuenta.</span>
                  </div>
                </label>

                {notificationsStatus && <p className="config-success">{notificationsStatus}</p>}

                <button type="button" className="config-submit" onClick={saveNotifications}>
                  Guardar notificaciones
                </button>
              </div>
            </article>
          </section>
        )}

        {activeTab === 'blocked' && (
          <section className="config-panel config-blocked-layout">
            <article className="config-card config-blocked-card">
              <div className="config-favorites-head">
                <h2>Usuarios bloqueados</h2>
                <p>Gestiona aquí a quién has bloqueado y desbloquéalo cuando quieras.</p>
              </div>

              {blockedLoading && <p className="config-empty">Cargando usuarios bloqueados...</p>}
              {blockedError && <p className="config-error">{blockedError}</p>}
              {blockedStatus && <p className="config-success">{blockedStatus}</p>}

              {!blockedLoading && !blockedError && blockedUsers.length === 0 && (
                <p className="config-empty">No tienes usuarios bloqueados.</p>
              )}

              {!blockedLoading && blockedUsers.length > 0 && (
                <div className="config-blocked-list" role="list" aria-label="Usuarios bloqueados">
                  {blockedUsers.map((user) => (
                    <article key={user.id} className="config-blocked-item" role="listitem">
                      <div className="config-blocked-user">
                        {user.avatar ? (
                          <img src={user.avatar} alt={`Avatar de ${user.name}`} className="config-blocked-avatar" />
                        ) : (
                          <span className="config-blocked-avatar config-blocked-avatar-fallback">
                            {(user.name || 'U').slice(0, 2).toUpperCase()}
                          </span>
                        )}

                        <div className="config-blocked-copy">
                          <strong>{user.name}</strong>
                          {user.username && <span>@{user.username}</span>}
                        </div>
                      </div>

                      <button
                        type="button"
                        className="config-pill-btn secondary config-unblock-btn"
                        onClick={() => handleUnblockUser(user.id)}
                        disabled={Boolean(unblockingUserId)}
                      >
                        {unblockingUserId === user.id ? 'Desbloqueando...' : 'Desbloquear'}
                      </button>
                    </article>
                  ))}
                </div>
              )}
            </article>
          </section>
        )}

      </section>
    </div>
  );
}

export default Configuracion;
