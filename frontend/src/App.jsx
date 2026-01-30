import React, { useState } from 'react';
import { AuthProvider } from './context/AuthContext';
import Antigravity from './components/AnimatedBackground';
import Login from './components/Login';
import Register from './components/Register';
import MainPage from './components/MainPage';
import { useAuth } from './context/AuthContext';

function AppContent() {
  const { isAuthenticated, loading } = useAuth();
  const [isRegistering, setIsRegistering] = useState(false);

  // Mostrar loading mientras se verifica autenticación
  if (loading) {
    return (
      <div style={{ 
        width: '100vw', 
        height: '100vh', 
        display: 'flex', 
        alignItems: 'center', 
        justifyContent: 'center',
        background: '#0a0e1a'
      }}>
        <div style={{ color: 'white', fontSize: '1.2rem' }}>Cargando...</div>
      </div>
    );
  }

  return (
    <div style={{ width: '100vw', height: '100vh', position: 'relative' }}>
      {/* Fondo animado siempre activo */}
      <Antigravity
        count={300}
        magnetRadius={6}
        ringRadius={7}
        waveSpeed={0.4}
        waveAmplitude={1}
        particleSize={1.5}
        lerpSpeed={0.05}
        color="#5227FF"
        autoAnimate
        particleVariance={1}
        rotationSpeed={0}
        depthFactor={1}
        pulseSpeed={3}
        particleShape="capsule"
        fieldStrength={10}
      />

      {/* Login / Registro */}
      {!isAuthenticated && !isRegistering && (
        <Login onRegister={() => setIsRegistering(true)} />
      )}

      {!isAuthenticated && isRegistering && (
        <Register onBack={() => setIsRegistering(false)} />
      )}

      {/* Página principal */}
      {isAuthenticated && <MainPage />}
    </div>
  );
}

function App() {
  return (
    <AuthProvider>
      <AppContent />
    </AuthProvider>
  );
}

export default App;