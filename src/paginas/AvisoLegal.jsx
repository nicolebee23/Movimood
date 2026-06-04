import './AvisoLegal.css';
import { useEffect, useState } from 'react';

export default function AvisoLegal() {
  const [updatedAt, setUpdatedAt] = useState('');

  useEffect(() => {
    const d = new Date();
    const opts = { year: 'numeric', month: 'long', day: 'numeric' };
    setUpdatedAt(d.toLocaleDateString(undefined, opts));
  }, []);

  const toc = [
    { id: 'info', label: 'Información identificativa' },
    { id: 'objeto', label: 'Objeto y contenido' },
    { id: 'responsabilidades', label: 'Responsabilidades' },
    { id: 'propiedad', label: 'Propiedad intelectual' },
    { id: 'restricciones', label: 'Restricciones de uso' },
    { id: 'cuentas', label: 'Cuentas de usuario' },
    { id: 'links', label: 'Links externos' },
    { id: 'ley', label: 'Ley aplicable' }
  ];

  return (
    <div className="legal-page">
      <div className="legal-container legal-grid">
        <header className="legal-header">
          <h1>Aviso Legal</h1>
          <div className="legal-actions">
            <button className="btn btn-ghost" onClick={() => window.print()}>Imprimir / Descargar</button>
          </div>
        </header>

        <aside className="legal-toc">
          <nav>
            <strong>Índice</strong>
            <ul>
              {toc.map((t) => (
                <li key={t.id}><a href={`#${t.id}`}>{t.label}</a></li>
              ))}
            </ul>
          </nav>
        </aside>

        <main className="legal-content">
          <section id="info">
            <h2>1. Información Identificativa</h2>
            <p>
              <strong>Titularidad:</strong> MoviMood<br />
              <strong>Domicilio:</strong> Internet<br />
              <strong>Correo Electrónico:</strong> info@plandecine.com<br />
              <strong>Sitio Web:</strong> www.movimood.plandecine.com
            </p>
          </section>

          <section id="objeto">
            <h2>2. Objeto y Contenido del Sitio</h2>
            <p>
              El sitio web de MoviMood pone a disposición del usuario una plataforma de descubrimiento de películas con
              recomendaciones personalizadas basadas en preferencias. El contenido ofrecido se actualiza regularmente,
              aunque no se garantiza la continuidad ni la disponibilidad de todos los servicios.
            </p>
          </section>

          <section id="responsabilidades">
            <h2>3. Responsabilidades</h2>
            <p>MoviMood no será responsable de:</p>
            <ul>
              <li>La disponibilidad continua del sitio o interrupción de servicios</li>
              <li>Los daños derivados del acceso, consulta o uso del sitio</li>
              <li>Los errores, omisiones o inexactitudes en la información contenida</li>
              <li>El contenido de otros sitios web vinculados desde el nuestro</li>
              <li>Virus u otros elementos dañinos que puedan afectar equipos informáticos</li>
            </ul>
          </section>

          <section id="propiedad">
            <h2>4. Propiedad Intelectual e Industrial</h2>
            <p>
              El contenido del sitio web, incluyendo textos, imágenes, logos, diseños y código, está protegido por
              derechos de propiedad intelectual e industrial. El usuario se compromete a no reproducir, distribuir,
              modificar o transmitir el contenido sin autorización previa de MoviMood.
            </p>
            <p>
              Los datos de películas son proporcionados por The Movie Database (TMDB) y están sujetos a su propia licencia.
            </p>
          </section>

          <section id="restricciones">
            <h2>5. Restricciones de Uso</h2>
            <p>El usuario se compromete a no utilizar el sitio para:</p>
            <ul>
              <li>Actividades ilegales o fraudulentas</li>
              <li>Difamación, injuria o acoso</li>
              <li>Spam, phishing o intentos de acceso no autorizado</li>
              <li>Distribución de virus o malware</li>
              <li>Scraperng masivo de datos sin consentimiento</li>
            </ul>
          </section>

          <section id="cuentas">
            <h2>6. Cuentas de Usuario</h2>
            <p>
              El usuario es responsable de mantener la confidencialidad de sus credenciales de acceso. MoviMood no será
              responsable de actividades realizadas con su cuenta si la contraseña ha sido comprometida. Debe notificar
              inmediatamente cualquier acceso no autorizado.
            </p>
          </section>

          <section id="links">
            <h2>7. Links Externos</h2>
            <p>
              MoviMood puede contener enlaces a sitios de terceros. No somos responsables del contenido, políticas de
              privacidad o prácticas de esos sitios. El acceso a enlaces externos es bajo su responsabilidad.
            </p>
          </section>

          <section id="ley">
            <h2>8. Ley Aplicable</h2>
            <p>
              Este Aviso Legal se rige por las leyes aplicables. Cualquier disputa se resolverá en los juzgados competentes.
            </p>
          </section>

          <footer className="legal-footer">
            <p>Última actualización: {updatedAt}</p>
          </footer>
        </main>
      </div>
    </div>
  );
}
