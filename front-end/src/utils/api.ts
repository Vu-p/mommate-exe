import axios from 'axios';

// Determine API base URL:
// - Prefer explicit env `VITE_API_BASE` (set to production backend URL on Vercel)
// - If running on localhost and no env override, fall back to local API
// - Otherwise default to same-origin `/api` (works when frontend and backend are deployed together)
const resolveBaseURL = () => {
  const envBase = import.meta.env.VITE_API_BASE?.trim();

  if (envBase) return envBase;

  const isBrowser = typeof window !== 'undefined';
  const isLocalHost = isBrowser && window.location.hostname === 'localhost';

  if (isLocalHost) return 'http://localhost:5000/api';

  return isBrowser ? `${window.location.origin}/api` : 'http://localhost:5000/api';
};

const api = axios.create({
  baseURL: resolveBaseURL(),
  headers: {
    'Content-Type': 'application/json',
  },
});

// Add a request interceptor to include the auth token in headers
api.interceptors.request.use(
  (config) => {
    const userInfo = localStorage.getItem('userInfo');
    if (userInfo) {
      const { token } = JSON.parse(userInfo);
      if (token) {
        config.headers.Authorization = `Bearer ${token}`;
      }
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

export default api;
