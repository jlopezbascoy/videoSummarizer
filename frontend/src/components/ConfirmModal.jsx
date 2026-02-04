import React from 'react';

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
  info: '#00D4FF',
  textPrimary: '#E0FFE0',
  textSecondary: '#7FBF7F',
  textDisabled: '#3D5C3D',
};

export default function ConfirmModal({ 
  isOpen, 
  onClose, 
  onConfirm, 
  title, 
  message, 
  confirmText = '[CONFIRMAR]',
  cancelText = '[CANCELAR]',
  confirmColor = colors.error,
  isLoading = false
}) {
  if (!isOpen) return null;

  // Determinar si es acción destructiva basándose en el color
  const isDestructive = confirmColor === colors.error || confirmColor === '#ef4444' || confirmColor === '#EF4444';
  const actionColor = isDestructive ? colors.error : colors.primary;
  const actionGlow = isDestructive ? `${colors.error}40` : colors.primaryGlow;

  return (
    <div
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        width: '100vw',
        height: '100vh',
        background: 'rgba(0, 0, 0, 0.85)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 1000,
        padding: '20px',
        pointerEvents: 'auto',
        fontFamily: '"Share Tech Mono", "Fira Code", monospace',
      }}
      onClick={onClose}
    >
      {/* Importar fuente */}
      <link href="https://fonts.googleapis.com/css2?family=Share+Tech+Mono&display=swap" rel="stylesheet" />
      
      <div
        style={{
          background: colors.bgPrimary,
          borderRadius: '12px',
          border: `1px solid ${actionColor}30`,
          padding: '32px',
          maxWidth: '450px',
          width: '100%',
          position: 'relative',
          boxShadow: `0 0 60px ${actionGlow}, 0 0 100px ${actionGlow}50`,
          animation: 'modalFadeIn 0.3s ease-out',
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Terminal Header */}
        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: '8px',
          marginBottom: '24px',
          paddingBottom: '16px',
          borderBottom: `1px solid ${colors.border}`,
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
          <span style={{
            marginLeft: '8px',
            color: colors.textDisabled,
            fontSize: '0.75rem',
            letterSpacing: '1px',
          }}>
            {isDestructive ? 'system://warning' : 'system://confirm'}
          </span>
        </div>

        {/* Icono de advertencia */}
        <div style={{
          width: '70px',
          height: '70px',
          borderRadius: '8px',
          background: `${actionColor}10`,
          border: `2px solid ${actionColor}40`,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          margin: '0 auto 24px auto',
          fontSize: '1.5rem',
          color: actionColor,
          fontWeight: '600',
          boxShadow: `0 0 30px ${actionGlow}, inset 0 0 20px ${actionGlow}50`,
          animation: 'pulse 2s ease-in-out infinite',
        }}>
          {isDestructive ? '[!]' : '[?]'}
        </div>

        {/* Título */}
        <h2 style={{ 
          color: actionColor, 
          marginBottom: '16px', 
          fontSize: '1.3rem',
          textAlign: 'center',
          fontWeight: '600',
          letterSpacing: '2px',
          textTransform: 'uppercase',
          textShadow: `0 0 20px ${actionGlow}`,
        }}>
          {title}
        </h2>

        {/* Mensaje */}
        <div style={{
          background: colors.bgSecondary,
          border: `1px solid ${colors.border}`,
          borderRadius: '8px',
          padding: '16px',
          marginBottom: '28px',
        }}>
          <p style={{
            color: colors.textSecondary,
            margin: 0,
            fontSize: '0.9rem',
            textAlign: 'center',
            lineHeight: '1.7',
          }}>
            {message}
          </p>
        </div>

        {/* Botones */}
        <div style={{ 
          display: 'flex', 
          gap: '12px', 
          justifyContent: 'center',
        }}>
          <button
            onClick={onClose}
            disabled={isLoading}
            style={{
              padding: '12px 24px',
              borderRadius: '8px',
              border: `1px solid ${colors.border}`,
              background: 'transparent',
              color: colors.textSecondary,
              cursor: isLoading ? 'not-allowed' : 'pointer',
              fontSize: '0.9rem',
              fontWeight: '500',
              fontFamily: '"Share Tech Mono", "Fira Code", monospace',
              transition: 'all 200ms ease',
              opacity: isLoading ? 0.5 : 1,
              textTransform: 'uppercase',
              letterSpacing: '1px',
            }}
            onMouseEnter={(e) => {
              if (!isLoading) {
                e.currentTarget.style.borderColor = colors.primary;
                e.currentTarget.style.color = colors.primary;
                e.currentTarget.style.boxShadow = `0 0 15px ${colors.primaryGlow}`;
                e.currentTarget.style.transform = 'translateY(-2px)';
              }
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.borderColor = colors.border;
              e.currentTarget.style.color = colors.textSecondary;
              e.currentTarget.style.boxShadow = 'none';
              e.currentTarget.style.transform = 'translateY(0)';
            }}
          >
            {cancelText}
          </button>
          
          <button
            onClick={onConfirm}
            disabled={isLoading}
            style={{
              padding: '12px 24px',
              borderRadius: '8px',
              border: `1px solid ${isLoading ? colors.textDisabled : actionColor}`,
              background: isLoading ? 'transparent' : 'transparent',
              color: isLoading ? colors.textDisabled : actionColor,
              cursor: isLoading ? 'not-allowed' : 'pointer',
              fontSize: '0.9rem',
              fontWeight: '600',
              fontFamily: '"Share Tech Mono", "Fira Code", monospace',
              transition: 'all 200ms ease',
              textTransform: 'uppercase',
              letterSpacing: '1px',
              boxShadow: isLoading ? 'none' : `0 0 20px ${actionGlow}, inset 0 0 20px ${actionGlow}50`,
            }}
            onMouseEnter={(e) => {
              if (!isLoading) {
                e.currentTarget.style.background = `${actionColor}20`;
                e.currentTarget.style.boxShadow = `0 0 30px ${actionGlow}, inset 0 0 30px ${actionGlow}`;
                e.currentTarget.style.transform = 'translateY(-2px)';
              }
            }}
            onMouseLeave={(e) => {
              if (!isLoading) {
                e.currentTarget.style.background = 'transparent';
                e.currentTarget.style.boxShadow = `0 0 20px ${actionGlow}, inset 0 0 20px ${actionGlow}50`;
                e.currentTarget.style.transform = 'translateY(0)';
              }
            }}
          >
            {isLoading ? '> PROCESSING...' : confirmText}
          </button>
        </div>

        {/* Terminal Footer */}
        <div style={{
          marginTop: '24px',
          paddingTop: '16px',
          borderTop: `1px solid ${colors.border}`,
        }}>
          <p style={{
            margin: 0,
            color: colors.textDisabled,
            fontSize: '0.7rem',
            textAlign: 'center',
            letterSpacing: '1px',
          }}>
            <span style={{ color: actionColor }}>{'>'}</span>
            {' awaiting_user_input'}
            <span style={{ 
              color: colors.textPrimary,
              animation: 'blink 1s infinite',
            }}> _</span>
          </p>
        </div>
      </div>

      <style>{`
        @keyframes modalFadeIn {
          from {
            opacity: 0;
            transform: scale(0.95) translateY(10px);
          }
          to {
            opacity: 1;
            transform: scale(1) translateY(0);
          }
        }
        
        @keyframes blink {
          0%, 50% { opacity: 1; }
          51%, 100% { opacity: 0; }
        }
        
        @keyframes pulse {
          0%, 100% { 
            box-shadow: 0 0 30px ${actionGlow}, inset 0 0 20px ${actionGlow}50;
          }
          50% { 
            box-shadow: 0 0 40px ${actionGlow}, inset 0 0 30px ${actionGlow}70;
          }
        }

        ::selection {
          background: ${colors.primary}40;
          color: ${colors.textPrimary};
        }
      `}</style>
    </div>
  );
}