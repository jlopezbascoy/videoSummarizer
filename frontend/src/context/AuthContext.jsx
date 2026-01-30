import React, { createContext, useContext, useState, useEffect } from 'react';
import { login as apiLogin, register as apiRegister, getCurrentUser, saveAuthData, clearAuthData, getStoredToken, getStoredUser } from '../services/api';

const AuthContext = createContext(null);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth debe ser usado dentro de AuthProvider');
  }
  return context;
};

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  // Inicializar autenticación desde localStorage
  useEffect(() => {
    const initAuth = async () => {
      const storedToken = getStoredToken();
      const storedUser = getStoredUser();

      if (storedToken && storedUser) {
        setToken(storedToken);
        setUser(storedUser);
        setIsAuthenticated(true);

        // Verificar que el token sigue siendo válido
        try {
          const currentUser = await getCurrentUser();
          setUser(currentUser);
        } catch (error) {
          console.error('Token inválido, cerrando sesión:', error);
          logout();
        }
      }

      setLoading(false);
    };

    initAuth();
  }, []);

  /**
   * Inicia sesión
   */
  const login = async (credentials) => {
    try {
      const response = await apiLogin(credentials);
      
      const { token: newToken, ...userData } = response;
      
      setToken(newToken);
      setUser(userData);
      setIsAuthenticated(true);
      
      saveAuthData(newToken, userData);
      
      return { success: true, data: response };
    } catch (error) {
      console.error('Error en login:', error);
      return {
        success: false,
        error: error.response?.data?.error || 'Error al iniciar sesión'
      };
    }
  };

  /**
   * Registra un nuevo usuario
   */
  const register = async (userData) => {
    try {
      const response = await apiRegister(userData);
      
      const { token: newToken, ...userInfo } = response;
      
      setToken(newToken);
      setUser(userInfo);
      setIsAuthenticated(true);
      
      saveAuthData(newToken, userInfo);
      
      return { success: true, data: response };
    } catch (error) {
      console.error('Error en registro:', error);
      return {
        success: false,
        error: error.response?.data?.error || 'Error al registrar usuario'
      };
    }
  };

  /**
   * Cierra sesión
   */
  const logout = () => {
    setToken(null);
    setUser(null);
    setIsAuthenticated(false);
    clearAuthData();
  };

  /**
   * Actualiza los datos del usuario
   */
  const updateUser = (newUserData) => {
    setUser(prev => ({ ...prev, ...newUserData }));
    const storedUser = getStoredUser();
    if (storedUser) {
      saveAuthData(token, { ...storedUser, ...newUserData });
    }
  };

  const value = {
    user,
    token,
    loading,
    isAuthenticated,
    login,
    register,
    logout,
    updateUser,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export default AuthContext;