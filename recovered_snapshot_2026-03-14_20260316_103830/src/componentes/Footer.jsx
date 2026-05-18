import { Link } from 'react-router-dom';
import './Footer.css';

function Footer() {
  return (
    <footer className="footer">
      <div className="footer-contenido">
        <div className="footer-seccion">
          <h3 className="footer-logo">🎬 MoviMood</h3>
          <p className="footer-descripcion">
            Tu recomendador de películas basado en emociones
          </p>
        </div>
        
        <div className="footer-seccion">
          <h4>Navegación</h4>
          <Link to="/" className="footer-link">Inicio</Link>
          <Link to="/cuestionario" className="footer-link">Cuestionario</Link>
          <Link to="/login" className="footer-link">Iniciar Sesión</Link>
        </div>
        
        <div className="footer-seccion">
          <h4>Legal</h4>
          <Link to="/privacidad" className="footer-link">Privacidad</Link>
          <Link to="/aviso-legal" className="footer-link">Aviso legal</Link>
        </div>
        
        <div className="footer-seccion">
          <h4>Síguenos</h4>
          <div className="footer-redes">
            <a href="https://twitter.com" target="_blank" rel="noreferrer" className="footer-red">🐦 Twitter</a>
            <a href="https://instagram.com" target="_blank" rel="noreferrer" className="footer-red">📷 Instagram</a>
            <a href="https://linkedin.com" target="_blank" rel="noreferrer" className="footer-red">💼 LinkedIn</a>
          </div>
        </div>
      </div>
      
      <div className="footer-bottom">
        <p>© 2026 MoviMood — Creado por Nicole Beeckmans</p>
        <p>Hecho con ❤️ en Madrid</p>
      </div>
    </footer>
  );
}

export default Footer;