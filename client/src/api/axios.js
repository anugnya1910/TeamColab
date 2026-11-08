import axios from 'axios';

export const TOKEN_KEY = 'ts_token';

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || '/api',
  timeout: 15000,
});

// Attach the JWT to every request
api.interceptors.request.use((config) => {
  const token = localStorage.getItem(TOKEN_KEY);
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

// Log out automatically when the token is rejected
api.interceptors.response.use(
  (res) => res,
  (err) => {
    const url = err.config?.url || '';
    if (err.response?.status === 401 && !/\/auth\/(login|register|password)/.test(url)) {
      localStorage.removeItem(TOKEN_KEY);
      if (!window.location.pathname.startsWith('/login')) window.location.href = '/login';
    }
    return Promise.reject(err);
  }
);

export const errMsg = (e, fallback = 'Something went wrong') => {
  if (e?.response?.data?.message) return e.response.data.message;
  if (e?.code === 'ERR_NETWORK' || e?.response?.status === 502 || e?.response?.status === 504) {
    return 'Cannot reach the server. Is the backend running on port 5000?';
  }
  return fallback;
};

export default api;
