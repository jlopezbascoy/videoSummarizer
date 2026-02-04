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
  success: '#00FF41',
  error: '#FF3333',
  warning: '#FFB800',
  textPrimary: '#E0FFE0',
  textSecondary: '#7FBF7F',
  textDisabled: '#3D5C3D',
};

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
  };

  const passwordsMatch = password && repeatPassword && password === repeatPassword;
  const isFormValid = username && email && password && repeatPassword && passwordsMatch && !loading;

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

  const getPasswordMatchStyle = () => {
    if (!repeatPassword) return inputStyle;
    if (passwordsMatch) {
      return {
        ...inputStyle,
        border: `1px solid ${colors.success}50`,
        boxShadow: `0 0 10px ${colors.primaryGlow}`,
      };
    }
    return {
      ...inputStyle,
      border: `1px solid ${colors.error}50`,
    };
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
        width: 400,
        textAlign: 'center',
        boxShadow: `0 0 40px rgba(0, 255, 65, 0.15), 0 0 80px rgba(0, 255, 65, 0.05)`,
      }}>
        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
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
                background: colors.warning,
                boxShadow: `0 0 8px ${colors.warning}60`,
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
              {'> REGISTER_'}
            </h2>
            <p style={{
              margin: '8px 0 0 0',
              color: colors.textSecondary,
              fontSize: '0.8rem',
              letterSpacing: '1px',
            }}>
              [CREAR NUEVA CUENTA]
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
              animation: 'fadeIn 0.3s ease-in',
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
              placeholder="> email"
              type="text"
              value={email}
              onChange={e => setEmail(e.target.value)}
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
              placeholder="> contraseña (mín. 6 chars)"
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

          <div>
            <input
              type="password"
              placeholder="> repetir contraseña"
              value={repeatPassword}
              onChange={e => setRepeatPassword(e.target.value)}
              disabled={loading}
              style={getPasswordMatchStyle()}
              onFocus={(e) => {
                if (!repeatPassword || passwordsMatch) {
                  e.currentTarget.style.borderColor = colors.primary;
                  e.currentTarget.style.boxShadow = `0 0 15px ${colors.primaryGlow}`;
                }
              }}
              onBlur={(e) => {
                if (!repeatPassword) {
                  e.currentTarget.style.borderColor = colors.border;
                  e.currentTarget.style.boxShadow = 'none';
                }
              }}
            />
            {repeatPassword && (
              <p style={{
                margin: '8px 0 0 0',
                fontSize: '0.75rem',
                textAlign: 'left',
                color: passwordsMatch ? colors.success : colors.error,
                animation: 'fadeIn 0.3s ease-in',
              }}>
                {passwordsMatch ? '[✓] Contraseñas coinciden' : '[✗] Las contraseñas no coinciden'}
              </p>
            )}
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
              marginTop: '8px',
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
            {loading ? '> Procesando...' : '> Crear Cuenta'}
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
            {'¿Ya tienes acceso? '}
            <button
              onClick={onBack}
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
              [INICIAR SESIÓN]
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
            <span style={{ color: colors.primary }}>new_user@system</span>
            <span style={{ color: colors.textSecondary }}>:</span>
            <span style={{ color: '#00D4FF' }}>~/register</span>
            <span style={{ color: colors.textSecondary }}>$ </span>
            <span style={{ 
              color: colors.textPrimary,
              animation: 'blink 1s infinite',
            }}>_</span>
          </p>
        </div>
      </div>

      <style>{`
        @keyframes fadeIn {
          from {
            opacity: 0;
            transform: translateY(8px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
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