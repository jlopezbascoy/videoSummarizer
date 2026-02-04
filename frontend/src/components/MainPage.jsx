import React, { useState, useEffect, useRef } from 'react';
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

const WORD_COUNTS = [
  { value: '100-200', label: '[100-200 palabras]' },
  { value: '200-400', label: '[200-400 palabras]' },
  { value: '400-600', label: '[400-600 palabras]' },
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

// Componente de fondo Matrix
const MatrixBackground = () => {
  const canvasRef = useRef(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');

    // Ajustar tamaño del canvas
    const resizeCanvas = () => {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
    };
    resizeCanvas();
    window.addEventListener('resize', resizeCanvas);

    // Caracteres para el efecto Matrix
    const chars = '01アイウエオカキクケコサシスセソタチツテトナニヌネノハヒフヘホマミムメモヤユヨラリルレロワヲン';
    const charArray = chars.split('');
    
    const fontSize = 14;
    const columns = canvas.width / fontSize;
    
    // Array para rastrear la posición Y de cada columna
    const drops = [];
    for (let i = 0; i < columns; i++) {
      drops[i] = Math.random() * -100;
    }

    // Función de dibujo
    const draw = () => {
      // Fondo semi-transparente para crear efecto de estela
      ctx.fillStyle = 'rgba(10, 15, 10, 0.05)';
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      ctx.fillStyle = colors.primary;
      ctx.font = `${fontSize}px monospace`;

      for (let i = 0; i < drops.length; i++) {
        // Seleccionar un carácter aleatorio
        const char = charArray[Math.floor(Math.random() * charArray.length)];
        
        // Calcular opacidad basada en posición
        const opacity = Math.random() * 0.5 + 0.1;
        ctx.fillStyle = `rgba(0, 255, 65, ${opacity})`;
        
        // Dibujar el carácter
        ctx.fillText(char, i * fontSize, drops[i] * fontSize);

        // Carácter brillante en la cabeza de cada columna
        if (Math.random() > 0.98) {
          ctx.fillStyle = '#FFFFFF';
          ctx.fillText(char, i * fontSize, drops[i] * fontSize);
        }

        // Reiniciar la columna si sale de la pantalla
        if (drops[i] * fontSize > canvas.height && Math.random() > 0.975) {
          drops[i] = 0;
        }
        
        // Mover hacia abajo
        drops[i] += 0.5 + Math.random() * 0.5;
      }
    };

    // Intervalo de animación
    const interval = setInterval(draw, 50);

    return () => {
      clearInterval(interval);
      window.removeEventListener('resize', resizeCanvas);
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        width: '100%',
        height: '100%',
        zIndex: 0,
        opacity: 0.6,
      }}
    />
  );
};

