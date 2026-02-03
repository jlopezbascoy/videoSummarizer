import React, { useState, useEffect } from 'react';
import Select from 'react-select';
import { useAuth } from '../context/AuthContext';
import { 
  generateSummary, 
  getSummaryHistory, 
  deleteSummary, 
  getUserStats,
  downloadAudio 
} from '../services/api';
import SummaryModal from './SummaryModal';
import ConfirmModal from './ConfirmModal';

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
  
  // Estados para resumen
  const [videoURL, setVideoURL] = useState('');
  const [language, setLanguage] = useState(LANGUAGES[0]);
  const [summaryLength, setSummaryLength] = useState('100-200');
  const [loading, setLoading] = useState(false);
  const [loadingStep, setLoadingStep] = useState('');
  const [error, setError] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [currentSummary, setCurrentSummary] = useState(null);
  const [remainingRequests, setRemainingRequests] = useState(null);
  const [summaries, setSummaries] = useState([]);
  const [loadingHistory, setLoadingHistory] = useState(false);
  const [stats, setStats] = useState(null);

  // Estados para descarga de audio
  const [audioURL, setAudioURL] = useState('');
  const [audioLoading, setAudioLoading] = useState(false);
  const [audioError, setAudioError] = useState('');
  const [audioSuccess, setAudioSuccess] = useState('');

  // Estados para validaciones de inputs
  const [videoURLError, setVideoURLError] = useState('');
  const [audioURLError, setAudioURLError] = useState('');

  // Estado para animación de transición de tabs
  const [isTransitioning, setIsTransitioning] = useState(false);

  // Estados para modales de confirmación
  const [confirmModal, setConfirmModal] = useState({
    isOpen: false,
    type: null, // 'delete' o 'logout'
    data: null, // ID del resumen a eliminar
  });
  const [confirmLoading, setConfirmLoading] = useState(false);

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

  // Función para validar URL de YouTube
  const isValidYouTubeURL = (url) => {
    if (!url || url.trim() === '') return false;
    const youtubeRegex = /^(https?:\/\/)?(www\.)?(youtube\.com\/(watch\?v=|embed\/|v\/)|youtu\.be\/)[\w-]+/;
    return youtubeRegex.test(url);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setVideoURLError('');

    // Validación de URL
    if (!videoURL || videoURL.trim() === '') {
      setVideoURLError('Debes introducir una URL de YouTube');
      return;
    }

    if (!isValidYouTubeURL(videoURL)) {
      setVideoURLError('Debes introducir una URL de YouTube válida');
      return;
    }

    setLoading(true);
    setLoadingStep('Iniciando...');

    try {
      setLoadingStep('Descargando audio del video...');
      
      const timer1 = setTimeout(() => {
        setLoadingStep('Transcribiendo audio a texto...');
      }, 10000);

      const timer2 = setTimeout(() => {
        setLoadingStep('Generando resumen con IA...');
      }, 40000);

      const result = await generateSummary({
        videoUrl: videoURL,
        language: language.value,
        wordCountRange: summaryLength,
      });

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
    setConfirmModal({
      isOpen: true,
      type: 'delete',
      data: id,
    });
  };

  const handleLogoutClick = () => {
    setConfirmModal({
      isOpen: true,
      type: 'logout',
      data: null,
    });
  };

  const handleConfirmAction = async () => {
    setConfirmLoading(true);

    try {
      if (confirmModal.type === 'delete') {
        await deleteSummary(confirmModal.data);
        await loadHistory();
        await loadStats();
        
        // Si el resumen eliminado es el que está abierto en el modal, cerrarlo
        if (currentSummary && currentSummary.id === confirmModal.data) {
          setShowModal(false);
          setCurrentSummary(null);
        }
      } else if (confirmModal.type === 'logout') {
        logout();
      }
    } catch (err) {
      setError('Error al realizar la acción. Por favor, inténtalo de nuevo.');
      console.error('Error:', err);
    } finally {
      setConfirmLoading(false);
      setConfirmModal({ isOpen: false, type: null, data: null });
    }
  };

  const handleCancelConfirm = () => {
    setConfirmModal({ isOpen: false, type: null, data: null });
  };

  // Función para cambiar de tab con animación
  const handleTabChange = (newTab) => {
    if (newTab === activeTab) return;
    
    setIsTransitioning(true);
    
    // Limpiar errores de validación al cambiar de tab
    setVideoURLError('');
    setAudioURLError('');
    
    setTimeout(() => {
      setActiveTab(newTab);
      setTimeout(() => {
        setIsTransitioning(false);
      }, 50);
    }, 200);
  };

  const handleAudioDownload = async (e) => {
    e.preventDefault();
    setAudioError('');
    setAudioSuccess('');
    setAudioURLError('');

    // Validación de URL
    if (!audioURL || audioURL.trim() === '') {
      setAudioURLError('Debes introducir una URL de YouTube');
      return;
    }

    if (!isValidYouTubeURL(audioURL)) {
      setAudioURLError('Debes introducir una URL de YouTube válida');
      return;
    }

    setAudioLoading(true);

    try {
      const blob = await downloadAudio(audioURL);
      const videoId = extractVideoId(audioURL);
      const fileName = `youtube_audio_${videoId}.mp3`;
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = fileName;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);

      setAudioSuccess('Audio descargado correctamente');
      setAudioURL('');
      await loadStats();

    } catch (err) {
      const errorMessage = err.response?.data?.error || err.message || 'Error al descargar audio';
      setAudioError(errorMessage);
    } finally {
      setAudioLoading(false);
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
        animation: 'fadeIn 0.5s ease-in',
      }}>
        {/* Header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
          <div>
            <h2 style={{ fontSize: '1.8rem', margin: 0, fontWeight: '600', color: 'white' }}>
              Hola, {user?.username}
            </h2>
            <p style={{ margin: '5px 0 0 0', color: 'rgba(255, 255, 255, 0.6)', fontSize: '0.85rem' }}>
              {user?.userType} • {stats?.remainingRequests !== undefined ? `${stats.remainingRequests} restantes` : 'Cargando...'}
            </p>
          </div>
          <button onClick={handleLogoutClick} style={{
            padding: '8px 16px',
            borderRadius: '8px',
            border: '1px solid rgba(255, 255, 255, 0.2)',
            background: 'rgba(255, 255, 255, 0.1)',
            color: 'white',
            cursor: 'pointer',
            fontSize: '0.9rem',
            transition: 'all 0.3s ease',
          }}
          onMouseEnter={(e) => (e.currentTarget.style.background = 'rgba(255, 255, 255, 0.2)', e.currentTarget.style.transform = 'translateY(-2px)')}
          onMouseLeave={(e) => (e.currentTarget.style.background = 'rgba(255, 255, 255, 0.1)', e.currentTarget.style.transform = 'translateY(0)')}
          >Salir</button>
        </div>

        {/* Tabs */}
        <div style={{ display: 'flex', gap: '5px', marginBottom: '25px', borderBottom: '1px solid rgba(255, 255, 255, 0.1)' }}>
          <button onClick={() => handleTabChange('generate')} style={{
            padding: '12px 18px',
            border: 'none',
            background: 'transparent',
            color: activeTab === 'generate' ? 'white' : 'rgba(255, 255, 255, 0.5)',
            cursor: 'pointer',
            fontSize: '0.95rem',
            fontWeight: activeTab === 'generate' ? 'bold' : 'normal',
            borderBottom: activeTab === 'generate' ? '3px solid #5227FF' : 'none',
            transition: 'all 0.3s ease',
            transform: activeTab === 'generate' ? 'translateY(-2px)' : 'translateY(0)',
          }}
          onMouseEnter={(e) => {
            if (activeTab !== 'generate') {
              e.currentTarget.style.color = 'rgba(255, 255, 255, 0.8)';
              e.currentTarget.style.transform = 'translateY(-2px)';
            }
          }}
          onMouseLeave={(e) => {
            if (activeTab !== 'generate') {
              e.currentTarget.style.color = 'rgba(255, 255, 255, 0.5)';
              e.currentTarget.style.transform = 'translateY(0)';
            }
          }}>Transcribir</button>

          <button onClick={() => handleTabChange('history')} style={{
            padding: '12px 18px',
            border: 'none',
            background: 'transparent',
            color: activeTab === 'history' ? 'white' : 'rgba(255, 255, 255, 0.5)',
            cursor: 'pointer',
            fontSize: '0.95rem',
            fontWeight: activeTab === 'history' ? 'bold' : 'normal',
            borderBottom: activeTab === 'history' ? '3px solid #5227FF' : 'none',
            transition: 'all 0.3s ease',
            transform: activeTab === 'history' ? 'translateY(-2px)' : 'translateY(0)',
          }}
          onMouseEnter={(e) => {
            if (activeTab !== 'history') {
              e.currentTarget.style.color = 'rgba(255, 255, 255, 0.8)';
              e.currentTarget.style.transform = 'translateY(-2px)';
            }
          }}
          onMouseLeave={(e) => {
            if (activeTab !== 'history') {
              e.currentTarget.style.color = 'rgba(255, 255, 255, 0.5)';
              e.currentTarget.style.transform = 'translateY(0)';
            }
          }}>Historial ({stats?.totalSummaries ?? 0})</button>

          <button onClick={() => handleTabChange('audio')} style={{
            padding: '12px 18px',
            border: 'none',
            background: 'transparent',
            color: activeTab === 'audio' ? 'white' : 'rgba(255, 255, 255, 0.5)',
            cursor: 'pointer',
            fontSize: '0.95rem',
            fontWeight: activeTab === 'audio' ? 'bold' : 'normal',
            borderBottom: activeTab === 'audio' ? '3px solid #5227FF' : 'none',
            transition: 'all 0.3s ease',
            transform: activeTab === 'audio' ? 'translateY(-2px)' : 'translateY(0)',
          }}
          onMouseEnter={(e) => {
            if (activeTab !== 'audio') {
              e.currentTarget.style.color = 'rgba(255, 255, 255, 0.8)';
              e.currentTarget.style.transform = 'translateY(-2px)';
            }
          }}
          onMouseLeave={(e) => {
            if (activeTab !== 'audio') {
              e.currentTarget.style.color = 'rgba(255, 255, 255, 0.5)';
              e.currentTarget.style.transform = 'translateY(0)';
            }
          }}>Audio</button>
        </div>

        {/* Tab: Generar Resumen */}
        {activeTab === 'generate' && (
          <div style={{
            animation: isTransitioning ? 'fadeOut 0.2s ease-out' : 'fadeIn 0.3s ease-in',
            opacity: isTransitioning ? 0 : 1,
          }}>
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
                animation: 'fadeIn 0.3s ease-in',
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
                  Esto puede tardar 2-5 minutos
                </p>
              </div>
            )}

            <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
              <div>
                <input 
                  type="text"
                  placeholder="https://www.youtube.com/watch?v=..." 
                  value={videoURL}
                  onChange={(e) => {
                    setVideoURL(e.target.value);
                    if (videoURLError) setVideoURLError('');
                  }} 
                  disabled={loading}
                  onFocus={(e) => {
                    if (!videoURLError) e.currentTarget.style.borderColor = '#5227FF';
                  }}
                  onBlur={(e) => {
                    if (!videoURLError) e.currentTarget.style.borderColor = 'rgba(255, 255, 255, 0.2)';
                  }}
                  style={{ 
                    width: '100%', 
                    padding: '12px', 
                    borderRadius: '8px', 
                    border: videoURLError ? '2px solid #ef4444' : '1px solid rgba(255, 255, 255, 0.2)',
                    background: videoURLError ? 'rgba(239, 68, 68, 0.05)' : 'rgba(255, 255, 255, 0.1)', 
                    color: 'white', 
                    fontSize: '1rem', 
                    boxSizing: 'border-box', 
                    transition: 'all 0.3s ease',
                    animation: videoURLError ? 'shake 0.5s' : 'none',
                  }} 
                />
                {videoURLError && (
                  <p style={{ 
                    color: '#f87171', 
                    fontSize: '0.85rem', 
                    margin: '8px 0 0 0',
                    animation: 'fadeIn 0.3s ease-in',
                  }}>
                    {videoURLError}
                  </p>
                )}
              </div>

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
                onFocus={(e) => e.currentTarget.style.borderColor = '#5227FF'}
                onBlur={(e) => e.currentTarget.style.borderColor = 'rgba(255, 255, 255, 0.2)'}
                style={{ width: '100%', padding: '12px', borderRadius: '8px', border: '1px solid rgba(255, 255, 255, 0.2)',
                  background: 'rgba(255, 255, 255, 0.1)', color: 'white', fontSize: '1rem', boxSizing: 'border-box',
                  transition: 'all 0.3s ease', cursor: 'pointer' }}>
                <option style={{ background: '#111928' }} value="100-200">100-200 palabras</option>
                <option style={{ background: '#111928' }} value="200-400">200-400 palabras</option>
                <option style={{ background: '#111928' }} value="400-600">400-600 palabras</option>
              </select>

              <button type="submit" disabled={loading} style={{
                width: '100%', padding: '12px', borderRadius: '8px', border: 'none',
                background: loading ? '#6b7280' : '#5227FF', color: '#fff',
                cursor: loading ? 'not-allowed' : 'pointer', fontSize: '1.1rem', fontWeight: 'bold',
                transition: 'all 0.3s ease',
                transform: 'scale(1)',
              }}
              onMouseEnter={(e) => !loading && (e.currentTarget.style.transform = 'scale(1.02)', e.currentTarget.style.boxShadow = '0 4px 12px rgba(82, 39, 255, 0.4)')}
              onMouseLeave={(e) => (e.currentTarget.style.transform = 'scale(1)', e.currentTarget.style.boxShadow = 'none')}
              >{loading ? 'Procesando...' : 'Generar Resumen'}</button>
            </form>
          </div>
        )}

        {/* Tab: Historial */}
        {activeTab === 'history' && (
          <div style={{
            animation: isTransitioning ? 'fadeOut 0.2s ease-out' : 'fadeIn 0.3s ease-in',
            opacity: isTransitioning ? 0 : 1,
          }}>
            {loadingHistory ? (<p style={{ color: 'rgba(255, 255, 255, 0.7)', textAlign: 'center' }}>Cargando...</p>
            ) : summaries.length === 0 ? (<p style={{ color: 'rgba(255, 255, 255, 0.7)', textAlign: 'center' }}>
                Aun no has generado ningun resumen</p>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
                {summaries.map((s, index) => (
                  <div key={s.id} style={{ 
                    background: 'rgba(255, 255, 255, 0.05)', 
                    border: '1px solid rgba(255, 255, 255, 0.1)',
                    borderRadius: '8px', 
                    padding: '15px',
                    animation: `fadeIn 0.3s ease-in ${index * 0.05}s backwards`,
                    transition: 'all 0.3s ease',
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.background = 'rgba(255, 255, 255, 0.08)';
                    e.currentTarget.style.transform = 'translateY(-2px)';
                    e.currentTarget.style.boxShadow = '0 4px 12px rgba(0, 0, 0, 0.3)';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.background = 'rgba(255, 255, 255, 0.05)';
                    e.currentTarget.style.transform = 'translateY(0)';
                    e.currentTarget.style.boxShadow = 'none';
                  }}
                  >
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start', marginBottom: '10px' }}>
                      <div style={{ flex: 1 }}>
                        <h4 style={{ color: 'white', margin: '0 0 5px 0', fontSize: '1rem' }}>{s.videoTitle || 'Video de YouTube'}</h4>
                        <p style={{ color: 'rgba(255, 255, 255, 0.6)', fontSize: '0.85rem', margin: 0 }}>
                          {new Date(s.createdAt).toLocaleDateString('es-ES', { day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' })}
                        </p>
                      </div>
                      <button onClick={() => handleDeleteSummary(s.id)} style={{
                        background: 'rgba(239, 68, 68, 0.1)', border: '1px solid rgba(239, 68, 68, 0.3)',
                        color: '#f87171', padding: '6px 12px', borderRadius: '6px', cursor: 'pointer', fontSize: '0.85rem',
                        transition: 'all 0.3s ease',
                      }}
                      onMouseEnter={(e) => (e.currentTarget.style.background = 'rgba(239, 68, 68, 0.2)', e.currentTarget.style.transform = 'translateY(-2px)')}
                      onMouseLeave={(e) => (e.currentTarget.style.background = 'rgba(239, 68, 68, 0.1)', e.currentTarget.style.transform = 'translateY(0)')}
                      >Eliminar</button>
                    </div>
                    <p style={{ color: 'rgba(255, 255, 255, 0.8)', fontSize: '0.95rem', margin: '10px 0', lineHeight: '1.5',
                      display: '-webkit-box', WebkitLineClamp: 3, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>{s.summaryText}</p>
                    <button onClick={() => { setCurrentSummary(s); setShowModal(true); }} style={{
                      background: 'transparent', border: '1px solid rgba(82, 39, 255, 0.5)', color: '#5227FF',
                      padding: '8px 16px', borderRadius: '6px', cursor: 'pointer', fontSize: '0.9rem', fontWeight: 'bold',
                      transition: 'all 0.3s ease',
                    }}
                    onMouseEnter={(e) => (e.currentTarget.style.background = 'rgba(82, 39, 255, 0.1)', e.currentTarget.style.transform = 'translateY(-2px)')}
                    onMouseLeave={(e) => (e.currentTarget.style.background = 'transparent', e.currentTarget.style.transform = 'translateY(0)')}
                    >Ver completo</button>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Tab: Descargar Audio */}
        {activeTab === 'audio' && (
          <div style={{
            animation: isTransitioning ? 'fadeOut 0.2s ease-out' : 'fadeIn 0.3s ease-in',
            opacity: isTransitioning ? 0 : 1,
          }}>
            <p style={{ marginBottom: '20px', color: 'rgba(255, 255, 255, 0.8)', textAlign: 'center' }}>
              Descarga el audio de cualquier video de YouTube en formato MP3
            </p>

            {audioError && (
              <div style={{
                padding: '12px',
                borderRadius: '8px',
                background: 'rgba(239, 68, 68, 0.1)',
                border: '1px solid rgba(239, 68, 68, 0.5)',
                color: '#f87171',
                fontSize: '0.9rem',
                marginBottom: '15px',
                animation: 'fadeIn 0.3s ease-in',
              }}>{audioError}</div>
            )}

            {audioSuccess && (
              <div style={{
                padding: '12px',
                borderRadius: '8px',
                background: 'rgba(34, 197, 94, 0.1)',
                border: '1px solid rgba(34, 197, 94, 0.5)',
                color: '#4ade80',
                fontSize: '0.9rem',
                marginBottom: '15px',
                animation: 'fadeIn 0.3s ease-in',
              }}>{audioSuccess}</div>
            )}

            {audioLoading && (
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

            <form onSubmit={handleAudioDownload} style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
              <div>
                <input
                  type="text"
                  placeholder="https://www.youtube.com/watch?v=..."
                  value={audioURL}
                  onChange={(e) => {
                    setAudioURL(e.target.value);
                    if (audioURLError) setAudioURLError('');
                  }}
                  disabled={audioLoading}
                  onFocus={(e) => {
                    if (!audioURLError) e.currentTarget.style.borderColor = '#5227FF';
                  }}
                  onBlur={(e) => {
                    if (!audioURLError) e.currentTarget.style.borderColor = 'rgba(255, 255, 255, 0.2)';
                  }}
                  style={{
                    width: '100%',
                    padding: '12px',
                    borderRadius: '8px',
                    border: audioURLError ? '2px solid #ef4444' : '1px solid rgba(255, 255, 255, 0.2)',
                    background: audioURLError ? 'rgba(239, 68, 68, 0.05)' : 'rgba(255, 255, 255, 0.1)',
                    color: 'white',
                    fontSize: '1rem',
                    boxSizing: 'border-box',
                    transition: 'all 0.3s ease',
                    animation: audioURLError ? 'shake 0.5s' : 'none',
                  }}
                />
                {audioURLError && (
                  <p style={{ 
                    color: '#f87171', 
                    fontSize: '0.85rem', 
                    margin: '8px 0 0 0',
                    animation: 'fadeIn 0.3s ease-in',
                  }}>
                    {audioURLError}
                  </p>
                )}
              </div>
<button
  type="submit"
  style={{
    width: '100%',
    padding: '12px',
    borderRadius: '8px',
    border: 'none',
    background: audioLoading || !audioURL ? '#6b7280' : '#5227FF',
    color: '#fff',
    cursor: 'pointer',
    fontSize: '1.1rem',
    fontWeight: 'bold',
    transition: 'all 0.3s ease',
    transform: 'scale(1)',
  }}
  onMouseEnter={(e) =>
    !audioLoading &&
    audioURL &&
    (e.currentTarget.style.transform = 'scale(1.02)',
     e.currentTarget.style.boxShadow = '0 4px 12px rgba(82, 39, 255, 0.4)')
  }
  onMouseLeave={(e) => {
    e.currentTarget.style.transform = 'scale(1)';
    e.currentTarget.style.boxShadow = 'none';
  }}
>
  {audioLoading ? 'Descargando...' : 'Descargar Audio MP3'}
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
                <strong>Nota:</strong> Las descargas cuentan para tu limite diario ({user?.dailyLimit || stats?.dailyLimit || 5} por dia).
              </p>
            </div>
          </div>
        )}

        <style>{`
          @keyframes spin {
            to { transform: rotate(360deg); }
          }
          
          @keyframes fadeIn {
            from {
              opacity: 0;
              transform: translateY(10px);
            }
            to {
              opacity: 1;
              transform: translateY(0);
            }
          }
          
          @keyframes fadeOut {
            from {
              opacity: 1;
              transform: translateY(0);
            }
            to {
              opacity: 0;
              transform: translateY(-10px);
            }
          }
          
          @keyframes shake {
            0%, 100% { transform: translateX(0); }
            10%, 30%, 50%, 70%, 90% { transform: translateX(-5px); }
            20%, 40%, 60%, 80% { transform: translateX(5px); }
          }
          
          @keyframes pulse {
            0%, 100% { transform: scale(1); }
            50% { transform: scale(1.05); }
          }
        `}</style>
      </div>

      {showModal && <SummaryModal summary={currentSummary} remainingRequests={remainingRequests} onClose={() => setShowModal(false)} />}
      
      {/* Modal de confirmación */}
      <ConfirmModal
        isOpen={confirmModal.isOpen}
        onClose={handleCancelConfirm}
        onConfirm={handleConfirmAction}
        title={
          confirmModal.type === 'delete' 
            ? '¿Eliminar resumen?' 
            : '¿Cerrar sesión?'
        }
        message={
          confirmModal.type === 'delete'
            ? 'Esta acción no se puede deshacer. El resumen será eliminado permanentemente.'
            : '¿Estás seguro de que quieres cerrar sesión?'
        }
        confirmText={
          confirmModal.type === 'delete' 
            ? 'Eliminar' 
            : 'Cerrar sesión'
        }
        cancelText="Cancelar"
        confirmColor={confirmModal.type === 'delete' ? '#ef4444' : '#5227FF'}
        isLoading={confirmLoading}
      />
    </div>
  );
}