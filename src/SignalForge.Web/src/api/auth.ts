import api from './client';
import type { AuthResponse } from '../types';

export const authApi = {
  register: (email: string, password: string, fullName: string) =>
    api.post<AuthResponse>('/auth/register', { email, password, fullName }).then(r => r.data),
  login: (email: string, password: string) =>
    api.post<AuthResponse>('/auth/login', { email, password }).then(r => r.data),
  refresh: (token: string, refreshToken: string) =>
    api.post<AuthResponse>('/auth/refresh', { token, refreshToken }).then(r => r.data),
  logout: () => api.post('/auth/logout'),
  me: () => api.get('/auth/me').then(r => r.data),
};
