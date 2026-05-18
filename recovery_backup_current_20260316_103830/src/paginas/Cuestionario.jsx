import '../App.css';
import BotonMood from '../componentes/BotonMood';
import SliderAnios from '../componentes/SliderAnios';
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';

function Cuestionario() {
  const navigate = useNavigate();
  
  // Estado para controlar en qué paso estamos (1, 2, 3, 4)
  const [pasoActual, setPasoActual] = useState(1);
  
  // Estados para las respuestas
  const [moodSeleccionado, setMoodSeleccionado] = useState('');
  const [aniosSeleccionados, setAniosSeleccionados] = useState({ min: 1980, max: 2025 });
  const [duracionSeleccionada, setDuracionSeleccionada] = useState('');
  const [generoSeleccionado, setGeneroSeleccionado] = useState('');

  // Datos de cada pregunta
  const listaMoods = [
    { emoji: '😊', texto: 'Feliz' },
    { emoji: '😢', texto: 'Triste' },
    { emoji: '😴', texto: 'Relajado' },
    { emoji: '😡', texto: 'Enojado' },
    { emoji: '🤩', texto: 'Emocionado' }
  ];

  const listaDuraciones = [
    { emoji: '⚡', texto: 'Corta', detalle: '< 90 min' },
    { emoji: '⏱️', texto: 'Media', detalle: '90-120 min' },
    { emoji: '🎬', texto: 'Larga', detalle: '> 120 min' }
  ];

  const listaGeneros = [
    { emoji: '💥', texto: 'Acción' },
    { emoji: '😂', texto: 'Comedia' },
    { emoji: '😭', texto: 'Drama' },
    { emoji: '👻', texto: 'Terror' },
    { emoji: '💕', texto: 'Romance' },
    { emoji: '🔮', texto: 'Fantasía' }
  ];

  // Funciones de navegación
  function irSiguiente() {
    if (pasoActual < 4) {
      setPasoActual(pasoActual + 1);
    } else {
      // Último paso - mostrar resumen
      alert(`¡Cuestionario completado!\n\nMood: ${moodSeleccionado}\nAños: ${aniosSeleccionados.min} - ${aniosSeleccionados.max}\nDuración: ${duracionSeleccionada}\nGénero: ${generoSeleccionado}\n\n(Próximamente verás películas recomendadas)`);
    }
  }

  function irAtras() {
    if (pasoActual > 1) {
      setPasoActual(pasoActual - 1);
    }
  }

  // Verificar si puede avanzar (respuesta seleccionada)
  function puedeAvanzar() {
    switch(pasoActual) {
      case 1: return moodSeleccionado !== '';
      case 2: return true; // Slider siempre tiene valores
      case 3: return duracionSeleccionada !== '';
      case 4: return generoSeleccionado !== '';
      default: return false;
    }
  }

  return (
    <div className="pagina-principal">
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
        
        {/* PASO 1: MOOD */}
        {pasoActual === 1 && (
          <div className="wizard-paso">
            <h2>¿Cómo te sientes hoy?</h2>
            <div className="contenedor-botones">
              {listaMoods.map((mood) => (
                <BotonMood 
                  key={mood.texto}
                  emoji={mood.emoji}
                  texto={mood.texto}
                  onClick={() => setMoodSeleccionado(mood.texto)}
                  seleccionado={moodSeleccionado === mood.texto}
                />
              ))}
            </div>
          </div>
        )}

        {/* PASO 2: AÑOS */}
      {pasoActual === 2 && (
  <div className="wizard-paso">
    <h2>¿De qué años quieres películas?</h2>
    <SliderAnios 
      onCambio={setAniosSeleccionados} 
      valoresIniciales={aniosSeleccionados}
    />
  </div>
)}

        {/* PASO 3: DURACIÓN */}
        {pasoActual === 3 && (
          <div className="wizard-paso">
            <h2>¿Cuánto tiempo tienes?</h2>
            <div className="contenedor-botones">
              {listaDuraciones.map((duracion) => (
                <BotonMood 
                  key={duracion.texto}
                  emoji={duracion.emoji}
                  texto={duracion.texto}
                  detalle={duracion.detalle}
                  onClick={() => setDuracionSeleccionada(duracion.texto)}
                  seleccionado={duracionSeleccionada === duracion.texto}
                />
              ))}
            </div>
          </div>
        )}

        {/* PASO 4: GÉNERO */}
        {pasoActual === 4 && (
          <div className="wizard-paso">
            <h2>¿Qué género te apetece?</h2>
            <div className="contenedor-botones">
              {listaGeneros.map((genero) => (
                <BotonMood 
                  key={genero.texto}
                  emoji={genero.emoji}
                  texto={genero.texto}
                  onClick={() => setGeneroSeleccionado(genero.texto)}
                  seleccionado={generoSeleccionado === genero.texto}
                />
              ))}
            </div>
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