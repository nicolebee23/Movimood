import { useState } from 'react';
import { Link, Navigate, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import loginBg from '../assets/login.bg.png';
import './Auth.css';

const LAST_IDENTIFIER_KEY = 'movimood-last-login-identifier';

function getLastIdentifier() {
  try {
    return localStorage.getItem(LAST_IDENTIFIER_KEY) || '';
  } catch {
    return '';
  }
}

function Login() {
  const navigate = useNavigate();
  const location = useLocation();
  const { currentUser, login } = useAuth();
  const [identifier, setIdentifier] = useState(getLastIdentifier());
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const redirectTo = location.state?.from || '/perfil';

  if (currentUser) {
    return <Navigate to={redirectTo} replace />;
  }

  async function handleSubmit(event) {
    event.preventDefault();
    try {
      setError('');
      await login({ identifier, password });
      localStorage.setItem(LAST_IDENTIFIER_KEY, identifier.trim());
      navigate(redirectTo, { replace: true });
    } catch (loginError) {
      // Log full error for debugging and show server message when available
      // eslint-disable-next-line no-console
      console.error('Login failed:', loginError);
      const serverMessage = loginError?.payload?.message || loginError?.message;
      setError(serverMessage || 'No se pudo iniciar sesión.');
    }
  }

  return (
    <div className="pagina-login" style={{ backgroundImage: `url(${loginBg})` }}>
      <button className="login-back-btn" onClick={() => navigate(-1)}>← Volver</button>
      <div className="login-overlay" />
      <div className="login-form-container">
        <div className="login-form-content">
          <h1>Iniciar Sesión<br />y vuelve a <span className="login-accent">disfrutar.</span></h1>
          <p className="login-subtitle">Entra en tu perfil para seguir tu videoteca, tus reseñas y tu actividad cinéfila.</p>

          <form className="login-form" onSubmit={handleSubmit}>
            <div className="form-group">
              <label htmlFor="identifier">Email o nombre de usuario</label>
              <input 
                type="text" 
                id="identifier" 
                placeholder="sergiomartin99" 
                value={identifier} 
                onChange={(event) => setIdentifier(event.target.value)} 
                required 
              />
            </div>
            
            <div className="form-group">
              <label htmlFor="password">Contraseña</label>
              <div className="password-input-wrapper">
                <input 
                  type={showPassword ? 'text' : 'password'} 
                  id="password" 
                  placeholder="••••••••" 
                  value={password} 
                  onChange={(event) => setPassword(event.target.value)} 
                  required 
                />
                <button 
                  type="button" 
                  className="password-toggle-icon" 
                  onClick={() => setShowPassword((prev) => !prev)}
                  aria-label={showPassword ? 'Ocultar contraseña' : 'Mostrar contraseña'}
                >
                  {showPassword ? '👁' : '👁‍🗨'}
                </button>
              </div>
              <p className="login-help-link">
                <Link to="/recuperar-password">¿Olvidaste tu contraseña?</Link>
              </p>
            </div>

            {error && <p className="login-error">{error}</p>}
            
            <button type="submit" className="login-btn">Iniciar Sesión →</button>
          </form>
          
          <p className="login-footer">
            ¿No tienes cuenta? <Link to="/registro">Regístrate aquí</Link>
          </p>
        </div>
      </div>
    </div>
  );
}

export default Login;
