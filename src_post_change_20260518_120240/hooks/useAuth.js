import { createContext, useCallback, useContext, useEffect, useRef, useState } from 'react';
import { buildLocalSyncPayload, hasApiBaseUrl, requestJson } from '../utils/movimoodApi';

const USERS_KEY = 'movimood-users';
const SESSION_KEY = 'movimood-session-user';
const AUTH_CHANGE_EVENT = 'movimood-auth-change';
const AuthContext = createContext(null);

const USERNAME_REGEX = /^[a-z0-9._]{3,18}$/;

function normalizeEmail(email) {
  return email.trim().toLowerCase();
}

function normalizeUsername(username) {
  return username.trim().toLowerCase();
}

function firstNonEmptyString(...values) {
  const matchedValue = values.find((value) => typeof value === 'string' && value.trim());
  return matchedValue ? matchedValue.trim() : '';
}

function buildCompatibleUsername(username, email, fallbackId = '') {
  const usernameSource = firstNonEmptyString(username, email ? email.split('@')[0] : '');
  const normalizedCandidate = normalizeUsername(usernameSource)
    .replace(/\s+/g, '.')
    .replace(/[^a-z0-9._]/g, '')
    .replace(/\.{2,}/g, '.')
    .replace(/_{2,}/g, '_')
    .replace(/^[._]+|[._]+$/g, '');

  if (USERNAME_REGEX.test(normalizedCandidate)) {
    return normalizedCandidate;
  }

  const shortenedCandidate = normalizedCandidate.slice(0, 18);
  if (USERNAME_REGEX.test(shortenedCandidate)) {
    return shortenedCandidate;
  }

  const fallbackSuffix = String(fallbackId || Date.now()).replace(/[^a-z0-9]/gi, '').toLowerCase().slice(0, 8);
  return `user.${fallbackSuffix || 'movi'}`.slice(0, 18);
}

function normalizeStoredUser(user) {
  if (!user || typeof user !== 'object') {
    return null;
  }

  const rawEmail = firstNonEmptyString(user.email, user.mail, user.correo);
  const normalizedEmail = rawEmail ? normalizeEmail(rawEmail) : '';
  const normalizedId = firstNonEmptyString(user.id, user.userId, user.uid) || buildUserId();
  const normalizedUsername = buildCompatibleUsername(
    firstNonEmptyString(user.username, user.usuario, user.user),
    normalizedEmail,
    normalizedId
  );
  const password = firstNonEmptyString(user.password, user.pass, user.contrasena, user['contraseña']);

  if (!password) {
    return null;
  }

  return {
    ...user,
    id: normalizedId,
    username: normalizedUsername,
    name: firstNonEmptyString(user.name, user.nombre, user.displayName, user.username, user.usuario) || normalizedUsername,
    avatar: typeof user.avatar === 'string' ? user.avatar : '',
    email: normalizedEmail,
    password,
    createdAt: firstNonEmptyString(user.createdAt, user.created_at) || new Date().toISOString(),
    notifications:
      user.notifications && typeof user.notifications === 'object'
        ? {
            app: user.notifications.app !== false,
            email: Boolean(user.notifications.email),
          }
        : {
            app: true,
            email: false,
          },
  };
}

