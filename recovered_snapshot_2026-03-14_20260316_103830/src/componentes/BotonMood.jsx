import './BotonMood.css';

function IconoMood({ iconName }) {
  switch (iconName) {
    case 'feliz':
      return (
        <svg className="mood-icon-svg" viewBox="0 0 24 24" aria-hidden="true">
          <circle cx="12" cy="12" r="8"></circle>
          <path d="M9 10h.01"></path>
          <path d="M15 10h.01"></path>
          <path d="M8.5 14c1 .9 2.2 1.4 3.5 1.4s2.5-.5 3.5-1.4"></path>
        </svg>
      );
    case 'triste':
      return (
        <svg className="mood-icon-svg" viewBox="0 0 24 24" aria-hidden="true">
          <circle cx="12" cy="12" r="8"></circle>
          <path d="M9 10h.01"></path>
          <path d="M15 10h.01"></path>
          <path d="M8.5 15.2c1-.9 2.2-1.4 3.5-1.4s2.5.5 3.5 1.4"></path>
        </svg>
      );
    case 'relajado':
      return (
        <svg className="mood-icon-svg" viewBox="0 0 24 24" aria-hidden="true">
          <path d="M14.8 5.5a6.6 6.6 0 1 0 0 13.2 7.3 7.3 0 0 1 0-13.2z"></path>
          <path d="M5 17.6c1 .4 1.8.4 2.8 0s1.8-.4 2.8 0"></path>
        </svg>
      );
    case 'enojado':
      return (
        <svg className="mood-icon-svg" viewBox="0 0 24 24" aria-hidden="true">
          <circle cx="12" cy="12" r="8"></circle>
          <path d="M8.2 10.2 10 9.4"></path>
          <path d="m15.8 10.2-1.8-.8"></path>
          <path d="M9 14.5h6"></path>
        </svg>
      );
    case 'emocionado':
      return (
        <svg className="mood-icon-svg" viewBox="0 0 24 24" aria-hidden="true">
          <path d="m12 4.5 1.8 3.6 4 .6-2.9 2.8.7 4-3.6-1.9-3.6 1.9.7-4-2.9-2.8 4-.6z"></path>
          <path d="M18.5 5.5v2"></path>
          <path d="M19.5 6.5h-2"></path>
        </svg>
      );
    case 'nostalgico':
      return (
        <svg className="mood-icon-svg" viewBox="0 0 24 24" aria-hidden="true">
          <circle cx="12" cy="12" r="8"></circle>
          <path d="M12 8v4l2.6 1.8"></path>
          <path d="M8.5 17.2h7"></path>
        </svg>
      );
    case 'ansioso':
      return (
        <svg className="mood-icon-svg" viewBox="0 0 24 24" aria-hidden="true">
          <circle cx="12" cy="12" r="8"></circle>
          <path d="M8.8 10.4 10.5 9"></path>
          <path d="m15.2 10.4-1.7-1.4"></path>
          <path d="M9 14.7c1.2-.6 2-.9 3-.9s1.8.3 3 .9"></path>
        </svg>
      );
    case 'motivado':
      return (
        <svg className="mood-icon-svg" viewBox="0 0 24 24" aria-hidden="true">
          <path d="M12 4.8v14.4"></path>
          <path d="m7.8 9.2 4.2-4.4 4.2 4.4"></path>
          <path d="M7 16.8h10"></path>
        </svg>
      );
    case 'corta':
      return (
        <svg className="mood-icon-svg" viewBox="0 0 24 24" aria-hidden="true">
          <path d="M12 7.2v5.2"></path>
          <path d="m10.2 10.8 1.8 1.6 1.8-1.6"></path>
          <path d="M7 16.8h10"></path>
        </svg>
      );
    case 'media':
      return (
        <svg className="mood-icon-svg" viewBox="0 0 24 24" aria-hidden="true">
          <circle cx="12" cy="12" r="7.2"></circle>
          <path d="M12 8.5v4.2l2.8 1.7"></path>
        </svg>
      );
    case 'larga':
      return (
        <svg className="mood-icon-svg" viewBox="0 0 24 24" aria-hidden="true">
          <path d="M12 16.8V8"></path>
          <path d="m9.8 10.2 2.2-2.2 2.2 2.2"></path>
          <path d="M7 16.8h10"></path>
        </svg>
      );
    case 'accion':
      return (
        <svg className="mood-icon-svg" viewBox="0 0 24 24" aria-hidden="true">
          <path d="M4.5 12h15"></path>
          <path d="m13.5 8.5 6 3.5-6 3.5"></path>
        </svg>
      );
    case 'aventura':
      return (
        <svg className="mood-icon-svg" viewBox="0 0 24 24" aria-hidden="true">
          <path d="M6 18 12 6l6 12"></path>
          <path d="M9.5 14.2h5"></path>
        </svg>
      );
    case 'animacion':
      return (
        <svg className="mood-icon-svg" viewBox="0 0 24 24" aria-hidden="true">
          <path d="M7 7h10v10H7z"></path>
          <path d="m9.2 9.4 5.6 5.2"></path>
          <path d="m14.8 9.4-5.6 5.2"></path>
        </svg>
      );
    case 'comedia':
      return (
        <svg className="mood-icon-svg" viewBox="0 0 24 24" aria-hidden="true">
          <circle cx="12" cy="12" r="8"></circle>
          <path d="M9 10h.01"></path>
          <path d="M15 10h.01"></path>
          <path d="M8.6 14.2c1 .8 2.1 1.2 3.4 1.2s2.4-.4 3.4-1.2"></path>
        </svg>
      );
    case 'crimen':
      return (
        <svg className="mood-icon-svg" viewBox="0 0 24 24" aria-hidden="true">
          <path d="M8 9.2h8"></path>
          <path d="M8 12h8"></path>
          <path d="M8 14.8h5.5"></path>
          <path d="M6.5 6h11v12h-11z"></path>
        </svg>
      );
    case 'drama':
      return (
        <svg className="mood-icon-svg" viewBox="0 0 24 24" aria-hidden="true">
          <path d="M8 18V8"></path>
          <path d="M16 18V8"></path>
          <path d="M8 13h8"></path>
          <path d="M12 18v-3"></path>
        </svg>
      );
    case 'familia':
      return (
        <svg className="mood-icon-svg" viewBox="0 0 24 24" aria-hidden="true">
          <circle cx="9" cy="10" r="2"></circle>
          <circle cx="15" cy="10" r="2"></circle>
          <path d="M6.5 16c.8-1.5 1.7-2.2 2.5-2.2S10.7 14.5 11.5 16"></path>
          <path d="M12.5 16c.8-1.5 1.7-2.2 2.5-2.2s1.7.7 2.5 2.2"></path>
        </svg>
      );
    case 'fantasia':
      return (
        <svg className="mood-icon-svg" viewBox="0 0 24 24" aria-hidden="true">
          <path d="m12 5 1.7 3.4 3.8.6-2.7 2.7.6 3.8-3.4-1.8-3.4 1.8.6-3.8-2.7-2.7 3.8-.6z"></path>
        </svg>
      );
    case 'terror':
      return (
        <svg className="mood-icon-svg" viewBox="0 0 24 24" aria-hidden="true">
          <path d="M12 5c3.4 0 6 2.8 6 6.2 0 3.1-2.6 5.8-6 7.8-3.4-2-6-4.7-6-7.8C6 7.8 8.6 5 12 5z"></path>
          <path d="M10 10.7h.01"></path>
          <path d="M14 10.7h.01"></path>
          <path d="M10 13.8h4"></path>
        </svg>
      );
    case 'musical':
      return (
        <svg className="mood-icon-svg" viewBox="0 0 24 24" aria-hidden="true">
          <path d="M14 6v8.4"></path>
          <path d="M14 6l4-1.2v8"></path>
          <circle cx="10" cy="15.8" r="1.8"></circle>
          <circle cx="18" cy="14.8" r="1.8"></circle>
        </svg>
      );
    case 'misterio':
      return (
        <svg className="mood-icon-svg" viewBox="0 0 24 24" aria-hidden="true">
          <circle cx="11" cy="11" r="5"></circle>
          <path d="m14.8 14.8 4 4"></path>
          <path d="M11 9.5a1.5 1.5 0 1 1-1.1 2.5"></path>
          <path d="M11 14h.01"></path>
        </svg>
      );
    case 'romance':
      return (
        <svg className="mood-icon-svg" viewBox="0 0 24 24" aria-hidden="true">
          <path d="M12 18s-5.5-3.3-7.2-6.5C3.6 9.4 5 7 7.6 7c1.6 0 2.8.9 4.4 2.6C13.6 7.9 14.8 7 16.4 7 19 7 20.4 9.4 19.2 11.5 17.5 14.7 12 18 12 18z"></path>
        </svg>
      );
    case 'ciencia-ficcion':
      return (
        <svg className="mood-icon-svg" viewBox="0 0 24 24" aria-hidden="true">
          <path d="M12 5c3.2 0 5.8 2.1 5.8 4.8S15.2 14.6 12 14.6 6.2 12.5 6.2 9.8 8.8 5 12 5z"></path>
          <path d="M5.2 16h13.6"></path>
          <path d="M8.2 18.8h7.6"></path>
        </svg>
      );
    case 'thriller':
      return (
        <svg className="mood-icon-svg" viewBox="0 0 24 24" aria-hidden="true">
          <path d="M12 6v7"></path>
          <path d="M8.5 15.8 12 13l3.5 2.8"></path>
          <path d="M12 18h.01"></path>
          <path d="M12 4.8c4 0 7.2 3.2 7.2 7.2S16 19.2 12 19.2 4.8 16 4.8 12 8 4.8 12 4.8z"></path>
        </svg>
      );
    case 'belica':
      return (
        <svg className="mood-icon-svg" viewBox="0 0 24 24" aria-hidden="true">
          <path d="M7.5 16.5 16.5 7.5"></path>
          <path d="m14.8 6.2 3 3"></path>
          <path d="M6.2 14.8 9.2 17.8"></path>
          <path d="M5.8 18.2h4"></path>
        </svg>
      );
    case 'western':
      return (
        <svg className="mood-icon-svg" viewBox="0 0 24 24" aria-hidden="true">
          <path d="M6 10.2h12"></path>
          <path d="M8.2 10.2 9.8 7h4.4l1.6 3.2"></path>
          <path d="M8.2 10.2v2.6"></path>
          <path d="M15.8 10.2v2.6"></path>
        </svg>
      );
    default:
      return null;
  }
}

// Componente de botón para seleccionar opciones del cuestionario
function BotonMood(props) {
  return (
    <button 
      className={props.seleccionado ? 'boton-mood seleccionado' : 'boton-mood'}
      onClick={props.onClick}
    >
      {props.iconName ? (
        <span className="emoji-mood mood-icon-wrapper">
          <IconoMood iconName={props.iconName} />
        </span>
      ) : (
        <span className="emoji-mood">{props.emoji}</span>
      )}
      <span className="texto-mood">{props.texto}</span>
      {props.detalle && (
        <span className="detalle-mood">{props.detalle}</span>
      )}
    </button>
  );
}

export default BotonMood;