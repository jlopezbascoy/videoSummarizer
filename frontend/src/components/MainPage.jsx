import React, { useState, useEffect } from 'react';
import Select from 'react-select';
import { useAuth } from '../context/AuthContext';
import { generateSummary, getSummaryHistory, deleteSummary, getUserStats } from '../services/api';
import SummaryModal from './SummaryModal';

const LANGUAGES = [
  { value: 'es', label: 'Español' },
  { value: 'en', label: 'Inglés' },
  { value: 'fr', label: 'Francés' },
  { value: 'de', label: 'Alemán' },
  { value: 'it', label: 'Italiano' },
  { value: 'pt', label: 'Portugués' },
  { value: 'ru', label: 'Ruso' },
  { value: 'zh', label: 'Chino' },
  { value: 'ja', label: 'Japonés' },
  { value: 'ko', label: 'Coreano' },
  { value: 'ar', label: 'Árabe' },
  { value: 'hi', label: 'Hindi' },
  { value: 'tr', label: 'Turco' },
  { value: 'vi', label: 'Vietnamita' },
  { value: 'pl', label: 'Polaco' },
];

export default function MainPage() {
  const { logout, user } = useAuth();
  const [activeTab, setActiveTab] = useState('generate');
  const [videoURL, setVideoURL] = useState('');
  const [language, setLanguage] = useState(LANGUAGES[0]);
  const [summaryLength, setSummaryLength] = useState('100-200');
  const [loading, setLoading] = useState(false);
  const [loadingStep, setLoadingStep] = useState(''); // Paso actual del proceso
  const [error, setError] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [currentSummary, setCurrentSummary] = useState(null);
  const [remainingRequests, setRemainingRequests] = useState(null);
  const [summaries, setSummaries] = useState([]);
  const [loadingHistory, setLoadingHistory] = useState(false);
  const [stats, setStats] = useState(null);

  useEffect(() => {
    loadStats();
  }, []);

  useEffect(() => {
    if (activeTab === 'history') {
      loadHistory();
    }
  }, [activeTab]);

  const loadStats = async () => {
    try {
      const data = await getUserStats();
      setStats(data);
      setRemainingRequests(data.remainingRequests);
    } catch (err) {
      console.error('Error cargando stats:', err);
    }
  };

  const loadHistory = async () => {
    setLoadingHistory(true);
    try {
      const data = await getSummaryHistory();
      setSummaries(data);
    } catch (err) {
      console.error('Error cargando historial:', err);
    } finally {
      setLoadingHistory(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    setLoadingStep('Iniciando...');

    if (!videoURL) {
      setError('Ingresa un enlace de YouTube');
      setLoading(false);
      return;
    }

    try {
      // Simular pasos de progreso (estimados)
      setLoadingStep('Descargando audio del video...');
      
      // Después de 10 segundos, cambiar mensaje
      const timer1 = setTimeout(() => {
        setLoadingStep('Transcribiendo audio a texto...');
      }, 10000);

      // Después de 40 segundos, cambiar mensaje
      const timer2 = setTimeout(() => {
        setLoadingStep('Generando resumen con IA...');
      }, 40000);

      const result = await generateSummary({
        videoUrl: videoURL,
        language: language.value,
        wordCountRange: summaryLength,
      });

      // Limpiar timers
      clearTimeout(timer1);
      clearTimeout(timer2);

      setCurrentSummary(result);
      setRemainingRequests(result.remainingRequests);
      setShowModal(true);
      setVideoURL('');
      await loadStats();
    } catch (err) {
      const errorMessage = err.response?.data?.error || err.message || 'Error al generar resumen';
      setError(errorMessage);
      console.error('Error completo:', err);
    } finally {
      setLoading(false);
      setLoadingStep('');
    }
  };

  const handleDeleteSummary = async (id) => {
    if (!window.confirm('¿Seguro que quieres eliminar este resumen?')) return;

    try {
      await deleteSummary(id);
      loadHistory();
      loadStats();
    } catch (err) {
      alert('Error al eliminar resumen');
    }
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
      pointerEvents: 'none',
    }}>
      <div style={{
        pointerEvents: 'auto',
        backdropFilter: 'blur(16px) saturate(180%)',
        WebkitBackdropFilter: 'blur(16px) saturate(180%)',
        backgroundColor: 'rgba(17, 25, 40, 0.75)',
        borderRadius: '12px',
        border: '1px solid rgba(255, 255, 255, 0.125)',
        padding: '40px',
        width: 550,
        maxHeight: '85vh',
        overflowY: 'auto',
      }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
          <div>
            <h2 style={{ fontSize: '1.8rem', margin: 0, fontWeight: '600', color: 'white' }}>
              Hola, {user?.username}
            </h2>
            <p style={{ margin: '5px 0 0 0', color: 'rgba(255, 255, 255, 0.6)', fontSize: '0.85rem' }}>
{user?.userType} • {stats?.remainingRequests !== undefined ? `${stats.remainingRequests} resumenes restantes` : 'Cargando...'}            </p>
          </div>
          <button onClick={logout} style={{
            padding: '8px 16px',
            borderRadius: '8px',
            border: '1px solid rgba(255, 255, 255, 0.2)',
            background: 'rgba(255, 255, 255, 0.1)',
            color: 'white',
            cursor: 'pointer',
            fontSize: '0.9rem',
          }}>Salir</button>
        </div>

        <div style={{ display: 'flex', gap: '10px', marginBottom: '25px', borderBottom: '1px solid rgba(255, 255, 255, 0.1)' }}>
          <button onClick={() => setActiveTab('generate')} style={{
            padding: '12px 24px',
            border: 'none',
            background: 'transparent',
            color: activeTab === 'generate' ? 'white' : 'rgba(255, 255, 255, 0.5)',
            cursor: 'pointer',
            fontSize: '1rem',
            fontWeight: activeTab === 'generate' ? 'bold' : 'normal',
            borderBottom: activeTab === 'generate' ? '3px solid #5227FF' : 'none',
          }}>Generar Resumen</button>
          <button onClick={() => setActiveTab('history')} style={{
            padding: '12px 24px',
            border: 'none',
            background: 'transparent',
            color: activeTab === 'history' ? 'white' : 'rgba(255, 255, 255, 0.5)',
            cursor: 'pointer',
            fontSize: '1rem',
            fontWeight: activeTab === 'history' ? 'bold' : 'normal',
            borderBottom: activeTab === 'history' ? '3px solid #5227FF' : 'none',
          }}>Historial ({stats?.totalSummaries ?? 0})</button>
        </div>

        {activeTab === 'generate' && (
          <div>
            <p style={{ marginBottom: '20px', color: 'rgba(255, 255, 255, 0.8)', textAlign: 'center' }}>
              Pega un enlace de YouTube para obtener un resumen rapido
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
              }}>{error}</div>
            )}

            {loading && loadingStep && (
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
                <p style={{ color: 'white', margin: 0, fontSize: '0.95rem', fontWeight: '500' }}>
                  {loadingStep}
                </p>
                <p style={{ color: 'rgba(255, 255, 255, 0.6)', margin: '5px 0 0 0', fontSize: '0.85rem' }}>
                  Esto puede tardar 2-5 minutos, por favor espera...
                </p>
              </div>
            )}

            <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
              <input type="url" placeholder="https://www.youtube.com/watch?v=..." value={videoURL}
                onChange={(e) => setVideoURL(e.target.value)} disabled={loading}
                style={{ width: '100%', padding: '12px', borderRadius: '8px', border: '1px solid rgba(255, 255, 255, 0.2)',
                  background: 'rgba(255, 255, 255, 0.1)', color: 'white', fontSize: '1rem', boxSizing: 'border-box' }} />

              <Select options={LANGUAGES} value={language} onChange={setLanguage} isSearchable isDisabled={loading}
                placeholder="Selecciona un idioma" menuPlacement="auto" styles={{
                  control: (p) => ({ ...p, background: 'rgba(255, 255, 255, 0.1)', border: '1px solid rgba(255, 255, 255, 0.2)',
                    borderRadius: '8px', padding: '4px', boxShadow: 'none', textAlign: 'left' }),
                  singleValue: (p) => ({ ...p, color: 'white' }),
                  menu: (p) => ({ ...p, background: 'rgba(17, 25, 40, 0.95)', borderRadius: '8px', backdropFilter: 'blur(10px)' }),
                  option: (p, s) => ({ ...p, background: s.isSelected ? '#5227FF' : s.isFocused ? 'rgba(255, 255, 255, 0.2)' : 'transparent', color: 'white' }),
                  input: (p) => ({ ...p, color: 'white' }),
                  placeholder: (p) => ({ ...p, color: 'rgba(255, 255, 255, 0.7)' }),
                }} />

              <select value={summaryLength} onChange={(e) => setSummaryLength(e.target.value)} disabled={loading}
                style={{ width: '100%', padding: '12px', borderRadius: '8px', border: '1px solid rgba(255, 255, 255, 0.2)',
                  background: 'rgba(255, 255, 255, 0.1)', color: 'white', fontSize: '1rem', boxSizing: 'border-box' }}>
                <option style={{ background: '#111928' }} value="100-200">100-200 palabras</option>
                <option style={{ background: '#111928' }} value="200-400">200-400 palabras</option>
                <option style={{ background: '#111928' }} value="400-600">400-600 palabras</option>
              </select>

              <button type="submit" disabled={loading} style={{
                width: '100%', padding: '12px', borderRadius: '8px', border: 'none',
                background: loading ? '#6b7280' : '#5227FF', color: '#fff',
                cursor: loading ? 'not-allowed' : 'pointer', fontSize: '1.1rem', fontWeight: 'bold',
              }}>{loading ? 'Procesando...' : '✨ Generar Resumen'}</button>
            </form>

            <style>{`
              @keyframes spin {
                to { transform: rotate(360deg); }
              }
            `}</style>
          </div>
        )}

        {activeTab === 'history' && (
          <div>
            {loadingHistory ? (<p style={{ color: 'rgba(255, 255, 255, 0.7)', textAlign: 'center' }}>Cargando...</p>
            ) : summaries.length === 0 ? (<p style={{ color: 'rgba(255, 255, 255, 0.7)', textAlign: 'center' }}>
                Aun no has generado ningun resumen</p>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
                {summaries.map((s) => (
                  <div key={s.id} style={{ background: 'rgba(255, 255, 255, 0.05)', border: '1px solid rgba(255, 255, 255, 0.1)',
                    borderRadius: '8px', padding: '15px' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start', marginBottom: '10px' }}>
                      <div style={{ flex: 1 }}>
                        <h4 style={{ color: 'white', margin: '0 0 5px 0', fontSize: '1rem' }}>{s.videoTitle || 'Video de YouTube'}</h4>
                        <p style={{ color: 'rgba(255, 255, 255, 0.6)', fontSize: '0.85rem', margin: 0 }}>
                          {new Date(s.createdAt).toLocaleDateString('es-ES', { day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' })}
                        </p>
                      </div>
                      <button onClick={() => handleDeleteSummary(s.id)} style={{
                        background: 'rgba(239, 68, 68, 0.1)', border: '1px solid rgba(239, 68, 68, 0.3)',
                        color: '#f87171', padding: '6px 12px', borderRadius: '6px', cursor: 'pointer', fontSize: '0.85rem'
                      }}>🗑️</button>
                    </div>
                    <p style={{ color: 'rgba(255, 255, 255, 0.8)', fontSize: '0.95rem', margin: '10px 0', lineHeight: '1.5',
                      display: '-webkit-box', WebkitLineClamp: 3, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>{s.summaryText}</p>
                    <button onClick={() => { setCurrentSummary(s); setShowModal(true); }} style={{
                      background: 'transparent', border: '1px solid rgba(82, 39, 255, 0.5)', color: '#5227FF',
                      padding: '8px 16px', borderRadius: '6px', cursor: 'pointer', fontSize: '0.9rem', fontWeight: 'bold'
                    }}>Ver completo</button>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>

      {showModal && <SummaryModal summary={currentSummary} remainingRequests={remainingRequests} onClose={() => setShowModal(false)} />}
    </div>
  );
}