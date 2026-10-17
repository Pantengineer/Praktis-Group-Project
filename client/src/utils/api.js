import axios from 'axios';

const getApiBaseUrl = () => {
  const envUrl = import.meta.env.VITE_API_URL;
  if (typeof window !== 'undefined') {
    const hostname = window.location.hostname;
    // When accessed through production domain or non-localhost, route to production API
    if (hostname !== 'localhost' && hostname !== '127.0.0.1') {
      if (!envUrl || envUrl.includes('localhost') || envUrl.includes('127.0.0.1')) {
        return 'https://api.praktis-project.site';
      }
    }
  }
  return envUrl || (typeof window !== 'undefined' ? window.location.origin : 'http://localhost:5001');
};

const API_BASE_URL = getApiBaseUrl();

const api = axios.create({
  baseURL: API_BASE_URL,
  withCredentials: true, // 2.1: Send HttpOnly cookies with every request
});

// Request interceptor: attach Authorization header from localStorage (backward compat)
// Once fully migrated to cookie-only auth, this interceptor can be removed.
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Response interceptor: if the server returns 401, clear stale local state.
// The user will be redirected to login by the PrivateRoute / authContext.
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('token');
      localStorage.removeItem('user');
    }
    return Promise.reject(error);
  }
);

export default api;