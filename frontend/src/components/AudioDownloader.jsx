import React, { useState } from 'react';
import { downloadAudio } from '../services/api';

/**
 * Componente para descargar audio de YouTube
 * Se puede integrar como un tab en MainPage o como componente separado
 */
export default function AudioDownloader() {
  const [videoURL, setVideoURL] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const handleDownload = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    setLoading(true);

    if (!videoURL) {
      setError('Ingresa una URL de YouTube');
      setLoading(false);
      return;
    }

    try {
      // Descargar el archivo
      const blob = await downloadAudio(videoURL);

      // Extraer video ID para el nombre del archivo
      const videoId = extractVideoId(videoURL);
      const fileName = `youtube_audio_${videoId}.mp3`;

      // Crear URL temporal del blob
      const url = window.URL.createObjectURL(blob);

      // Crear elemento <a> invisible para descargar
      const link = document.createElement('a');
      link.href = url;
      link.download = fileName;
      document.body.appendChild(link);
      link.click();

      // Limpiar
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);

      setSuccess('Audio descargado correctamente');
      setVideoURL('');

    } catch (err) {
      const errorMessage = err.response?.data?.error || 
                          err.message || 
                          'Error al descargar audio';
      setError(errorMessage);
      console.error('Error en descarga:', err);
    } finally {
      setLoading(false);
    }
  };

  const extractVideoId = (url) => {
    if (url.includes('youtu.be/')) {
      return url.split('youtu.be/')[1].split('?')[0];
    } else if (url.includes('watch?v=')) {
      return url.split('watch?v=')[1].split('&')[0];
    }
    return 'audio';
  };

  return (
    <div>
      <p style={{ 
        marginBottom: '20px', 
        color: 'rgba(255, 255, 255, 0.8)', 
        textAlign: 'center' 
      }}>
        Descarga el audio de cualquier video de YouTube en formato MP3
      </p>

      {error && (
        <div style={{
          padding: '12px',
          borderRadius: '8px',
          background: 'rgba(239, 68, 68, 0.1)',
          border: '1px solid rgba(239, 68, 68, 0.5)',
          color: '#f87171',
          fontSize: '0.9rem',
          marginBottom: '15px',
        }}>
          {error}
        </div>
      )}

      {success && (
        <div style={{
          padding: '12px',
          borderRadius: '8px',
          background: 'rgba(34, 197, 94, 0.1)',
          border: '1px solid rgba(34, 197, 94, 0.5)',
          color: '#4ade80',
          fontSize: '0.9rem',
          marginBottom: '15px',
        }}>
          {success}
        </div>
      )}

      {loading && (
        <div style={{
          padding: '15px',
          borderRadius: '8px',
          background: 'rgba(82, 39, 255, 0.1)',
          border: '1px solid rgba(82, 39, 255, 0.3)',
          marginBottom: '15px',
          textAlign: 'center',
        }}>
          <div style={{
            width: '24px',
            height: '24px',
            border: '3px solid rgba(82, 39, 255, 0.3)',
            borderTopColor: '#5227FF',
            borderRadius: '50%',
            animation: 'spin 1s linear infinite',
            margin: '0 auto 10px auto',
          }}></div>
          <p style={{ color: 'white', margin: 0, fontSize: '0.95rem' }}>
            Descargando audio...
          </p>
          <p style={{ color: 'rgba(255, 255, 255, 0.6)', margin: '5px 0 0 0', fontSize: '0.85rem' }}>
            Esto puede tardar 10-30 segundos
          </p>
        </div>
      )}

      <form onSubmit={handleDownload} style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
        <input
          type="url"
          placeholder="https://www.youtube.com/watch?v=..."
          value={videoURL}
          onChange={(e) => setVideoURL(e.target.value)}
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

        <button
          type="submit"
          disabled={loading || !videoURL}
          style={{
            width: '100%',
            padding: '12px',
            borderRadius: '8px',
            border: 'none',
            background: loading || !videoURL ? '#6b7280' : '#5227FF',
            color: '#fff',
            cursor: loading || !videoURL ? 'not-allowed' : 'pointer',
            fontSize: '1.1rem',
            fontWeight: 'bold',
          }}
        >
          {loading ? 'Descargando...' : '⬇️ Descargar Audio MP3'}
        </button>
      </form>

      <div style={{
        marginTop: '20px',
        padding: '15px',
        background: 'rgba(255, 255, 255, 0.05)',
        borderRadius: '8px',
        fontSize: '0.9rem',
        color: 'rgba(255, 255, 255, 0.7)',
      }}>
        <p style={{ margin: '0 0 5px 0' }}>
          <strong>Nota:</strong> Las descargas cuentan para tu limite diario ({'{dailyLimit}'} por dia).
        </p>
      </div>

      <style>{`
        @keyframes spin {
          to { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  );
}