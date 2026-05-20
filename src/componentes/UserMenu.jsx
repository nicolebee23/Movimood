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
              <span className="menu-icon">👤</span>
              Mi perfil
            </button>
          </li>
          <li role="none">
            <button type="button" role="menuitem" className="user-dropdown-item" onClick={() => ir('/videoteca')}>
              <span className="menu-icon">🎞️</span>
              Mi videoteca
            </button>
          </li>
          <li role="none">
            <button type="button" role="menuitem" className="user-dropdown-item" onClick={() => ir('/cuestionario')}>
              <span className="menu-icon">✦</span>
              Descubrir película
            </button>
          </li>
           <li role="none">
        <button type="button" role="menuitem" className="user-dropdown-item" onClick={() => ir('/configuracion')}>
            <span className="menu-icon">⚙️</span>
            Configuración
            </button>
            </li>
          <li className="user-dropdown-sep" aria-hidden="true" style={{ borderTop: '1px solid rgba(255,255,255,0.08)', margin: '6px 0' }}></li>
          <li role="none">
            <button type="button" role="menuitem" className="user-dropdown-item user-dropdown-logout" onClick={() => { logout(); setOpen(false); }}>
              <span className="menu-icon">⛔</span>
              Cerrar sesión
            </button>
          </li>
        </ul>
      )}
    </div>
  );
}

export default UserMenu;