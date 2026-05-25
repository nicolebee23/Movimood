import '../App.css';
import BotonMood from '../componentes/BotonMood';
import SliderAnios from '../componentes/SliderAnios';
// Imágenes de géneros
import genAccion from '../assets/genero-accion.png';
import genComedia from '../assets/genero-comedia.png';
import genDrama from '../assets/genero-drama.png';
import genTerror from '../assets/genero-terror.png';
import genRomance from '../assets/genero-romance.png';
import genFantasia from '../assets/genero-fantasia.png';
import genAnimacion from '../assets/genero-animacion.png';
import genAventura from '../assets/genero-aventura.png';
import genBelica from '../assets/genero-belica.png';
import genCienciaFiccion from '../assets/genero-ciencia-ficcion.png';
import genCrimen from '../assets/genero-crimen.png';
import genFamilia from '../assets/genero-familia.png';
import genMisterio from '../assets/genero-misterio.png';
import genMusical from '../assets/genero-musical.png';
import genThriller from '../assets/genero-thriller.png';
import genWestern from '../assets/genero-western.png';
// Imágenes de mood locales
import moodAnsioso from '../assets/mood-ansioso-thriller.png';
import moodEmocionado from '../assets/mood-emocionado-aventura.png';
import moodEnfadado from '../assets/mood-enfadado-furia.png';
import moodFeliz from '../assets/mood-feliz-musica.png';
import moodMotivado from '../assets/mood-motivado-impulso.png';
import moodNostalgico from '../assets/mood-nostalgico-noir.png';
import moodRelajado from '../assets/mood-relajado-atardecer.png';
import moodTriste from '../assets/mood-triste-joker.png';
import { useState } from 'react';
import { useNavigate, Navigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import WizardSidebar from '../componentes/WizardSidebar';

// Menu is provided by `WizardSidebar`; no local menuLinks required here.

// Removed unused MOOD_CARD_BACKGROUNDS constant (was causing lint warning)

function Cuestionario() {
  const navigate = useNavigate();
  const { currentUser } = useAuth();
  
  
  // Estado para controlar en qué paso estamos (1, 2, 3, 4)
  const [pasoActual, setPasoActual] = useState(1);
  
  // Estados para las respuestas
  const [moodsSeleccionados, setMoodsSeleccionados] = useState([]);
  const [avisoMood, setAvisoMood] = useState('');
  const [aniosSeleccionados, setAniosSeleccionados] = useState({ min: 1980, max: 2025 });
  const [duracionSeleccionada, setDuracionSeleccionada] = useState('');
  const [generosSeleccionados, setGenerosSeleccionados] = useState([]); // ← AHORA ES ARRAY

  // Si no hay usuario autenticado, redirigir al login (protección doble)
  if (!currentUser) {
    return <Navigate to="/login" replace state={{ from: '/cuestionario' }} />;
  }

  const titulosPaso = {
    1: 'Mood',
    2: 'Época',
    3: 'Duración',
    4: 'Géneros'
  };

  // Datos de cada pregunta
  const listaMoods = [
    { iconName: 'triste', texto: 'Triste', backgroundImage: moodTriste },
    { iconName: 'nostalgico', texto: 'Nostálgico', backgroundImage: moodNostalgico },
    { iconName: 'relajado', texto: 'Relajado', backgroundImage: moodRelajado },
    { iconName: 'ansioso', texto: 'Ansioso', backgroundImage: moodAnsioso },
    { iconName: 'feliz', texto: 'Feliz', backgroundImage: moodFeliz },
    { iconName: 'motivado', texto: 'Motivado', backgroundImage: moodMotivado },
    { iconName: 'enojado', texto: 'Enojado', backgroundImage: moodEnfadado },
    { iconName: 'emocionado', texto: 'Emocionado', backgroundImage: moodEmocionado }
  ];

  const listaDuraciones = [
    { iconName: 'corta', texto: 'Corta', detalle: '< 90 min' },
    { iconName: 'media', texto: 'Media', detalle: '90-120 min' },
    { iconName: 'larga', texto: 'Larga', detalle: '> 120 min' }
  ];


  const listaGeneros = [
    { backgroundImage: genAccion, texto: 'Acción' },
    { backgroundImage: genComedia, texto: 'Comedia' },
    { backgroundImage: genDrama, texto: 'Drama' },
    { backgroundImage: genTerror, texto: 'Terror' },
    { backgroundImage: genRomance, texto: 'Romance' },
    { backgroundImage: genFantasia, texto: 'Fantasía' },
    { backgroundImage: genAnimacion, texto: 'Animación' },
    { backgroundImage: genAventura, texto: 'Aventura' },
    { backgroundImage: genBelica, texto: 'Bélica' },
    { backgroundImage: genCienciaFiccion, texto: 'Ciencia Ficción' },
    { backgroundImage: genCrimen, texto: 'Crimen' },
    { backgroundImage: genFamilia, texto: 'Familia' },
    { backgroundImage: genMisterio, texto: 'Misterio' },
    { backgroundImage: genMusical, texto: 'Musical' },
    { backgroundImage: genThriller, texto: 'Thriller' },
    { backgroundImage: genWestern, texto: 'Western' }
  ];

  // Función para seleccionar/deseleccionar géneros (toggle)
  function toggleGenero(genero) {
    if (generosSeleccionados.includes(genero)) {
      // Ya está seleccionado → deseleccionar
      setGenerosSeleccionados(generosSeleccionados.filter(g => g !== genero));
    } else {
      // No está seleccionado → seleccionar
      setGenerosSeleccionados([...generosSeleccionados, genero]);
    }
  }

  // Función para deseleccionar todos los géneros
  function deseleccionarTodos() {
    setGenerosSeleccionados([]);
  }

  // Funciones de navegación
  function irSiguiente() {
    if (pasoActual < 4) {
      setPasoActual(pasoActual + 1);
    } else {
      const questionnaire = {
        moods: moodsSeleccionados,
        anios: aniosSeleccionados,
        duracion: duracionSeleccionada,
        generos: generosSeleccionados,
      };

      localStorage.setItem('movimood-cuestionario', JSON.stringify(questionnaire));
      navigate('/resultados', { state: { questionnaire } });
    }
  }

  function irAtras() {
    if (pasoActual > 1) {
      setPasoActual(pasoActual - 1);
    }
  }

  function toggleMood(mood) {
    if (moodsSeleccionados.includes(mood)) {
      setMoodsSeleccionados(moodsSeleccionados.filter((m) => m !== mood));
      setAvisoMood('');
    } else if (moodsSeleccionados.length < 2) {
      setMoodsSeleccionados([...moodsSeleccionados, mood]);
      setAvisoMood('');
    } else {
      setAvisoMood('Puedes seleccionar como máximo 2 emociones.');
      return;
    }
  }

  // Presets removed — currently unused. Use the slider directly to select year range.

  function getTextoRangoAnios() {
    const rango = aniosSeleccionados.max - aniosSeleccionados.min;

    if (rango <= 2) {
      return `Rango muy específico (${aniosSeleccionados.min}-${aniosSeleccionados.max}). Te mostraremos recomendaciones muy concretas.`;
    }

    if (rango <= 8) {
      return `Rango definido (${aniosSeleccionados.min}-${aniosSeleccionados.max}). Buen equilibrio entre precisión y variedad.`;
    }

    return `Te sugeriremos cine de ${aniosSeleccionados.min} a ${aniosSeleccionados.max} con una variedad amplia de títulos.`;
  }

  function getTextoGeneros() {
    if (generosSeleccionados.length === 0) {
      return 'Elige al menos 1 género para personalizar mejor tus recomendaciones.';
    }

    if (generosSeleccionados.length === 1) {
      return 'Buen inicio. Si añades uno más, afinaremos mejor el resultado.';
    }

    if (generosSeleccionados.length <= 4) {
      return 'Selección ideal: equilibrio perfecto entre precisión y variedad.';
    }

    return 'Has elegido muchos géneros. Priorizaremos los que mejor encajen con tu mood.';
  }

  // Verificar si puede avanzar (respuesta seleccionada)
  function puedeAvanzar() {
    switch(pasoActual) {
      case 1: return moodsSeleccionados.length >= 1;
      case 2: return true; // Slider siempre tiene valores
      case 3: return duracionSeleccionada !== '';
      case 4: return generosSeleccionados.length > 0; // Al menos 1 género
      default: return false;
    }
  }

  return (
    <div className="cuestionario-page">
      <WizardSidebar
        activeLabel="Cuestionario"
        footerText="Responde el cuestionario y te damos películas hechas para tu mood."
        hideLinks={["Mi lista", "Mood"]}
      />

      <main className="cuestionario-main">
        {/* Barra de progreso */}
        <div className={`wizard-progreso paso-${pasoActual}`}>
            <p className="progreso-texto">Paso {pasoActual} de 4</p>
            <div className="progreso-barra">
              <div 
                className="progreso-relleno" 
                style={{ width: `${(pasoActual / 4) * 100}%` }}
              ></div>
            </div>
            
        </div>

        {/* Contenedor del paso actual con animación */}
        <div className={`wizard-contenedor ${pasoActual === 1 ? 'wizard-contenedor--sin-card' : ''}`} key={pasoActual}>
        <div className="wizard-step-chip-wrap">
          <span className="wizard-step-chip">PASO {pasoActual} • {titulosPaso[pasoActual]}</span>
        </div>
        
        {/* PASO 1: MOOD */}
        {pasoActual === 1 && (
          <div className="wizard-paso">
            <h2>¿Cómo te sientes <span className="wizard-title-accent">hoy?</span></h2>
            <p className="wizard-subtitulo">Selecciona 1 o 2 emociones</p>
            <p className="mood-selector-meta">Seleccionadas: {moodsSeleccionados.length}/2</p>

            {avisoMood && <p className="mood-selector-warning">{avisoMood}</p>}
            <div className="contenedor-botones moods-strip">
              {listaMoods.map((m) => (
                <BotonMood
                  key={m.iconName}
                  backgroundImage={m.backgroundImage}
                  texto={m.texto}
                  onClick={() => toggleMood(m.texto)}
                  seleccionado={moodsSeleccionados.includes(m.texto)}
                />
              ))}
            </div>
          </div>
        )}

        {/* PASO 2: ÉPOCA */}
        {pasoActual === 2 && (
          <div className="wizard-paso">
            <h2>¿En qué época buscas películas?</h2>
            <p className="wizard-subtitulo">Selecciona un rango de años</p>
            <SliderAnios 
              onCambio={setAniosSeleccionados} 
              valoresIniciales={aniosSeleccionados}
            />
            <p className="anios-contexto">{getTextoRangoAnios()}</p>
          </div>
        )}

        {/* PASO 3: DURACIÓN */}
        {pasoActual === 3 && (
          <div className="wizard-paso">
            <h2>¿Cuánto quieres que dure la película?</h2>
            <p className="wizard-subtitulo">Elige la duración que te apetece ver hoy</p>
            <div className="contenedor-botones duracion-botones" role="group" aria-label="Opciones de duración">
              {listaDuraciones.map((duracion) => (
                <BotonMood 
                  key={duracion.texto}
                  iconName={duracion.iconName}
                  texto={duracion.texto}
                  detalle={duracion.detalle}
                  onClick={() => setDuracionSeleccionada(duracion.texto)}
                  seleccionado={duracionSeleccionada === duracion.texto}
                />
              ))}
            </div>
          </div>
        )}

        {/* PASO 4: GÉNERO (SELECCIÓN MÚLTIPLE) */}
        {pasoActual === 4 && (
          <div className="wizard-paso">
            <h2>¿Qué géneros te apetecen?</h2>
            
            {/* Contador y botón deseleccionar */}
            <div className="generos-info">
              <p className="generos-contador">
                {generosSeleccionados.length === 0 
                  ? 'No has seleccionado ningún género' 
                  : `Has seleccionado ${generosSeleccionados.length} género${generosSeleccionados.length > 1 ? 's' : ''}`
                }
              </p>
              <span className="generos-recomendado">Recomendado: 2-4</span>
              {generosSeleccionados.length > 0 && (
                <button className="boton-deseleccionar" onClick={deseleccionarTodos}>
                  Deseleccionar todos
                </button>
              )}
            </div>

            <div className={`contenedor-botones generos-grid ${generosSeleccionados.length > 0 ? 'has-selection' : ''}`}>
              {listaGeneros.map((genero) => (
                  <BotonMood 
                    key={genero.texto}
                    backgroundImage={genero.backgroundImage}
                  texto={genero.texto}
                  onClick={() => toggleGenero(genero.texto)}
                  seleccionado={generosSeleccionados.includes(genero.texto)}
                  />
                ))}
            </div>

            {/* Sugerencia */}
            <p className="generos-sugerencia">
              {getTextoGeneros()}
            </p>
          </div>
        )}

        {/* Botones de navegación */}
        <div className="wizard-botones">
          {pasoActual > 1 && (
            <button className="boton-wizard boton-atras" onClick={irAtras}>
              ← Atrás
            </button>
          )}
          
          <button 
            className="boton-wizard boton-siguiente" 
            onClick={irSiguiente}
            disabled={!puedeAvanzar()}
          >
            {pasoActual === 4 ? '🎥 Ver Películas' : 'Siguiente →'}
          </button>
        </div>
        </div>
      </main>
    </div>
  );
}

export default Cuestionario;