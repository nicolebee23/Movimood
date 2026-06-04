import './Privacidad.css';
import { useEffect, useState } from 'react';

export default function Privacidad() {
  const [updatedAt, setUpdatedAt] = useState('');

  useEffect(() => {
    // compute friendly date (could be replaced by server value)
    const d = new Date();
    const opts = { year: 'numeric', month: 'long', day: 'numeric' };
    setUpdatedAt(d.toLocaleDateString(undefined, opts));
  }, []);

  const toc = [
    { id: 'introduccion', label: 'Introducción' },
    { id: 'informacion', label: 'Información que recopilamos' },
    { id: 'uso', label: 'Cómo usamos su información' },
    { id: 'cookies', label: 'Cookies' },
    { id: 'seguridad', label: 'Seguridad de datos' },
    { id: 'cambios', label: 'Cambios en la política' },
    { id: 'contacto', label: 'Contacto' }
  ];

  return (
    <div className="legal-page">
      <div className="legal-container legal-grid">
        <header className="legal-header">
          <h1>Política de Privacidad</h1>
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
          <section id="introduccion">
            <h2>1. Introducción</h2>
            <p>
              MoviMood ("nosotros", "nuestro" o "nos") opera el sitio web movimood.plandecine.com (el "Sitio"). Esta página de
              Política de Privacidad le informa sobre nuestras políticas relacionadas con la recopilación, uso y divulgación
              de datos personales cuando utiliza nuestro sitio web y las opciones que tiene asociadas con esos datos.
            </p>
          </section>

          <section id="informacion">
            <h2>2. Información que Recopilamos</h2>
            <p>Recopilamos diferentes tipos de información en conexión con los servicios que brindamos, incluyendo:</p>
            <ul>
              <li><strong>Información de Identificación Personal:</strong> Nombre, correo electrónico, contraseña y perfil de usuario</li>
              <li><strong>Información de Preferencias:</strong> Películas marcadas como favoritas, reseñas, calificaciones y cuestionarios</li>
              <li><strong>Información de Navegación:</strong> Cookies, datos de sesión y dirección IP</li>
              <li><strong>Información de Comunicación:</strong> Notificaciones, mensajes y soporte técnico</li>
            </ul>
          </section>

          <section id="uso">
            <h2>3. Cómo Usamos Su Información</h2>
            <p>Utilizamos la información recopilada para los siguientes propósitos:</p>
            <ul>
              <li>Proporcionar y mantener nuestro servicio</li>
              <li>Notificar a los usuarios sobre cambios en nuestro servicio</li>
              <li>Permitir que los usuarios usen características interactivas de nuestro sitio</li>
              <li>Personalizar recomendaciones de películas</li>
              <li>Realizar análisis estadísticos sobre el uso del sitio</li>
              <li>Proporcionar soporte técnico y resolver problemas</li>
            </ul>
          </section>

          <section id="cookies">
            <h2>4. Cookies</h2>
            <p>
              MoviMood utiliza cookies para mejorar su experiencia de usuario. Las cookies son pequeños archivos de datos
              almacenados en su dispositivo que nos ayudan a recordar sus preferencias.
            </p>
            <p>Tipos de cookies que usamos:</p>
            <ul>
              <li><strong>Cookies Esenciales:</strong> Necesarias para el funcionamiento del sitio (sesión, autenticación)</li>
              <li><strong>Cookies de Funcionalidad:</strong> Para recordar sus preferencias y personalizar la experiencia</li>
              <li><strong>Cookies de Análisis:</strong> Para entender cómo los usuarios interactúan con nuestro sitio</li>
            </ul>
            <p>Puede controlar o eliminar las cookies en cualquier momento a través de la configuración de su navegador.</p>
          </section>

          <section id="seguridad">
            <h2>5. Seguridad de Datos</h2>
            <p>
              La seguridad de sus datos es importante para nosotros, pero recuerde que ningún método de transmisión por
              Internet o almacenamiento electrónico es 100% seguro. Aunque nos esforzamos por utilizar medios comercialmente
              aceptables para proteger sus datos personales, no podemos garantizar su seguridad absoluta.
            </p>
          </section>

          <section id="cambios">
            <h2>6. Cambios en Esta Política de Privacidad</h2>
            <p>
              MoviMood puede actualizar esta Política de Privacidad de vez en cuando. Le notificaremos sobre cualquier cambio
              publicando la nueva Política de Privacidad en esta página y actualizando la fecha de última actualización.
            </p>
          </section>

          <section id="contacto">
            <h2>7. Contacto</h2>
            <p>
              Si tiene preguntas sobre esta Política de Privacidad, contáctenos en: <strong>info@plandecine.com</strong>
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
