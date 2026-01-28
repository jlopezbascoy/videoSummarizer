import React, { useState } from 'react';
import Antigravity from './components/AnimatedBackground';
import Login from './components/Login';
import Register from './components/Register';
import MainPage from './components/MainPage';
// hola mudno
function App() {
  const [creds, setCreds] = useState({ username: '', password: '' });
  const [isRegistering, setIsRegistering] = useState(false);

  const handleLogin = ({ username, password }) => {
    setCreds({ username, password });
  };

  const handleRegister = ({ username, email, password }) => {
    console.log('Registro:', { username, email, password });
    setIsRegistering(false);
    setCreds({ username, password });
  };

  const handleLogout = () => {
    setCreds({ username: '', password: '' });
    setIsRegistering(false);
  };

  const isLogged = Boolean(creds.username && creds.password);

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
      {!isLogged && !isRegistering && (
        <Login
          onLogin={handleLogin}
          onRegister={() => setIsRegistering(true)}
        />
      )}

      {!isLogged && isRegistering && (
        <Register
          onRegister={handleRegister}
          onBack={() => setIsRegistering(false)}
        />
      )}

      {/* Página principal */}
      {isLogged && (
        <MainPage onLogout={handleLogout} />
      )}
    </div>
  );
}

export default App;
