import React, { useState, useEffect, useCallback, useMemo, useRef } from 'react';
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

// Iconos SVG
const EyeIcon = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
    <circle cx="12" cy="12" r="3" />
  </svg>
);

const EyeOffIcon = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24" />
    <line x1="1" y1="1" x2="23" y2="23" />
  </svg>
);

const GoogleIcon = () => (
  <svg width="18" height="18" viewBox="0 0 24 24">
    <path
      d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z"
      fill="#4285F4"
    />
    <path
      d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
      fill="#34A853"
    />
    <path
      d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
      fill="#FBBC05"
    />
    <path
      d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
      fill="#EA4335"
    />
  </svg>
);

export default function Login({ onRegister }) {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);
  const [googleReady, setGoogleReady] = useState(false);

  const { login, loginWithGoogle } = useAuth();

  const googleClientId = import.meta.env.VITE_GOOGLE_CLIENT_ID;

  const inputStyle = useMemo(
    () => ({
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
    }),
    []
  );

  const isAnyLoading = loading || googleLoading;
  const isFormValid = username && password && !loading && !googleLoading;

  // Manejar respuesta de Google
  const handleGoogleResponse = useCallback(
    async (response) => {
      setError('');
      setGoogleLoading(true);

      try {
        const credential = response?.credential;
        if (!credential) {
          setError('Google no devolvió credenciales. Intenta de nuevo.');
          return;
        }

        const authResult = await loginWithGoogle(credential);

        if (!authResult?.success) {
          setError(authResult?.error || 'Error al iniciar sesión con Google');
        }
      } catch (err) {
        console.error('Error Google Auth:', err);
        setError(err?.response?.data?.error || err?.message || 'Error al iniciar sesión con Google');
      } finally {
        setGoogleLoading(false);
      }
    },
    [loginWithGoogle]
  );

  // Cargar Google Identity Services
  useEffect(() => {
    if (window.google?.accounts?.id) {
      setGoogleReady(true);
      return;
    }

    const existing = document.querySelector('script[data-google-gsi="true"]');

    if (existing) {
      const checkInterval = setInterval(() => {
        if (window.google?.accounts?.id) {
          setGoogleReady(true);
          clearInterval(checkInterval);
        }
      }, 100);

      const timeout = setTimeout(() => {
        clearInterval(checkInterval);
      }, 10000);

      return () => {
        clearInterval(checkInterval);
        clearTimeout(timeout);
      };
    }

    const script = document.createElement('script');
    script.src = 'https://accounts.google.com/gsi/client';
    script.async = true;
    script.defer = true;
    script.setAttribute('data-google-gsi', 'true');
    script.onload = () => setTimeout(() => setGoogleReady(true), 150);
    script.onerror = () => setError('No se pudo cargar Google Identity Services.');
    document.body.appendChild(script);
  }, []);

  // Inicializar Google Sign-In cuando esté listo
  useEffect(() => {
    if (!googleReady || !googleClientId || !window.google?.accounts?.id) return;

    try {
      window.google.accounts.id.initialize({
        client_id: googleClientId,
        callback: handleGoogleResponse,
        auto_select: false,
        cancel_on_tap_outside: true,
        use_fedcm_for_prompt: false,
      });
    } catch (e) {
      console.error('Error inicializando Google:', e);
    }
  }, [googleReady, googleClientId, handleGoogleResponse]);

  // Botón custom que abre el popup de Google
  const handleGoogleClick = () => {
    if (!googleReady || isAnyLoading) return;

    try {
      window.google.accounts.id.prompt((notification) => {
        if (notification.isNotDisplayed()) {
          // Si prompt no se muestra (popup bloqueado, etc), intentar con popup manual
          console.warn('Google prompt no disponible, razón:', notification.getNotDisplayedReason());

          // Fallback: usar el flujo OAuth2 manual con popup
          const width = 500;
          const height = 600;
          const left = window.screenX + (window.outerWidth - width) / 2;
          const top = window.screenY + (window.outerHeight - height) / 2;

          const authUrl =
            `https://accounts.google.com/o/oauth2/v2/auth?` +
            `client_id=${googleClientId}` +
            `&redirect_uri=${encodeURIComponent(window.location.origin)}` +
            `&response_type=token id_token` +
            `&scope=openid email profile` +
            `&nonce=${Math.random().toString(36).substring(2)}`;

          const popup = window.open(
            authUrl,
            'google-auth',
            `width=${width},height=${height},left=${left},top=${top}`
          );

          // Escuchar el resultado del popup
          const checkPopup = setInterval(() => {
            try {
              if (popup?.closed) {
                clearInterval(checkPopup);
                return;
              }
              const url = popup?.location?.href;
              if (url?.includes('id_token=')) {
                clearInterval(checkPopup);
                const params = new URLSearchParams(url.split('#')[1]);
                const idToken = params.get('id_token');
                popup.close();
                if (idToken) {
                  handleGoogleResponse({ credential: idToken });
                }
              }
            } catch {
              // Cross-origin, ignorar hasta que redirija
            }
          }, 500);
        }

        if (notification.isSkippedMoment()) {
          console.log('Usuario cerró el prompt de Google');
        }
      });
    } catch (err) {
      console.error('Error abriendo Google Sign-In:', err);
      setError('Error al abrir Google Sign-In');
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    e.stopPropagation();
    setError('');

    if (!username || !password) {
      setError('Todos los campos son obligatorios');
      return;
    }

    setLoading(true);

    try {
      const result = await login({ username, password });

      if (!result || result.success === false) {
        setError(result?.error || 'Usuario o contraseña incorrectos');
        setPassword('');
        setLoading(false);
        return;
      }
    } catch (err) {
      console.error('Error inesperado en Login.jsx:', err);
      setError('Error de conexión. Inténtalo de nuevo.');
      setLoading(false);
    }
  };

  return (
    <div
      style={{
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
      }}
    >
      <link href="https://fonts.googleapis.com/css2?family=Share+Tech+Mono&display=swap" rel="stylesheet" />

      <div
        style={{
          pointerEvents: 'auto',
          background: colors.bgPrimary,
          borderRadius: '12px',
          border: `1px solid ${colors.primary}30`,
          padding: '40px',
          width: 380,
          textAlign: 'center',
          boxShadow: `0 0 40px rgba(0, 255, 65, 0.15), 0 0 80px rgba(0, 255, 65, 0.05)`,
        }}
      >
        <form onSubmit={handleSubmit} noValidate style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          {/* Terminal Header */}
          <div style={{ marginBottom: '8px' }}>
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '8px',
                marginBottom: '16px',
              }}
            >
              <span style={{ width: '12px', height: '12px', borderRadius: '50%', background: colors.error, boxShadow: `0 0 8px ${colors.error}60` }}></span>
              <span style={{ width: '12px', height: '12px', borderRadius: '50%', background: '#FFB800', boxShadow: '0 0 8px rgba(255, 184, 0, 0.6)' }}></span>
              <span style={{ width: '12px', height: '12px', borderRadius: '50%', background: colors.primary, boxShadow: `0 0 8px ${colors.primaryGlow}` }}></span>
            </div>

            <h2
              style={{
                fontSize: '1.5rem',
                margin: '0',
                fontWeight: '600',
                color: colors.primary,
                letterSpacing: '3px',
                textTransform: 'uppercase',
                textShadow: `0 0 20px ${colors.primaryGlow}`,
              }}
            >
              {'> LOGIN_'}
            </h2>
            <p style={{ margin: '8px 0 0 0', color: colors.textSecondary, fontSize: '0.8rem', letterSpacing: '1px' }}>
              [SISTEMA DE AUTENTICACIÓN]
            </p>
          </div>

          {error && (
            <div
              style={{
                padding: '14px 16px',
                borderRadius: '8px',
                background: `${colors.error}10`,
                border: `1px solid ${colors.error}50`,
                color: colors.error,
                fontSize: '0.85rem',
                textAlign: 'left',
                animation: 'shakeAndFadeIn 0.5s ease-out',
              }}
            >
              {`[ERROR] ${error}`}
            </div>
          )}

          <div>
            <input
              placeholder="> usuario"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              disabled={isAnyLoading}
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

          <div style={{ position: 'relative' }}>
            <input
              type={showPassword ? 'text' : 'password'}
              placeholder="> contraseña"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              disabled={isAnyLoading}
              style={{ ...inputStyle, paddingRight: '50px' }}
              onFocus={(e) => {
                e.currentTarget.style.borderColor = colors.primary;
                e.currentTarget.style.boxShadow = `0 0 15px ${colors.primaryGlow}`;
              }}
              onBlur={(e) => {
                e.currentTarget.style.borderColor = colors.border;
                e.currentTarget.style.boxShadow = 'none';
              }}
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              disabled={isAnyLoading}
              style={{
                position: 'absolute',
                right: '12px',
                top: '50%',
                transform: 'translateY(-50%)',
                background: 'transparent',
                border: 'none',
                color: showPassword ? colors.primary : colors.textSecondary,
                cursor: isAnyLoading ? 'not-allowed' : 'pointer',
                padding: '4px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                transition: 'all 200ms ease',
                opacity: isAnyLoading ? 0.5 : 1,
              }}
              onMouseEnter={(e) => {
                if (!isAnyLoading) {
                  e.currentTarget.style.color = colors.primary;
                  e.currentTarget.style.filter = `drop-shadow(0 0 8px ${colors.primaryGlow})`;
                }
              }}
              onMouseLeave={(e) => {
                if (!isAnyLoading) {
                  e.currentTarget.style.color = showPassword ? colors.primary : colors.textSecondary;
                  e.currentTarget.style.filter = 'none';
                }
              }}
              title={showPassword ? 'Ocultar contraseña' : 'Mostrar contraseña'}
            >
              {showPassword ? <EyeOffIcon /> : <EyeIcon />}
            </button>
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

          {/* Separador */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px', margin: '4px 0' }}>
            <div style={{ flex: 1, height: '1px', background: colors.border }} />
            <span style={{ color: colors.textDisabled, fontSize: '0.75rem', letterSpacing: '1px' }}>[O]</span>
            <div style={{ flex: 1, height: '1px', background: colors.border }} />
          </div>

          {/* Botón de Google CUSTOM estilo hacker */}
          <button
            type="button"
            onClick={handleGoogleClick}
            disabled={!googleReady || isAnyLoading}
            style={{
              width: '100%',
              padding: '14px 24px',
              borderRadius: '8px',
              border: `1px solid ${!googleReady || isAnyLoading ? colors.textDisabled : colors.border}`,
              background: colors.bgSecondary,
              color: !googleReady || isAnyLoading ? colors.textDisabled : colors.textPrimary,
              cursor: !googleReady || isAnyLoading ? 'not-allowed' : 'pointer',
              fontSize: '0.9rem',
              fontWeight: '600',
              fontFamily: '"Share Tech Mono", "Fira Code", monospace',
              transition: 'all 200ms ease',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '12px',
              letterSpacing: '1px',
              opacity: !googleReady || isAnyLoading ? 0.5 : 1,
            }}
            onMouseEnter={(e) => {
              if (googleReady && !isAnyLoading) {
                e.currentTarget.style.borderColor = colors.primary;
                e.currentTarget.style.boxShadow = `0 0 15px ${colors.primaryGlow}`;
                e.currentTarget.style.background = `${colors.primary}10`;
                e.currentTarget.style.color = colors.primary;
                e.currentTarget.style.transform = 'translateY(-2px)';
              }
            }}
            onMouseLeave={(e) => {
              if (googleReady && !isAnyLoading) {
                e.currentTarget.style.borderColor = colors.border;
                e.currentTarget.style.boxShadow = 'none';
                e.currentTarget.style.background = colors.bgSecondary;
                e.currentTarget.style.color = colors.textPrimary;
                e.currentTarget.style.transform = 'translateY(0)';
              }
            }}
          >
            {googleLoading ? (
              <>
                <div
                  style={{
                    width: '18px',
                    height: '18px',
                    border: `2px solid ${colors.primary}40`,
                    borderTop: `2px solid ${colors.primary}`,
                    borderRadius: '50%',
                    animation: 'spin 1s linear infinite',
                  }}
                />
                {'> Autenticando...'}
              </>
            ) : (
              <>
                <GoogleIcon />
                {'> Continuar con Google'}
              </>
            )}
          </button>
        </form>

        <div style={{ marginTop: '24px', paddingTop: '20px', borderTop: `1px solid ${colors.border}` }}>
          <p style={{ color: colors.textSecondary, margin: 0, fontSize: '0.85rem' }}>
            {'¿Sin acceso? '}
            <button
              type="button"
              onClick={onRegister}
              disabled={isAnyLoading}
              style={{
                border: 'none',
                background: 'transparent',
                color: colors.primary,
                cursor: isAnyLoading ? 'not-allowed' : 'pointer',
                textDecoration: 'none',
                padding: 0,
                fontWeight: '600',
                fontSize: 'inherit',
                fontFamily: '"Share Tech Mono", "Fira Code", monospace',
                transition: 'all 200ms ease',
                textShadow: `0 0 10px ${colors.primaryGlow}`,
              }}
              onMouseEnter={(e) => {
                if (!isAnyLoading) e.currentTarget.style.textShadow = `0 0 20px ${colors.primaryGlow}`;
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
        <div
          style={{
            marginTop: '20px',
            padding: '12px',
            background: colors.bgSecondary,
            borderRadius: '6px',
            border: `1px solid ${colors.border}`,
          }}
        >
          <p
            style={{
              margin: 0,
              color: colors.textDisabled,
              fontSize: '0.75rem',
              textAlign: 'left',
              letterSpacing: '1px',
            }}
          >
            <span style={{ color: colors.primary }}>guest@system</span>
            <span style={{ color: colors.textSecondary }}>:</span>
            <span style={{ color: '#00D4FF' }}>~</span>
            <span style={{ color: colors.textSecondary }}>$ </span>
            <span style={{ color: colors.textPrimary, animation: 'blink 1s infinite' }}>_</span>
          </p>
        </div>
      </div>

      <style>{`
        @keyframes shakeAndFadeIn {
          0% { opacity: 0; transform: translateX(-10px); }
          20% { transform: translateX(8px); }
          40% { transform: translateX(-6px); }
          60% { transform: translateX(4px); }
          80% { transform: translateX(-2px); }
          100% { opacity: 1; transform: translateX(0); }
        }
        @keyframes blink {
          0%, 50% { opacity: 1; }
          51%, 100% { opacity: 0; }
        }
        @keyframes spin {
          to { transform: rotate(360deg); }
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