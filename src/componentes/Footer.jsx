import { Link } from 'react-router-dom';
import { useState } from 'react';
import './Footer.css';

function Footer() {
  const currentYear = new Date().getFullYear();
  const [email, setEmail] = useState('');
  const [newsletterStatus, setNewsletterStatus] = useState(null); // null | 'sending' | 'ok' | 'error'
  const [newsletterError, setNewsletterError] = useState('');

  function navigateAndScroll(e, path) {
    if (window.location.pathname === path) {
      e.preventDefault();
      window.scrollTo({ top: 0, behavior: 'smooth' });
    } else {
      // let the Link navigate, then ensure top after small delay
      setTimeout(() => window.scrollTo(0, 0), 300);
    }
  }

  return (
    <footer className="footer">
      <div className="footer-shell">
        <div className="footer-panel">
          <div className="footer-grid">
            <div className="footer-brand">
              <h3 className="footer-logo">Movi<span className="footer-logo-mood">Mood</span></h3>
              <p className="footer-descripcion">Recomendaciones según tu estado de ánimo. Guarda películas, escribe reseñas y crea colecciones.</p>
              <div className="footer-socials" aria-label="Redes sociales">
                <a href="https://twitter.com/" target="_blank" rel="noreferrer" aria-label="Twitter" className="social">🐦</a>
                <a href="https://instagram.com/" target="_blank" rel="noreferrer" aria-label="Instagram" className="social">📸</a>
                <a href="https://github.com/" target="_blank" rel="noreferrer" aria-label="GitHub" className="social">💻</a>
              </div>
            </div>

            <div className="footer-links">
              <h4>Explorar</h4>
              <Link to="/" className="footer-link" onClick={(e) => {
                // If already on home, just scroll to top; otherwise let Link navigate then scroll
                if (window.location.pathname === '/') {
                  e.preventDefault();
                  window.scrollTo({ top: 0, behavior: 'smooth' });
                } else {
                  // after navigation, ensure top position (small delay lets router update)
                  setTimeout(() => window.scrollTo(0, 0), 300);
                }
              }}>Inicio</Link>
              <Link to="/explorar" className="footer-link" onClick={(e) => navigateAndScroll(e, '/explorar')}>Películas</Link>
              <Link to="/cuestionario" className="footer-link" onClick={(e) => navigateAndScroll(e, '/cuestionario')}>Cuestionario</Link>
              <Link to="/videoteca" className="footer-link" onClick={(e) => navigateAndScroll(e, '/videoteca')}>Mi videoteca</Link>
            </div>

            <div className="footer-links">
              <h4>Soporte</h4>
              <Link to="/privacidad" className="footer-link" onClick={(e) => navigateAndScroll(e, '/privacidad')}>Privacidad</Link>
              <Link to="/aviso-legal" className="footer-link" onClick={(e) => navigateAndScroll(e, '/aviso-legal')}>Aviso legal</Link>
              <a className="footer-link" href="mailto:hola@movimood.app">Contacto</a>
            </div>

            <div className="footer-controls">
              <h4>Newsletter</h4>
              <form className="newsletter-form" onSubmit={async (e) => {
                e.preventDefault();
                setNewsletterError('');
                if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
                  setNewsletterError('Introduce un correo válido');
                  setNewsletterStatus('error');
                  return;
                }
                setNewsletterStatus('sending');
                try {
                  const fd = new FormData();
                  fd.append('email', email.trim());
                  const res = await fetch('https://plandecine.com/api/newsletter.php', { method: 'POST', body: fd, credentials: 'include' });
                  const text = await res.text();
                  let data = null;
                  try {
                    data = JSON.parse(text);
                  } catch (parseErr) {
                    // tolerate responses that include stray characters; fallback to regex check
                    data = { success: /"success"\s*:\s*true/.test(text), rawText: text };
                  }
                  // Prefer explicit success flag, but also accept provider send result
                  const mailSent = data && data.mail && data.mail.sent;
                  // DEBUG: log parsed JSON string for debugging inconsistent cases
                  // Log only on failure to avoid showing red errors in console for normal success
                  if (!mailSent) {
                    try {
                      console.error('Newsletter parsed JSON (failure case):', JSON.stringify(data));
                    } catch (e) {
                      console.error('Newsletter parsed (non-serializable):', data);
                    }
                    console.error('Newsletter mailSent debug:', mailSent, typeof (data && data.mail && data.mail.sent), data && data.mail && data.mail.sent);
                  } else {
                    // success: non-intrusive debug/info log
                    if (console.debug) console.debug('Newsletter sent OK', data);
                    else console.log('Newsletter sent OK', data);
                  }
                  if ((res.ok && data && data.success) || mailSent) {
                    setNewsletterStatus('ok');
                    setEmail('');
                  } else {
                    const contentType = res.headers && res.headers.get ? res.headers.get('content-type') : '';
                    const contentEncoding = res.headers && res.headers.get ? res.headers.get('content-encoding') : '';
                    const safeSnippet = text ? text.replace(/[^ -~\t\n\r]/g, '?').slice(0, 200) : '';
                    console.error('Newsletter subscription failed:', { status: res.status, contentType, contentEncoding, parsed: data, snippet: safeSnippet, length: text ? text.length : 0 });
                    // If provider returned an error message, show it (sanitized)
                    const providerErr = data && data.mail && data.mail.error;
                    setNewsletterStatus('error');
                    setNewsletterError(providerErr ? String(providerErr).slice(0, 200) : 'No se pudo enviar la confirmación. Intenta más tarde.');
                  }
                } catch (err) {
                  console.error('Newsletter request error:', err);
                  setNewsletterStatus('error');
                  setNewsletterError('Error de red. Intenta de nuevo.');
                }
              }}>
                <label className="sr-only" htmlFor="footer-news-email">Correo</label>
                <input id="footer-news-email" className="newsletter-input" placeholder="tu@email.com" value={email} onChange={(e) => setEmail(e.target.value)} aria-label="Correo electrónico" />
                <button type="submit" className="newsletter-btn" disabled={newsletterStatus==='sending'}>{newsletterStatus==='sending' ? 'Enviando...' : 'Suscribirme'}</button>
                {newsletterStatus === 'ok' && <div className="newsletter-success">¡Gracias! Revisaremos tu correo.</div>}
                {newsletterStatus === 'error' && <div className="newsletter-error">{newsletterError}</div>}
              </form>
            </div>
          </div>

          <div className="footer-bottom">
            <p>© {currentYear} MoviMood. Todos los derechos reservados.</p>
            <div className="footer-credit">Diseño y desarrollo · MoviMood</div>
          </div>
        </div>
      </div>
    </footer>
  );
}

export default Footer;