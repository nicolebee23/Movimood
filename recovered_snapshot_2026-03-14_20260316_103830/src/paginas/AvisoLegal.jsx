import { Link } from 'react-router-dom';
import './Legal.css';

function AvisoLegal() {
  return (
    <div className="legal-page">
      <div className="legal-container">
        <Link to="/" className="legal-back">← Volver</Link>
        <h1>Aviso Legal</h1>
        <p className="legal-fecha">Última actualización: abril de 2026</p>

        <section>
          <h2>1. Identificación</h2>
          <p>
            <strong>Nombre del proyecto:</strong> MoviMood<br />
            <strong>Autora:</strong> Nicole Beeckmans<br />
            <strong>Naturaleza:</strong> Trabajo de Fin de Grado — Desarrollo de Aplicaciones Web, ILERNA<br />
            <strong>Dominio:</strong> plandecine.com
          </p>
        </section>

        <section>
          <h2>2. Objeto</h2>
          <p>
            MoviMood es una aplicación web académica para el descubrimiento y recomendación de películas
            según el estado emocional del usuario. No tiene finalidad comercial.
          </p>
        </section>

        <section>
          <h2>3. Propiedad intelectual</h2>
          <p>
            El código, diseño y contenido propio de MoviMood son obra de Nicole Beeckmans.
            Los datos de películas (títulos, pósters, sinopsis, valoraciones) provienen de{' '}
            <a href="https://www.themoviedb.org" target="_blank" rel="noreferrer">TMDB</a> y
            están sujetos a sus términos de uso. MoviMood no es avalado ni certificado por TMDB.
          </p>
        </section>

        <section>
          <h2>4. Limitación de responsabilidad</h2>
          <p>
            MoviMood no garantiza la exactitud o completitud de la información de películas
            proporcionada por TMDB. El uso de la aplicación es bajo la responsabilidad del usuario.
            Al ser un proyecto académico, el servicio puede interrumpirse sin previo aviso.
          </p>
        </section>

        <section>
          <h2>5. Ley aplicable</h2>
          <p>
            Este aviso legal se rige por la legislación española. Para cualquier controversia,
            las partes se someten a los juzgados y tribunales de Madrid.
          </p>
        </section>
      </div>
    </div>
  );
}

export default AvisoLegal;