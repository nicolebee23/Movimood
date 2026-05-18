import { Link } from 'react-router-dom';

const menuLinks = [
  { label: 'Inicio', to: '/', icon: '⌂' },
  { label: 'Explorar', to: '/explorar', icon: '◎' },
  { label: 'Cuestionario', to: '/cuestionario', icon: '✦' },
  { label: 'Resultados', to: '/resultados', icon: '◫' },
  { label: 'Mi videoteca', to: '/videoteca', icon: '☰' },
  { label: 'Perfil', to: '/perfil', icon: '◯' },
];

function WizardSidebar({ activeLabel = 'Cuestionario', footerText = 'Responde el cuestionario y te damos películas hechas para tu mood.', hideLinks = [] }) {
  const linksToHide = activeLabel === 'Cuestionario'
    ? [...new Set([...hideLinks, 'Resultados'])]
    : hideLinks;

  return (
    <aside className="cuestionario-sidebar">
      <div>
        <div className="sidebar-brand">
          <div className="brand-mark">M</div>
          <div>
            <p className="brand-title">MoviMood</p>
            <p className="brand-subtitle">Tu cine personalizado</p>
          </div>
        </div>
        <nav className="sidebar-nav" aria-label="Navegación principal">
          {menuLinks.filter(link => !linksToHide.includes(link.label)).map((link) => {
            const isActive = link.label === activeLabel;

            return (
              <Link
                key={link.label}
                to={link.to}
                className={`sidebar-link${isActive ? ' active' : ''}`}
                aria-current={isActive ? 'page' : undefined}
              >
                <span className="sidebar-link-icon" aria-hidden="true">{link.icon}</span>
                <span>{link.label}</span>
              </Link>
            );
          })}
        </nav>
      </div>
      <div className="sidebar-footer">
        <p>{footerText}</p>
      </div>
    </aside>
  );
}

export default WizardSidebar;