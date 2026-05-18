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
        <div className="cookie-banner-text">
          <h3>Política de Cookies</h3>
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
            Rechazar
          </button>
          <button
            className="cookie-btn cookie-btn-accept"
            onClick={handleAccept}
          >
            Aceptar
          </button>
        </div>
      </div>
    </div>
  );
}
