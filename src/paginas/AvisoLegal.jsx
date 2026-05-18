import './AvisoLegal.css';

export default function AvisoLegal() {
  return (
    <div className="legal-page">
      <div className="legal-container">
        <h1>Aviso Legal</h1>
        
        <div className="legal-content">
          <section>
            <h2>1. Información Identificativa</h2>
            <p>
              <strong>Titularidad:</strong> MoviMood<br />
              <strong>Domicilio:</strong> Internet<br />
              <strong>Correo Electrónico:</strong> info@plandecine.com<br />
              <strong>Sitio Web:</strong> www.movimood.plandecine.com
            </p>
          </section>

          <section>
            <h2>2. Objeto y Contenido del Sitio</h2>
            <p>
              El sitio web de MoviMood pone a disposición del usuario una plataforma de descubrimiento de películas con 
              recomendaciones personalizadas basadas en preferencias. El contenido ofrecido se actualiza regularmente, 
              aunque no se garantiza la continuidad ni la disponibilidad de todos los servicios.
            </p>
          </section>

          <section>
            <h2>3. Responsabilidades</h2>
            <p>
              MoviMood no será responsable de:
            </p>
            <ul>
              <li>La disponibilidad continua del sitio o interrupción de servicios</li>
              <li>Los daños derivados del acceso, consulta o uso del sitio</li>
              <li>Los errores, omisiones o inexactitudes en la información contenida</li>
              <li>El contenido de otros sitios web vinculados desde el nuestro</li>
              <li>Virus u otros elementos dañinos que puedan afectar equipos informáticos</li>
            </ul>
          </section>

          <section>
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

          <section>
            <h2>5. Restricciones de Uso</h2>
            <p>
              El usuario se compromete a no utilizar el sitio para:
            </p>
            <ul>
              <li>Actividades ilegales o fraudulentas</li>
              <li>Difamación, injuria o acoso</li>
              <li>Spam, phishing o intentos de acceso no autorizado</li>
              <li>Distribución de virus o malware</li>
              <li>Scraperng masivo de datos sin consentimiento</li>
            </ul>
          </section>

          <section>
            <h2>6. Cuentas de Usuario</h2>
            <p>
              El usuario es responsable de mantener la confidencialidad de sus credenciales de acceso. MoviMood no será 
              responsable de actividades realizadas con su cuenta si la contraseña ha sido comprometida. Debe notificar 
              inmediatamente cualquier acceso no autorizado.
            </p>
          </section>

          <section>
            <h2>7. Links Externos</h2>
            <p>
              MoviMood puede contener enlaces a sitios de terceros. No somos responsables del contenido, políticas de 
              privacidad o prácticas de esos sitios. El acceso a enlaces externos es bajo su responsabilidad.
            </p>
          </section>

          <section>
            <h2>8. Limitación de Responsabilidad</h2>
            <p>
              En la máxima medida permitida por la ley, MoviMood no será responsable de daños directos, indirectos, 
              incidentales, especiales o consecuentes derivados del uso o imposibilidad de uso del sitio.
            </p>
          </section>

          <section>
            <h2>9. Modificación del Aviso Legal</h2>
            <p>
              MoviMood se reserva el derecho de modificar este Aviso Legal en cualquier momento. Los cambios serán 
              efectivos inmediatamente después de su publicación en el sitio.
            </p>
          </section>

          <section>
            <h2>10. Ley Aplicable</h2>
            <p>
              Este Aviso Legal se rige por las leyes aplicables. Cualquier disputa se resolverá en los juzgados competentes.
            </p>
          </section>

          <footer className="legal-footer">
            <p>Última actualización: 29 de Abril de 2026</p>
          </footer>
        </div>
      </div>
    </div>
  );
}
