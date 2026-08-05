import axios from 'axios';
import { useAuthStore } from '../store/authStore';

const isHttps = window.location.protocol === 'https:';
const apiBaseUrl = isHttps 
  ? `${window.location.origin}/api`
  : `http://${window.location.hostname}:5011/api`;

const api = axios.create({
  baseURL: apiBaseUrl,
});

// Interceptor para injetar o token em todas as requisições
api.interceptors.request.use((config) => {
  const token = useAuthStore.getState().token;
  // Só injeta se a requisição já não tiver um Authorization setado manualmente
  if (token && !config.headers.Authorization && !config.headers.authorization) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Interceptor para deslogar em caso de token expirado
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      const url = error.config?.url || '';
      if (!url.endsWith('/proxy')) {
        useAuthStore.getState().logout();
      }
    }
    return Promise.reject(error);
  }
);

export const getAssetUrl = (path?: string | null) => {
  if (!path) return '';
  if (path.startsWith('http')) return path;
  const cleanPath = path.startsWith('/') ? path : `/${path}`;
  if (isHttps) {
    return `${window.location.origin}${cleanPath}`;
  }
  return `http://${window.location.hostname}:5011${cleanPath}`;
};

export default api;