function normalizeSessionUser(user) {
  if (!user || typeof user !== 'object') {
    return null;
  }

  const rawEmail = firstNonEmptyString(user.email, user.mail, user.correo);
  const normalizedEmail = rawEmail ? normalizeEmail(rawEmail) : '';
  const normalizedId = firstNonEmptyString(user.id, user.userId, user.uid) || buildUserId();
  const normalizedUsername = buildCompatibleUsername(
    firstNonEmptyString(user.username, user.usuario, user.user),
    normalizedEmail,
    normalizedId
  );

  return {
    ...user,
    id: normalizedId,
    username: normalizedUsername,
    name: firstNonEmptyString(user.name, user.nombre, user.displayName, user.username, user.usuario) || normalizedUsername,
    avatar: typeof user.avatar === 'string' ? user.avatar : '',
    email: normalizedEmail,
    password: undefined,
    createdAt: firstNonEmptyString(user.createdAt, user.created_at) || new Date().toISOString(),
    notifications:
      user.notifications && typeof user.notifications === 'object'
        ? {
            app: user.notifications.app !== false,
            email: Boolean(user.notifications.email),
          }
        : {
            app: true,
            email: false,
          },
  };
}

      function normalizeBackendUser(user) {
        if (!user || typeof user !== 'object') {
          return null;
        }

        const normalizedId = firstNonEmptyString(user.id, user.userId, user.uid) || buildUserId();
        const normalizedUsername = buildCompatibleUsername(
          firstNonEmptyString(user.username, user.usuario, user.user),
          firstNonEmptyString(user.email, user.mail, user.correo),
          normalizedId
        );

        return {
          ...user,
          id: normalizedId,
          username: normalizedUsername,
          name: firstNonEmptyString(user.name, user.nombre, user.displayName, normalizedUsername) || normalizedUsername,
          avatar: firstNonEmptyString(user.avatar, user.avatar_url) || '',
          email: firstNonEmptyString(user.email, user.mail, user.correo),
          createdAt: firstNonEmptyString(user.createdAt, user.created_at) || new Date().toISOString(),
          notifications: user.notifications && typeof user.notifications === 'object'
            ? {
                app: user.notifications.app !== false,
                email: Boolean(user.notifications.email),
              }
            : {
                app: Boolean(user.notifications_app ?? true),
                email: Boolean(user.notifications_email ?? false),
              },
        };
      }

      function mergeUsersByIdentity(primaryUsers, secondaryUsers) {
        const merged = new Map();

        [...primaryUsers, ...secondaryUsers].forEach((user) => {
          if (!user) {
            return;
          }

          const key = user.id || user.email || user.username;
          if (!key) {
            return;
          }

          merged.set(key, {
            ...(merged.get(key) || {}),
            ...user,
          });
        });

        return Array.from(merged.values());
      }

function normalizeUserRecord(user) {
  if (!user) {
    return null;
  }

  return typeof user.password === 'string'
    ? normalizeStoredUser(user)
    : normalizeBackendUser(user);
}

function dedupeUsers(users) {
  const seenKeys = new Set();

  return users.filter((user) => {
    const dedupeKey = user.email || user.username || user.id;
    if (!dedupeKey || seenKeys.has(dedupeKey)) {
      return false;
    }

    seenKeys.add(dedupeKey);
    return true;
  });
}

function userMatchesIdentifier(user, identifier) {
  if (!identifier) {
    return false;
  }

  return [user.email, user.username, normalizeUsername(user.name || '')].includes(identifier);
}

function validatePasswordRules(password) {
  if (password.length < 8) {
    throw new Error('La contraseña debe tener al menos 8 caracteres.');
  }

  if (!/[a-z]/.test(password)) {
    throw new Error('La contraseña debe incluir al menos una letra minúscula.');
  }

  if (!/[A-Z]/.test(password)) {
    throw new Error('La contraseña debe incluir al menos una letra mayúscula.');
  }

  if (!/\d/.test(password)) {
    throw new Error('La contraseña debe incluir al menos un número.');
  }
}

function validateRegistrationData({ username, name, email, password }) {
  const normalizedUsername = normalizeUsername(username);
  const normalizedEmail = normalizeEmail(email);
  const trimmedName = name.trim();

  if (!USERNAME_REGEX.test(normalizedUsername)) {
    throw new Error('El nombre de usuario debe tener 3-18 caracteres y solo usar letras minúsculas, números, punto o guion bajo.');
  }

  if (trimmedName.length < 2) {
    throw new Error('El nombre visible debe tener al menos 2 caracteres.');
  }

  if (!normalizedEmail.includes('@')) {
    throw new Error('Introduce un email válido.');
  }

  validatePasswordRules(password);

  return {
    normalizedUsername,
    normalizedEmail,
    trimmedName,
  };
}

function loadUsers() {
  try {
    const raw = localStorage.getItem(USERS_KEY);
    const parsed = raw ? JSON.parse(raw) : [];
    if (!Array.isArray(parsed)) {
      return [];
    }

    return dedupeUsers(parsed.map(normalizeStoredUser).filter(Boolean));
  } catch {
    return [];
  }
}

