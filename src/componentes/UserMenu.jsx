import { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

function UserMenu({ currentUser, logout }) {
  const [open, setOpen] = useState(false);
  const ref = useRef(null);
  const navigate = useNavigate();
  const displayName = (currentUser?.name || currentUser?.username || 'Perfil').split(' ')[0];
  const avatarInitial = displayName.charAt(0).toUpperCase() || 'M';

  useEffect(() => {
    function handleOutside(e) {
      if (ref.current && !ref.current.contains(e.target)) setOpen(false);
    }
    function handleKey(e) {
      if (e.key === 'Escape') setOpen(false);
    }
    window.addEventListener('mousedown', handleOutside);
    window.addEventListener('keydown', handleKey);
    return () => {
      window.removeEventListener('mousedown', handleOutside);
      window.removeEventListener('keydown', handleKey);
    };
  }, []);

  function ir(ruta) {
    setOpen(false);
    navigate(ruta);
  }

  return (
    <div className="wizard-user-menu" ref={ref} style={{ position: 'relative' }}>
      <button
        type="button"
        className="wizard-user-chip"
        onClick={() => setOpen((s) => !s)}
        aria-haspopup="true"
        aria-expanded={open}
        aria-label="Abrir menú de usuario"
      >
        {currentUser?.avatar ? (
          <img className="wizard-user-avatar" src={currentUser.avatar} alt={`Avatar de ${displayName}`} />
        ) : (
          <span className="wizard-user-avatar wizard-user-avatar-fallback" aria-hidden="true">{avatarInitial}</span>
        )}
        <span className="wizard-user-name">{displayName}</span>
        <span className="wizard-user-caret">▾</span>
      </button>

      {open && (
        <ul
          className="user-dropdown"
          role="menu"
          style={{
            position: 'absolute',
            top: 'calc(100% + 8px)',
            right: 0,
            zIndex: 9999,
            minWidth: '200px',
            background: 'rgba(8, 15, 28, 0.96)',
            border: '1px solid rgba(255,255,255,0.12)',
            borderRadius: '14px',
            padding: '8px',
            listStyle: 'none',
            margin: 0,
            backdropFilter: 'blur(12px)',
            boxShadow: '0 16px 40px rgba(0,0,0,0.5)',
          }}
        >
        
          <li role="none">
            <button type="button" role="menuitem" className="user-dropdown-item" onClick={() => ir('/perfil')}>
              <span className="menu-icon">
                <svg className="neon-menu neon-profile" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <circle cx="12" cy="8" r="3" stroke="currentColor" strokeWidth="1.6" />
                  <path d="M4 20c0-3.3 2.7-6 6-6h4c3.3 0 6 2.7 6 6" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              </span>
              Mi perfil
            </button>
          </li>
          <li role="none">
            <button type="button" role="menuitem" className="user-dropdown-item" onClick={() => ir('/videoteca')}>
              <span className="menu-icon">
                <svg className="neon-menu neon-videoteca" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <rect x="2" y="5" width="20" height="14" rx="2" stroke="currentColor" strokeWidth="1.6" />
                  <rect x="7" y="8" width="3" height="3" fill="currentColor" />
                  <rect x="14" y="8" width="3" height="3" fill="currentColor" />
                </svg>
              </span>
              Mi videoteca
            </button>
          </li>
          <li role="none">
            <button type="button" role="menuitem" className="user-dropdown-item" onClick={() => ir('/cuestionario')}>
              <span className="menu-icon">
                <svg className="neon-menu neon-discover" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path d="M12 2l1.8 4.6L18.8 8l-4 3.1L15 18l-3-1.9L9 18l.2-6.9L5 8l4-1.4L12 2z" stroke="currentColor" strokeWidth="0.9" fill="currentColor" />
                </svg>
              </span>
              Descubrir película
            </button>
          </li>
           <li role="none">
        <button type="button" role="menuitem" className="user-dropdown-item" onClick={() => ir('/configuracion')}>
            <span className="menu-icon">
              <svg className="neon-menu neon-gear" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M12 15.5A3.5 3.5 0 1 0 12 8.5a3.5 3.5 0 0 0 0 7z" stroke="currentColor" strokeWidth="1.4" />
                <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 1 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 1 1-4 0v-.09a1.65 1.65 0 0 0-1-1.51 1.65 1.65 0 0 0-1.82.33l-.06.06A2 2 0 1 1 2.3 16.9l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 1 1 0-4h.09c.7 0 1.28-.45 1.51-1a1.65 1.65 0 0 0-.33-1.82L4.34 5.7A2 2 0 1 1 7.17 2.87l.06.06c.45.45 1.24.58 1.82.33.55-.23 1-0.81 1-1.51V2a2 2 0 1 1 4 0v.09c0 .7.45 1.28 1 1.51.58.25 1.37.12 1.82-.33l.06-.06A2 2 0 1 1 21.7 4.34l-.06.06c-.23.55-.81 1-1.51 1H19a1.65 1.65 0 0 0-1.51 1c-.23.55-.12 1.37.33 1.82l.06.06A1.65 1.65 0 0 0 19 9.4V9a2 2 0 1 1 0 4v.1c0 .7.45 1.28 1 1.51z" stroke="currentColor" strokeWidth="0.9" />
              </svg>
            </span>
            Configuración
            </button>
            </li>
          <li className="user-dropdown-sep" aria-hidden="true" style={{ borderTop: '1px solid rgba(255,255,255,0.08)', margin: '6px 0' }}></li>
          <li role="none">
            <button type="button" role="menuitem" className="user-dropdown-item user-dropdown-logout" onClick={() => { logout(); setOpen(false); navigate('/'); }}>
              <span className="menu-icon">
                <svg className="neon-menu neon-logout" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path d="M16 17l5-5-5-5" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
                  <path d="M21 12H9" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
                  <path d="M13 5H6a2 2 0 0 0-2 2v10a2 2 0 0 0 2 2h7" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              </span>
              Cerrar sesión
            </button>
          </li>
        </ul>
      )}
    </div>
  );
}

export default UserMenu;