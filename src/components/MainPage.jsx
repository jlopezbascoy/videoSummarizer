import React, { useState } from 'react';

const LANGUAGES = [
  'Español', 'Inglés', 'Francés', 'Alemán', 'Italiano', 'Portugués', 'Ruso', 'Chino', 
  'Japonés', 'Coreano', 'Árabe', 'Hindi', 'Bengalí', 'Turco', 'Vietnamita', 'Polaco',
  // agrega todos los que necesites
];

export default function MainPage({ onLogout }) {
  const [videoURL, setVideoURL] = useState('');
  const [language, setLanguage] = useState(LANGUAGES[0]);
  const [summaryLength, setSummaryLength] = useState('100-200');

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!videoURL) {
      alert('Ingresa un enlace de YouTube');
      return;
    }
    console.log({
      videoURL,
      language,
      summaryLength
    });
    // Aquí va la lógica de resumir video
  };

  return (
    <div style={{
      position: 'absolute',
      top: 0,
      left: 0,
      width: '100%',
      height: '100%',
      display: 'flex',
      justifyContent: 'center',
      alignItems: 'center',
      pointerEvents: 'none'
    }}>
      <div style={{
        pointerEvents: 'auto',
        background: 'rgba(255,255,255,0.95)',
        padding: 20,
        borderRadius: 8,
        boxShadow: '0 8px 24px rgba(0,0,0,0.25)',
        width: 400,
        textAlign: 'center'
      }}>
        <h2>Resumir video de YouTube</h2>

        <form onSubmit={handleSubmit} style={{ marginTop: 20, display: 'flex', flexDirection: 'column', gap: 12 }}>
          {/* Input del enlace */}
          <input
            type="url"
            placeholder="Pega el enlace de YouTube aquí"
            value={videoURL}
            onChange={e => setVideoURL(e.target.value)}
            style={{ width: '100%', padding: 10, borderRadius: 4, border: '1px solid #ccc' }}
          />

          {/* Selector de idioma */}
          <select
            value={language}
            onChange={e => setLanguage(e.target.value)}
            size={5} // scrollable
            style={{
              width: '100%',
              padding: 10,
              borderRadius: 4,
              border: '1px solid #ccc',
              overflowY: 'scroll',
              height: 100
            }}
          >
            {LANGUAGES.map(lang => (
              <option key={lang} value={lang}>{lang}</option>
            ))}
          </select>

          {/* Selector de longitud */}
          <select
            value={summaryLength}
            onChange={e => setSummaryLength(e.target.value)}
            style={{ width: '100%', padding: 10, borderRadius: 4, border: '1px solid #ccc' }}
          >
            <option value="100-200">Entre 100 y 200 palabras</option>
            <option value="200-400">Entre 200 y 400 palabras</option>
            <option value="400-600">Entre 400 y 600 palabras</option>
          </select>

          {/* Botón resumir */}
          <button
            type="submit"
            style={{
              width: '100%',
              padding: 10,
              borderRadius: 4,
              border: 'none',
              background: '#5227FF',
              color: '#fff',
              cursor: 'pointer'
            }}
          >
            Resumir video
          </button>
        </form>

        {/* Botón cerrar sesión */}
        <button
          onClick={onLogout}
          style={{
            marginTop: 10,
            border: 'none',
            background: 'transparent',
            color: '#5227FF',
            cursor: 'pointer',
            textDecoration: 'underline'
          }}
        >
          Cerrar sesión
        </button>
      </div>
    </div>
  );
}
