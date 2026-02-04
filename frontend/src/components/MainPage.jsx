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
    type: null,
    data: null,
  });
  const [confirmLoading, setConfirmLoading] = useState(false);

  // SOLUCION BUG: Cargar stats e historial al iniciar
  useEffect(() => {
    const initializeData = async () => {
      await loadStats();
      await loadHistory();
    };
    initializeData();
  }, []);

  useEffect(() => {
    if (activeTab === 'history') {
      loadHistory();
    }
  }, [activeTab]);

  // FUNCION HELPER: Detectar y parsear errores del backend
  const parseErrorMessage = (errorMessage) => {
    const message = errorMessage.toLowerCase();
    
    if (message.includes('age') || 
        message.includes('sign in') || 
        message.includes('inappropriate') ||
        message.includes('verificacion de edad') ||
        message.includes('verificación')) {
      return '⚠️ Este video requiere verificación de edad y no se puede procesar. Por favor, elige un video público sin restricciones.';
    }
    
    if (message.includes('private') || message.includes('privado')) {
      return '🔒 Este video es privado y no se puede acceder. Elige un video público.';
    }
    
    if (message.includes('unavailable') || 
        message.includes('not available') ||
        message.includes('no esta disponible') ||
        message.includes('no está disponible') ||
        message.includes('eliminado')) {
      return '❌ Este video no está disponible o ha sido eliminado.';
    }
    
    if (message.includes('region') || 
        message.includes('country') ||
        message.includes('geo')) {
      return '🌍 Este video no está disponible en tu región.';
    }
    
    if (message.includes('timeout') || 
        message.includes('too long') ||
        message.includes('demasiado largo')) {
      return '⏱️ El video es demasiado largo. Intenta con un video más corto.';
    }
    
    if (errorMessage.startsWith('⚠️') || 
        errorMessage.startsWith('🔒') || 
        errorMessage.startsWith('❌') ||
        errorMessage.startsWith('🌍') ||
        errorMessage.startsWith('⏱️')) {
      return errorMessage;
    }
    
    return errorMessage;
  };

  const loadStats = async () => {
    try {
      console.log('📊 Cargando stats...');
      const data = await getUserStats();
      console.log('✅ Stats recibidos:', data);
      
      setStats(data);
      setRemainingRequests(data.remainingRequests);
    } catch (err) {
      console.error('❌ Error cargando stats:', err);
      if (user) {
        setStats({
          remainingRequests: user.dailyLimit || 5,
          totalSummaries: 0,
          dailyLimit: user.dailyLimit || 5
        });
        setRemainingRequests(user.dailyLimit || 5);
      }
    }
  };

  const loadHistory = async () => {
    setLoadingHistory(true);
    try {
      console.log('📚 Cargando historial...');
      const data = await getSummaryHistory();
      console.log('✅ Historial recibido:', data, 'Total:', data.length);
      
      setSummaries(data);
    } catch (err) {
      console.error('❌ Error cargando historial:', err);
      setSummaries([]);
    } finally {
      setLoadingHistory(false);
    }
  };

  const isValidYouTubeURL = (url) => {
    if (!url || url.trim() === '') return false;
    const youtubeRegex = /^(https?:\/\/)?(www\.)?(youtube\.com\/(watch\?v=|embed\/|v\/)|youtu\.be\/)[\w-]+/;
    return youtubeRegex.test(url);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setVideoURLError('');

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

    let timer1, timer2;

    try {
      setLoadingStep('Descargando audio del video...');
      
      timer1 = setTimeout(() => {
        setLoadingStep('Transcribiendo audio a texto...');
      }, 10000);

      timer2 = setTimeout(() => {
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
      await loadHistory();
    } catch (err) {
      clearTimeout(timer1);
      clearTimeout(timer2);
      
      const rawError = err.response?.data?.error || err.message || 'Error al generar resumen';
      const friendlyError = parseErrorMessage(rawError);
      setError(friendlyError);
      
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

  const handleTabChange = (newTab) => {
    if (newTab === activeTab) return;
    
    setIsTransitioning(true);
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

      setAudioSuccess('✅ Audio descargado correctamente');
      setAudioURL('');
      await loadStats();

    } catch (err) {
      const rawError = err.response?.data?.error || err.message || 'Error al descargar audio';
      const friendlyError = parseErrorMessage(rawError);
      setAudioError(friendlyError);
      
      console.error('Error descarga audio:', err);
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

  // Estilos reutilizables
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

  const inputErrorStyle = {
    ...inputStyle,
    border: `2px solid ${colors.error}`,
    background: `${colors.error}10`,
  };

  const buttonPrimaryStyle = {
    width: '100%',
    padding: '14px 24px',
    borderRadius: '8px',
    border: `1px solid ${colors.primary}`,
    background: 'transparent',
    color: colors.primary,
    cursor: 'pointer',
    fontSize: '1rem',
    fontWeight: '600',
    fontFamily: '"Share Tech Mono", "Fira Code", monospace',
    transition: 'all 200ms ease',
    boxShadow: `0 0 20px ${colors.primaryGlow}, inset 0 0 20px rgba(0, 255, 65, 0.1)`,
    textTransform: 'uppercase',
    letterSpacing: '2px',
  };

  const buttonDisabledStyle = {
    ...buttonPrimaryStyle,
    border: `1px solid ${colors.textDisabled}`,
    color: colors.textDisabled,
    cursor: 'not-allowed',
    boxShadow: 'none',
  };

  const cardStyle = {
    background: colors.bgSecondary,
    border: `1px solid ${colors.border}`,
    borderRadius: '8px',
    padding: '20px',
    transition: 'all 200ms ease',
  };

  const tabButtonStyle = (isActive) => ({
    padding: '14px 20px',
    border: 'none',
    background: 'transparent',
    color: isActive ? colors.primary : colors.textSecondary,
    cursor: 'pointer',
    fontSize: '0.9rem',
    fontWeight: isActive ? '600' : '500',
    fontFamily: '"Share Tech Mono", "Fira Code", monospace',
    borderBottom: isActive ? `2px solid ${colors.primary}` : '2px solid transparent',
    transition: 'all 200ms ease',
    marginBottom: '-1px',
    textTransform: 'uppercase',
    letterSpacing: '1px',
    textShadow: isActive ? `0 0 10px ${colors.primaryGlow}` : 'none',
  });

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
      fontFamily: '"Share Tech Mono", "Fira Code", monospace',
    }}>
      {/* Importar fuente */}
      <link href="https://fonts.googleapis.com/css2?family=Share+Tech+Mono&display=swap" rel="stylesheet" />
      
      <div style={{
        pointerEvents: 'auto',
        background: colors.bgPrimary,
        borderRadius: '12px',
        border: `1px solid ${colors.primary}30`,
        padding: '32px 40px',
        width: 540,
        maxHeight: '85vh',
        overflowY: 'auto',
        boxShadow: `0 0 40px rgba(0, 255, 65, 0.15), 0 0 80px rgba(0, 255, 65, 0.05)`,
      }}>
        {/* Header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
          <div>
            <h2 style={{ 
              fontSize: '1.5rem', 
              margin: 0, 
              fontWeight: '600', 
              color: colors.primary,
              letterSpacing: '2px',
              textTransform: 'uppercase',
              textShadow: `0 0 20px ${colors.primaryGlow}`,
            }}>
              {`> ${user?.username}`}
            </h2>
            <p style={{ 
              margin: '8px 0 0 0', 
              color: colors.textSecondary, 
              fontSize: '0.85rem',
              fontWeight: '500',
              letterSpacing: '1px',
            }}>
              [{user?.userType}] :: {
                stats?.remainingRequests !== undefined 
                  ? `${stats.remainingRequests} requests remaining` 
                  : (user?.dailyLimit ? `${user.dailyLimit} remaining` : 'loading...')
              }
            </p>
          </div>
          <button 
            onClick={handleLogoutClick} 
            style={{
              padding: '10px 18px',
              borderRadius: '6px',
              border: `1px solid ${colors.error}50`,
              background: 'transparent',
              color: colors.error,
              cursor: 'pointer',
              fontSize: '0.85rem',
              fontWeight: '500',
              fontFamily: '"Share Tech Mono", "Fira Code", monospace',
              transition: 'all 200ms ease',
              textTransform: 'uppercase',
              letterSpacing: '1px',
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.background = `${colors.error}20`;
              e.currentTarget.style.boxShadow = `0 0 15px ${colors.error}40`;
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.background = 'transparent';
              e.currentTarget.style.boxShadow = 'none';
            }}
          >
            [EXIT]
          </button>
        </div>

        {/* Tabs */}
        <div style={{ 
          display: 'flex', 
          gap: '8px', 
          marginBottom: '28px', 
          borderBottom: `1px solid ${colors.border}`,
        }}>
          <button 
            onClick={() => handleTabChange('generate')} 
            style={tabButtonStyle(activeTab === 'generate')}
            onMouseEnter={(e) => {
              if (activeTab !== 'generate') {
                e.currentTarget.style.color = colors.primary;
                e.currentTarget.style.textShadow = `0 0 10px ${colors.primaryGlow}`;
              }
            }}
            onMouseLeave={(e) => {
              if (activeTab !== 'generate') {
                e.currentTarget.style.color = colors.textSecondary;
                e.currentTarget.style.textShadow = 'none';
              }
            }}
          >
            [Resumen]
          </button>

          <button 
            onClick={() => handleTabChange('history')} 
            style={tabButtonStyle(activeTab === 'history')}
            onMouseEnter={(e) => {
              if (activeTab !== 'history') {
                e.currentTarget.style.color = colors.primary;
                e.currentTarget.style.textShadow = `0 0 10px ${colors.primaryGlow}`;
              }
            }}
            onMouseLeave={(e) => {
              if (activeTab !== 'history') {
                e.currentTarget.style.color = colors.textSecondary;
                e.currentTarget.style.textShadow = 'none';
              }
            }}
          >
            [Historial] ({summaries.length})
          </button>

          <button 
            onClick={() => handleTabChange('audio')} 
            style={tabButtonStyle(activeTab === 'audio')}
            onMouseEnter={(e) => {
              if (activeTab !== 'audio') {
                e.currentTarget.style.color = colors.primary;
                e.currentTarget.style.textShadow = `0 0 10px ${colors.primaryGlow}`;
              }
            }}
            onMouseLeave={(e) => {
              if (activeTab !== 'audio') {
                e.currentTarget.style.color = colors.textSecondary;
                e.currentTarget.style.textShadow = 'none';
              }
            }}
          >
            [Audio]
          </button>
        </div>

        {/* Tab: Generar Resumen */}
        {activeTab === 'generate' && (
          <div style={{
            animation: isTransitioning ? 'fadeOut 0.2s ease-out' : 'fadeIn 0.3s ease-in',
            opacity: isTransitioning ? 0 : 1,
          }}>
            <p style={{ 
              marginBottom: '24px', 
              color: colors.textSecondary, 
              textAlign: 'center',
              fontSize: '0.9rem',
              lineHeight: '1.6',
            }}>
              {'> Pega un enlace de YouTube para obtener un resumen_'}
            </p>

            {error && (
              <div style={{
                padding: '14px 16px',
                borderRadius: '8px',
                background: `${colors.error}10`,
                border: `1px solid ${colors.error}50`,
                color: colors.error,
                fontSize: '0.85rem',
                marginBottom: '20px',
                animation: 'fadeIn 0.3s ease-in',
                lineHeight: '1.5',
              }}>
                {error}
              </div>
            )}

            {loading && loadingStep && (
              <div style={{
                padding: '20px',
                borderRadius: '8px',
                background: `${colors.primary}08`,
                border: `1px solid ${colors.primary}30`,
                marginBottom: '20px',
                textAlign: 'center',
              }}>
                <div style={{
                  width: '28px',
                  height: '28px',
                  border: `2px solid ${colors.primary}30`,
                  borderTopColor: colors.primary,
                  borderRadius: '50%',
                  animation: 'spin 1s linear infinite',
                  margin: '0 auto 12px auto',
                  boxShadow: `0 0 15px ${colors.primaryGlow}`,
                }}></div>
                <p style={{ 
                  color: colors.primary, 
                  margin: 0, 
                  fontSize: '0.9rem', 
                  fontWeight: '600',
                  textShadow: `0 0 10px ${colors.primaryGlow}`,
                }}>
                  {`> ${loadingStep}`}
                </p>
                <p style={{ 
                  color: colors.textSecondary, 
                  margin: '8px 0 0 0', 
                  fontSize: '0.8rem',
                }}>
                  [Tiempo estimado: 2-5 min]
                </p>
              </div>
            )}

            <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
              <div>
                <input 
                  type="text" 
                  placeholder="> https://www.youtube.com/watch?v=..." 
                  value={videoURL}
                  onChange={(e) => {
                    setVideoURL(e.target.value);
                    if (videoURLError) setVideoURLError('');
                  }}
                  disabled={loading}
                  onFocus={(e) => {
                    if (!videoURLError) {
                      e.currentTarget.style.borderColor = colors.primary;
                      e.currentTarget.style.boxShadow = `0 0 15px ${colors.primaryGlow}`;
                    }
                  }}
                  onBlur={(e) => {
                    if (!videoURLError) {
                      e.currentTarget.style.borderColor = colors.border;
                      e.currentTarget.style.boxShadow = 'none';
                    }
                  }}
                  style={videoURLError ? inputErrorStyle : inputStyle}
                />
                {videoURLError && (
                  <p style={{ 
                    color: colors.error, 
                    fontSize: '0.8rem', 
                    margin: '10px 0 0 0',
                    fontWeight: '500',
                    animation: 'fadeIn 0.3s ease-in',
                  }}>
                    {`[ERROR] ${videoURLError}`}
                  </p>
                )}
              </div>

              <Select 
                options={LANGUAGES} 
                value={language} 
                onChange={setLanguage} 
                isSearchable 
                isDisabled={loading}
                placeholder="> Selecciona idioma" 
                menuPlacement="auto" 
                styles={{
                  control: (p, state) => ({ 
                    ...p, 
                    background: colors.bgSecondary, 
                    border: `1px solid ${state.isFocused ? colors.primary : colors.border}`,
                    borderRadius: '8px', 
                    padding: '6px 4px', 
                    boxShadow: state.isFocused ? `0 0 15px ${colors.primaryGlow}` : 'none', 
                    textAlign: 'left',
                    transition: 'all 200ms ease',
                    fontFamily: '"Share Tech Mono", "Fira Code", monospace',
                    '&:hover': {
                      borderColor: colors.primary,
                    },
                  }),
                  singleValue: (p) => ({ ...p, color: colors.textPrimary, fontFamily: '"Share Tech Mono", "Fira Code", monospace' }),
                  menu: (p) => ({ 
                    ...p, 
                    background: colors.bgSecondary, 
                    borderRadius: '8px', 
                    border: `1px solid ${colors.primary}30`,
                    boxShadow: `0 10px 40px rgba(0,0,0,0.5), 0 0 20px ${colors.primaryGlow}`,
                    overflow: 'hidden',
                  }),
                  menuList: (p) => ({ ...p, padding: '6px' }),
                  option: (p, s) => ({ 
                    ...p, 
                    background: s.isSelected ? `${colors.primary}30` : s.isFocused ? `${colors.primary}15` : 'transparent', 
                    color: s.isSelected ? colors.primary : colors.textPrimary,
                    borderRadius: '4px',
                    fontFamily: '"Share Tech Mono", "Fira Code", monospace',
                    cursor: 'pointer',
                    transition: 'all 150ms ease',
                  }),
                  input: (p) => ({ ...p, color: colors.textPrimary }),
                  placeholder: (p) => ({ ...p, color: colors.textDisabled }),
                }} 
              />

              <select 
                value={summaryLength} 
                onChange={(e) => setSummaryLength(e.target.value)} 
                disabled={loading}
                style={inputStyle}
              >
                <option style={{ background: colors.bgSecondary }} value="100-200">[100-200 palabras]</option>
                <option style={{ background: colors.bgSecondary }} value="200-400">[200-400 palabras]</option>
                <option style={{ background: colors.bgSecondary }} value="400-600">[400-600 palabras]</option>
              </select>

              <button 
                type="submit" 
                disabled={loading} 
                style={loading ? buttonDisabledStyle : buttonPrimaryStyle}
                onMouseEnter={(e) => {
                  if (!loading) {
                    e.currentTarget.style.background = `${colors.primary}20`;
                    e.currentTarget.style.boxShadow = `0 0 30px ${colors.primaryGlow}, inset 0 0 30px rgba(0, 255, 65, 0.2)`;
                    e.currentTarget.style.transform = 'translateY(-2px)';
                  }
                }}
                onMouseLeave={(e) => {
                  if (!loading) {
                    e.currentTarget.style.background = 'transparent';
                    e.currentTarget.style.boxShadow = `0 0 20px ${colors.primaryGlow}, inset 0 0 20px rgba(0, 255, 65, 0.1)`;
                    e.currentTarget.style.transform = 'translateY(0)';
                  }
                }}
              >
                {loading ? '> Procesando...' : '> Generar Resumen'}
              </button>
            </form>
          </div>
        )}

        {/* Tab: Historial */}
        {activeTab === 'history' && (
          <div style={{
            animation: isTransitioning ? 'fadeOut 0.2s ease-out' : 'fadeIn 0.3s ease-in',
            opacity: isTransitioning ? 0 : 1,
          }}>
            {loadingHistory ? (
              <p style={{ color: colors.textSecondary, textAlign: 'center', padding: '40px 0' }}>
                {'> Cargando datos...'}
              </p>
            ) : summaries.length === 0 ? (
              <p style={{ color: colors.textSecondary, textAlign: 'center', padding: '40px 0' }}>
                {'> No hay resúmenes en el historial_'}
              </p>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                {summaries.map((s) => (
                  <div 
                    key={s.id} 
                    style={cardStyle}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.borderColor = `${colors.primary}50`;
                      e.currentTarget.style.boxShadow = `0 0 20px ${colors.primaryGlow}`;
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.borderColor = colors.border;
                      e.currentTarget.style.boxShadow = 'none';
                    }}
                  >
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start', marginBottom: '12px' }}>
                      <div style={{ flex: 1, marginRight: '12px' }}>
                        <h4 style={{ 
                          color: colors.primary, 
                          margin: '0 0 6px 0', 
                          fontSize: '0.95rem',
                          fontWeight: '600',
                          lineHeight: '1.3',
                        }}>
                          {`> ${s.videoTitle || 'Video de YouTube'}`}
                        </h4>
                        <p style={{ 
                          color: colors.textDisabled, 
                          fontSize: '0.8rem', 
                          margin: 0,
                        }}>
                          [{new Date(s.createdAt).toLocaleDateString('es-ES', { 
                            day: 'numeric', 
                            month: 'short', 
                            year: 'numeric', 
                            hour: '2-digit', 
                            minute: '2-digit' 
                          })}]
                        </p>
                      </div>
                      <button 
                        onClick={() => handleDeleteSummary(s.id)} 
                        style={{
                          background: 'transparent', 
                          border: `1px solid ${colors.error}50`,
                          color: colors.error, 
                          padding: '8px 14px', 
                          borderRadius: '6px', 
                          cursor: 'pointer', 
                          fontSize: '0.8rem',
                          fontWeight: '500',
                          fontFamily: '"Share Tech Mono", "Fira Code", monospace',
                          transition: 'all 200ms ease',
                          flexShrink: 0,
                          textTransform: 'uppercase',
                        }}
                        onMouseEnter={(e) => {
                          e.currentTarget.style.background = `${colors.error}20`;
                          e.currentTarget.style.boxShadow = `0 0 10px ${colors.error}40`;
                        }}
                        onMouseLeave={(e) => {
                          e.currentTarget.style.background = 'transparent';
                          e.currentTarget.style.boxShadow = 'none';
                        }}
                      >
                        [DEL]
                      </button>
                    </div>
                    <p style={{ 
                      color: colors.textSecondary, 
                      fontSize: '0.85rem', 
                      margin: '12px 0', 
                      lineHeight: '1.6',
                      display: '-webkit-box', 
                      WebkitLineClamp: 3, 
                      WebkitBoxOrient: 'vertical', 
                      overflow: 'hidden' 
                    }}>
                      {s.summaryText}
                    </p>
                    <button 
                      onClick={() => { setCurrentSummary(s); setShowModal(true); }} 
                      style={{
                        background: 'transparent', 
                        border: `1px solid ${colors.primary}50`, 
                        color: colors.primary,
                        padding: '10px 18px', 
                        borderRadius: '6px', 
                        cursor: 'pointer', 
                        fontSize: '0.85rem', 
                        fontWeight: '600',
                        fontFamily: '"Share Tech Mono", "Fira Code", monospace',
                        transition: 'all 200ms ease',
                        textTransform: 'uppercase',
                        letterSpacing: '1px',
                      }}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.background = `${colors.primary}15`;
                        e.currentTarget.style.boxShadow = `0 0 15px ${colors.primaryGlow}`;
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.background = 'transparent';
                        e.currentTarget.style.boxShadow = 'none';
                      }}
                    >
                      [Ver más]
                    </button>
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
            <p style={{ 
              marginBottom: '24px', 
              color: colors.textSecondary, 
              textAlign: 'center',
              fontSize: '0.9rem',
              lineHeight: '1.6',
            }}>
              {'> Descarga audio de YouTube en formato MP3_'}
            </p>

            {audioError && (
              <div style={{
                padding: '14px 16px',
                borderRadius: '8px',
                background: `${colors.error}10`,
                border: `1px solid ${colors.error}50`,
                color: colors.error,
                fontSize: '0.85rem',
                marginBottom: '20px',
                animation: 'fadeIn 0.3s ease-in',
                lineHeight: '1.5',
              }}>
                {audioError}
              </div>
            )}

            {audioSuccess && (
              <div style={{
                padding: '14px 16px',
                borderRadius: '8px',
                background: `${colors.success}10`,
                border: `1px solid ${colors.success}50`,
                color: colors.success,
                fontSize: '0.85rem',
                marginBottom: '20px',
                animation: 'fadeIn 0.3s ease-in',
                textShadow: `0 0 10px ${colors.primaryGlow}`,
              }}>
                {audioSuccess}
              </div>
            )}

            {audioLoading && (
              <div style={{
                padding: '20px',
                borderRadius: '8px',
                background: `${colors.primary}08`,
                border: `1px solid ${colors.primary}30`,
                marginBottom: '20px',
                textAlign: 'center',
              }}>
                <div style={{
                  width: '28px',
                  height: '28px',
                  border: `2px solid ${colors.primary}30`,
                  borderTopColor: colors.primary,
                  borderRadius: '50%',
                  animation: 'spin 1s linear infinite',
                  margin: '0 auto 12px auto',
                  boxShadow: `0 0 15px ${colors.primaryGlow}`,
                }}></div>
                <p style={{ 
                  color: colors.primary, 
                  margin: 0, 
                  fontSize: '0.9rem',
                  fontWeight: '600',
                  textShadow: `0 0 10px ${colors.primaryGlow}`,
                }}>
                  {'> Descargando audio...'}
                </p>
                <p style={{ 
                  color: colors.textSecondary, 
                  margin: '8px 0 0 0', 
                  fontSize: '0.8rem',
                }}>
                  [Tiempo estimado: 10-30 seg]
                </p>
              </div>
            )}

            <form onSubmit={handleAudioDownload} style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
              <div>
                <input
                  type="text"
                  placeholder="> https://www.youtube.com/watch?v=..."
                  value={audioURL}
                  onChange={(e) => {
                    setAudioURL(e.target.value);
                    if (audioURLError) setAudioURLError('');
                  }}
                  disabled={audioLoading}
                  onFocus={(e) => {
                    if (!audioURLError) {
                      e.currentTarget.style.borderColor = colors.primary;
                      e.currentTarget.style.boxShadow = `0 0 15px ${colors.primaryGlow}`;
                    }
                  }}
                  onBlur={(e) => {
                    if (!audioURLError) {
                      e.currentTarget.style.borderColor = colors.border;
                      e.currentTarget.style.boxShadow = 'none';
                    }
                  }}
                  style={audioURLError ? inputErrorStyle : inputStyle}
                />
                {audioURLError && (
                  <p style={{ 
                    color: colors.error, 
                    fontSize: '0.8rem', 
                    margin: '10px 0 0 0',
                    fontWeight: '500',
                    animation: 'fadeIn 0.3s ease-in',
                  }}>
                    {`[ERROR] ${audioURLError}`}
                  </p>
                )}
              </div>

              <button
                type="submit"
                disabled={audioLoading || !audioURL}
                style={audioLoading || !audioURL ? buttonDisabledStyle : buttonPrimaryStyle}
                onMouseEnter={(e) => {
                  if (!audioLoading && audioURL) {
                    e.currentTarget.style.background = `${colors.primary}20`;
                    e.currentTarget.style.boxShadow = `0 0 30px ${colors.primaryGlow}, inset 0 0 30px rgba(0, 255, 65, 0.2)`;
                    e.currentTarget.style.transform = 'translateY(-2px)';
                  }
                }}
                onMouseLeave={(e) => {
                  if (!audioLoading && audioURL) {
                    e.currentTarget.style.background = 'transparent';
                    e.currentTarget.style.boxShadow = `0 0 20px ${colors.primaryGlow}, inset 0 0 20px rgba(0, 255, 65, 0.1)`;
                    e.currentTarget.style.transform = 'translateY(0)';
                  }
                }}
              >
                {audioLoading ? '> Descargando...' : '> Descargar MP3'}
              </button>
            </form>

            {/* NOTA INFORMATIVA */}
            <div style={{
              marginTop: '24px',
              padding: '18px',
              background: `${colors.info}08`,
              border: `1px solid ${colors.info}30`,
              borderRadius: '8px',
              fontSize: '0.8rem',
              color: colors.textSecondary,
              animation: 'fadeIn 0.3s ease-in',
            }}>
              <p style={{ 
                margin: '0 0 10px 0', 
                fontWeight: '600', 
                color: colors.info, 
                fontSize: '0.85rem',
              }}>
                {'> [INFO]'}
              </p>
              <ul style={{ 
                margin: 0, 
                paddingLeft: '20px', 
                lineHeight: '1.8',
              }}>
                <li>Solo videos <span style={{ color: colors.primary }}>públicos</span> sin restricciones de edad</li>
                <li>Límite diario: <span style={{ color: colors.primary }}>{user?.dailyLimit || 5}</span> descargas</li>
                <li>Compatibilidad: ~95% de videos</li>
              </ul>
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
              transform: translateY(8px);
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
              transform: translateY(-8px);
            }
          }
          
          @keyframes blink {
            0%, 50% { opacity: 1; }
            51%, 100% { opacity: 0; }
          }

          /* Scrollbar styling */
          ::-webkit-scrollbar {
            width: 6px;
          }
          
          ::-webkit-scrollbar-track {
            background: ${colors.bgPrimary};
          }
          
          ::-webkit-scrollbar-thumb {
            background: ${colors.primary}40;
            border-radius: 3px;
          }
          
          ::-webkit-scrollbar-thumb:hover {
            background: ${colors.primary}60;
          }

          ::selection {
            background: ${colors.primary}40;
            color: ${colors.textPrimary};
          }
        `}</style>
      </div>

      {showModal && <SummaryModal summary={currentSummary} remainingRequests={remainingRequests} onClose={() => setShowModal(false)} />}
      
      <ConfirmModal
        isOpen={confirmModal.isOpen}
        onClose={handleCancelConfirm}
        onConfirm={handleConfirmAction}
        title={
          confirmModal.type === 'delete' 
            ? '> ¿Eliminar resumen?' 
            : '> ¿Cerrar sesión?'
        }
        message={
          confirmModal.type === 'delete'
            ? '[WARNING] Esta acción no se puede deshacer. El resumen será eliminado permanentemente.'
            : '[CONFIRM] ¿Estás seguro de que quieres cerrar sesión?'
        }
        confirmText={
          confirmModal.type === 'delete' 
            ? '[ELIMINAR]' 
            : '[SALIR]'
        }
        cancelText="[CANCELAR]"
        confirmColor={confirmModal.type === 'delete' ? colors.error : colors.primary}
        isLoading={confirmLoading}
      />
    </div>
  );
}