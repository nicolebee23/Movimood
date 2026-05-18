import { useEffect, useMemo, useState } from 'react';
import Cropper from 'react-easy-crop';
import { Link, Navigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import { useFavoritos } from '../hooks/useFavoritos';
import { useMovieReviews } from '../hooks/useMovieReviews';
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

  const tabs = [
    { id: 'profile', label: 'Profile' },
    { id: 'auth', label: 'Auth' },
    { id: 'avatar', label: 'Avatar' },
    { id: 'notifications', label: 'Notifications' },
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
      changeCurrentUserPassword(passwordDraft);
      setPasswordStatus('Contrasena actualizada correctamente.');
      setPasswordDraft({
        currentPassword: '',
        newPassword: '',
        confirmPassword: '',
      });
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

  return (
    <div className="pagina-principal config-page">
      <section className="config-header">
        <div className="config-header-copy">
          <p className="config-kicker">Configuracion</p>
          <h1>Configuracion de cuenta</h1>
          <p>Ajusta tus datos, seguridad y seleccion de favoritas que veran en tu perfil publico.</p>
        </div>

        <div className="config-header-actions">
          <p className="config-pro-copy">Tu escaparate publico vive en tu perfil y toma tus favoritas desde aqui.</p>
          <Link to={`/perfil/${currentUser.id}`} className="config-public-link">
            Ver perfil publico
          </Link>
        </div>
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
              <h2>Profile</h2>
              <form onSubmit={saveAccountSettings} className="config-form">
                <label>
                  Username
                  <input
                    type="text"
                    value={accountDraft.username}
                    onChange={(event) => updateAccountField('username', event.target.value)}
                    required
                  />
                </label>

                <div className="config-split-fields">
                  <label>
                    Given name
                    <input
                      type="text"
                      value={accountDraft.name}
                      onChange={(event) => updateAccountField('name', event.target.value)}
                      required
                      minLength={2}
                    />
                  </label>

                  <label>
                    Email address
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
                <h2>Favorite films</h2>
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
                <p className="config-empty">Aun no has fijado favoritas.</p>
              )}

              <div className="config-fav-manage">
                <p className="config-fav-manage-copy">Elige las 4 que quieres mostrar buscando por nombre.</p>

                <label className="config-search-label">
                  Buscar pelicula
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
                        <span>{favoriteMovieIds.includes(movie.id) ? 'Quitar' : 'Anadir'}</span>
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
              <h2>Change password</h2>
              <form onSubmit={savePassword} className="config-form">
                <label>
                  Current password
                  <input
                    type="password"
                    value={passwordDraft.currentPassword}
                    onChange={(event) => setPasswordDraft((prev) => ({ ...prev, currentPassword: event.target.value }))}
                    required
                  />
                </label>

                <label>
                  New password
                  <input
                    type="password"
                    value={passwordDraft.newPassword}
                    onChange={(event) => setPasswordDraft((prev) => ({ ...prev, newPassword: event.target.value }))}
                    required
                  />
                </label>

                <label>
                  Confirm new password
                  <input
                    type="password"
                    value={passwordDraft.confirmPassword}
                    onChange={(event) => setPasswordDraft((prev) => ({ ...prev, confirmPassword: event.target.value }))}
                    required
                  />
                </label>

                {passwordError && <p className="config-error">{passwordError}</p>}
                {passwordStatus && <p className="config-success">{passwordStatus}</p>}

                <button type="submit" className="config-submit">Change</button>
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

                  <p className="config-avatar-caption">Vista previa del perfil publico</p>
                  <p className="config-avatar-name">{accountDraft.name || 'Usuario MoviMood'}</p>
                </div>

                <div className="config-avatar-controls-panel">
                  <h3>Personaliza tu foto</h3>
                  <p className="config-avatar-copy">
                    Sube una imagen cuadrada en JPG, PNG o WEBP. El tamano maximo permitido es de 2MB.
                  </p>

                  <div className="config-avatar-meta-grid">
                    <div className="config-avatar-meta-item">
                      <span>Formato</span>
                      <strong>JPG, PNG, WEBP</strong>
                    </div>
                    <div className="config-avatar-meta-item">
                      <span>Tamano maximo</span>
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
              <h2>Notifications</h2>
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

      </section>
    </div>
  );
}

export default Configuracion;
