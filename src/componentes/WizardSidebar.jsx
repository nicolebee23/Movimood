import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';

const menuLinks = [
  { label: 'Inicio', to: '/', icon: '⌂' },
  { label: 'Explorar', to: '/explorar', icon: '◎' },
  { label: 'Cuestionario', to: '/cuestionario', icon: '✦' },
  { label: 'Resultados', to: '/resultados', icon: '◫' },
  { label: 'Mi videoteca', to: '/videoteca', icon: '☰' },
  { label: 'Perfil', to: '/perfil', icon: '◯' },
];

function WizardSidebar({ activeLabel = 'Cuestionario', footerText = 'Responde el cuestionario y te damos películas hechas para tu mood.', hideLinks = [] }) {
  const { currentUser } = useAuth();
  const [isOpen, setIsOpen] = useState(false);
  const linksToHide = activeLabel === 'Cuestionario'
    ? [...new Set([...hideLinks, 'Resultados'])]
    : hideLinks;

  const visibleLinks = menuLinks.filter((link) => {
    if (linksToHide.includes(link.label)) {
      return false;
    }

    if (!currentUser && ['Mi videoteca', 'Perfil'].includes(link.label)) {
      return false;
    }

    return true;
  });

  return (
    <aside className="cuestionario-sidebar">
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
            {visibleLinks.map((link) => {
              const isActive = link.label === activeLabel;

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
          <div className="sidebar-footer">
            <p>{footerText}</p>
          </div>
        </div>
      </div>
    </aside>
  );
}

export default WizardSidebar;