import { useState, useEffect } from 'react';
import './SliderAnios.css';

function SliderAnios({ onCambio, valoresIniciales }) {
  const [anioMin, setAnioMin] = useState(valoresIniciales?.min || 1980);
  const [anioMax, setAnioMax] = useState(valoresIniciales?.max || 2025);

  const MIN_YEAR = 1950;
  const MAX_YEAR = 2025;

  // Actualizar estado cuando cambien los valores iniciales
  useEffect(() => {
    if (valoresIniciales) {
      setAnioMin(valoresIniciales.min);
      setAnioMax(valoresIniciales.max);
    }
  }, [valoresIniciales]);

  function handleMinChange(e) {
    const valor = parseInt(e.target.value);
    if (valor <= anioMax) {
      setAnioMin(valor);
      onCambio({ min: valor, max: anioMax });
    }
  }

  function handleMaxChange(e) {
    const valor = parseInt(e.target.value);
    if (valor >= anioMin) {
      setAnioMax(valor);
      onCambio({ min: anioMin, max: valor });
    }
  }

  return (
    <div className="slider-anios">
      <div className="slider-valores">
        <span className="slider-valor-min">{anioMin}</span>
        <span className="slider-separador">-</span>
        <span className="slider-valor-max">{anioMax}</span>
      </div>
      
      <div className="slider-contenedor">
        <input
          type="range"
          min={MIN_YEAR}
          max={MAX_YEAR}
          value={anioMin}
          onChange={handleMinChange}
          className="slider slider-min"
        />
        <input
          type="range"
          min={MIN_YEAR}
          max={MAX_YEAR}
          value={anioMax}
          onChange={handleMaxChange}
          className="slider slider-max"
        />
        <div className="slider-track">
          <div 
            className="slider-range"
            style={{
              left: `${((anioMin - MIN_YEAR) / (MAX_YEAR - MIN_YEAR)) * 100}%`,
              right: `${100 - ((anioMax - MIN_YEAR) / (MAX_YEAR - MIN_YEAR)) * 100}%`
            }}
          ></div>
        </div>
      </div>
      
      <div className="slider-etiquetas">
        <span>{MIN_YEAR}</span>
        <span>{MAX_YEAR}</span>
      </div>
    </div>
  );
}

export default SliderAnios;