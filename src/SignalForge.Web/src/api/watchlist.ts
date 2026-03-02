import api from './client';
import type { WatchlistItem } from '../types';

export const watchlistApi = {
  get: () => api.get<WatchlistItem[]>('/watchlist').then(r => r.data),
  add: (symbol: string) => api.post<WatchlistItem>('/watchlist', { symbol }).then(r => r.data),
  remove: (symbol: string) => api.delete(`/watchlist/${symbol}`),
};
