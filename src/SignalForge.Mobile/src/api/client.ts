import axios from 'axios';
import { useAuthStore } from '../stores/authStore';
import { API_BASE_URL } from '../constants/config';

const api = axios.create({
  baseURL: `${API_BASE_URL}/api`,
  headers: { 'Content-Type': 'application/json' },
  timeout: 90000,
});

api.interceptors.request.use((config) => {
  const token = useAuthStore.getState().token;
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

let isRefreshing = false;

api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;

    if (error.response?.status === 401 && !originalRequest._retry) {
      const { token, refreshToken, setTokens, logout } = useAuthStore.getState();

      if (refreshToken && !isRefreshing) {
        originalRequest._retry = true;
        isRefreshing = true;

        try {
          const res = await axios.post(`${API_BASE_URL}/api/auth/refresh`, {
            token,
            refreshToken,
          });

          const { token: newToken, refreshToken: newRefreshToken } = res.data;
          setTokens(newToken, newRefreshToken);

          originalRequest.headers.Authorization = `Bearer ${newToken}`;
          return api(originalRequest);
        } catch {
          logout();
          return Promise.reject(error);
        } finally {
          isRefreshing = false;
        }
      }

      logout();
    }

    return Promise.reject(error);
  }
);

export default api;
