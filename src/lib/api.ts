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

export default api;
