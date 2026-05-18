import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import recuperarBg from '../assets/recuperar-password-bg.png';
import './Auth.css';

function RecuperarPassword() {
  const navigate = useNavigate();
  const { recoverPasswordByEmail } = useAuth();
  const [email, setEmail] = useState('');
  const [error, setError] = useState('');
  const [successMessage, setSuccessMessage] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  async function handleSubmit(event) {
    event.preventDefault();
    setError('');
    setSuccessMessage('');
    setIsSubmitting(true);

    try {
      const result = await recoverPasswordByEmail(email);
      if (result?.mailSent === false && !result?.temporaryPassword && result?.mailError) {
        setError(result.mailError);
        return;
      }

      setSuccessMessage(result?.message || 'Te hemos enviado un correo de recuperación a esa dirección.');
    } catch (recoverError) {
      setError(recoverError.message || 'No se pudo iniciar el proceso de recuperación.');
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <div className="pagina-login" style={{ backgroundImage: `url(${recuperarBg})` }}>
      <button className="login-back-btn" onClick={() => navigate(-1)}>← Volver</button>
      <div className="login-overlay" />
      <div className="login-form-container">
        <div className="login-form-content">
          <h1>Recuperar <span className="login-accent">contraseña</span></h1>
          <p className="login-subtitle">Escribe tu email y te enviaremos un correo de recuperación.</p>

          <form className="login-form" onSubmit={handleSubmit}>
            <div className="form-group">
              <label htmlFor="recover-email">Email</label>
              <div className="input-with-icon">
                <input
                  id="recover-email"
                  type="email"
                  placeholder="tu@email.com"
                  value={email}
                  onChange={(event) => setEmail(event.target.value)}
                  required
                />
                <span className="input-icon">✉</span>
              </div>
            </div>

            {error && <p className="login-error">{error}</p>}
            {successMessage && (
              <p className="login-error" style={{ color: '#1f8d54', marginTop: 0 }}>{successMessage}</p>
            )}

            <button type="submit" className="login-btn" disabled={isSubmitting}>
              {isSubmitting ? 'Enviando...' : 'Enviar recuperación →'}
            </button>
          </form>

          <p className="login-footer" style={{ textAlign: 'left' }}>
            ¿Recordaste tu contraseña? <Link to="/login">Volver a iniciar sesión</Link>
          </p>
        </div>
      </div>
    </div>
  );
}

export default RecuperarPassword;
