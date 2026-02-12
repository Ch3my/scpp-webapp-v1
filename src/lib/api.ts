import axios from 'axios';
import { useAppState } from '@/AppState';

// Create axios instance
const api = axios.create({
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor middleware - automatically attaches Bearer token
api.interceptors.request.use((config) => {
  const { sessionId, apiPrefix } = useAppState.getState();

  // Set base URL dynamically (user-configurable)
  config.baseURL = apiPrefix;

  // Attach Authorization header if session exists
  if (sessionId) {
    config.headers.Authorization = `Bearer ${sessionId}`;
  }

  return config;
});

// Response interceptor - handle 401 errors globally
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      const { setLoggedIn, setSessionId } = useAppState.getState();
      setLoggedIn(false);
      setSessionId('');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

export default api;
