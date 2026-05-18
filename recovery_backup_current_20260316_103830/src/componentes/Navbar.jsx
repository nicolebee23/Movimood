import { Link } from 'react-router-dom';
import './Navbar.css';

function Navbar() {
  return (
    <nav className="navbar">
      <div className="navbar-contenido">
        <Link to="/" className="navbar-logo">
          🎬 MoviMood
        </Link>
        
        <div className="navbar-menu">
          <Link to="/" className="navbar-link">Inicio</Link>
          <Link to="/cuestionario" className="navbar-link">Cuestionario</Link>
          <Link to="/login" className="navbar-link-boton">Iniciar Sesión</Link>
        </div>
      </div>
    </nav>
  );
}

export default Navbar;