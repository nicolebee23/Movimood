import '../App.css';
import BotonMood from '../componentes/BotonMood';
import SliderAnios from '../componentes/SliderAnios';
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';

function Cuestionario() {
  // Estado para controlar en qué paso estamos (1, 2, 3, 4)
  const [pasoActual, setPasoActual] = useState(1);
  const navigate = useNavigate();
  
  // Estados para las respuestas
  const [moodsSeleccionados, setMoodsSeleccionados] = useState([]);
  const [avisoMood, setAvisoMood] = useState('');
  const [aniosSeleccionados, setAniosSeleccionados] = useState({ min: 1980, max: 2025 });
  const [duracionSeleccionada, setDuracionSeleccionada] = useState('');
  const [generosSeleccionados, setGenerosSeleccionados] = useState([]); // ← AHORA ES ARRAY

  const titulosPaso = {
    1: 'Mood',
    2: 'Epoca',
    3: 'Duracion',
    4: 'Generos'
  };

  // Datos de cada pregunta
  const listaMoods = [
    { iconName: 'triste', texto: 'Triste' },
    { iconName: 'nostalgico', texto: 'Nostalgico' },
    { iconName: 'relajado', texto: 'Relajado' },
    { iconName: 'ansioso', texto: 'Ansioso' },
    { iconName: 'feliz', texto: 'Feliz' },
    { iconName: 'motivado', texto: 'Motivado' },
    { iconName: 'enojado', texto: 'Enojado' },
    { iconName: 'emocionado', texto: 'Emocionado' }
  ];

  const listaDuraciones = [
    { iconName: 'corta', texto: 'Corta', detalle: '< 90 min' },
    { iconName: 'media', texto: 'Media', detalle: '90-120 min' },
    { iconName: 'larga', texto: 'Larga', detalle: '> 120 min' }
  ];

  const presetsAnios = [
    { label: 'Ultimos 5 años', min: 2020, max: 2025 },
    { label: '90s', min: 1990, max: 1999 },
    { label: '2000-2010', min: 2000, max: 2010 },
    { label: 'Clasicos', min: 1950, max: 1985 }
  ];

  const listaGeneros = [
    { iconName: 'accion', texto: 'Acción' },
    { iconName: 'aventura', texto: 'Aventura' },
    { iconName: 'animacion', texto: 'Animación' },
    { iconName: 'comedia', texto: 'Comedia' },
    { iconName: 'crimen', texto: 'Crimen' },
    { iconName: 'drama', texto: 'Drama' },
    { iconName: 'familia', texto: 'Familia' },
    { iconName: 'fantasia', texto: 'Fantasía' },
    { iconName: 'terror', texto: 'Terror' },
    { iconName: 'musical', texto: 'Musical' },
    { iconName: 'misterio', texto: 'Misterio' },
    { iconName: 'romance', texto: 'Romance' },
    { iconName: 'ciencia-ficcion', texto: 'Ciencia Ficción' },
    { iconName: 'thriller', texto: 'Thriller' },
    { iconName: 'belica', texto: 'Bélica' },
    { iconName: 'western', texto: 'Western' }
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
      setAvisoMood('Puedes seleccionar como maximo 2 emociones.');
      return;
    }
  }

  function aplicarPresetAnios(min, max) {
    setAniosSeleccionados({ min, max });
  }

  function getTextoRangoAnios() {
    const rango = aniosSeleccionados.max - aniosSeleccionados.min;

    if (rango <= 2) {
      return `Rango muy especifico (${aniosSeleccionados.min}-${aniosSeleccionados.max}). Te mostraremos recomendaciones muy concretas.`;
    }

    if (rango <= 8) {
      return `Rango definido (${aniosSeleccionados.min}-${aniosSeleccionados.max}). Buen equilibrio entre precision y variedad.`;
    }

    return `Te sugeriremos cine de ${aniosSeleccionados.min} a ${aniosSeleccionados.max} con una variedad amplia de titulos.`;
  }

  function getTextoGeneros() {
    if (generosSeleccionados.length === 0) {
      return 'Elige al menos 1 genero para personalizar mejor tus recomendaciones.';
    }

    if (generosSeleccionados.length === 1) {
      return 'Buen inicio. Si anades uno mas, afinaremos mejor el resultado.';
    }

    if (generosSeleccionados.length <= 4) {
      return 'Seleccion ideal: equilibrio perfecto entre precision y variedad.';
    }

    return 'Has elegido muchos generos. Priorizaremos los que mejor encajen con tu mood.';
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
    <div className="pagina-principal cuestionario-page">
      {/* Barra de progreso */}
      <div className="wizard-progreso">
        <div className="progreso-barra">
          <div 
            className="progreso-relleno" 
            style={{ width: `${(pasoActual / 4) * 100}%` }}
          ></div>
        </div>
        <p className="progreso-texto">Paso {pasoActual} de 4</p>
      </div>

      <h1 className="titulo-app">🎬 MoviMood</h1>
      
      {/* Contenedor del paso actual con animación */}
      <div className="wizard-contenedor" key={pasoActual}>
        <div className="wizard-step-chip-wrap">
          <span className="wizard-step-chip">PASO {pasoActual} • {titulosPaso[pasoActual]}</span>
        </div>
        
        {/* PASO 1: MOOD */}
        {pasoActual === 1 && (
          <div className="wizard-paso">
            <h2>¿Cómo te sientes hoy?</h2>
            <p className="wizard-subtitulo">Selecciona 1 o 2 emociones</p>
            <p className="mood-selector-meta">Seleccionadas: {moodsSeleccionados.length}/2</p>
            {avisoMood && <p className="mood-selector-warning">{avisoMood}</p>}
            <div className="contenedor-botones moods-strip">
              {listaMoods.map((mood) => (
                <BotonMood 
                  key={mood.texto}
                  iconName={mood.iconName}
                  texto={mood.texto}
                  onClick={() => toggleMood(mood.texto)}
                  seleccionado={moodsSeleccionados.includes(mood.texto)}
                />
              ))}
            </div>
          </div>
        )}

        {/* PASO 2: AÑOS */}
        {pasoActual === 2 && (
          <div className="wizard-paso">
            <h2>¿Qué epoca te apetece hoy?</h2>
            <p className="wizard-subtitulo">Puedes mover el rango o usar un preset rapido</p>

            <div className="anios-presets" role="group" aria-label="Presets de años">
              {presetsAnios.map((preset) => {
                const activo = aniosSeleccionados.min === preset.min && aniosSeleccionados.max === preset.max;
                return (
                  <button
                    key={preset.label}
                    type="button"
                    className={`anio-preset-btn ${activo ? 'activo' : ''}`}
                    onClick={() => aplicarPresetAnios(preset.min, preset.max)}
                  >
                    {preset.label}
                  </button>
                );
              })}
            </div>

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
            <p className="wizard-subtitulo">Elige la duracion que te apetece ver hoy</p>
            <div className="contenedor-botones" role="group" aria-label="Opciones de duración">
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
            <p className="wizard-subtitulo">Elige los generos que te apetecen hoy</p>
            
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

            <div className="contenedor-botones generos-grid">
              {listaGeneros.map((genero) => (
                <BotonMood 
                  key={genero.texto}
                  iconName={genero.iconName}
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
      
      <p className="nombre-autora">Por Nicole Beeckmans</p>
    </div>
  );
}

export default Cuestionario;