function loadSessionUser() {
  try {
    const raw = localStorage.getItem(SESSION_KEY);
    if (!raw) {
      return null;
    }
    
    const parsed = JSON.parse(raw);
    const normalizedSessionUser = normalizeSessionUser(parsed);
    if (!normalizedSessionUser) {
      // Si el usuario guardado está corrupto, limpiarlo
      localStorage.removeItem(SESSION_KEY);
      return null;
    }

    const storedUsers = loadUsers();
    return storedUsers.find((user) => user.id === normalizedSessionUser.id)
      || storedUsers.find((user) => user.email && user.email === normalizedSessionUser.email)
      || storedUsers.find((user) => user.username === normalizedSessionUser.username)
      || normalizedSessionUser;
  } catch {
    // Si hay error al cargar la sesión, limpiar datos corruptos
    localStorage.removeItem(SESSION_KEY);
    return null;
  }
}

function persistUsers(users) {
  localStorage.setItem(USERS_KEY, JSON.stringify(users));
}

function persistSession(user) {
  if (user) {
    // No almacenar la contraseña en localStorage por seguridad
    const { password, ...userWithoutPassword } = user;
    localStorage.setItem(SESSION_KEY, JSON.stringify(userWithoutPassword));
  } else {
    localStorage.removeItem(SESSION_KEY);
  }

  window.dispatchEvent(new Event(AUTH_CHANGE_EVENT));
}

function buildUserId() {
  if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
    return crypto.randomUUID();
  }

  return `${Date.now()}-${Math.floor(Math.random() * 100000)}`;
}

