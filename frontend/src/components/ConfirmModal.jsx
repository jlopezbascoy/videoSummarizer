import React from 'react';

export default function ConfirmModal({ 
  isOpen, 
  onClose, 
  onConfirm, 
  title, 
  message, 
  confirmText = 'Confirmar',
  cancelText = 'Cancelar',
  confirmColor = '#ef4444', // Rojo por defecto para acciones destructivas
  isLoading = false
}) {
  if (!isOpen) return null;

  return (
    <div
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        width: '100vw',
        height: '100vh',
        background: 'rgba(0, 0, 0, 0.7)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 1000,
        padding: '20px',
        pointerEvents: 'auto',
      }}
      onClick={onClose}
    >
      <div
        style={{
          backdropFilter: 'blur(16px) saturate(180%)',
          WebkitBackdropFilter: 'blur(16px) saturate(180%)',
          backgroundColor: 'rgba(17, 25, 40, 0.9)',
          borderRadius: '12px',
          border: '1px solid rgba(255, 255, 255, 0.125)',
          padding: '30px',
          maxWidth: '450px',
          width: '100%',
          position: 'relative',
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Icono de advertencia */}
        <div style={{
          width: '60px',
          height: '60px',
          borderRadius: '50%',
          background: 'rgba(239, 68, 68, 0.1)',
          border: '2px solid rgba(239, 68, 68, 0.3)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          margin: '0 auto 20px auto',
          fontSize: '2rem',
        }}>
          !
        </div>

        {/* Título */}
        <h2 style={{ 
          color: 'white', 
          marginBottom: '15px', 
          fontSize: '1.5rem',
          textAlign: 'center',
          fontWeight: '600'
        }}>
          {title}
        </h2>

        {/* Mensaje */}
        <p style={{
          color: 'rgba(255, 255, 255, 0.8)',
          marginBottom: '30px',
          fontSize: '1rem',
          textAlign: 'center',
          lineHeight: '1.6',
        }}>
          {message}
        </p>

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
              padding: '12px 30px',
              borderRadius: '8px',
              border: '1px solid rgba(255, 255, 255, 0.2)',
              background: 'rgba(255, 255, 255, 0.1)',
              color: 'white',
              cursor: isLoading ? 'not-allowed' : 'pointer',
              fontSize: '1rem',
              fontWeight: '500',
              transition: 'all 0.3s ease',
              opacity: isLoading ? 0.5 : 1,
            }}
            onMouseEnter={(e) => !isLoading && (e.currentTarget.style.background = 'rgba(255, 255, 255, 0.15)', e.currentTarget.style.transform = 'translateY(-2px)')}
            onMouseLeave={(e) => (e.currentTarget.style.background = 'rgba(255, 255, 255, 0.1)', e.currentTarget.style.transform = 'translateY(0)')}
          >
            {cancelText}
          </button>
          
          <button
            onClick={onConfirm}
            disabled={isLoading}
            style={{
              padding: '12px 30px',
              borderRadius: '8px',
              border: 'none',
              background: isLoading ? '#6b7280' : confirmColor,
              color: 'white',
              cursor: isLoading ? 'not-allowed' : 'pointer',
              fontSize: '1rem',
              fontWeight: '600',
              transition: 'all 0.3s ease',
              opacity: isLoading ? 0.7 : 1,
            }}
            onMouseEnter={(e) => !isLoading && (e.currentTarget.style.opacity = '0.85', e.currentTarget.style.transform = 'translateY(-2px)')}
            onMouseLeave={(e) => (e.currentTarget.style.opacity = '1', e.currentTarget.style.transform = 'translateY(0)')}
          >
            {isLoading ? 'Procesando...' : confirmText}
          </button>
        </div>
      </div>
    </div>
  );
}