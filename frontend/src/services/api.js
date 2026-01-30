import axios from 'axios';

// Configuración base de axios
const API_BASE_URL = 'http://localhost:8080/api';

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Interceptor para incluir el token JWT en todas las peticiones
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Interceptor para manejar errores de autenticación
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      // Token inválido o expirado
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      window.location.href = '/';
    }
    return Promise.reject(error);
  }
);

// ==========================================
// AUTH ENDPOINTS
// ==========================================

/**
 * Registra un nuevo usuario
 * @param {Object} data - { username, email, password }
 * @returns {Promise} - { token, userId, username, email, userType, dailyLimit, maxVideoDuration }
 */
export const register = async (data) => {
  const response = await api.post('/auth/register', data);
  return response.data;
};

/**
 * Inicia sesión
 * @param {Object} data - { username, password }
 * @returns {Promise} - { token, userId, username, email, userType, dailyLimit, maxVideoDuration }
 */
export const login = async (data) => {
  const response = await api.post('/auth/login', data);
  return response.data;
};

/**
 * Obtiene información del usuario autenticado
 * @returns {Promise} - { id, username, email, userType, dailyLimit, maxVideoDuration, createdAt }
 */
export const getCurrentUser = async () => {
  const response = await api.get('/auth/me');
  return response.data;
};

/**
 * Verifica si el token es válido
 * @returns {Promise} - { authenticated, username }
 */
export const checkAuth = async () => {
  const response = await api.get('/auth/check');
  return response.data;
};

// ==========================================
// SUMMARY ENDPOINTS
// ==========================================

/**
 * Genera un resumen de un video de YouTube
 * @param {Object} data - { videoUrl, language, wordCountRange }
 * @returns {Promise} - { id, videoUrl, videoTitle, summaryText, language, wordCount, videoDurationSeconds, createdAt, remainingRequests }
 */
export const generateSummary = async (data) => {
  const response = await api.post('/summaries/generate', data);
  return response.data;
};

/**
 * Obtiene el historial completo de resúmenes del usuario
 * @returns {Promise} - Array de resúmenes
 */
export const getSummaryHistory = async () => {
  const response = await api.get('/summaries/history');
  return response.data;
};

/**
 * Obtiene los últimos N resúmenes
 * @param {number} limit - Número de resúmenes a obtener (default: 10)
 * @returns {Promise} - Array de resúmenes
 */
export const getRecentSummaries = async (limit = 10) => {
  const response = await api.get(`/summaries/recent?limit=${limit}`);
  return response.data;
};

/**
 * Obtiene un resumen específico por ID
 * @param {number} id - ID del resumen
 * @returns {Promise} - Resumen
 */
export const getSummaryById = async (id) => {
  const response = await api.get(`/summaries/${id}`);
  return response.data;
};

/**
 * Elimina un resumen
 * @param {number} id - ID del resumen
 * @returns {Promise} - { message }
 */
export const deleteSummary = async (id) => {
  const response = await api.delete(`/summaries/${id}`);
  return response.data;
};

/**
 * Obtiene estadísticas del usuario
 * @returns {Promise} - { totalSummaries, remainingRequests, todayUsage, dailyLimit, userType }
 */
export const getUserStats = async () => {
  const response = await api.get('/summaries/stats');
  return response.data;
};

// ==========================================
// USER ENDPOINTS
// ==========================================

/**
 * Obtiene el perfil completo del usuario
 * @returns {Promise} - Perfil completo con información de uso
 */
export const getUserProfile = async () => {
  const response = await api.get('/users/profile');
  return response.data;
};

/**
 * Obtiene información sobre límites del usuario
 * @returns {Promise} - { userType, dailyLimit, maxVideoDurationSeconds, remainingRequests, todayUsage, hasReachedLimit }
 */
export const getUserLimits = async () => {
  const response = await api.get('/users/limits');
  return response.data;
};

/**
 * Actualiza el tipo de usuario (solo para testing)
 * @param {string} type - 'FREE', 'PREMIUM', o 'VIP'
 * @returns {Promise} - { message, newType, dailyLimit, maxVideoDuration }
 */
export const upgradeUserType = async (type) => {
  const response = await api.put(`/users/upgrade?type=${type}`);
  return response.data;
};

// ==========================================
// UTILITY FUNCTIONS
// ==========================================

/**
 * Guarda el token y datos de usuario en localStorage
 * @param {string} token - JWT token
 * @param {Object} user - Datos del usuario
 */
export const saveAuthData = (token, user) => {
  localStorage.setItem('token', token);
  localStorage.setItem('user', JSON.stringify(user));
};

/**
 * Elimina los datos de autenticación de localStorage
 */
export const clearAuthData = () => {
  localStorage.removeItem('token');
  localStorage.removeItem('user');
};

/**
 * Obtiene el token guardado
 * @returns {string|null} - Token o null
 */
export const getStoredToken = () => {
  return localStorage.getItem('token');
};

/**
 * Obtiene el usuario guardado
 * @returns {Object|null} - Usuario o null
 */
export const getStoredUser = () => {
  const user = localStorage.getItem('user');
  return user ? JSON.parse(user) : null;
};

export default api;