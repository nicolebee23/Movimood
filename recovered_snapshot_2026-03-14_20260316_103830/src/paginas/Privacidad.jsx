import { Link } from 'react-router-dom';
import './Legal.css';

function Privacidad() {
  return (
    <div className="legal-page">
      <div className="legal-container">
        <Link to="/" className="legal-back">← Volver</Link>
        <h1>Política de Privacidad</h1>
        <p className="legal-fecha">Última actualización: abril de 2026</p>

        <section>
          <h2>1. Responsable del tratamiento</h2>
          <p>
            MoviMood es un proyecto académico desarrollado por Nicole Beeckmans como Trabajo de Fin de Grado
            del ciclo de Desarrollo de Aplicaciones Web en ILERNA. No es una empresa ni entidad comercial.
          </p>
        </section>

        <section>
          <h2>2. Datos que recogemos</h2>
          <p>Al registrarte en MoviMood recogemos:</p>
          <ul>
            <li>Nombre de usuario y nombre visible</li>
            <li>Dirección de correo electrónico</li>
            <li>Contraseña (almacenada cifrada con bcrypt)</li>
            <li>Foto de perfil (opcional)</li>
          </ul>
          <p>Durante el uso de la app también guardamos:</p>
          <ul>
            <li>Películas marcadas como vistas, en lista o favoritas</li>
            <li>Reseñas y puntuaciones que escribas</li>
            <li>Preferencias de notificación</li>
          </ul>
        </section>

        <section>
          <h2>3. Finalidad del tratamiento</h2>
          <p>
            Usamos tus datos exclusivamente para ofrecerte la funcionalidad de la app:
            gestionar tu cuenta, mostrar tus listas y reseñas, y personalizar las recomendaciones
            según tu estado de ánimo. No usamos tus datos para publicidad ni los cedemos a terceros.
          </p>
        </section>

        <section>
          <h2>4. API de TMDB</h2>
          <p>
            MoviMood utiliza la API de <strong>The Movie Database (TMDB)</strong> para obtener
            información de películas (títulos, pósters, sinopsis). Las búsquedas que realizas
            pueden ser procesadas por TMDB según su propia política de privacidad, disponible en{' '}
            <a href="https://www.themoviedb.org/privacy-policy" target="_blank" rel="noreferrer">
              themoviedb.org/privacy-policy
            </a>.
          </p>
        </section>

        <section>
          <h2>5. Cookies</h2>
          <p>MoviMood usa las siguientes cookies propias:</p>
          <ul>
            <li><strong>Sesión:</strong> cookie técnica necesaria para mantenerte conectada. Se elimina al cerrar sesión.</li>
            <li><strong>Preferencias:</strong> guardamos tu elección sobre cookies en el navegador (localStorage).</li>
          </ul>
          <p>No usamos cookies de terceros, de seguimiento ni publicitarias.</p>
        </section>

        <section>
          <h2>6. Tus derechos</h2>
          <p>
            Puedes ejercer tus derechos de acceso, rectificación y eliminación de datos en cualquier momento
            desde la sección de Configuración de tu perfil, o eliminando tu cuenta. Al ser un proyecto
            académico sin base de datos de producción activa, puedes contactar directamente con la autora
            para cualquier solicitud.
          </p>
        </section>

        <section>
          <h2>7. Seguridad</h2>
          <p>
            Las contraseñas se almacenan cifradas con bcrypt. La comunicación con el servidor
            se realiza mediante HTTPS en el entorno de producción.
          </p>
        </section>
      </div>
    </div>
  );
}

export default Privacidad;