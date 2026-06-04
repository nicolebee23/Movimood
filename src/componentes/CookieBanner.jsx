import { Link } from 'react-router-dom';
import { useEffect, useState } from 'react';
import './CookieBanner.css';

export default function CookieBanner() {
  const [showBanner, setShowBanner] = useState(false);

  useEffect(() => {
    // Verificar si el usuario ya aceptó/rechazó cookies
    const cookieConsent = localStorage.getItem('movimood-cookie-consent');
    if (!cookieConsent) {
      setShowBanner(true);
    }
  }, []);

  const handleAccept = () => {
    localStorage.setItem('movimood-cookie-consent', 'accepted');
    setShowBanner(false);
    // Aquí se puede inicializar Google Analytics u otros cookies de terceros
  };

  const handleReject = () => {
    localStorage.setItem('movimood-cookie-consent', 'rejected');
    setShowBanner(false);
  };

  if (!showBanner) {
    return null;
  }

  return (
    <div className="cookie-banner">
      <div className="cookie-banner-content">
        <div className="cookie-banner-badge" aria-hidden="true">
          <svg className="cookie-banner-badge-icon" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M12 3.2c-4.9 0-8.8 3.9-8.8 8.8S7.1 20.8 12 20.8 20.8 16.9 20.8 12 16.9 3.2 12 3.2Z" stroke="currentColor" strokeWidth="1.5" />
            <path d="M8.4 12.2l2.2 2.2 4.8-5" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </div>
        <div className="cookie-banner-text">
          <p className="cookie-banner-kicker">Cookies y privacidad</p>
          <h3>Usamos cookies para mejorar MoviMood</h3>
          <p>
            Usamos cookies para mejorar tu experiencia. Al usar MoviMood, aceptas nuestra{' '}
            <Link to="/privacidad" className="cookie-link">
              política de privacidad
            </Link>{' '}
            y{' '}
            <Link to="/aviso-legal" className="cookie-link">
              aviso legal
            </Link>
            .
          </p>
        </div>
        <div className="cookie-banner-buttons">
          <button
            className="cookie-btn cookie-btn-reject"
            onClick={handleReject}
          >
            <span className="cookie-btn-icon" aria-hidden="true">
              <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M18 6L6 18" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
                <path d="M6 6l12 12" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
              </svg>
            </span>
            Rechazar
          </button>
          <button
            className="cookie-btn cookie-btn-accept"
            onClick={handleAccept}
          >
            <span className="cookie-btn-icon" aria-hidden="true">
              <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M9.2 12.4l2.2 2.2 5.4-6" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </span>
            Aceptar
          </button>
        </div>
      </div>
    </div>
  );
}
