import './BotonMood.css';

// Componente de botón para seleccionar opciones del cuestionario
function BotonMood(props) {
  return (
    <button 
      className={props.seleccionado ? 'boton-mood seleccionado' : 'boton-mood'}
      onClick={props.onClick}
    >
      <span className="emoji-mood">{props.emoji}</span>
      <span className="texto-mood">{props.texto}</span>
      {props.detalle && (
        <span className="detalle-mood">{props.detalle}</span>
      )}
    </button>
  );
}

export default BotonMood;