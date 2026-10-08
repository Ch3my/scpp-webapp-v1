import axios from 'axios';
import { useAppState } from '@/AppState';
import { clearPersistedCache } from './persist';

/**
 * Shared axios instance. Ported from scpp-app-v2/api/axiosClient.ts, keeping
 * this app's runtime-configurable baseURL instead of a hardcoded host.
 *
 * Deliberately free of routing imports: the 401 redirect is injected by the
 * app entry point so this module stays portable.
 */
const api = axios.create({
  headers: {
    'Content-Type': 'application/json',
  },
});

let onUnauthorized: (() => void) | null = null;

/** Wired up once in main.tsx. */
export function setUnauthorizedHandler(handler: () => void) {
  onUnauthorized = handler;
}

api.interceptors.request.use((config) => {
  const { sessionId, apiPrefix } = useAppState.getState();

  config.baseURL = apiPrefix;

  // /login is the one endpoint that runs before a session exists
  if (sessionId && config.url !== '/login') {
    config.headers.Authorization = `Bearer ${sessionId}`;
  }

  return config;
});

api.interceptors.response.use(
  (response) => {
    // The API has two failure channels: a non-2xx status (axios throws on its
    // own) and a 200 carrying { hasErrors, errorDescription }. Normalise the
    // second into a throw so callers only handle one.
    const data = response.data;
    if (data && typeof data === 'object' && data.hasErrors) {
      const description = Array.isArray(data.errorDescription)
        ? data.errorDescription[0]
        : undefined;
      throw new Error(description ?? 'Error desconocido');
    }
    return response;
  },
  (error) => {
    if (error.response?.status === 401) {
      const { setLoggedIn, setSessionId } = useAppState.getState();
      setLoggedIn(false);
      setSessionId('');
      // The session is gone, so the data cached under it must go too.
      clearPersistedCache();
      if (onUnauthorized) {
        onUnauthorized();
      } else {
        window.location.href = '/login';
      }
    }
    return Promise.reject(error);
  }
);

export default api;
