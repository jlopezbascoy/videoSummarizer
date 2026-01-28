import React, { useState } from 'react';

export default function Register({ onRegister, onBack }) {
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [repeatPassword, setRepeatPassword] = useState('');

const handleSubmit = (e) => {
  e.preventDefault();

  if (!username || !email || !password || !repeatPassword) {
    alert('Todos los campos son obligatorios');
    return;
  }

  if (!passwordsMatch) {
    alert('Las contraseñas no coinciden');
    return;
  }

  // Si todo está bien, llama al callback
  onRegister({ username, email, password });
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
        width: 320,
        background: 'rgba(255,255,255,0.9)',
        borderRadius: 8,
        padding: 20,
        boxShadow: '0 8px 24px rgba(0,0,0,0.25)',
        pointerEvents: 'auto'
      }}>
        <form onSubmit={handleSubmit}>
          <h3 style={{ margin: '0 0 12px 0', textAlign: 'center' }}>Crear cuenta</h3>

          <div style={{ marginBottom: 10 }}>
            <input
              placeholder="Usuario"
              value={username}
              onChange={e => setUsername(e.target.value)}
              style={{ width: '100%', padding: 8, borderRadius: 4, border: '1px solid #ccc' }}
            />
          </div>

          <div style={{ marginBottom: 10 }}>
            <input
              placeholder="Email"
              type="email"
              value={email}
              onChange={e => setEmail(e.target.value)}
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

          <div style={{ marginBottom: 14 }}>
            <input
              type="password"
              placeholder="Repetir Contraseña"
              value={repeatPassword}
              onChange={e => setRepeatPassword(e.target.value)}
              style={{
                width: '100%',
                padding: 8,
                borderRadius: 4,
                border: `1px solid ${passwordsMatch || !repeatPassword ? '#ccc' : 'red'}`
              }}
            />
          </div>

         <button
  type="submit"
  style={{
    width: '100%',
    padding: 10,
    borderRadius: 4,
    border: 'none',
    background: '#5227FF',
    color: '#fff',
    cursor: 'pointer'  // siempre pointer
  }}
>
  Registrarse
</button>

        </form>

        <div style={{ marginTop: 10, textAlign: 'center' }}>
          <button
            onClick={onBack}
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
            Volver al login
          </button>
        </div>
      </div>
    </div>
  );
}
