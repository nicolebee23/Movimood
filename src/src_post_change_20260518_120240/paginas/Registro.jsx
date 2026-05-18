import { useState } from 'react';
import { Link, Navigate, useNavigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import registroBg from '../assets/registro-page-bg.png';
import './Auth.css';

function Registro() {
  const navigate = useNavigate();
  const { currentUser, register } = useAuth();
  const [username, setUsername] = useState('');
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState('');

  if (currentUser) {
    return <Navigate to="/perfil" replace />;
  }

  async function handleSubmit(event) {
    event.preventDefault();

    if (password !== confirmPassword) {
      setError('Las contraseñas no coinciden.');
      return;
    }

    try {
      setError('');
      await register({ username, name, email, password });
      navigate('/perfil');
    } catch (registerError) {
      setError(registerError.message || 'No se pudo crear la cuenta.');
    }
  }

  return (
    <div className="pagina-register" style={{ backgroundImage: `url(${registroBg})` }}>
      <button className="login-back-btn" onClick={() => navigate(-1)}>← Volver</button>
      <div className="login-overlay" />
      <div className="login-hero-panel">
        <div className="hero-copy">
          <h1>Crea tu cuenta<br />y guarda tus películas, <span className="login-accent">reseñas y más.</span></h1>
          <p className="login-subtitle">Únete a nuestra comunidad y construye tu videoteca personal.</p>
          <ul className="hero-features">
            <li>Guarda tus películas favoritas en un solo lugar</li>
            <li>Escribe reseñas y calificaciones para compartir tu opinión</li>
            <li>Descubre nuevas recomendaciones basadas en tu actividad</li>
          </ul>
        </div>
      </div>
      <div className="login-form-container">
        <div className="login-form-content">
          <h1>Regístrate</h1>
          <p className="login-subtitle">Crea tu cuenta para acceder a tu videoteca personal.</p>

          <form className="login-form" onSubmit={handleSubmit}>
            <div className="form-group">
              <label htmlFor="username">Nombre de usuario</label>
              <input
                type="text"
                id="username"
                placeholder="ej. moviemarta"
                value={username}
                onChange={(event) => setUsername(event.target.value)}
                required
              />
              <p className="auth-help-text">Será tu identificador público. Usa 3-18 caracteres en minúsculas, números, punto o _.</p>
            </div>

            <div className="form-group">
              <label htmlFor="nombre">Nombre visible</label>
              <input
                type="text"
                id="nombre"
                placeholder="Cómo quieres que te vean"
                value={name}
                onChange={(event) => setName(event.target.value)}
                required
              />
            </div>

            <div className="form-group">
              <label htmlFor="email">Email</label>
              <div className="input-with-icon">
                <input
                  type="email"
                  id="email"
                  placeholder="tu@email.com"
                  value={email}
                  onChange={(event) => setEmail(event.target.value)}
                  required
                />
                <span className="input-icon">✉</span>
              </div>
            </div>

            <div className="form-group">
              <label htmlFor="password">Contraseña</label>
              <input
                type="password"
                id="password"
                placeholder="••••••••"
                value={password}
                onChange={(event) => setPassword(event.target.value)}
                required
              />
            </div>

            <div className="form-group">
              <label htmlFor="confirm">Confirmar contraseña</label>
              <input
                type="password"
                id="confirm"
                placeholder="••••••••"
                value={confirmPassword}
                onChange={(event) => setConfirmPassword(event.target.value)}
                required
              />
            </div>

            {error && <p className="login-error">{error}</p>}

            <button type="submit" className="login-btn">Registrarse →</button>
          </form>

          <p className="login-footer" style={{ textAlign: 'left' }}>
            ¿Ya tienes cuenta? <Link to="/login">Inicia sesión aquí</Link>
          </p>
        </div>
      </div>
    </div>
  );
}

export default Registro;
