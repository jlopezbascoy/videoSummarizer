import React, { useState } from 'react';
import Antigravity from './components/AnimatedBackground';
import Login from './components/Login';

function App() {
  const [creds, setCreds] = useState({ username: '', password: '' });

  const handleLogin = ({ username, password }) => {
    // verification will be implemented later
    setCreds({ username, password });
  };

  const isLogged = Boolean(creds.username && creds.password);

  return (
    <div style={{ width: '100vw', height: '100vh', position: 'relative' }}>
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

      {!isLogged && <Login onLogin={handleLogin} />}
    </div>
  );
}

export default App;
