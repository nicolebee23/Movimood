import { Link } from 'react-router-dom';
import { useState, useEffect } from 'react';
import './Home.css';

function Home() {
  const [peliculaActiva, setPeliculaActiva] = useState(0);
  const [openFAQ, setOpenFAQ] = useState(null);
  const [captureLoadErrors, setCaptureLoadErrors] = useState({});
  const [captureSourceIndex, setCaptureSourceIndex] = useState({
    '1': 0,
    '2': 0,
    '3': 0,
  });
  
// 1. Array de películas (Definido para que todo funcione)
  const peliculasDestacadas = [
    {
      titulo: "Oppenheimer",
      descripcion: "La historia del físico J. Robert Oppenheimer y su papel en el desarrollo de la bomba atómica.",
      fondo: "https://image.tmdb.org/t/p/original/fm6KqXpk3M2HVveHwCrBSSBaO0V.jpg",
      poster: "https://image.tmdb.org/t/p/w500/ptpr0kGAckfQkJeJIt8st5dglvd.jpg",
      rating: "8.4", año: "2023", genero: "Drama"
    },
    {
      titulo: "Dune",
      descripcion: "Un noble debe viajar al planeta más peligroso del universo para asegurar el futuro de su familia.",
      fondo: "https://image.tmdb.org/t/p/original/8b8R8l88Qje9dn9OE8PY05Nxl1X.jpg",
      poster: "https://image.tmdb.org/t/p/w500/d5NXSklXo0qyIYkgV94XAgMIckC.jpg",
      rating: "8.0", año: "2021", genero: "Ciencia Ficción"
    },
    {
      titulo: "Inception",
      descripcion: "Un ladrón que roba secretos corporativos a través de la tecnología de los sueños compartidos.",
      fondo: "https://image.tmdb.org/t/p/original/s3TBrRGB1iav7gFOCNx3H31MoES.jpg",
      poster: "https://image.tmdb.org/t/p/w500/8IB2e4r4oVhHnANbnm7O3Tj6tF8.jpg",
      rating: "8.8", año: "2010", genero: "Thriller"
    },
    {
      titulo: "Interstellar",
      descripcion: "Un equipo de exploradores viaja a través de un agujero de gusano en el espacio para asegurar la supervivencia de la humanidad.",
      fondo: "https://image.tmdb.org/t/p/original/pbrkL804c8yAv3zBZR4QPEafpAR.jpg",
      poster: "https://image.tmdb.org/t/p/w500/gEU2QniE6E77NI6lCU6MxlNBvIx.jpg",
      rating: "8.7", año: "2014", genero: "Ciencia Ficción"
    },
    {
      titulo: "The Menu",
      descripcion: "Una pareja viaja a una isla costera para comer en un restaurante exclusivo donde el chef ha preparado un menú sorpresa.",
      fondo: "https://image.tmdb.org/t/p/original/4vSBj7BYsyuKCx96EJzGyp20WfY.jpg",
      poster: "https://image.tmdb.org/t/p/w500/eNcfCScUUyHQyjP84P25a8ColWp.jpg",
      rating: "7.2", año: "2022", genero: "Thriller"
    },
    {
      titulo: "Parasite",
      descripcion: "Codicia y discriminación de clases amenazan la recién formada relación simbiótica entre la adinerada familia Park y el clan pobre de los Kim.",
      fondo: "https://image.tmdb.org/t/p/original/hiKmpZMGZsrkA3cdce8a7Dpos1j.jpg",
      poster: "https://image.tmdb.org/t/p/w500/7IiTTgloJzvGI1TAYymCfbfl3vT.jpg",
      rating: "8.5", año: "2019", genero: "Drama"
    }
  ];
  const motivosMoviMood = [
    {
      etiqueta: "PERSONALIZADO",
      titulo: "Recomendaciones segun tu mood real",
      texto: "El algoritmo tiene en cuenta como te sientes hoy, no solo lo que viste ayer.",
      cta: "Explorar ahora",
      imagen: "https://images.unsplash.com/photo-1489599849927-2ee91cede3ba?auto=format&fit=crop&w=900&q=80",
      sizeClass: "card-wide"
    },
    {
      etiqueta: "RAPIDO",
      titulo: "Resultado en 2 minutos",
      texto: "Un cuestionario corto y recomendaciones listas al instante.",
      cta: "Probar",
      imagen: "https://images.unsplash.com/photo-1460881680858-30d872d5b530?auto=format&fit=crop&w=700&q=80",
      sizeClass: "card-tall"
    },
    {
      etiqueta: "GRATIS",
      titulo: "Sin suscripcion ni letra pequena",
      texto: "Todo el descubrimiento de peliculas, gratis y sin anuncios invasivos.",
      cta: "Ver detalles",
      imagen: "https://images.unsplash.com/photo-1450101499163-c8848c66ca85?auto=format&fit=crop&w=700&q=80",
      sizeClass: "card-regular"
    },
    {
      etiqueta: "CATALOGO",
      titulo: "Miles de peliculas y series",
      texto: "Encuentra desde estrenos hasta clasicos por genero, animo y duracion.",
      cta: "Descubrir",
      imagen: "https://images.unsplash.com/photo-1485095329183-d0797cdc5676?auto=format&fit=crop&w=900&q=80",
      sizeClass: "card-wide"
    },
    {
      etiqueta: "FAVORITOS",
      titulo: "Guarda lo que te encanta",
      texto: "Crea listas personales y recupera tus recomendaciones favoritas en segundos.",
      cta: "Guardar",
      imagen: "https://images.unsplash.com/photo-1478720568477-152d9b164e26?auto=format&fit=crop&w=700&q=80",
      sizeClass: "card-regular"
    },
    {
      etiqueta: "MULTIPLATAFORMA",
      titulo: "Tu cine, en cualquier dispositivo",
      texto: "MoviMood funciona igual de bien en movil, tablet y ordenador.",
      cta: "Abrir app",
      imagen: "https://images.unsplash.com/photo-1512428559087-560fa5ceab42?auto=format&fit=crop&w=1000&q=80",
      sizeClass: "card-regular"
    }
  ];

  const capturasComoFunciona = {
    paso1: [
      '/assets/how-it-works/paso-1.png',
      '/assets/how-it-works/paso-1.jpg',
      '/assets/how-it-works/paso-1.jpeg',
      '/assets/how-it-works/paso-1.webp',
    ],
    paso2: [
      '/assets/how-it-works/paso-2.png',
      '/assets/how-it-works/paso-2.jpg',
      '/assets/how-it-works/paso-2.jpeg',
      '/assets/how-it-works/paso-2.webp',
    ],
    paso3: [
      '/assets/how-it-works/paso-3.png',
      '/assets/how-it-works/paso-3.jpg',
      '/assets/how-it-works/paso-3.jpeg',
      '/assets/how-it-works/paso-3.webp',
    ],
  };

  const pasosComoFunciona = [
    {
      numero: '1',
      titulo: 'Cuentanos tu mood',
      texto: 'Responde un breve cuestionario sobre tu estado de animo y tus favoritas.',
      imagenes: capturasComoFunciona.paso1,
      alt: 'Pantalla de cuestionario en MoviMood',
    },
    {
      numero: '2',
      titulo: 'Analizamos tus preferencias',
      texto: 'Nuestro sistema busca entre miles de peliculas las mejores para ti.',
      imagenes: capturasComoFunciona.paso2,
      alt: 'Pantalla de analisis en MoviMood',
    },
    {
      numero: '3',
      titulo: 'Disfruta tu pelicula',
      texto: 'Recibe recomendaciones personalizadas y guarda tus favoritas.',
      imagenes: capturasComoFunciona.paso3,
      alt: 'Pantalla de resultados en MoviMood',
    },
  ];

  useEffect(() => {
    function retryCaptures() {
      setCaptureLoadErrors({});
      setCaptureSourceIndex({
        '1': 0,
        '2': 0,
        '3': 0,
      });
    }

    window.addEventListener('focus', retryCaptures);
    return () => window.removeEventListener('focus', retryCaptures);
  }, []);

  function handleCaptureError(stepNumber, totalSources) {
    const currentIndex = captureSourceIndex[stepNumber] || 0;

    if (currentIndex < totalSources - 1) {
      setCaptureSourceIndex((prev) => ({
        ...prev,
        [stepNumber]: currentIndex + 1,
      }));
      return;
    }

    setCaptureLoadErrors((prev) => ({
      ...prev,
      [stepNumber]: true,
    }));
  }

// 2. Timer para cambiar la película destacada automáticamente
  useEffect(() => {
    const interval = setInterval(() => {
      setPeliculaActiva((prev) => (prev + 1) % peliculasDestacadas.length);
    }, 6000);
    return () => clearInterval(interval);
  }, [peliculasDestacadas.length]);

  return (
    <div className="pagina-home">
      {/* Fondo con imagen de película borrosa */}
      <div className="hero-background"></div>
      <div className="hero-overlay"></div>

{/* HERO SECTION CON PÓSTERS FLOTANTES */}
      <section className="hero">
        <div className="hero-container">
          {/* COLUMNA IZQUIERDA - CONTENIDO */}
          <div className="hero-contenido">
            <h1 className="hero-titulo">
              <span className="titulo-gradient">MoviMood</span>
            </h1>
            <p className="hero-subtitulo">Descubre películas perfectas para tu estado de ánimo</p>
            <p className="hero-descripcion">
              Una experiencia cinematográfica personalizada. Responde un breve cuestionario 
              y recibe recomendaciones adaptadas a cómo te sientes hoy.
            </p>

            <div className="hero-botones">
              <Link to="/registro" className="btn btn-primario" title="Crear nueva cuenta en MoviMood">
                Regístrate Gratis
              </Link>
              <Link to="/login" className="btn btn-secundario" title="Acceder con tu cuenta existente">
                Iniciar Sesión
              </Link>
            </div>

            <div className="hero-stats">
              <div className="stat-item">
                <span className="stat-numero">10K+</span>
                <span className="stat-texto">Películas</span>
              </div>
              <div className="stat-item">
                <span className="stat-numero">100%</span>
                <span className="stat-texto">Gratis</span>
              </div>
              <div className="stat-item">
                <span className="stat-numero">2min</span>
                <span className="stat-texto">Cuestionario</span>
              </div>
            </div>
          </div>

       {/* COLUMNA DERECHA - SLIDER INFINITO VERTICAL */}
          <div className="hero-posters">
            <div className="slider-vertical-container">
              <div className="slider-vertical-track">
                {/* Primera serie de pósters */}
                <div className="poster-slide">
                  <img src="https://image.tmdb.org/t/p/w500/ptpr0kGAckfQkJeJIt8st5dglvd.jpg" alt="Oppenheimer" />
                </div>
                <div className="poster-slide">
                  <img src="https://image.tmdb.org/t/p/w500/d5NXSklXo0qyIYkgV94XAgMIckC.jpg" alt="Dune" />
                </div>
                <div className="poster-slide">
                  <img src="https://image.tmdb.org/t/p/w500/8IB2e4r4oVhHnANbnm7O3Tj6tF8.jpg" alt="Inception" />
                </div>
                <div className="poster-slide">
                  <img src="https://image.tmdb.org/t/p/w500/gEU2QniE6E77NI6lCU6MxlNBvIx.jpg" alt="Interstellar" />
                </div>
                <div className="poster-slide">
                  <img src="https://image.tmdb.org/t/p/w500/eNcfCScUUyHQyjP84P25a8ColWp.jpg" alt="The Menu" />
                </div>
                <div className="poster-slide">
                  <img src="https://image.tmdb.org/t/p/w500/7IiTTgloJzvGI1TAYymCfbfl3vT.jpg" alt="Parasite" />
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>
{/* SECCIÓN CÓMO FUNCIONA - ESTILO SERIALIZD */}
      <section className="seccion-como-funciona">
        <h2 className="seccion-titulo">¿Cómo funciona?</h2>

        <div className="pasos-container-horizontal">
          {pasosComoFunciona.map((paso) => (
            <article className="paso-columna" key={paso.numero}>
              <div className="paso-numero">{paso.numero}</div>

              <div className="paso-media">
                {!captureLoadErrors[paso.numero] && (
                  <img
                    src={paso.imagenes[captureSourceIndex[paso.numero] || 0]}
                    alt={paso.alt}
                    className="paso-imagen"
                    loading="lazy"
                    onError={() => handleCaptureError(paso.numero, paso.imagenes.length)}
                  />
                )}
              </div>

              <h3 className="paso-titulo">{paso.titulo}</h3>
              <p className="paso-texto">{paso.texto}</p>
            </article>
          ))}
        </div>
      </section>

      {/* TIME CARD OPENING - EXPANSIÓN A FONDO */}
      <section className="seccion-time-cards-hero">
        {/* Fondo expandido de la tarjeta activa */}
        <div className="cards-hero-background-container">
          <div 
            className="cards-hero-background"
            style={{
              backgroundImage: `url(${peliculasDestacadas[peliculaActiva].fondo})`
            }}
            key={peliculaActiva}
          ></div>
          <div className="cards-hero-overlay"></div>
        </div>

        {/* Contenido de texto */}
        <div className="cards-hero-content">
          <div className="cards-hero-text" key={`text-${peliculaActiva}`}>
            <h2 className="cards-hero-titulo">
              {peliculasDestacadas[peliculaActiva].titulo}
            </h2>
            <p className="cards-hero-descripcion">
              {peliculasDestacadas[peliculaActiva].descripcion}
            </p>
            <div className="cards-hero-info">
              <span className="info-badge">⭐ {peliculasDestacadas[peliculaActiva].rating}</span>
              <span className="info-badge">📅 {peliculasDestacadas[peliculaActiva].año}</span>
              <span className="info-badge">🎭 {peliculasDestacadas[peliculaActiva].genero}</span>
            </div>
          </div>
        </div>

        {/* Tarjetas pequeñas en la parte inferior */}
        <div className="cards-thumbnails-row">
          {peliculasDestacadas.map((pelicula, index) => (
            <div
              key={index}
              className={`card-thumbnail ${index === peliculaActiva ? 'active' : ''}`}
              onClick={() => setPeliculaActiva(index)}
              style={{ '--card-delay': `${index * 0.1}s` }}
            >
              <img src={pelicula.poster} alt={pelicula.titulo} />
              <div className="card-thumbnail-number">{index + 1}</div>
            </div>
          ))}
        </div>
      </section>

      {/* CARACTERÍSTICAS CON CARRUSEL */}
      <section className="seccion-caracteristicas" aria-label="Por qué elegir MoviMood">
        <h2 className="seccion-titulo">Por qué MoviMood</h2>
        <p className="seccion-caracteristicas-subtitulo">
          Descubre una experiencia de recomendaciones visual y personalizada inspirada en tu estado de animo.
        </p>

        <div className="lifestyle-grid" role="region" aria-label="Beneficios de MoviMood">
          {motivosMoviMood.map((card) => (
            <article
              className={`lifestyle-card ${card.sizeClass}`}
              key={card.titulo}
              style={{ backgroundImage: `linear-gradient(135deg, rgba(12, 22, 38, 0.18), rgba(12, 22, 38, 0.5)), url(${card.imagen})` }}
            >
              <span className="lifestyle-tag">{card.etiqueta}</span>
              <h3 className="lifestyle-title">{card.titulo}</h3>
              <p className="lifestyle-text">{card.texto}</p>
              <span className="lifestyle-cta">{card.cta}</span>
            </article>
          ))}
        </div>
      </section>

  {/* PREGUNTAS FRECUENTES */}
      <section className="seccion-faq">
        <h2 className="seccion-titulo">Preguntas Frecuentes</h2>
       

   <div className="faq-container">
          <div className="faq-item">
            <button className="faq-pregunta" onClick={() => setOpenFAQ(openFAQ === 0 ? null : 0)} aria-expanded={openFAQ === 0} aria-controls="faq-answer-0">
              <span>¿En qué se diferencia MoviMood de Netflix o Amazon Prime?</span>
              <span className="faq-icono" style={{ transform: openFAQ === 0 ? 'rotate(45deg)' : 'rotate(0)' }}>+</span>
            </button>
            {openFAQ === 0 && (
              <div className="faq-respuesta" id="faq-answer-0">
                <p>MoviMood no es una plataforma de streaming. Somos un sistema de recomendaciones basado en tu estado de ánimo actual, no solo en tu historial. Te ayudamos a descubrir qué ver según cómo te sientes hoy.</p>
              </div>
            )}
          </div>

          <div className="faq-item">
            <button className="faq-pregunta" onClick={() => setOpenFAQ(openFAQ === 1 ? null : 1)} aria-expanded={openFAQ === 1} aria-controls="faq-answer-1">
              <span>¿Necesito conectar mis redes sociales?</span>
              <span className="faq-icono" style={{ transform: openFAQ === 1 ? 'rotate(45deg)' : 'rotate(0)' }}>+</span>
            </button>
            {openFAQ === 1 && (
              <div className="faq-respuesta" id="faq-answer-1">
                <p>No. MoviMood es completamente independiente. Solo necesitas email y contraseña. No compartimos tus datos con terceros ni requerimos acceso a tus redes sociales.</p>
              </div>
            )}
          </div>

          <div className="faq-item">
            <button className="faq-pregunta" onClick={() => setOpenFAQ(openFAQ === 2 ? null : 2)} aria-expanded={openFAQ === 2} aria-controls="faq-answer-2">
              <span>¿Qué pasa si no me gusta ninguna recomendación?</span>
              <span className="faq-icono" style={{ transform: openFAQ === 2 ? 'rotate(45deg)' : 'rotate(0)' }}>+</span>
            </button>
            {openFAQ === 2 && (
              <div className="faq-respuesta" id="faq-answer-2">
                <p>Puedes repetir el cuestionario ajustando tus preferencias de género, época o duración. Nuestro sistema aprende de tus elecciones para mejorar futuras recomendaciones.</p>
              </div>
            )}
          </div>

          <div className="faq-item">
            <button className="faq-pregunta" onClick={() => setOpenFAQ(openFAQ === 3 ? null : 3)} aria-expanded={openFAQ === 3} aria-controls="faq-answer-3">
              <span>¿Puedo compartir mis listas de películas favoritas?</span>
              <span className="faq-icono" style={{ transform: openFAQ === 3 ? 'rotate(45deg)' : 'rotate(0)' }}>+</span>
            </button>
            {openFAQ === 3 && (
              <div className="faq-respuesta" id="faq-answer-3">
                <p>Actualmente las listas son privadas, pero estamos trabajando en una función para compartir tus listas favoritas con amigos mediante enlace directo.</p>
              </div>
            )}
          </div>

          <div className="faq-item">
            <button className="faq-pregunta" onClick={() => setOpenFAQ(openFAQ === 4 ? null : 4)} aria-expanded={openFAQ === 4} aria-controls="faq-answer-4">
              <span>¿MoviMood tiene aplicación móvil?</span>
              <span className="faq-icono" style={{ transform: openFAQ === 4 ? 'rotate(45deg)' : 'rotate(0)' }}>+</span>
            </button>
            {openFAQ === 4 && (
              <div className="faq-respuesta" id="faq-answer-4">
                <p>Por ahora MoviMood es una aplicación web responsive que funciona perfectamente en móvil, tablet y ordenador desde el navegador. Una app nativa está en desarrollo.</p>
              </div>
            )}
          </div>

          <div className="faq-item">
            <button className="faq-pregunta" onClick={() => setOpenFAQ(openFAQ === 5 ? null : 5)} aria-expanded={openFAQ === 5} aria-controls="faq-answer-5">
              <span>¿Cómo se actualiza el catálogo de películas?</span>
              <span className="faq-icono" style={{ transform: openFAQ === 5 ? 'rotate(45deg)' : 'rotate(0)' }}>+</span>
            </button>
            {openFAQ === 5 && (
              <div className="faq-respuesta" id="faq-answer-5">
                <p>Nuestro catálogo se actualiza automáticamente gracias a la integración con TMDB. Cada semana se añaden nuevos estrenos y películas clásicas recién digitalizadas.</p>
              </div>
            )}
          </div>
        </div>
      </section>
    </div>
  );
}

export default Home;