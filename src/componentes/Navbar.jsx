import { useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import UserMenu from './UserMenu';
import './Navbar.css';

function normalizeNotificationItem(item, index = 0) {
  if (!item || typeof item !== 'object') {
    return null;
  }

  const type = typeof item.type === 'string' && item.type.trim() ? item.type.trim().toLowerCase() : 'update';
  const message = typeof item.message === 'string' && item.message.trim()
    ? item.message.trim()
    : 'Tienes una nueva actividad en tu cuenta.';

  return {
    id: item.id || `${type}-${index}`,
    type,
    message,
    timeLabel: typeof item.timeLabel === 'string' && item.timeLabel.trim() ? item.timeLabel.trim() : 'Ahora',
    unread: item.unread !== false,
  };
}

function getNotificationIcon(type) {
  switch (type) {
    case 'follow':
      return '👥';
    case 'like':
      return '❤️';
    case 'comment':
      return '💬';
    default:
      return '🔔';
  }
}

function Navbar() {
  const navigate = useNavigate();
  const { currentUser, logout } = useAuth();
  const [isNotificationsOpen, setIsNotificationsOpen] = useState(false);
  const [isAccessModalOpen, setIsAccessModalOpen] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [searchInput, setSearchInput] = useState('');
  // visual-only: no selector shown, search defaults to automatic on backend
  const searchType = 'auto';
  const profileMenuRef = useRef(null);

  useEffect(() => {
    if (!isNotificationsOpen) {
      return undefined;
    }

    function handleClickOutside(event) {
      if (profileMenuRef.current && !profileMenuRef.current.contains(event.target)) {
        setIsNotificationsOpen(false);
      }
    }

    function handleEscape(event) {
      if (event.key === 'Escape') {
        setIsNotificationsOpen(false);
      }
    }

    document.addEventListener('mousedown', handleClickOutside);
    document.addEventListener('keydown', handleEscape);

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('keydown', handleEscape);
    };
  }, [isNotificationsOpen]);

  useEffect(() => {
    if (!isAccessModalOpen) {
      return undefined;
    }

    function handleEscape(event) {
      if (event.key === 'Escape') {
        setIsAccessModalOpen(false);
      }
    }

    document.addEventListener('keydown', handleEscape);
    return () => {
      document.removeEventListener('keydown', handleEscape);
    };
  }, [isAccessModalOpen]);

  function handleSearchChange(event) {
    setSearchInput(event.target.value);
  }

  function handleSearchKeyDown(event) {
    if (event.key === 'Enter' && searchInput.trim()) {
      event.preventDefault();
      navigate(`/buscar?type=${encodeURIComponent(searchType)}&q=${encodeURIComponent(searchInput.trim())}`);
      setSearchInput('');
    }
  }

  function handleSearchClick() {
    if (searchInput.trim()) {
      navigate(`/buscar?type=${encodeURIComponent(searchType)}&q=${encodeURIComponent(searchInput.trim())}`);
      setSearchInput('');
    }
  }

  function closeMobileMenu() {
    setIsMobileMenuOpen(false);
  }

  function handleLogout() {
    logout();
    closeMobileMenu();
    setIsNotificationsOpen(false);
    navigate('/');
  }

  function toggleNotificationsPanel() {
    setIsNotificationsOpen((prevState) => !prevState);
  }

  function toggleMobileMenu() {
    setIsNotificationsOpen(false);
    setIsMobileMenuOpen((prevState) => !prevState);
  }

  function handleQuestionnaireClick(event) {
    if (currentUser) {
      return;
    }

    event.preventDefault();
    setIsAccessModalOpen(true);
  }

  function closeAccessModal() {
    setIsAccessModalOpen(false);
  }

  const unreadNotifications = Number(
    currentUser?.unreadNotifications ?? currentUser?.notifications?.unread ?? 0
  );

  const safeUnreadNotifications = Number.isFinite(unreadNotifications)
    ? Math.max(0, unreadNotifications)
    : 0;

  const followersCount = Number(
    currentUser?.followersCount ?? currentUser?.seguidoresCount ?? currentUser?.followers?.length ?? 0
  );

  const safeFollowersCount = Number.isFinite(followersCount)
    ? Math.max(0, followersCount)
    : 0;

  const rawNotificationItems = Array.isArray(currentUser?.notificationItems)
    ? currentUser.notificationItems
    : Array.isArray(currentUser?.notifications?.items)
      ? currentUser.notifications.items
      : [];

  const normalizedNotificationItems = rawNotificationItems
    .map((item, index) => normalizeNotificationItem(item, index))
    .filter(Boolean);

  const fallbackNotificationItems = [
    safeFollowersCount > 0
      ? {
          id: 'followers-summary',
          type: 'follow',
          message: safeFollowersCount === 1
            ? 'Alguien empezo a seguirte.'
            : `Tienes ${safeFollowersCount} seguidores en tu perfil.`,
          timeLabel: 'Reciente',
          unread: safeUnreadNotifications > 0,
        }
      : null,
    {
      id: 'account-update',
      type: 'update',
      message: 'Tu panel de notificaciones ya esta activo. Pronto mostraremos actividad en tiempo real.',
      timeLabel: 'Ahora',
      unread: false,
    },
  ].filter(Boolean);

  const notificationItems = normalizedNotificationItems.length > 0
    ? normalizedNotificationItems
    : fallbackNotificationItems;

  const accessModal = isAccessModalOpen && !currentUser ? (
    <div className="navbar-access-modal-overlay" onClick={closeAccessModal} role="presentation">
      <div
        className="navbar-access-modal"
        role="dialog"
        aria-modal="true"
        aria-labelledby="navbar-access-modal-title"
        onClick={(event) => event.stopPropagation()}
      >
        <button
          type="button"
          className="navbar-access-modal-close"
          aria-label="Cerrar modal"
          onClick={closeAccessModal}
        >
          ×
        </button>

        <p className="navbar-access-modal-kicker">Acceso rápido</p>
        <h3 id="navbar-access-modal-title">Tu plan de peli empieza iniciando sesión</h3>
        <p className="navbar-access-modal-copy">
          Entra a tu cuenta para desbloquear el cuestionario y recibir recomendaciones personalizadas.
        </p>

        <div className="navbar-access-modal-actions">
          <Link to="/login" state={{ from: '/cuestionario' }} className="navbar-access-modal-btn primary" onClick={closeAccessModal}>
            Iniciar Sesión
          </Link>
          <Link to="/registro" className="navbar-access-modal-btn secondary" onClick={closeAccessModal}>
            Crear cuenta
          </Link>
        </div>
      </div>
    </div>
  ) : null;

  return (
    <>
      <nav className="navbar">
        <div className="navbar-contenido">
          <Link to="/" className="navbar-logo">
            🎬 MoviMood
          </Link>

          <div className="navbar-search">
            <div className="navbar-search-container">
              <input
                type="text"
                className="navbar-search-input"
                placeholder="Buscar..."
                value={searchInput}
                onChange={handleSearchChange}
                onKeyDown={handleSearchKeyDown}
                aria-label="Buscar"
              />
              <button
                type="button"
                className="navbar-search-button"
                aria-label="Buscar"
                onClick={handleSearchClick}
              >
                🔍
              </button>
            </div>
          </div>

          <button
            type="button"
            className="navbar-mobile-toggle"
            aria-label="Abrir menú principal"
            aria-expanded={isMobileMenuOpen}
            onClick={toggleMobileMenu}
          >
            <span />
            <span />
            <span />
          </button>

          <div className={`navbar-menu${isMobileMenuOpen ? ' abierto' : ''}`}>
            <Link to="/" className="navbar-link" onClick={closeMobileMenu}>Inicio</Link>
            <Link to="/explorar" className="navbar-link" onClick={closeMobileMenu}>Explorar</Link>
            <Link to="/cuestionario" className="navbar-link" onClick={(event) => { handleQuestionnaireClick(event); closeMobileMenu(); }}>Cuestionario</Link>
            {currentUser && (
              <div className="navbar-profile" ref={profileMenuRef}>
                <button
                  type="button"
                  className="navbar-notifications navbar-notifications-standalone"
                  onClick={toggleNotificationsPanel}
                  aria-haspopup="dialog"
                  aria-expanded={isNotificationsOpen}
                  aria-controls="navbar-notifications-dropdown"
                  aria-label={
                    safeUnreadNotifications > 0
                      ? `${safeUnreadNotifications} notificaciones nuevas`
                      : 'Sin notificaciones nuevas'
                  }
                  title={
                    safeUnreadNotifications > 0
                      ? `${safeUnreadNotifications} notificaciones nuevas`
                      : 'Sin notificaciones nuevas'
                  }
                >
                  <span className="navbar-notifications-icon" aria-hidden="true">🔔</span>
                  {safeUnreadNotifications > 0 && (
                    <span className="navbar-notifications-badge" aria-hidden="true">
                      {safeUnreadNotifications > 99 ? '99+' : safeUnreadNotifications}
                    </span>
                  )}
                </button>

                {isNotificationsOpen && (
                  <div
                    id="navbar-notifications-dropdown"
                    className="navbar-notifications-dropdown"
                    role="dialog"
                    aria-label="Notificaciones"
                  >
                    <div className="navbar-notifications-header">
                      <strong>Notificaciones</strong>
                      <span>
                        {safeUnreadNotifications > 0
                          ? `${safeUnreadNotifications} nuevas`
                          : 'Sin novedades'}
                      </span>
                    </div>

                    <div className="navbar-notifications-content">
                      {notificationItems.length > 0 ? (
                        <ul className="navbar-notifications-list">
                          {notificationItems.map((item) => (
                            <li
                              key={item.id}
                              className={`navbar-notification-item${item.unread ? ' unread' : ''}`}
                            >
                              <span className="navbar-notification-icon" aria-hidden="true">
                                {getNotificationIcon(item.type)}
                              </span>
                              <div className="navbar-notification-body">
                                <p>{item.message}</p>
                                <span>{item.timeLabel}</span>
                              </div>
                            </li>
                          ))}
                        </ul>
                      ) : (
                        <p>No hay notificaciones nuevas por ahora.</p>
                      )}
                    </div>
                  </div>
                )}

              </div>
            )}
            {!currentUser && (
              <Link to="/login" state={{ from: '/perfil' }} className="navbar-link-boton" onClick={closeMobileMenu}>Iniciar Sesión</Link>
            )}
          </div>

          {currentUser && (
            <div className="navbar-user-menu">
              <UserMenu currentUser={currentUser} logout={handleLogout} />
            </div>
          )}
        </div>
      </nav>
      {typeof document !== 'undefined' ? createPortal(accessModal, document.body) : null}
    </>
  );
}

export default Navbar;
