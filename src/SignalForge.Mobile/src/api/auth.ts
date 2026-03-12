import api from './client';

export interface AuthResponse {
  token: string;
  refreshToken: string;
  expiration: string;
  user: { id: string; email: string; fullName: string };
}

export const authApi = {
  login: (email: string, password: string) =>
    api.post<AuthResponse>('/auth/login', { email, password }).then(r => r.data),
  register: (email: string, password: string, fullName: string) =>
    api.post<AuthResponse>('/auth/register', { email, password, fullName }).then(r => r.data),
  me: () => api.get('/auth/me').then(r => r.data),
};
