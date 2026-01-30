import React from 'react';

export default function SummaryModal({ summary, onClose, remainingRequests }) {
  if (!summary) return null;

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
          padding: '40px',
          maxWidth: '700px',
          width: '100%',
          maxHeight: '80vh',
          overflowY: 'auto',
          position: 'relative',
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Botón cerrar */}
        <button
          onClick={onClose}
          style={{
            position: 'absolute',
            top: '15px',
            right: '15px',
            background: 'rgba(255, 255, 255, 0.1)',
            border: '1px solid rgba(255, 255, 255, 0.2)',
            color: 'white',
            width: '35px',
            height: '35px',
            borderRadius: '50%',
            cursor: 'pointer',
            fontSize: '1.2rem',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            transition: 'background 0.2s',
          }}
          onMouseEnter={(e) => (e.currentTarget.style.background = 'rgba(255, 255, 255, 0.2)')}
          onMouseLeave={(e) => (e.currentTarget.style.background = 'rgba(255, 255, 255, 0.1)')}
        >
          ✕
        </button>

        {/* Título */}
        <h2 style={{ color: 'white', marginBottom: '10px', fontSize: '1.6rem', paddingRight: '40px' }}>
          Resumen Generado
        </h2>

        {/* Info del video */}
        {summary.videoTitle && (
          <p style={{ color: 'rgba(255, 255, 255, 0.7)', marginBottom: '20px', fontSize: '0.95rem' }}>
            <strong>Video:</strong> {summary.videoTitle}
          </p>
        )}

        {/* Resumen */}
        <div
          style={{
            background: 'rgba(255, 255, 255, 0.05)',
            border: '1px solid rgba(255, 255, 255, 0.1)',
            borderRadius: '8px',
            padding: '20px',
            marginBottom: '20px',
            lineHeight: '1.7',
            color: 'rgba(255, 255, 255, 0.9)',
            fontSize: '1rem',
            whiteSpace: 'pre-wrap',
          }}
        >
          {summary.summaryText}
        </div>

        {/* Información adicional */}
        <div style={{ display: 'flex', gap: '20px', flexWrap: 'wrap', marginBottom: '20px' }}>
          <div style={{ color: 'rgba(255, 255, 255, 0.7)', fontSize: '0.9rem' }}>
            📝 <strong>{summary.wordCount}</strong> palabras
          </div>
          {summary.videoDurationSeconds && (
            <div style={{ color: 'rgba(255, 255, 255, 0.7)', fontSize: '0.9rem' }}>
              ⏱️ <strong>{Math.floor(summary.videoDurationSeconds / 60)}:{String(summary.videoDurationSeconds % 60).padStart(2, '0')}</strong> min
            </div>
          )}
          <div style={{ color: 'rgba(255, 255, 255, 0.7)', fontSize: '0.9rem' }}>
            🌐 <strong>{summary.language.toUpperCase()}</strong>
          </div>
        </div>

        {/* Peticiones restantes */}
        {remainingRequests !== undefined && (
          <div
            style={{
              background: 'rgba(82, 39, 255, 0.1)',
              border: '1px solid rgba(82, 39, 255, 0.3)',
              borderRadius: '8px',
              padding: '15px',
              marginBottom: '20px',
              color: 'rgba(255, 255, 255, 0.9)',
              fontSize: '0.95rem',
              textAlign: 'center',
            }}
          >
            Te quedan <strong>{remainingRequests}</strong> resúmenes hoy
          </div>
        )}

        {/* Botones de acción */}
        <div style={{ display: 'flex', gap: '10px', justifyContent: 'flex-end' }}>
          <button
            onClick={() => {
              navigator.clipboard.writeText(summary.summaryText);
              alert('Resumen copiado al portapapeles');
            }}
            style={{
              padding: '10px 20px',
              borderRadius: '8px',
              border: '1px solid rgba(255, 255, 255, 0.2)',
              background: 'rgba(255, 255, 255, 0.1)',
              color: 'white',
              cursor: 'pointer',
              fontSize: '0.95rem',
              transition: 'background 0.2s',
            }}
            onMouseEnter={(e) => (e.currentTarget.style.background = 'rgba(255, 255, 255, 0.2)')}
            onMouseLeave={(e) => (e.currentTarget.style.background = 'rgba(255, 255, 255, 0.1)')}
          >
            📋 Copiar
          </button>
          <button
            onClick={onClose}
            style={{
              padding: '10px 20px',
              borderRadius: '8px',
              border: 'none',
              background: '#5227FF',
              color: 'white',
              cursor: 'pointer',
              fontSize: '0.95rem',
              fontWeight: 'bold',
              transition: 'background 0.2s',
            }}
            onMouseEnter={(e) => (e.currentTarget.style.background = '#4526d1')}
            onMouseLeave={(e) => (e.currentTarget.style.background = '#5227FF')}
          >
            Cerrar
          </button>
        </div>
      </div>
    </div>
  );
}