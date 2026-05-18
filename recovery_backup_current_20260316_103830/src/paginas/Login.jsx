import { useState } from 'react';
import { Link, Navigate, useNavigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import './Auth.css';

function Login() {
  const navigate = useNavigate();
  const { currentUser, login } = useAuth();
  const [identifier, setIdentifier] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');

  if (currentUser) {
    return <Navigate to="/perfil" replace />;
  }

  function handleSubmit(event) {
    event.preventDefault();
    try {
      setError('');
      login({ identifier, password });
      navigate('/perfil');
    } catch (loginError) {
      setError(loginError.message || 'No se pudo iniciar sesión.');
    }
  }

  return (
    <div className="pagina-auth">
      <div className="auth-container">
        <div className="auth-layout">
          <div className="auth-brand-panel">
            <h1>🎬 MoviMood</h1>
            <h2>Iniciar Sesión</h2>
            <p className="auth-intro-copy">
              Entra en tu perfil para seguir tu videoteca, tus reseñas y tu actividad cinéfila.
            </p>
          </div>

          <div className="auth-form-panel">
            <form className="auth-form auth-form-grid" onSubmit={handleSubmit}>
              <div className="form-group auth-form-span-2">
                <label htmlFor="identifier">Email o nombre de usuario</label>
                <input type="text" id="identifier" placeholder="tu@email.com o moviemarta" value={identifier} onChange={(event) => setIdentifier(event.target.value)} required />
              </div>
              
              <div className="form-group auth-form-span-2">
                <label htmlFor="password">Contraseña</label>
                <input type="password" id="password" placeholder="••••••••" value={password} onChange={(event) => setPassword(event.target.value)} required />
              </div>

              {error && <p className="auth-error auth-form-span-2">{error}</p>}
              
              <button type="submit" className="btn-auth auth-form-span-2">Iniciar Sesión</button>
            </form>
            
            <p className="auth-footer">
              ¿No tienes cuenta? <Link to="/registro">Regístrate aquí</Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

export default Login;
