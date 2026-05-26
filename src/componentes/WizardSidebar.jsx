import { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';

const menuLinks = [
  { label: 'Inicio', to: '/', icon: '⌂' },
  { label: 'Explorar', to: '/explorar', icon: '◎' },
  { label: 'Cuestionario', to: '/cuestionario', icon: '✦' },
  { label: 'Mi videoteca', to: '/videoteca', icon: '☰' },
  { label: 'Mood', to: '/mood', icon: '◌' },
  { label: 'Perfil', to: '/perfil', icon: '◯' },
];

function WizardSidebar({ activeLabel = null, footerText = 'Responde el cuestionario y te damos películas hechas para tu mood.', hideLinks = [], sidebarClassName = '' }) {
  const { currentUser } = useAuth();
  const [isOpen, setIsOpen] = useState(false);
  const location = useLocation();
  // Match visible links and behavior used on Home: hide 'Mood' entirely,
  // and hide personal links when not logged in.
  const visibleLinks = menuLinks.filter((link) => {
    if (['Mood'].includes(link.label)) {
      return false;
    }

    if (!currentUser && ['Mi videoteca', 'Perfil'].includes(link.label)) {
      return false;
    }

    return true;
  });

  const comunidadLinks = [
    {
      label: 'Colecciones',
      to: '/colecciones',
      icon: (
        <svg className="sidebar-icon-svg" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
          <path d="M3 7h4l2 3h10a2 2 0 0 1 2 2v5a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V7z" />
          <path d="M3 7V5a2 2 0 0 1 2-2h4l2 3" />
        </svg>
      ),
    },
  ];
  // If user is logged, append comunidad links to the main visible links
  const finalVisibleLinks = currentUser ? [...visibleLinks, ...comunidadLinks] : visibleLinks;
  return (
    <aside className={`cuestionario-sidebar home-sidebar${isOpen ? ' open' : ''} ${sidebarClassName || ''}`}>
      <div className="sidebar-shell">
        <div className="sidebar-top">
          <div className="sidebar-brand">
            <div className="brand-mark">M</div>
            <div>
              <p className="brand-title">MoviMood</p>
              <p className="brand-subtitle">Tu cine personalizado</p>
            </div>
          </div>
          <button
            type="button"
            className="sidebar-toggle"
            aria-expanded={isOpen}
            aria-controls="wizard-sidebar-panel"
            onClick={() => setIsOpen((value) => !value)}
          >
            <span className="sidebar-toggle-icon" aria-hidden="true">☰</span>
            <span className="sidebar-toggle-text">Menú</span>
          </button>
        </div>
        <div id="wizard-sidebar-panel" className={`sidebar-panel${isOpen ? ' open' : ''}`}>
          <nav className="sidebar-nav" aria-label="Navegación principal">
            {finalVisibleLinks.map((link) => {
                // Determine active state. Prefer explicit `activeLabel` prop when provided,
                // otherwise match against current location pathname.
                let isActive = false;
                if (typeof activeLabel === 'string' && activeLabel) {
                  isActive = link.label === activeLabel;
                } else if (location && location.pathname) {
                  try {
                    // Treat '/perfil' as a prefix match for profile routes like '/perfil/:id' or '/perfil/*'
                    if (link.to === '/perfil') {
                      isActive = location.pathname.startsWith('/perfil');
                    } else {
                      isActive = location.pathname === link.to || location.pathname.startsWith(link.to + '/');
                    }
                  } catch (e) {
                    isActive = false;
                  }
                }

                return (
                  <Link
                    key={link.label}
                    to={link.to}
                    className={`sidebar-link${isActive ? ' active' : ''}`}
                    aria-current={isActive ? 'page' : undefined}
                    onClick={() => setIsOpen(false)}
                  >
                    <span className="sidebar-link-icon" aria-hidden="true">{link.icon}</span>
                    <span>{link.label}</span>
                  </Link>
                );
              })}
          </nav>
          {/* sidebar footer descriptions removed by request */}
          {/* Comunidad links are appended to main nav when user is logged in */}
        </div>
      </div>
    </aside>
  );
}

export default WizardSidebar;