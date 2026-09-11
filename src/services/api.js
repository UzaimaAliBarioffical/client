import axios from 'axios';
import { normalizeApiOrigin, resolveApiUrl } from './apiConfig';

export const API_ORIGIN = normalizeApiOrigin(import.meta.env.VITE_API_URL);
export const apiUrl = (path) => resolveApiUrl(API_ORIGIN, path);
export const getSessionToken = () => {
  try { return sessionStorage.getItem('qissaghar.token'); } catch { return null; }
};
export const setSessionToken = (token) => {
  try {
    if (token) sessionStorage.setItem('qissaghar.token', token);
    else sessionStorage.removeItem('qissaghar.token');
    localStorage.removeItem('token');
    localStorage.removeItem('user');
  } catch { /* Cookie sessions still work without browser storage. */ }
};
export const getAuthHeaders = () => {
  const token = getSessionToken();
  return token ? { Authorization: 'Bearer ' + token } : {};
};
const api = axios.create({ baseURL: API_ORIGIN, withCredentials: true, timeout: 20000 });
api.interceptors.request.use((config) => {
  Object.assign(config.headers, getAuthHeaders());
  if (!['get', 'head', 'options'].includes(config.method?.toLowerCase())) {
    config.headers['X-QissaGhar-Request'] = '1';
  }
  return config;
});
api.interceptors.response.use((response) => {
  if (response.config.responseType !== 'blob' &&
      (!response.data || typeof response.data !== 'object')) {
    const error = new Error('The story service is temporarily unavailable. Please try again shortly.');
    error.response = { status: 502, data: { message: error.message } };
    return Promise.reject(error);
  }
  return response;
}, (error) => {
  const url = error.config?.url || '';
  if (error.response?.status === 401 && !['/api/auth/login', '/api/auth/register'].includes(url)) {
    setSessionToken(null);
    window.dispatchEvent(new Event('qissaghar:session-expired'));
  }
  return Promise.reject(error);
});
export default api;