function useAuthState() {
  const [currentUser, setCurrentUser] = useState(loadSessionUser);
  const [users, setUsers] = useState(loadUsers);
  const hasHydratedBackendRef = useRef(false);
  const currentPasswordRef = useRef(null); // Guardar contraseña en memoria durante la sesión

  useEffect(() => {
    if (hasHydratedBackendRef.current) {
      return;
    }

    hasHydratedBackendRef.current = true;
    let cancelled = false;

    async function hydrateFromBackend() {
      try {
        const localUsers = loadUsers();
        let nextUsers = localUsers;

        if (hasApiBaseUrl()) {
          const [usersResponse, sessionResponse] = await Promise.all([
            requestJson('movimood.php', { params: { resource: 'auth', action: 'users' } }),
            requestJson('movimood.php', { params: { resource: 'auth', action: 'me' } }),
          ]);

          let backendUsers = Array.isArray(usersResponse?.items)
            ? usersResponse.items.map(normalizeBackendUser).filter(Boolean)
            : [];

          if (backendUsers.length === 0 && localUsers.length > 0) {
            const syncPayload = buildLocalSyncPayload();
            await requestJson('movimood.php', {
              params: { resource: 'sync' },
              method: 'POST',
              body: syncPayload,
            });

            const refetchedUsersResponse = await requestJson('movimood.php', { params: { resource: 'auth', action: 'users' } });
            backendUsers = Array.isArray(refetchedUsersResponse?.items)
              ? refetchedUsersResponse.items.map(normalizeBackendUser).filter(Boolean)
              : localUsers;
          }

          nextUsers = mergeUsersByIdentity(localUsers, backendUsers).map(normalizeUserRecord).filter(Boolean);

          if (!cancelled && nextUsers.length > 0) {
            persistUsers(nextUsers);
            setUsers(nextUsers);
          }

          const hydratedSessionUser = normalizeBackendUser(sessionResponse?.user);
          if (!cancelled && hydratedSessionUser) {
            const matchingUser = nextUsers.find((user) => user.id === hydratedSessionUser.id)
              || nextUsers.find((user) => user.username === hydratedSessionUser.username)
              || nextUsers.find((user) => user.email === hydratedSessionUser.email)
              || hydratedSessionUser;

            persistSession(matchingUser);
            setCurrentUser(matchingUser);
          }
        } else if (!cancelled) {
          setUsers(nextUsers);
        }
      } catch (error) {
        if (error?.status === 401) {
          if (!cancelled) {
            persistSession(null);
            setCurrentUser(null);
            setUsers(loadUsers());
          }
          return;
        }

        if (!cancelled) {
          setUsers(loadUsers());
        }
      } finally {
        if (!cancelled) {
          // Keep currentUser as the local session fallback when backend sync is unavailable.
        }
      }
    }

    hydrateFromBackend();

    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    function syncSession() {
      setCurrentUser(loadSessionUser());
    }

    window.addEventListener(AUTH_CHANGE_EVENT, syncSession);
    window.addEventListener('storage', syncSession);
    return () => {
      window.removeEventListener(AUTH_CHANGE_EVENT, syncSession);
      window.removeEventListener('storage', syncSession);
    };
  }, []);

  const register = useCallback(async ({ username, name, email, password }) => {
    const existingUsers = loadUsers();
    const { normalizedUsername, normalizedEmail, trimmedName } = validateRegistrationData({
      username,
      name,
      email,
      password,
    });

    if (existingUsers.some((user) => user.email === normalizedEmail)) {
      throw new Error('Ya existe una cuenta con ese email.');
    }

    if (existingUsers.some((user) => user.username === normalizedUsername)) {
      throw new Error('Ese nombre de usuario ya está en uso.');
    }

    const nextUser = {
      id: buildUserId(),
      username: normalizedUsername,
      name: trimmedName,
      avatar: '',
      email: normalizedEmail,
      password,
      createdAt: new Date().toISOString(),
    };

    if (hasApiBaseUrl()) {
      const response = await requestJson('movimood.php', {
        params: { resource: 'auth', action: 'register' },
        method: 'POST',
        body: {
          username: normalizedUsername,
          name: trimmedName,
          email: normalizedEmail,
          password,
        },
      });

      if (!response || typeof response !== 'object' || !response.user) {
        throw new Error('No se pudo crear la cuenta en el servidor.');
      }

      const serverUser = normalizeUserRecord(response.user);
      const nextUsers = [serverUser, ...existingUsers.filter((user) => user.id !== serverUser.id)];
      persistUsers(nextUsers);
      persistSession(serverUser);
      setUsers(nextUsers);
      setCurrentUser(serverUser);
      return serverUser;
    }

    const nextUsers = [...existingUsers, nextUser];
    persistUsers(nextUsers);
    setUsers(nextUsers);
    persistSession(nextUser);
    setCurrentUser(nextUser);
    return nextUser;
  }, []);

  const login = useCallback(async ({ identifier, password }) => {
    const normalizedIdentifier = identifier.trim().toLowerCase();

    if (!normalizedIdentifier || !password) {
      throw new Error('Debes indicar usuario/email y contraseña.');
    }

    if (hasApiBaseUrl()) {
      try {
        const loginResponse = await requestJson('movimood.php', {
          params: { resource: 'auth', action: 'login' },
          method: 'POST',
          body: {
            identifier: normalizedIdentifier,
            password,
          },
        });

        const backendUser = normalizeBackendUser(loginResponse?.user);
        if (!backendUser) {
          throw new Error('No se pudo iniciar sesión.');
        }

        const mergedUsers = mergeUsersByIdentity(loadUsers(), [backendUser]).map(normalizeUserRecord).filter(Boolean);
        persistUsers(mergedUsers);
        setUsers(mergedUsers);
        persistSession(backendUser);
        setCurrentUser(backendUser);
        currentPasswordRef.current = password; // Guardar contraseña en memoria

        return backendUser;
      } catch (error) {
        if (error?.status !== 401) {
          throw error;
        }
      }
    }

    const currentUsers = loadUsers();

    if (currentUsers.length === 0) {
      throw new Error('No hay cuentas guardadas en este navegador todavía.');
    }

    const matchingIdentityUser = currentUsers.find((user) => userMatchesIdentifier(user, normalizedIdentifier));
    if (!matchingIdentityUser) {
      throw new Error('No existe ninguna cuenta con ese email o usuario.');
    }

    const matchedUser = matchingIdentityUser.password === password ? matchingIdentityUser : null;

    if (!matchedUser) {
      throw new Error('La contraseña no coincide con esa cuenta.');
    }

    persistSession(matchedUser);
    setCurrentUser(matchedUser);
    currentPasswordRef.current = password; // Guardar contraseña en memoria

    return matchedUser;
  }, []);

  const recoverPasswordByEmail = useCallback(async (email) => {
    const normalizedEmail = normalizeEmail(email || '');
    if (!normalizedEmail || !normalizedEmail.includes('@')) {
      throw new Error('Introduce un email valido.');
    }

    const existingUsers = loadUsers();
    const existingUser = existingUsers.find((user) => user.email === normalizedEmail);

    if (!hasApiBaseUrl()) {
      if (!existingUser) {
        return {
          message: 'Si existe una cuenta con ese email, te hemos enviado instrucciones para recuperar la contraseña.',
        };
      }

      const tempPassword = `Movi${Math.floor(100000 + Math.random() * 900000)}A`;
      const updatedUsers = existingUsers.map((user) =>
        user.email === normalizedEmail ? { ...user, password: tempPassword } : user
      );
      persistUsers(updatedUsers);
      setUsers(updatedUsers);

      return {
        message: `Recuperacion completada. Contraseña temporal: ${tempPassword}`,
      };
    }

    const response = await requestJson('movimood.php', {
      params: { resource: 'auth', action: 'recover-password' },
      method: 'POST',
      body: { email: normalizedEmail },
    });

    if (existingUser && typeof response?.temporaryPassword === 'string' && response.temporaryPassword.trim()) {
      const updatedUsers = existingUsers.map((user) =>
        user.email === normalizedEmail
          ? { ...user, password: response.temporaryPassword.trim() }
          : user
      );
      persistUsers(updatedUsers);
      setUsers(updatedUsers);
    }

    const baseMessage = response?.message || 'Si existe una cuenta con ese email, te hemos enviado instrucciones para recuperar la contraseña.';
    if (response?.temporaryPassword) {
      return {
        message: baseMessage,
        temporaryPassword: response.temporaryPassword,
      };
    }

    if (response?.mailSent === false && typeof response?.error === 'string' && response.error.trim()) {
      return {
        message: baseMessage,
        mailSent: false,
        mailError: response.error.trim(),
      };
    }

    return { message: baseMessage };
  }, []);

  const logout = useCallback(() => {
    persistSession(null);
    setCurrentUser(null);
    currentPasswordRef.current = null; // Limpiar contraseña en memoria

    if (hasApiBaseUrl()) {
      void requestJson('movimood.php', {
        params: { resource: 'auth', action: 'logout' },
        method: 'POST',
      }).catch(() => {});
    }
  }, []);

  const updateCurrentUser = useCallback((patch) => {
    setCurrentUser((prevUser) => {
      if (!prevUser) {
        return prevUser;
      }

      const nextUser = { ...prevUser, ...patch };
      const nextUsers = loadUsers().map((user) =>
        user.id === prevUser.id ? { ...user, ...patch } : user
      );
      persistUsers(nextUsers);
      setUsers(nextUsers);
      persistSession(nextUser);

      if (hasApiBaseUrl()) {
        void requestJson('movimood.php', {
          params: { resource: 'auth', action: 'update' },
          method: 'POST',
          body: {
            name: nextUser.name,
            username: nextUser.username,
            email: nextUser.email,
            avatar: nextUser.avatar,
            notifications: nextUser.notifications,
          },
        })
          .then((response) => {
            const hydratedUser = normalizeBackendUser(response?.user);
            if (!hydratedUser) {
              return;
            }

            const mergedUsers = mergeUsersByIdentity(loadUsers(), [hydratedUser]).map(normalizeUserRecord).filter(Boolean);
            persistUsers(mergedUsers);
            setUsers(mergedUsers);
            persistSession(hydratedUser);
            setCurrentUser(hydratedUser);
          })
          .catch(() => {});
      }

      return nextUser;
    });
  }, []);

  const getUserById = useCallback((id) => {
    if (!id) {
      return null;
    }

    const normalizedId = String(id);
    return users.find((user) => {
      if (!user) {
        return false;
      }

      return String(user.id) === normalizedId
        || String(user.username || '') === normalizedId
        || String(user.email || '') === normalizedId;
    }) || null;
  }, [users]);

  const getPublicUsers = useCallback(() => {
    return users;
  }, [users]);

  const updateAccountSettings = useCallback(({ name, username, email, avatar, notifications }) => {
    setCurrentUser((prevUser) => {
      if (!prevUser) {
        throw new Error('Debes iniciar sesión para editar tu cuenta.');
      }

      const existingUsers = loadUsers();
      const normalizedUsername = normalizeUsername(username || prevUser.username);
      const normalizedEmail = normalizeEmail(email || prevUser.email);
      const trimmedName = (name || prevUser.name).trim();

      if (!USERNAME_REGEX.test(normalizedUsername)) {
        throw new Error('El nombre de usuario debe tener 3-18 caracteres y solo usar letras minúsculas, números, punto o guion bajo.');
      }

      if (trimmedName.length < 2) {
        throw new Error('El nombre visible debe tener al menos 2 caracteres.');
      }

      if (!normalizedEmail.includes('@')) {
        throw new Error('Introduce un email válido.');
      }

      if (existingUsers.some((user) => user.id !== prevUser.id && user.username === normalizedUsername)) {
        throw new Error('Ese nombre de usuario ya está en uso.');
      }

      if (existingUsers.some((user) => user.id !== prevUser.id && user.email === normalizedEmail)) {
        throw new Error('Ya existe una cuenta con ese email.');
      }

      const nextUser = {
        ...prevUser,
        name: trimmedName,
        username: normalizedUsername,
        email: normalizedEmail,
        avatar: typeof avatar === 'string' ? avatar : prevUser.avatar,
        notifications: notifications || prevUser.notifications || {
          app: true,
          email: false,
        },
      };

      const nextUsers = existingUsers.map((user) => (user.id === prevUser.id ? nextUser : user));
      persistUsers(nextUsers);
      setUsers(nextUsers);
      persistSession(nextUser);

      if (hasApiBaseUrl()) {
        void requestJson('movimood.php', {
          params: { resource: 'auth', action: 'update' },
          method: 'POST',
          body: {
            name: nextUser.name,
            username: nextUser.username,
            email: nextUser.email,
            avatar: nextUser.avatar,
            notifications: nextUser.notifications,
          },
        })
          .then((response) => {
            const hydratedUser = normalizeBackendUser(response?.user);
            if (!hydratedUser) {
              return;
            }

            const mergedUsers = mergeUsersByIdentity(loadUsers(), [hydratedUser]).map(normalizeUserRecord).filter(Boolean);
            persistUsers(mergedUsers);
            setUsers(mergedUsers);
            persistSession(hydratedUser);
            setCurrentUser(hydratedUser);
          })
          .catch(() => {});
      }

      return nextUser;
    });
  }, []);

  const changeCurrentUserPassword = useCallback(async ({ currentPassword, newPassword, confirmPassword }) => {
    if (!currentUser) {
      throw new Error('Debes iniciar sesión para cambiar la contraseña.');
    }

    if (newPassword !== confirmPassword) {
      throw new Error('La nueva contraseña y su confirmación no coinciden.');
    }

    validatePasswordRules(newPassword);

    if (!hasApiBaseUrl()) {
      throw new Error('No se puede cambiar la contraseña sin conexión al servidor.');
    }

    // Validate and update password via backend
    const response = await requestJson('movimood.php', {
      params: { resource: 'auth', action: 'password' },
      method: 'POST',
      body: {
        currentPassword,
        newPassword,
        confirmPassword,
      },
    });

    if (response?.success) {
      // Update local user data with updated backend info
      const hydratedUser = normalizeBackendUser(response?.user);
      if (hydratedUser) {
        const mergedUsers = mergeUsersByIdentity(loadUsers(), [hydratedUser]).map(normalizeUserRecord).filter(Boolean);
        persistUsers(mergedUsers);
        setUsers(mergedUsers);
        persistSession(hydratedUser);
        setCurrentUser(hydratedUser);
      }
    } else {
      throw new Error(response?.error || 'No se pudo cambiar la contraseña.');
    }
  }, [currentUser]);

  return {
    currentUser,
    isAuthenticated: Boolean(currentUser),
    register,
    login,
    recoverPasswordByEmail,
    logout,
    updateCurrentUser,
    updateAccountSettings,
    changeCurrentUserPassword,
    getUserById,
    getPublicUsers,
  };
}

export function AuthProvider({ children }) {
  const auth = useAuthState();

  return <AuthContext.Provider value={auth}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const auth = useContext(AuthContext);

  if (!auth) {
    throw new Error('useAuth debe usarse dentro de AuthProvider.');
  }

  return auth;
}