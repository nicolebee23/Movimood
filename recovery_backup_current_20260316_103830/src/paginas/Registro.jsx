import { useState } from 'react';
import { Link, Navigate, useNavigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
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

  const passwordRules = [
    { label: 'Minimo 8 caracteres', valid: password.length >= 8 },
    { label: 'Una letra minuscula', valid: /[a-z]/.test(password) },
    { label: 'Una letra mayuscula', valid: /[A-Z]/.test(password) },
    { label: 'Un numero', valid: /\d/.test(password) },
  ];

  if (currentUser) {
    return <Navigate to="/perfil" replace />;
  }

  function handleSubmit(event) {
    event.preventDefault();

    if (password !== confirmPassword) {
      setError('Las contraseñas no coinciden.');
      return;
    }

    try {
      setError('');
      register({ username, name, email, password });
      navigate('/perfil');
    } catch (registerError) {
      setError(registerError.message || 'No se pudo crear la cuenta.');
    }
  }

  return (
    <div className="pagina-auth">
      <div className="auth-container">
        <div className="auth-layout">
          <div className="auth-brand-panel">
            <h1>🎬 MoviMood</h1>
            <h2>Crear Cuenta</h2>
            <p className="auth-intro-copy">
              Crea tu perfil para guardar pelis, escribir reseñas y construir tu videoteca personal.
            </p>
          </div>

          <div className="auth-form-panel">
            <form className="auth-form auth-form-grid" onSubmit={handleSubmit}>
              <div className="form-group auth-form-span-2">
                <label htmlFor="username">Nombre de usuario</label>
                <input type="text" id="username" placeholder="ej. moviemarta" value={username} onChange={(event) => setUsername(event.target.value)} required />
                <p className="auth-help-text">Será tu identificador público. Usa 3-18 caracteres en minúsculas, números, punto o _.</p>
              </div>

              <div className="form-group">
                <label htmlFor="nombre">Nombre visible</label>
                <input type="text" id="nombre" placeholder="Cómo quieres que te vean" value={name} onChange={(event) => setName(event.target.value)} required />
              </div>
              
              <div className="form-group">
                <label htmlFor="email">Email</label>
                <input type="email" id="email" placeholder="tu@email.com" value={email} onChange={(event) => setEmail(event.target.value)} required />
              </div>
              
              <div className="form-group auth-form-span-2">
                <label htmlFor="password">Contraseña</label>
                <input type="password" id="password" placeholder="••••••••" value={password} onChange={(event) => setPassword(event.target.value)} required />
                <div className="auth-password-rules">
                  {passwordRules.map((rule) => (
                    <span key={rule.label} className={`auth-password-rule${rule.valid ? ' valido' : ''}`}>
                      {rule.label}
                    </span>
                  ))}
                </div>
              </div>
              
              <div className="form-group auth-form-span-2">
                <label htmlFor="confirm">Confirmar Contraseña</label>
                <input type="password" id="confirm" placeholder="••••••••" value={confirmPassword} onChange={(event) => setConfirmPassword(event.target.value)} required />
              </div>

              {error && <p className="auth-error auth-form-span-2">{error}</p>}
              
              <button type="submit" className="btn-auth auth-form-span-2">Registrarse</button>
            </form>
            
            <p className="auth-footer">
              ¿Ya tienes cuenta? <Link to="/login">Inicia sesión aquí</Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

export default Registro;
