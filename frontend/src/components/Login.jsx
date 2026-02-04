import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';

// Design System Colors - Hacker Theme
const colors = {
  bgPrimary: '#0A0F0A',
  bgSecondary: '#111811',
  border: '#1E2D1E',
  primary: '#00FF41',
  primaryHover: '#00CC33',
  primaryGlow: 'rgba(0, 255, 65, 0.4)',
  error: '#FF3333',
  textPrimary: '#E0FFE0',
  textSecondary: '#7FBF7F',
  textDisabled: '#3D5C3D',
};

export default function Login({ onRegister }) {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const { login } = useAuth();

  const handleSubmit = async (e) => {
    e.preventDefault();           // <- evita navegación por defecto SI o SI
    e.stopPropagation();          // <- por si algún padre escucha el submit
    setError('');

    if (!username || !password) {
      setError('Todos los campos son obligatorios');
      return;
    }

    setLoading(true);

    try {
      const result = await login({ username, password });
      console.log('Resultado login en Login.jsx:', result);

      if (!result || result.success === false) {
        setError(result?.error || 'Usuario o contraseña incorrectos');
        setPassword('');          // opcional: limpiar contraseña tras fallo
        setLoading(false);
        return;                   // <- muy explícito: no seguimos
      }

      // Si result.success === true:
      // El AuthProvider ya ha guardado token y user y tu app debería
      // redirigirte desde fuera (normalmente con una ruta protegida).
      // Aquí no hacemos nada más.
    } catch (err) {
      console.error('Error inesperado en Login.jsx:', err);
      setError('Error de conexión. Inténtalo de nuevo.');
      setLoading(false);
    }
  };

  const inputStyle = {
    width: '100%',
    padding: '14px 16px',
    borderRadius: '8px',
    border: `1px solid ${colors.border}`,
    background: colors.bgSecondary,
    color: colors.textPrimary,
    fontSize: '0.95rem',
    fontFamily: '"Share Tech Mono", "Fira Code", monospace',
    boxSizing: 'border-box',
    transition: 'all 200ms ease',
    outline: 'none',
  };

  const isFormValid = username && password && !loading;

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
      pointerEvents: 'none',
      fontFamily: '"Share Tech Mono", "Fira Code", monospace',
    }}>
      {/* Importar fuente */}
      <link href="https://fonts.googleapis.com/css2?family=Share+Tech+Mono&display=swap" rel="stylesheet" />
      
      <div style={{
        pointerEvents: 'auto',
        background: colors.bgPrimary,
        borderRadius: '12px',
        border: `1px solid ${colors.primary}30`,
        padding: '40px',
        width: 380,
        textAlign: 'center',
        boxShadow: `0 0 40px rgba(0, 255, 65, 0.15), 0 0 80px rgba(0, 255, 65, 0.05)`,
      }}>
        <form 
          onSubmit={handleSubmit} 
          noValidate // <- quita validación HTML que a veces causa comportamientos raros
          style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}
        >
          {/* Terminal Header */}
          <div style={{ marginBottom: '8px' }}>
            <div style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '8px',
              marginBottom: '16px',
            }}>
              <span style={{
                width: '12px',
                height: '12px',
                borderRadius: '50%',
                background: colors.error,
                boxShadow: `0 0 8px ${colors.error}60`,
              }}></span>
              <span style={{
                width: '12px',
                height: '12px',
                borderRadius: '50%',
                background: '#FFB800',
                boxShadow: '0 0 8px rgba(255, 184, 0, 0.6)',
              }}></span>
              <span style={{
                width: '12px',
                height: '12px',
                borderRadius: '50%',
                background: colors.primary,
                boxShadow: `0 0 8px ${colors.primaryGlow}`,
              }}></span>
            </div>
            
            <h2 style={{ 
              fontSize: '1.5rem', 
              margin: '0', 
              fontWeight: '600', 
              color: colors.primary,
              letterSpacing: '3px',
              textTransform: 'uppercase',
              textShadow: `0 0 20px ${colors.primaryGlow}`,
            }}>
              {'> LOGIN_'}
            </h2>
            <p style={{
              margin: '8px 0 0 0',
              color: colors.textSecondary,
              fontSize: '0.8rem',
              letterSpacing: '1px',
            }}>
              [SISTEMA DE AUTENTICACIÓN]
            </p>
          </div>

          {error && (
            <div style={{
              padding: '14px 16px',
              borderRadius: '8px',
              background: `${colors.error}10`,
              border: `1px solid ${colors.error}50`,
              color: colors.error,
              fontSize: '0.85rem',
              textAlign: 'left',
              animation: 'shakeAndFadeIn 0.5s ease-out',
            }}>
              {`[ERROR] ${error}`}
            </div>
          )}

          <div>
            <input
              placeholder="> usuario"
              value={username}
              onChange={e => setUsername(e.target.value)}
              disabled={loading}
              style={inputStyle}
              onFocus={(e) => {
                e.currentTarget.style.borderColor = colors.primary;
                e.currentTarget.style.boxShadow = `0 0 15px ${colors.primaryGlow}`;
              }}
              onBlur={(e) => {
                e.currentTarget.style.borderColor = colors.border;
                e.currentTarget.style.boxShadow = 'none';
              }}
            />
          </div>

          <div>
            <input
              type="password"
              placeholder="> contraseña"
              value={password}
              onChange={e => setPassword(e.target.value)}
              disabled={loading}
              style={inputStyle}
              onFocus={(e) => {
                e.currentTarget.style.borderColor = colors.primary;
                e.currentTarget.style.boxShadow = `0 0 15px ${colors.primaryGlow}`;
              }}
              onBlur={(e) => {
                e.currentTarget.style.borderColor = colors.border;
                e.currentTarget.style.boxShadow = 'none';
              }}
            />
          </div>

          <button
            type="submit"
            disabled={!isFormValid}
            style={{
              width: '100%',
              padding: '14px 24px',
              borderRadius: '8px',
              border: `1px solid ${isFormValid ? colors.primary : colors.textDisabled}`,
              background: 'transparent',
              color: isFormValid ? colors.primary : colors.textDisabled,
              cursor: isFormValid ? 'pointer' : 'not-allowed',
              fontSize: '1rem',
              fontWeight: '600',
              fontFamily: '"Share Tech Mono", "Fira Code", monospace',
              transition: 'all 200ms ease',
              boxShadow: isFormValid ? `0 0 20px ${colors.primaryGlow}, inset 0 0 20px rgba(0, 255, 65, 0.1)` : 'none',
              textTransform: 'uppercase',
              letterSpacing: '2px',
            }}
            onMouseEnter={(e) => {
              if (isFormValid) {
                e.currentTarget.style.background = `${colors.primary}20`;
                e.currentTarget.style.boxShadow = `0 0 30px ${colors.primaryGlow}, inset 0 0 30px rgba(0, 255, 65, 0.2)`;
                e.currentTarget.style.transform = 'translateY(-2px)';
              }
            }}
            onMouseLeave={(e) => {
              if (isFormValid) {
                e.currentTarget.style.background = 'transparent';
                e.currentTarget.style.boxShadow = `0 0 20px ${colors.primaryGlow}, inset 0 0 20px rgba(0, 255, 65, 0.1)`;
                e.currentTarget.style.transform = 'translateY(0)';
              }
            }}
          >
            {loading ? '> Conectando...' : '> Acceder'}
          </button>
        </form>

        <div style={{ 
          marginTop: '24px',
          paddingTop: '20px',
          borderTop: `1px solid ${colors.border}`,
        }}>
          <p style={{ 
            color: colors.textSecondary, 
            margin: 0,
            fontSize: '0.85rem',
          }}>
            {'¿Sin acceso? '}
            <button
              onClick={onRegister}
              disabled={loading}
              style={{
                border: 'none',
                background: 'transparent',
                color: colors.primary,
                cursor: loading ? 'not-allowed' : 'pointer',
                textDecoration: 'none',
                padding: 0,
                fontWeight: '600',
                fontSize: 'inherit',
                fontFamily: '"Share Tech Mono", "Fira Code", monospace',
                transition: 'all 200ms ease',
                textShadow: `0 0 10px ${colors.primaryGlow}`,
              }}
              onMouseEnter={(e) => {
                if (!loading) {
                  e.currentTarget.style.textShadow = `0 0 20px ${colors.primaryGlow}`;
                }
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.textShadow = `0 0 10px ${colors.primaryGlow}`;
              }}
            >
              [CREAR CUENTA]
            </button>
          </p>
        </div>

        {/* Decorative Terminal Line */}
        <div style={{
          marginTop: '20px',
          padding: '12px',
          background: colors.bgSecondary,
          borderRadius: '6px',
          border: `1px solid ${colors.border}`,
        }}>
          <p style={{
            margin: 0,
            color: colors.textDisabled,
            fontSize: '0.75rem',
            textAlign: 'left',
            letterSpacing: '1px',
          }}>
            <span style={{ color: colors.primary }}>guest@system</span>
            <span style={{ color: colors.textSecondary }}>:</span>
            <span style={{ color: '#00D4FF' }}>~</span>
            <span style={{ color: colors.textSecondary }}>$ </span>
            <span style={{ 
              color: colors.textPrimary,
              animation: 'blink 1s infinite',
            }}>_</span>
          </p>
        </div>
      </div>

      <style>{`
        @keyframes shakeAndFadeIn {
          0% { 
            opacity: 0;
            transform: translateX(-10px);
          }
          20% { transform: translateX(8px); }
          40% { transform: translateX(-6px); }
          60% { transform: translateX(4px); }
          80% { transform: translateX(-2px); }
          100% { 
            opacity: 1;
            transform: translateX(0);
          }
        }
        
        @keyframes blink {
          0%, 50% { opacity: 1; }
          51%, 100% { opacity: 0; }
        }

        ::selection {
          background: ${colors.primary}40;
          color: ${colors.textPrimary};
        }

        ::placeholder {
          color: ${colors.textDisabled};
        }
      `}</style>
    </div>
  );
}