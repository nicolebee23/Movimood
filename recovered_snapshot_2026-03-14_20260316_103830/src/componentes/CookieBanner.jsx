import { useState, useEffect } from 'react';
import './CookieBanner.css';

function CookieBanner() {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const consent = localStorage.getItem('movimood-cookie-consent');
    if (!consent) setVisible(true);
  }, []);

  function accept() {
    localStorage.setItem('movimood-cookie-consent', 'accepted');
    setVisible(false);
  }

  function reject() {
    localStorage.setItem('movimood-cookie-consent', 'rejected');
    setVisible(false);
  }

  if (!visible) return null;

  return (
    <div className="cookie-banner" role="dialog" aria-label="Aviso de cookies">
      <div className="cookie-banner-content">
        <div className="cookie-banner-text">
          <span className="cookie-icon">🍪</span>
          <p>
            Usamos cookies propias para recordar tu sesión y preferencias.
            No usamos cookies de terceros ni publicidad.{' '}
            <a href="/privacidad" className="cookie-link">Política de privacidad</a>
          </p>
        </div>
        <div className="cookie-banner-actions">
          <button className="cookie-btn cookie-btn-reject" onClick={reject}>
            Rechazar
          </button>
          <button className="cookie-btn cookie-btn-accept" onClick={accept}>
            Aceptar
          </button>
        </div>
      </div>
    </div>
  );
}

export default CookieBanner;