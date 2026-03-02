import api from './client';
import type { Signal } from '../types';

export const signalsApi = {
  getSignals: (type?: string, limit = 50) =>
    api.get<Signal[]>('/signals', { params: { type, limit } }).then(r => r.data),
  generateSignal: (symbol: string) =>
    api.post<Signal>('/signals/generate', { symbol }).then(r => r.data),
  getWatchlistSignals: () => api.get<Signal[]>('/signals/watchlist').then(r => r.data),
};
