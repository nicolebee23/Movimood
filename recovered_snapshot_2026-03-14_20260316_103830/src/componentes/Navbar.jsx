import { useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { Link } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import './Navbar.css';

function getInitials(name) {
  return (name || 'MM')
    .split(' ')
    .filter(Boolean)
    .slice(0, 2)
    .map((chunk) => chunk[0]?.toUpperCase())
    .join('') || 'MM';
}

function Navbar() {
  const { currentUser, logout } = useAuth();
  const [isProfileMenuOpen, setIsProfileMenuOpen] = useState(false);
  const [isAccessModalOpen, setIsAccessModalOpen] = useState(false);
  const profileMenuRef = useRef(null);

  useEffect(() => {
    if (!isProfileMenuOpen) {
      return undefined;
    }

    function handleClickOutside(event) {
      if (profileMenuRef.current && !profileMenuRef.current.contains(event.target)) {
        setIsProfileMenuOpen(false);
      }
    }

    function handleEscape(event) {
      if (event.key === 'Escape') {
        setIsProfileMenuOpen(false);
      }
    }

    document.addEventListener('mousedown', handleClickOutside);
    document.addEventListener('keydown', handleEscape);

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('keydown', handleEscape);
    };
  }, [isProfileMenuOpen]);

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

  function closeProfileMenu() {
    setIsProfileMenuOpen(false);
  }

  function toggleProfileMenu() {
    setIsProfileMenuOpen((prevState) => !prevState);
  }

  function handleLogout() {
    closeProfileMenu();
    logout();
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

        <p className="navbar-access-modal-kicker">Acceso rapido</p>
        <h3 id="navbar-access-modal-title">Tu plan de peli empieza iniciando sesion</h3>
        <p className="navbar-access-modal-copy">
          Entra a tu cuenta para desbloquear el cuestionario y recibir recomendaciones personalizadas.
        </p>

        <div className="navbar-access-modal-actions">
          <Link to="/login" className="navbar-access-modal-btn primary" onClick={closeAccessModal}>
            Iniciar Sesion
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

          <div className="navbar-menu">
            <Link to="/" className="navbar-link">Inicio</Link>
            <Link to="/cuestionario" className="navbar-link" onClick={handleQuestionnaireClick}>Cuestionario</Link>
            {currentUser && (
              <div className="navbar-profile" ref={profileMenuRef}>
                <button
                  type="button"
                  className="navbar-profile-trigger"
                  onClick={toggleProfileMenu}
                  aria-haspopup="menu"
                  aria-expanded={isProfileMenuOpen}
                  aria-label="Abrir menú de perfil"
                >
                  <span className="navbar-welcome">
                    {currentUser.avatar ? (
                      <img
                        className="navbar-avatar"
                        src={currentUser.avatar}
                        alt={`Avatar de ${currentUser.name}`}
                      />
                    ) : (
                      <span className="navbar-avatar navbar-avatar-fallback" aria-hidden="true">
                        {getInitials(currentUser.name)}
                      </span>
                    )}
                    <span>Hola, {currentUser.name}</span>
                  </span>
                  <span className={`navbar-profile-caret${isProfileMenuOpen ? ' abierto' : ''}`} aria-hidden="true">▾</span>
                </button>

                {isProfileMenuOpen && (
                  <div className="navbar-profile-dropdown" role="menu">
                    <div className="navbar-profile-header">
                      <strong>{currentUser.name}</strong>
                      <span>@{currentUser.username}</span>
                    </div>

                    <Link to={`/perfil/${currentUser.id}`} className="navbar-profile-item" role="menuitem" onClick={closeProfileMenu}>
                      Mi perfil
                    </Link>
                    <Link to="/configuracion" className="navbar-profile-item" role="menuitem" onClick={closeProfileMenu}>
                      Configuracion
                    </Link>
                    <Link to="/videoteca" className="navbar-profile-item" role="menuitem" onClick={closeProfileMenu}>
                      Mi videoteca
                    </Link>
                    <Link to="/cuestionario" className="navbar-profile-item" role="menuitem" onClick={closeProfileMenu}>
                      Descubrir película
                    </Link>

                    <div className="navbar-profile-separator" />

                    <button
                      type="button"
                      className="navbar-profile-item navbar-profile-item-danger"
                      role="menuitem"
                      onClick={handleLogout}
                    >
                      Cerrar sesión
                    </button>
                  </div>
                )}
              </div>
            )}
            {!currentUser && (
              <Link to="/login" className="navbar-link-boton">Iniciar Sesión</Link>
            )}
          </div>
        </div>
      </nav>
      {typeof document !== 'undefined' ? createPortal(accessModal, document.body) : null}
    </>
  );
}

export default Navbar;