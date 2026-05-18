import { useCallback, useEffect, useState } from 'react';

const USERS_KEY = 'movimood-users';
const SESSION_KEY = 'movimood-session-user';
const AUTH_CHANGE_EVENT = 'movimood-auth-change';

const USERNAME_REGEX = /^[a-z0-9._]{3,18}$/;

function normalizeEmail(email) {
  return email.trim().toLowerCase();
}

function normalizeUsername(username) {
  return username.trim().toLowerCase();
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
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

function loadSessionUser() {
  try {
    const raw = localStorage.getItem(SESSION_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

function persistUsers(users) {
  localStorage.setItem(USERS_KEY, JSON.stringify(users));
}

function persistSession(user) {
  if (user) {
    localStorage.setItem(SESSION_KEY, JSON.stringify(user));
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

export function useAuth() {
  const [currentUser, setCurrentUser] = useState(loadSessionUser);

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

  const register = useCallback(({ username, name, email, password }) => {
    const users = loadUsers();
    const { normalizedUsername, normalizedEmail, trimmedName } = validateRegistrationData({
      username,
      name,
      email,
      password,
    });

    if (users.some((user) => user.email === normalizedEmail)) {
      throw new Error('Ya existe una cuenta con ese email.');
    }

    if (users.some((user) => user.username === normalizedUsername)) {
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

    const nextUsers = [...users, nextUser];
    persistUsers(nextUsers);
    persistSession(nextUser);
    setCurrentUser(nextUser);
    return nextUser;
  }, []);

  const login = useCallback(({ identifier, password }) => {
    const users = loadUsers();
    const normalizedIdentifier = identifier.trim().toLowerCase();
    const matchedUser = users.find(
      (user) =>
        (user.email === normalizedIdentifier || user.username === normalizedIdentifier) &&
        user.password === password
    );

    if (!matchedUser) {
      throw new Error('Usuario/email o contraseña incorrectos.');
    }

    persistSession(matchedUser);
    setCurrentUser(matchedUser);
    return matchedUser;
  }, []);

  const logout = useCallback(() => {
    persistSession(null);
    setCurrentUser(null);
  }, []);

  const updateCurrentUser = useCallback((patch) => {
    setCurrentUser((prevUser) => {
      if (!prevUser) {
        return prevUser;
      }

      const nextUser = { ...prevUser, ...patch };
      const users = loadUsers().map((user) =>
        user.id === prevUser.id ? { ...user, ...patch } : user
      );
      persistUsers(users);
      persistSession(nextUser);
      return nextUser;
    });
  }, []);

  const getUserById = useCallback((id) => {
    if (!id) {
      return null;
    }

    const users = loadUsers();
    return users.find((user) => user.id === id) || null;
  }, []);

  const getPublicUsers = useCallback(() => {
    return loadUsers();
  }, []);

  const updateAccountSettings = useCallback(({ name, username, email, avatar, notifications }) => {
    setCurrentUser((prevUser) => {
      if (!prevUser) {
        throw new Error('Debes iniciar sesión para editar tu cuenta.');
      }

      const users = loadUsers();
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

      if (users.some((user) => user.id !== prevUser.id && user.username === normalizedUsername)) {
        throw new Error('Ese nombre de usuario ya está en uso.');
      }

      if (users.some((user) => user.id !== prevUser.id && user.email === normalizedEmail)) {
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

      const nextUsers = users.map((user) => (user.id === prevUser.id ? nextUser : user));
      persistUsers(nextUsers);
      persistSession(nextUser);
      return nextUser;
    });
  }, []);

  const changeCurrentUserPassword = useCallback(({ currentPassword, newPassword, confirmPassword }) => {
    setCurrentUser((prevUser) => {
      if (!prevUser) {
        throw new Error('Debes iniciar sesión para cambiar la contraseña.');
      }

      if (prevUser.password !== currentPassword) {
        throw new Error('La contraseña actual no es correcta.');
      }

      if (newPassword !== confirmPassword) {
        throw new Error('La nueva contraseña y su confirmación no coinciden.');
      }

      validatePasswordRules(newPassword);

      const nextUser = { ...prevUser, password: newPassword };
      const nextUsers = loadUsers().map((user) => (user.id === prevUser.id ? nextUser : user));
      persistUsers(nextUsers);
      persistSession(nextUser);
      return nextUser;
    });
  }, []);

  return {
    currentUser,
    isAuthenticated: Boolean(currentUser),
    register,
    login,
    logout,
    updateCurrentUser,
    updateAccountSettings,
    changeCurrentUserPassword,
    getUserById,
    getPublicUsers,
  };
}