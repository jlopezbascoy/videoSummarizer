import React, { useState } from 'react';

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

export default function SummaryModal({ summary, onClose, remainingRequests }) {
  const [copied, setCopied] = useState(false);

  if (!summary) return null;

  const handleCopy = () => {
    navigator.clipboard.writeText(summary.summaryText);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

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
          border: `1px solid ${colors.primary}30`,
          padding: '32px',
          maxWidth: '720px',
          width: '100%',
          maxHeight: '85vh',
          overflowY: 'auto',
          position: 'relative',
          boxShadow: `0 0 60px rgba(0, 255, 65, 0.2), 0 0 100px rgba(0, 255, 65, 0.1)`,
          animation: 'modalFadeIn 0.3s ease-out',
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Terminal Header */}
        <div style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          marginBottom: '20px',
          paddingBottom: '16px',
          borderBottom: `1px solid ${colors.border}`,
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <div style={{ display: 'flex', gap: '8px' }}>
              <span style={{
                width: '12px',
                height: '12px',
                borderRadius: '50%',
                background: colors.error,
                boxShadow: `0 0 8px ${colors.error}60`,
                cursor: 'pointer',
              }} onClick={onClose}></span>
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
              color: colors.primary, 
              margin: 0, 
              fontSize: '1.2rem',
              fontWeight: '600',
              letterSpacing: '2px',
              textTransform: 'uppercase',
              textShadow: `0 0 15px ${colors.primaryGlow}`,
            }}>
              {'> OUTPUT_SUMMARY'}
            </h2>
          </div>

          {/* Botón cerrar */}
          <button
            onClick={onClose}
            style={{
              background: 'transparent',
              border: `1px solid ${colors.border}`,
              color: colors.textSecondary,
              padding: '6px 12px',
              borderRadius: '6px',
              cursor: 'pointer',
              fontSize: '0.8rem',
              fontFamily: '"Share Tech Mono", "Fira Code", monospace',
              transition: 'all 200ms ease',
              textTransform: 'uppercase',
              letterSpacing: '1px',
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.borderColor = colors.error;
              e.currentTarget.style.color = colors.error;
              e.currentTarget.style.boxShadow = `0 0 10px ${colors.error}40`;
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.borderColor = colors.border;
              e.currentTarget.style.color = colors.textSecondary;
              e.currentTarget.style.boxShadow = 'none';
            }}
          >
            [ESC]
          </button>
        </div>

        {/* Info del video */}
        {summary.videoTitle && (
          <div style={{ 
            marginBottom: '20px',
            padding: '14px 16px',
            background: colors.bgSecondary,
            borderRadius: '8px',
            border: `1px solid ${colors.border}`,
          }}>
            <p style={{ 
              color: colors.textSecondary, 
              margin: 0, 
              fontSize: '0.85rem',
              lineHeight: '1.5',
            }}>
              <span style={{ color: colors.primary }}>{'> source:'}</span>{' '}
              <span style={{ color: colors.textPrimary }}>{summary.videoTitle}</span>
            </p>
          </div>
        )}

        {/* Stats del video */}
        <div style={{ 
          display: 'flex', 
          gap: '16px', 
          flexWrap: 'wrap', 
          marginBottom: '20px',
          padding: '12px 16px',
          background: colors.bgSecondary,
          borderRadius: '8px',
          border: `1px solid ${colors.border}`,
        }}>
          <div style={{ 
            color: colors.textSecondary, 
            fontSize: '0.85rem',
            display: 'flex',
            alignItems: 'center',
            gap: '6px',
          }}>
            <span style={{ color: colors.info }}>words:</span>
            <span style={{ color: colors.textPrimary, fontWeight: '600' }}>{summary.wordCount}</span>
          </div>
          {summary.videoDurationSeconds && (
            <div style={{ 
              color: colors.textSecondary, 
              fontSize: '0.85rem',
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
            }}>
              <span style={{ color: colors.warning }}>duration:</span>
              <span style={{ color: colors.textPrimary, fontWeight: '600' }}>
                {Math.floor(summary.videoDurationSeconds / 60)}:{String(summary.videoDurationSeconds % 60).padStart(2, '0')}
              </span>
            </div>
          )}
          <div style={{ 
            color: colors.textSecondary, 
            fontSize: '0.85rem',
            display: 'flex',
            alignItems: 'center',
            gap: '6px',
          }}>
            <span style={{ color: colors.primary }}>lang:</span>
            <span style={{ color: colors.textPrimary, fontWeight: '600' }}>{summary.language.toUpperCase()}</span>
          </div>
        </div>

        {/* Resumen */}
        <div
          style={{
            background: colors.bgSecondary,
            border: `1px solid ${colors.primary}20`,
            borderRadius: '8px',
            padding: '20px',
            marginBottom: '20px',
            position: 'relative',
          }}
        >
          <div style={{
            position: 'absolute',
            top: '12px',
            left: '16px',
            fontSize: '0.7rem',
            color: colors.textDisabled,
            letterSpacing: '1px',
            textTransform: 'uppercase',
          }}>
            {'// generated_content'}
          </div>
          <div
            style={{
              marginTop: '20px',
              lineHeight: '1.8',
              color: colors.textPrimary,
              fontSize: '0.95rem',
              whiteSpace: 'pre-wrap',
            }}
          >
            {summary.summaryText}
          </div>
        </div>

        {/* Peticiones restantes */}
        {remainingRequests !== undefined && (
          <div
            style={{
              background: `${colors.primary}08`,
              border: `1px solid ${colors.primary}30`,
              borderRadius: '8px',
              padding: '14px 16px',
              marginBottom: '24px',
              color: colors.textSecondary,
              fontSize: '0.9rem',
              textAlign: 'center',
            }}
          >
            <span style={{ color: colors.textSecondary }}>{'> remaining_requests:'}</span>{' '}
            <span style={{ 
              color: colors.primary, 
              fontWeight: '600',
              textShadow: `0 0 10px ${colors.primaryGlow}`,
            }}>
              {remainingRequests}
            </span>
            <span style={{ color: colors.textSecondary }}>{' /day'}</span>
          </div>
        )}

        {/* Botones de acción */}
        <div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end' }}>
          <button
            onClick={handleCopy}
            style={{
              padding: '12px 20px',
              borderRadius: '8px',
              border: `1px solid ${copied ? colors.success : colors.border}`,
              background: copied ? `${colors.success}15` : 'transparent',
              color: copied ? colors.success : colors.textSecondary,
              cursor: 'pointer',
              fontSize: '0.9rem',
              fontFamily: '"Share Tech Mono", "Fira Code", monospace',
              transition: 'all 200ms ease',
              textTransform: 'uppercase',
              letterSpacing: '1px',
              boxShadow: copied ? `0 0 15px ${colors.primaryGlow}` : 'none',
            }}
            onMouseEnter={(e) => {
              if (!copied) {
                e.currentTarget.style.borderColor = colors.primary;
                e.currentTarget.style.color = colors.primary;
                e.currentTarget.style.boxShadow = `0 0 15px ${colors.primaryGlow}`;
              }
            }}
            onMouseLeave={(e) => {
              if (!copied) {
                e.currentTarget.style.borderColor = colors.border;
                e.currentTarget.style.color = colors.textSecondary;
                e.currentTarget.style.boxShadow = 'none';
              }
            }}
          >
            {copied ? '[✓ COPIED]' : '[COPY]'}
          </button>
          <button
            onClick={onClose}
            style={{
              padding: '12px 24px',
              borderRadius: '8px',
              border: `1px solid ${colors.primary}`,
              background: 'transparent',
              color: colors.primary,
              cursor: 'pointer',
              fontSize: '0.9rem',
              fontWeight: '600',
              fontFamily: '"Share Tech Mono", "Fira Code", monospace',
              transition: 'all 200ms ease',
              textTransform: 'uppercase',
              letterSpacing: '2px',
              boxShadow: `0 0 20px ${colors.primaryGlow}, inset 0 0 20px rgba(0, 255, 65, 0.1)`,
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.background = `${colors.primary}20`;
              e.currentTarget.style.boxShadow = `0 0 30px ${colors.primaryGlow}, inset 0 0 30px rgba(0, 255, 65, 0.2)`;
              e.currentTarget.style.transform = 'translateY(-2px)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.background = 'transparent';
              e.currentTarget.style.boxShadow = `0 0 20px ${colors.primaryGlow}, inset 0 0 20px rgba(0, 255, 65, 0.1)`;
              e.currentTarget.style.transform = 'translateY(0)';
            }}
          >
            [CLOSE]
          </button>
        </div>

        {/* Decorative Terminal Line */}
        <div style={{
          marginTop: '24px',
          paddingTop: '16px',
          borderTop: `1px solid ${colors.border}`,
        }}>
          <p style={{
            margin: 0,
            color: colors.textDisabled,
            fontSize: '0.75rem',
            letterSpacing: '1px',
          }}>
            <span style={{ color: colors.primary }}>system@ai</span>
            <span style={{ color: colors.textSecondary }}>:</span>
            <span style={{ color: colors.info }}>~/summary</span>
            <span style={{ color: colors.textSecondary }}>$ </span>
            <span style={{ color: colors.success }}>process_complete</span>
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

        /* Scrollbar styling for modal */
        div::-webkit-scrollbar {
          width: 6px;
        }
        
        div::-webkit-scrollbar-track {
          background: ${colors.bgPrimary};
        }
        
        div::-webkit-scrollbar-thumb {
          background: ${colors.primary}40;
          border-radius: 3px;
        }
        
        div::-webkit-scrollbar-thumb:hover {
          background: ${colors.primary}60;
        }

        ::selection {
          background: ${colors.primary}40;
          color: ${colors.textPrimary};
        }
      `}</style>
    </div>
  );
}