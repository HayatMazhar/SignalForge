import api from './client';
import type { Alert } from '../types';

export const alertsApi = {
  get: () => api.get<Alert[]>('/alerts').then(r => r.data),
  create: (symbol: string, alertType: number, targetValue: number) =>
    api.post<Alert>('/alerts', { symbol, alertType, targetValue }).then(r => r.data),
  delete: (id: string) => api.delete(`/alerts/${id}`),
};
