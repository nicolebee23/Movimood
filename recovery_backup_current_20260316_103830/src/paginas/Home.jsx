import { Link } from 'react-router-dom';
import './Home.css';

function Home() {
  return (
    <div className="pagina-home">
      <div className="contenido-home">
        <h1 className="titulo-home">🎬 MoviMood</h1>
        <p className="subtitulo-home">
          Descubre películas perfectas para tu estado de ánimo
        </p>
        <p className="descripcion-home">
          Responde un breve cuestionario y recibe recomendaciones personalizadas
          basadas en cómo te sientes hoy
        </p>
        
        <div className="botones-home">
          <Link to="/cuestionario" className="boton-principal">
            🎯 Empezar Cuestionario
          </Link>
          <Link to="/login" className="boton-secundario">
            🔑 Iniciar Sesión
          </Link>
        </div>
        
        <div className="caracteristicas-home">
          <div className="caracteristica">
            <span className="emoji-caracteristica">😊</span>
            <p>Basado en tu mood</p>
          </div>
          <div className="caracteristica">
            <span className="emoji-caracteristica">⚡</span>
            <p>Rápido y sencillo</p>
          </div>
          <div className="caracteristica">
            <span className="emoji-caracteristica">🎬</span>
            <p>Miles de películas</p>
          </div>
        </div>
      </div>
      
      <p className="footer-home">Por Nicole Beeckmans</p>
    </div>
  );
}

export default Home;