import api from './client';
import type { Stock, StockQuote, OhlcBar, TopMover, TechnicalData } from '../types';

export const stocksApi = {
  search: (q: string) => api.get<Stock[]>('/stocks/search', { params: { q } }).then(r => r.data),
  getStock: (symbol: string) => api.get<Stock>(`/stocks/${symbol}`).then(r => r.data),
  getQuote: (symbol: string) => api.get<StockQuote>(`/stocks/${symbol}/quote`).then(r => r.data),
  getHistory: (symbol: string, from: string, to: string) =>
    api.get<OhlcBar[]>(`/stocks/${symbol}/history`, { params: { from, to } }).then(r => r.data),
  getTopMovers: () => api.get<TopMover[]>('/stocks/top-movers').then(r => r.data),
  getTopLosers: () => api.get<TopMover[]>('/stocks/movers/losers').then(r => r.data),
  getIndicators: (symbol: string) => api.get<TechnicalData>(`/stocks/${symbol}/indicators`).then(r => r.data),
};
