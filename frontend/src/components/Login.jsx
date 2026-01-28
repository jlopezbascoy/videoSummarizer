import React, { useState } from 'react';

export default function Login({ onLogin, onRegister }) {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');

  const handleSubmit = (e) => {
    e.preventDefault();
    if (username && password) onLogin({ username, password });
  };

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
      pointerEvents: 'none' // deja pasar el mouse al fondo
    }}>
      <div style={{
        width: 320,
        background: 'rgba(255,255,255,0.9)',
        borderRadius: 8,
        padding: 20,
        boxShadow: '0 8px 24px rgba(0,0,0,0.25)',
        pointerEvents: 'auto'  // solo el formulario captura eventos
      }}>
        <form onSubmit={handleSubmit}>
          <h3 style={{ margin: '0 0 12px 0', textAlign: 'center' }}>Login</h3>
          <div style={{ marginBottom: 10 }}>
            <input
              placeholder="Usuario"
              value={username}
              onChange={e => setUsername(e.target.value)}
              style={{ width: '100%', padding: 8, borderRadius: 4, border: '1px solid #ccc' }}
            />
          </div>
          <div style={{ marginBottom: 14 }}>
            <input
              type="password"
              placeholder="Contraseña"
              value={password}
              onChange={e => setPassword(e.target.value)}
              style={{ width: '100%', padding: 8, borderRadius: 4, border: '1px solid #ccc' }}
            />
          </div>
          <button
            type="submit"
            disabled={!username || !password}
            style={{
              width: '100%',
              padding: 10,
              borderRadius: 4,
              border: 'none',
              background: '#5227FF',
              color: '#fff',
              cursor: (username && password) ? 'pointer' : 'not-allowed'
            }}
          >
            Entrar
          </button>
        </form>

        {/* Botón de Crear Cuenta */}
        <div style={{ marginTop: 10, textAlign: 'center' }}>
          <button
            onClick={onRegister}
            style={{
              border: 'none',
              background: 'transparent',
              color: '#5227FF',
              cursor: 'pointer',
              textDecoration: 'underline',
              padding: 0,
              marginTop: 8
            }}
          >
            Crear cuenta
          </button>
        </div>
      </div>
    </div>
  );
}
