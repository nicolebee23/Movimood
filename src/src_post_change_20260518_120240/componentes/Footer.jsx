import { Link } from 'react-router-dom';
import { useState } from 'react';
import { useAuth } from '../hooks/useAuth';
import './Footer.css';

function Footer() {
  const { currentUser } = useAuth();
  const [newsletterEmail, setNewsletterEmail] = useState('');
  const currentYear = new Date().getFullYear();
  const accessPath = currentUser ? '/perfil' : '/login';
  const accessLabel = currentUser ? 'Mi perfil' : 'Acceso';

  function handleNewsletterSubmit(event) {
    event.preventDefault();

    const email = newsletterEmail.trim();
    const subject = encodeURIComponent('Quiero novedades de MoviMood');
    const body = encodeURIComponent(
      email
        ? `Hola, quiero recibir novedades de MoviMood. Mi email es: ${email}`
        : 'Hola, quiero recibir novedades de MoviMood.'
    );

    window.location.href = `mailto:hola@movimood.app?subject=${subject}&body=${body}`;
  }

  return (
    <footer className="footer">
      <div className="footer-shell">
        <div className="footer-panel">
          <div className="footer-contenido">
            <section className="footer-brand" aria-label="Marca MoviMood">
              <h3 className="footer-logo">Movi<span className="footer-logo-mood">Mood</span></h3>
              <p className="footer-descripcion">
                Descubre qué ver según cómo te sientes. Recomendaciones personalizadas,
                videoteca inteligente y experiencia cinematográfica en un solo lugar.
              </p>
            </section>

            <nav className="footer-seccion" aria-label="Navegacion principal">
              <h4>Explorar</h4>
              <Link to="/" className="footer-link">Inicio</Link>
              <Link to="/cuestionario" className="footer-link">Cuestionario</Link>
              <Link to={accessPath} className="footer-link">{accessLabel}</Link>
            </nav>

            <nav className="footer-seccion" aria-label="Enlaces legales">
              <h4>Legal</h4>
              <Link to="/privacidad" className="footer-link">Privacidad</Link>
              <Link to="/aviso-legal" className="footer-link">Aviso legal</Link>
              <a className="footer-link" href="mailto:hola@movimood.app">Contacto</a>
            </nav>

            <section className="footer-newsletter" aria-label="Newsletter">
              <div className="footer-newsletter-header">
                <div className="footer-newsletter-icon" aria-hidden="true">✉</div>
                <div>
                  <h4>¿Quieres novedades?</h4>
                  <p>Suscríbete a nuestra newsletter.</p>
                </div>
              </div>
              <form className="footer-newsletter-form" onSubmit={handleNewsletterSubmit}>
                <label className="sr-only" htmlFor="footer-newsletter-email">
                  Tu email
                </label>
                <input
                  id="footer-newsletter-email"
                  type="email"
                  className="footer-newsletter-input"
                  placeholder="Tu email"
                  value={newsletterEmail}
                  onChange={(event) => setNewsletterEmail(event.target.value)}
                />
                <button type="submit" className="footer-newsletter-button" aria-label="Suscribirme">
                  →
                </button>
              </form>
            </section>
          </div>

          <div className="footer-bottom">
            <p>© {currentYear} MoviMood. Todos los derechos reservados.</p>
          </div>
        </div>
      </div>
    </footer>
  );
}

export default Footer;