// Estilos reutilizables para react-select
const selectStyles = {
  control: (p, state) => ({ 
    ...p, 
    background: colors.bgSecondary, 
    border: `1px solid ${state.isFocused ? colors.primary : colors.border}`,
    borderRadius: '8px', 
    padding: '6px 4px', 
    boxShadow: state.isFocused ? `0 0 20px ${colors.primaryGlow}` : 'none', 
    textAlign: 'left',
    transition: 'all 300ms cubic-bezier(0.4, 0, 0.2, 1)',
    fontFamily: '"Share Tech Mono", "Fira Code", monospace',
    transform: state.isFocused ? 'scale(1.01)' : 'scale(1)',
    '&:hover': {
      borderColor: colors.primary,
    },
  }),
  singleValue: (p) => ({ 
    ...p, 
    color: colors.textPrimary, 
    fontFamily: '"Share Tech Mono", "Fira Code", monospace' 
  }),
  menu: (p) => ({ 
    ...p, 
    background: colors.bgSecondary, 
    borderRadius: '8px', 
    border: `1px solid ${colors.primary}30`,
    boxShadow: `0 10px 40px rgba(0,0,0,0.5), 0 0 30px ${colors.primaryGlow}`,
    overflow: 'hidden',
    animation: 'dropdownOpen 0.2s cubic-bezier(0.4, 0, 0.2, 1)',
    zIndex: 9999,
  }),
  menuPortal: (p) => ({
    ...p,
    zIndex: 9999,
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
  dropdownIndicator: (p, state) => ({
    ...p,
    color: colors.textSecondary,
    padding: '8px 12px',
    transition: 'all 200ms ease',
    transform: state.selectProps.menuIsOpen ? 'rotate(180deg)' : 'rotate(0deg)',
    '&:hover': {
      color: colors.primary,
    },
    '& svg': {
      width: '12px',
      height: '12px',
    },
  }),
  indicatorSeparator: () => ({
    display: 'none',
  }),
};

export default function MainPage() {
  const { logout, user } = useAuth();
  const [activeTab, setActiveTab] = useState('generate');
  const [isInitialLoad, setIsInitialLoad] = useState(true);
  
  // Estados para resumen
  const [videoURL, setVideoURL] = useState('');
  const [language, setLanguage] = useState(LANGUAGES[0]);
  const [summaryLength, setSummaryLength] = useState(WORD_COUNTS[0]);
  const [loading, setLoading] = useState(false);
  const [loadingStep, setLoadingStep] = useState('');
  const [loadingProgress, setLoadingProgress] = useState(0);
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

  // Animación inicial
  useEffect(() => {
    const timer = setTimeout(() => setIsInitialLoad(false), 100);
    return () => clearTimeout(timer);
  }, []);

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

  // Animación de progreso de carga
  useEffect(() => {
    let interval;
    if (loading) {
      setLoadingProgress(0);
      interval = setInterval(() => {
        setLoadingProgress(prev => {
          if (prev >= 95) return prev;
          const increment = Math.random() * 15;
          return Math.min(prev + increment, 95);
        });
      }, 2000);
    } else {
      setLoadingProgress(100);
      setTimeout(() => setLoadingProgress(0), 500);
    }
    return () => clearInterval(interval);
  }, [loading]);

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
        wordCountRange: summaryLength.value,
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
    transition: 'all 300ms cubic-bezier(0.4, 0, 0.2, 1)',
    outline: 'none',
  };

  const inputErrorStyle = {
    ...inputStyle,
    border: `2px solid ${colors.error}`,
    background: `${colors.error}10`,
    animation: 'shake 0.5s cubic-bezier(0.36, 0.07, 0.19, 0.97)',
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
    transition: 'all 300ms cubic-bezier(0.4, 0, 0.2, 1)',
    boxShadow: `0 0 20px ${colors.primaryGlow}, inset 0 0 20px rgba(0, 255, 65, 0.1)`,
    textTransform: 'uppercase',
    letterSpacing: '2px',
    position: 'relative',
    overflow: 'hidden',
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
    transition: 'all 300ms cubic-bezier(0.4, 0, 0.2, 1)',
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
    transition: 'all 300ms cubic-bezier(0.4, 0, 0.2, 1)',
    marginBottom: '-1px',
    textTransform: 'uppercase',
    letterSpacing: '1px',
    textShadow: isActive ? `0 0 10px ${colors.primaryGlow}` : 'none',
    position: 'relative',
  });

  return (
    <>
      {/* Matrix Background */}
      <MatrixBackground />
      
      {/* Overlay oscuro para mejorar legibilidad */}
      <div style={{
        position: 'fixed',
        top: 0,
        left: 0,
        width: '100%',
        height: '100%',
        background: 'radial-gradient(ellipse at center, transparent 0%, rgba(10, 15, 10, 0.8) 100%)',
        zIndex: 1,
        pointerEvents: 'none',
      }} />

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
        zIndex: 2,
      }}>
        {/* Importar fuente */}
        <link href="https://fonts.googleapis.com/css2?family=Share+Tech+Mono&display=swap" rel="stylesheet" />
        
        <div style={{
          pointerEvents: 'auto',
          background: `${colors.bgPrimary}F0`,
          backdropFilter: 'blur(10px)',
          borderRadius: '12px',
          border: `1px solid ${colors.primary}30`,
          padding: '32px 40px',
          width: 540,
          maxHeight: '85vh',
          overflowY: 'auto',
          boxShadow: `0 0 40px rgba(0, 255, 65, 0.15), 0 0 80px rgba(0, 255, 65, 0.05)`,
          animation: isInitialLoad ? 'none' : 'containerEntry 0.6s cubic-bezier(0.4, 0, 0.2, 1)',
          position: 'relative',
          overflow: 'hidden',
        }}>
          {/* Scanline Effect */}
          <div style={{
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            background: 'repeating-linear-gradient(0deg, transparent, transparent 2px, rgba(0, 255, 65, 0.03) 2px, rgba(0, 255, 65, 0.03) 4px)',
            pointerEvents: 'none',
            zIndex: 1,
          }} />

          {/* Content wrapper */}
          <div style={{ position: 'relative', zIndex: 2 }}>
            {/* Header */}
            <div style={{ 
              display: 'flex', 
              justifyContent: 'space-between', 
              alignItems: 'center', 
              marginBottom: '24px',
              animation: 'slideDown 0.5s cubic-bezier(0.4, 0, 0.2, 1) 0.1s both',
            }}>
              <div>
                <h2 style={{ 
                  fontSize: '1.5rem', 
                  margin: 0, 
                  fontWeight: '600', 
                  color: colors.primary,
                  letterSpacing: '2px',
                  textTransform: 'uppercase',
                  textShadow: `0 0 20px ${colors.primaryGlow}`,
                  animation: 'glitch 3s infinite',
                }}>
                  {`> ${user?.username}`}
                </h2>
                <p style={{ 
                  margin: '8px 0 0 0', 
                  color: colors.textSecondary, 
                  fontSize: '0.85rem',
                  fontWeight: '500',
                  letterSpacing: '1px',
                  animation: 'typewriter 1s steps(30) 0.5s both',
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
                  transition: 'all 300ms cubic-bezier(0.4, 0, 0.2, 1)',
                  textTransform: 'uppercase',
                  letterSpacing: '1px',
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.background = `${colors.error}20`;
                  e.currentTarget.style.boxShadow = `0 0 20px ${colors.error}40`;
                  e.currentTarget.style.transform = 'scale(1.05)';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.background = 'transparent';
                  e.currentTarget.style.boxShadow = 'none';
                  e.currentTarget.style.transform = 'scale(1)';
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
              animation: 'slideDown 0.5s cubic-bezier(0.4, 0, 0.2, 1) 0.2s both',
            }}>
              {['generate', 'history', 'audio'].map((tab, index) => (
                <button 
                  key={tab}
                  onClick={() => handleTabChange(tab)} 
                  style={{
                    ...tabButtonStyle(activeTab === tab),
                    animation: `fadeInUp 0.4s cubic-bezier(0.4, 0, 0.2, 1) ${0.3 + index * 0.1}s both`,
                  }}
                  onMouseEnter={(e) => {
                    if (activeTab !== tab) {
                      e.currentTarget.style.color = colors.primary;
                      e.currentTarget.style.textShadow = `0 0 10px ${colors.primaryGlow}`;
                      e.currentTarget.style.transform = 'translateY(-2px)';
                    }
                  }}
                  onMouseLeave={(e) => {
                    if (activeTab !== tab) {
                      e.currentTarget.style.color = colors.textSecondary;
                      e.currentTarget.style.textShadow = 'none';
                      e.currentTarget.style.transform = 'translateY(0)';
                    }
                  }}
                >
                  {tab === 'generate' && '[Resumen]'}
                  {tab === 'history' && `[Historial] (${summaries.length})`}
                  {tab === 'audio' && '[Audio]'}
                </button>
              ))}
            </div>

            {/* Tab: Generar Resumen */}
            {activeTab === 'generate' && (
              <div style={{
                animation: isTransitioning ? 'fadeOutUp 0.2s ease-out forwards' : 'fadeInUp 0.4s cubic-bezier(0.4, 0, 0.2, 1)',
              }}>
                <p style={{ 
                  marginBottom: '24px', 
                  color: colors.textSecondary, 
                  textAlign: 'center',
                  fontSize: '0.9rem',
                  lineHeight: '1.6',
                  animation: 'pulse 2s ease-in-out infinite',
                }}>
                  {'> Pega un enlace de YouTube para obtener un resumen'}
                  <span style={{ animation: 'blink 1s infinite' }}>_</span>
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
                    animation: 'shakeAndFadeIn 0.5s cubic-bezier(0.36, 0.07, 0.19, 0.97)',
                    lineHeight: '1.5',
                  }}>
                    {error}
                  </div>
                )}

                {loading && loadingStep && (
                  <div style={{
                    padding: '24px 20px',
                    borderRadius: '8px',
                    background: `${colors.primary}08`,
                    border: `1px solid ${colors.primary}30`,
                    marginBottom: '20px',
                    textAlign: 'center',
                  }}>
                    {/* Progress Bar */}
                    <div style={{
                      width: '100%',
                      height: '4px',
                      background: colors.border,
                      borderRadius: '2px',
                      marginBottom: '16px',
                      overflow: 'hidden',
                    }}>
                      <div style={{
                        width: `${loadingProgress}%`,
                        height: '100%',
                        background: `linear-gradient(90deg, ${colors.primary}, ${colors.primaryHover})`,
                        borderRadius: '2px',
                        transition: 'width 0.5s ease-out',
                        boxShadow: `0 0 10px ${colors.primary}`,
                      }} />
                    </div>
                    
                    {/* Matrix-style loader */}
                    <div style={{
                      display: 'flex',
                      justifyContent: 'center',
                      gap: '4px',
                      marginBottom: '16px',
                    }}>
                      {[...Array(5)].map((_, i) => (
                        <div key={i} style={{
                          width: '8px',
                          height: '24px',
                          background: colors.primary,
                          borderRadius: '2px',
                          animation: `matrixBar 1s ease-in-out ${i * 0.1}s infinite`,
                          boxShadow: `0 0 8px ${colors.primaryGlow}`,
                        }} />
                      ))}
                    </div>
                    
                    <p style={{ 
                      color: colors.primary, 
                      margin: 0, 
                      fontSize: '0.9rem', 
                      fontWeight: '600',
                      textShadow: `0 0 10px ${colors.primaryGlow}`,
                      animation: 'textGlow 1.5s ease-in-out infinite',
                    }}>
                      {`> ${loadingStep}`}
                    </p>
                    <p style={{ 
                      color: colors.textSecondary, 
                      margin: '8px 0 0 0', 
                      fontSize: '0.8rem',
                    }}>
                      [{Math.round(loadingProgress)}%] Tiempo estimado: 2-5 min
                    </p>
                  </div>
                )}

                <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                  <div style={{ animation: 'fadeInUp 0.4s cubic-bezier(0.4, 0, 0.2, 1) 0.1s both' }}>
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
                          e.currentTarget.style.boxShadow = `0 0 20px ${colors.primaryGlow}`;
                          e.currentTarget.style.transform = 'scale(1.01)';
                        }
                      }}
                      onBlur={(e) => {
                        if (!videoURLError) {
                          e.currentTarget.style.borderColor = colors.border;
                          e.currentTarget.style.boxShadow = 'none';
                          e.currentTarget.style.transform = 'scale(1)';
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
                        animation: 'fadeInUp 0.3s ease-out',
                      }}>
                        {`[ERROR] ${videoURLError}`}
                      </p>
                    )}
                  </div>

                  <div style={{ animation: 'fadeInUp 0.4s cubic-bezier(0.4, 0, 0.2, 1) 0.2s both' }}>
                    <Select 
                      options={LANGUAGES} 
                      value={language} 
                      onChange={setLanguage} 
                      isSearchable 
                      isDisabled={loading}
                      placeholder="> Selecciona idioma" 
                      menuPlacement="auto"
                      menuPortalTarget={document.body}
                      menuPosition="fixed"
                      styles={selectStyles}
                    />
                  </div>

                  <div style={{ animation: 'fadeInUp 0.4s cubic-bezier(0.4, 0, 0.2, 1) 0.3s both' }}>
                    <Select 
                      options={WORD_COUNTS} 
                      value={summaryLength} 
                      onChange={setSummaryLength} 
                      isSearchable={false}
                      isDisabled={loading}
                      placeholder="> Selecciona longitud" 
                      menuPlacement="auto"
                      menuPortalTarget={document.body}
                      menuPosition="fixed"
                      styles={selectStyles}
                    />
                  </div>

                  <div style={{ animation: 'fadeInUp 0.4s cubic-bezier(0.4, 0, 0.2, 1) 0.4s both' }}>
                    <button 
                      type="submit" 
                      disabled={loading} 
                      style={loading ? buttonDisabledStyle : buttonPrimaryStyle}
                      onMouseEnter={(e) => {
                        if (!loading) {
                          e.currentTarget.style.background = `${colors.primary}20`;
                          e.currentTarget.style.boxShadow = `0 0 40px ${colors.primaryGlow}, inset 0 0 40px rgba(0, 255, 65, 0.2)`;
                          e.currentTarget.style.transform = 'translateY(-3px) scale(1.02)';
                        }
                      }}
                      onMouseLeave={(e) => {
                        if (!loading) {
                          e.currentTarget.style.background = 'transparent';
                          e.currentTarget.style.boxShadow = `0 0 20px ${colors.primaryGlow}, inset 0 0 20px rgba(0, 255, 65, 0.1)`;
                          e.currentTarget.style.transform = 'translateY(0) scale(1)';
                        }
                      }}
                    >
                      {loading ? '> Procesando...' : '> Generar Resumen'}
                    </button>
                  </div>
                </form>
              </div>
            )}

            {/* Tab: Historial */}
            {activeTab === 'history' && (
              <div style={{
                animation: isTransitioning ? 'fadeOutUp 0.2s ease-out forwards' : 'fadeInUp 0.4s cubic-bezier(0.4, 0, 0.2, 1)',
              }}>
                {loadingHistory ? (
                  <div style={{ 
                    color: colors.textSecondary, 
                    textAlign: 'center', 
                    padding: '40px 0',
                    animation: 'pulse 1.5s ease-in-out infinite',
                  }}>
                    <div style={{
                      display: 'inline-flex',
                      gap: '4px',
                      marginBottom: '12px',
                    }}>
                      {[...Array(3)].map((_, i) => (
                        <div key={i} style={{
                          width: '8px',
                          height: '8px',
                          borderRadius: '50%',
                          background: colors.primary,
                          animation: `bounce 0.6s ease-in-out ${i * 0.1}s infinite`,
                        }} />
                      ))}
                    </div>
                    <p>{'> Cargando datos...'}</p>
                  </div>
                ) : summaries.length === 0 ? (
                  <p style={{ 
                    color: colors.textSecondary, 
                    textAlign: 'center', 
                    padding: '40px 0',
                    animation: 'fadeInUp 0.4s ease-out',
                  }}>
                    {'> No hay resúmenes en el historial'}
                    <span style={{ animation: 'blink 1s infinite' }}>_</span>
                  </p>
                ) : (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                    {summaries.map((s, index) => (
                      <div 
                        key={s.id} 
                        style={{
                          ...cardStyle,
                          animation: `fadeInUp 0.4s cubic-bezier(0.4, 0, 0.2, 1) ${index * 0.1}s both`,
                        }}
                        onMouseEnter={(e) => {
                          e.currentTarget.style.borderColor = `${colors.primary}50`;
                          e.currentTarget.style.boxShadow = `0 0 25px ${colors.primaryGlow}`;
                          e.currentTarget.style.transform = 'translateX(8px)';
                        }}
                        onMouseLeave={(e) => {
                          e.currentTarget.style.borderColor = colors.border;
                          e.currentTarget.style.boxShadow = 'none';
                          e.currentTarget.style.transform = 'translateX(0)';
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
                              transition: 'all 300ms cubic-bezier(0.4, 0, 0.2, 1)',
                              flexShrink: 0,
                              textTransform: 'uppercase',
                            }}
                            onMouseEnter={(e) => {
                              e.currentTarget.style.background = `${colors.error}20`;
                              e.currentTarget.style.boxShadow = `0 0 15px ${colors.error}40`;
                              e.currentTarget.style.transform = 'scale(1.05)';
                            }}
                            onMouseLeave={(e) => {
                              e.currentTarget.style.background = 'transparent';
                              e.currentTarget.style.boxShadow = 'none';
                              e.currentTarget.style.transform = 'scale(1)';
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
                            transition: 'all 300ms cubic-bezier(0.4, 0, 0.2, 1)',
                            textTransform: 'uppercase',
                            letterSpacing: '1px',
                          }}
                          onMouseEnter={(e) => {
                            e.currentTarget.style.background = `${colors.primary}15`;
                            e.currentTarget.style.boxShadow = `0 0 20px ${colors.primaryGlow}`;
                            e.currentTarget.style.transform = 'scale(1.05)';
                          }}
                          onMouseLeave={(e) => {
                            e.currentTarget.style.background = 'transparent';
                            e.currentTarget.style.boxShadow = 'none';
                            e.currentTarget.style.transform = 'scale(1)';
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
                animation: isTransitioning ? 'fadeOutUp 0.2s ease-out forwards' : 'fadeInUp 0.4s cubic-bezier(0.4, 0, 0.2, 1)',
              }}>
                <p style={{ 
                  marginBottom: '24px', 
                  color: colors.textSecondary, 
                  textAlign: 'center',
                  fontSize: '0.9rem',
                  lineHeight: '1.6',
                  animation: 'pulse 2s ease-in-out infinite',
                }}>
                  {'> Descarga audio de YouTube en formato MP3'}
                  <span style={{ animation: 'blink 1s infinite' }}>_</span>
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
                    animation: 'shakeAndFadeIn 0.5s cubic-bezier(0.36, 0.07, 0.19, 0.97)',
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
                    animation: 'successPop 0.5s cubic-bezier(0.4, 0, 0.2, 1)',
                    textShadow: `0 0 10px ${colors.primaryGlow}`,
                  }}>
                    {audioSuccess}
                  </div>
                )}

                {audioLoading && (
                  <div style={{
                    padding: '24px 20px',
                    borderRadius: '8px',
                    background: `${colors.primary}08`,
                    border: `1px solid ${colors.primary}30`,
                    marginBottom: '20px',
                    textAlign: 'center',
                  }}>
                    {/* Circular loader */}
                    <div style={{
                      width: '50px',
                      height: '50px',
                      margin: '0 auto 16px auto',
                      position: 'relative',
                    }}>
                      <div style={{
                        position: 'absolute',
                        width: '100%',
                        height: '100%',
                        border: `3px solid ${colors.border}`,
                        borderRadius: '50%',
                      }} />
                      <div style={{
                        position: 'absolute',
                        width: '100%',
                        height: '100%',
                        border: `3px solid transparent`,
                        borderTopColor: colors.primary,
                        borderRadius: '50%',
                        animation: 'spin 1s linear infinite',
                        boxShadow: `0 0 15px ${colors.primaryGlow}`,
                      }} />
                      <div style={{
                        position: 'absolute',
                        top: '50%',
                        left: '50%',
                        transform: 'translate(-50%, -50%)',
                        color: colors.primary,
                        fontSize: '1rem',
                        animation: 'pulse 1s ease-in-out infinite',
                      }}>
                        ↓
                      </div>
                    </div>
                    
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
                  <div style={{ animation: 'fadeInUp 0.4s cubic-bezier(0.4, 0, 0.2, 1) 0.1s both' }}>
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
                          e.currentTarget.style.boxShadow = `0 0 20px ${colors.primaryGlow}`;
                          e.currentTarget.style.transform = 'scale(1.01)';
                        }
                      }}
                      onBlur={(e) => {
                        if (!audioURLError) {
                          e.currentTarget.style.borderColor = colors.border;
                          e.currentTarget.style.boxShadow = 'none';
                          e.currentTarget.style.transform = 'scale(1)';
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
                        animation: 'fadeInUp 0.3s ease-out',
                      }}>
                        {`[ERROR] ${audioURLError}`}
                      </p>
                    )}
                  </div>

                  <div style={{ animation: 'fadeInUp 0.4s cubic-bezier(0.4, 0, 0.2, 1) 0.2s both' }}>
                    <button
                      type="submit"
                      disabled={audioLoading || !audioURL}
                      style={audioLoading || !audioURL ? buttonDisabledStyle : buttonPrimaryStyle}
                      onMouseEnter={(e) => {
                        if (!audioLoading && audioURL) {
                          e.currentTarget.style.background = `${colors.primary}20`;
                          e.currentTarget.style.boxShadow = `0 0 40px ${colors.primaryGlow}, inset 0 0 40px rgba(0, 255, 65, 0.2)`;
                          e.currentTarget.style.transform = 'translateY(-3px) scale(1.02)';
                        }
                      }}
                      onMouseLeave={(e) => {
                        if (!audioLoading && audioURL) {
                          e.currentTarget.style.background = 'transparent';
                          e.currentTarget.style.boxShadow = `0 0 20px ${colors.primaryGlow}, inset 0 0 20px rgba(0, 255, 65, 0.1)`;
                          e.currentTarget.style.transform = 'translateY(0) scale(1)';
                        }
                      }}
                    >
                      {audioLoading ? '> Descargando...' : '> Descargar MP3'}
                    </button>
                  </div>
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
                  animation: 'fadeInUp 0.4s cubic-bezier(0.4, 0, 0.2, 1) 0.3s both',
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
          </div>

          <style>{`
            @keyframes spin {
              to { transform: rotate(360deg); }
            }
            
            @keyframes containerEntry {
              from {
                opacity: 0;
                transform: translateY(30px) scale(0.95);
              }
              to {
                opacity: 1;
                transform: translateY(0) scale(1);
              }
            }
            
            @keyframes fadeInUp {
              from {
                opacity: 0;
                transform: translateY(20px);
              }
              to {
                opacity: 1;
                transform: translateY(0);
              }
            }
            
            @keyframes fadeOutUp {
              from {
                opacity: 1;
                transform: translateY(0);
              }
              to {
                opacity: 0;
                transform: translateY(-20px);
              }
            }
            
            @keyframes slideDown {
              from {
                opacity: 0;
                transform: translateY(-20px);
              }
              to {
                opacity: 1;
                transform: translateY(0);
              }
            }
            
            @keyframes blink {
              0%, 50% { opacity: 1; }
              51%, 100% { opacity: 0; }
            }
            
            @keyframes glitch {
              0%, 90%, 100% {
                text-shadow: 0 0 20px ${colors.primaryGlow};
              }
              92% {
                text-shadow: -2px 0 ${colors.error}, 2px 0 ${colors.info}, 0 0 20px ${colors.primaryGlow};
              }
              94% {
                text-shadow: 2px 0 ${colors.error}, -2px 0 ${colors.info}, 0 0 20px ${colors.primaryGlow};
              }
              96% {
                text-shadow: 0 0 20px ${colors.primaryGlow};
              }
              98% {
                text-shadow: -1px 0 ${colors.info}, 1px 0 ${colors.error}, 0 0 20px ${colors.primaryGlow};
              }
            }
            
            @keyframes typewriter {
              from { width: 0; }
              to { width: 100%; }
            }
            
            @keyframes shake {
              0%, 100% { transform: translateX(0); }
              10%, 30%, 50%, 70%, 90% { transform: translateX(-4px); }
              20%, 40%, 60%, 80% { transform: translateX(4px); }
            }
            
            @keyframes shakeAndFadeIn {
              0% { 
                opacity: 0;
                transform: translateX(-10px);
              }
              20% { transform: translateX(8px); }
              40% { transform: translateX(-6px); }
              60% { transform: translateX(4px); }
              80% { transform: translateX(-2px); }
              100% { 
                opacity: 1;
                transform: translateX(0);
              }
            }
            
            @keyframes pulse {
              0%, 100% { opacity: 1; }
              50% { opacity: 0.7; }
            }
            
            @keyframes pulseGlow {
              0%, 100% { 
                box-shadow: 0 0 20px ${colors.primaryGlow};
              }
              50% { 
                box-shadow: 0 0 40px ${colors.primaryGlow}, 0 0 60px rgba(0, 255, 65, 0.2);
              }
            }
            
            @keyframes textGlow {
              0%, 100% { 
                text-shadow: 0 0 10px ${colors.primaryGlow};
              }
              50% { 
                text-shadow: 0 0 20px ${colors.primaryGlow}, 0 0 30px ${colors.primary};
              }
            }
            
            @keyframes matrixBar {
              0%, 100% { 
                height: 8px;
                opacity: 0.5;
              }
              50% { 
                height: 24px;
                opacity: 1;
              }
            }
            
            @keyframes bounce {
              0%, 100% { transform: translateY(0); }
              50% { transform: translateY(-8px); }
            }
            
            @keyframes successPop {
              0% {
                opacity: 0;
                transform: scale(0.8);
              }
              50% {
                transform: scale(1.05);
              }
              100% {
                opacity: 1;
                transform: scale(1);
              }
            }
            
            @keyframes dropdownOpen {
              from {
                opacity: 0;
                transform: translateY(-10px) scale(0.95);
              }
              to {
                opacity: 1;
                transform: translateY(0) scale(1);
              }
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
    </>
  );
}