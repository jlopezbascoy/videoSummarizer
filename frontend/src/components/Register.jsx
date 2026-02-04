import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';

export default function Register({ onBack }) {
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [repeatPassword, setRepeatPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const { register } = useAuth();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    if (!username || !email || !password || !repeatPassword) {
      setError('Todos los campos son obligatorios');
      setLoading(false);
      return;
    }

    if (password !== repeatPassword) {
      setError('Las contraseñas no coinciden');
      setLoading(false);
      return;
    }

    if (password.length < 6) {
      setError('La contraseña debe tener al menos 6 caracteres');
      setLoading(false);
      return;
    }

    const result = await register({ username, email, password });

    if (!result.success) {
      setError(result.error);
      setLoading(false);
    }
    // Si success, el AuthContext ya manejó el estado
  };

  const passwordsMatch = password && repeatPassword && password === repeatPassword;

  return (
    <div style={{
      position: 'absolute',
      top: 0,
      left: 0,
      width: '100%',
      height: '100%',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      pointerEvents: 'none'
    }}>
      <div style={{
        pointerEvents: 'auto',
        backdropFilter: 'blur(16px) saturate(180%)',
        WebkitBackdropFilter: 'blur(16px) saturate(180%)',
        backgroundColor: 'rgba(17, 25, 40, 0.75)',
        borderRadius: '12px',
        border: '1px solid rgba(255, 255, 255, 0.125)',
        padding: '40px',
        width: 380,
        textAlign: 'center',
      }}>
        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
          <h2 style={{ fontSize: '1.8rem', margin: '0 0 10px 0', fontWeight: '600', color: 'white' }}>
            Crear Cuenta
          </h2>

          {error && (
            <div style={{
              padding: '12px',
              borderRadius: '8px',
              background: 'rgba(239, 68, 68, 0.1)',
              border: '1px solid rgba(239, 68, 68, 0.5)',
              color: '#f87171',
              fontSize: '0.9rem'
            }}>
              {error}
            </div>
          )}

          <input
            placeholder="Usuario"
            value={username}
            onChange={e => setUsername(e.target.value)}
            disabled={loading}
            style={{
              width: '100%',
              padding: '12px',
              borderRadius: '8px',
              border: '1px solid rgba(255, 255, 255, 0.2)',
              background: 'rgba(255, 255, 255, 0.1)',
              color: 'white',
              fontSize: '1rem',
              boxSizing: 'border-box',
            }}
          />

          <input
            placeholder="Email"
            type="text"
            value={email}
            onChange={e => setEmail(e.target.value)}
            disabled={loading}
            style={{
              width: '100%',
              padding: '12px',
              borderRadius: '8px',
              border: '1px solid rgba(255, 255, 255, 0.2)',
              background: 'rgba(255, 255, 255, 0.1)',
              color: 'white',
              fontSize: '1rem',
              boxSizing: 'border-box',
            }}
          />

          <input
            type="password"
            placeholder="Contraseña (mín. 6 caracteres)"
            value={password}
            onChange={e => setPassword(e.target.value)}
            disabled={loading}
            style={{
              width: '100%',
              padding: '12px',
              borderRadius: '8px',
              border: '1px solid rgba(255, 255, 255, 0.2)',
              background: 'rgba(255, 255, 255, 0.1)',
              color: 'white',
              fontSize: '1rem',
              boxSizing: 'border-box',
            }}
          />

          <input
            type="password"
            placeholder="Repetir Contraseña"
            value={repeatPassword}
            onChange={e => setRepeatPassword(e.target.value)}
            disabled={loading}
            style={{
              width: '100%',
              padding: '12px',
              borderRadius: '8px',
              border: `1px solid ${passwordsMatch || !repeatPassword ? 'rgba(255, 255, 255, 0.2)' : 'red'}`,
              background: 'rgba(255, 255, 255, 0.1)',
              color: 'white',
              fontSize: '1rem',
              boxSizing: 'border-box',
            }}
          />

          <button
            type="submit"
            disabled={loading}
            style={{
              width: '100%',
              padding: '12px',
              borderRadius: '8px',
              border: 'none',
              background: loading ? '#6b7280' : '#5227FF',
              color: '#fff',
              cursor: loading ? 'not-allowed' : 'pointer',
              fontSize: '1.1rem',
              fontWeight: 'bold',
              transition: 'background 0.2s ease-in-out',
              marginTop: '10px'
            }}
          >
            {loading ? 'Registrando...' : 'Registrarse'}
          </button>
        </form>

        <p style={{ color: 'rgba(255, 255, 255, 0.7)', marginTop: '20px' }}>
          ¿Ya tienes cuenta?{' '}
          <button
            onClick={onBack}
            disabled={loading}
            style={{
              border: 'none',
              background: 'transparent',
              color: '#fff',
              cursor: loading ? 'not-allowed' : 'pointer',
              textDecoration: 'underline',
              padding: 0,
              fontWeight: 'bold',
              fontSize: 'inherit',
            }}
          >
            Volver al login
          </button>
        </p>
      </div>
    </div>
  );
}