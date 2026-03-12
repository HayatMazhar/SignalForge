import api from './client';
import { getCached, setCache } from '../hooks/useOfflineCache';

export interface StockQuote {
  symbol: string; price: number; change: number; changePercent: number;
  high: number; low: number; open: number; volume: number; timestamp: string;
}

export interface Signal {
  id: string; symbol: string; type: string; confidenceScore: number;
  reasoning: string; technicalScore: number; sentimentScore: number;
  optionsScore: number; generatedAt: string;
}

export interface Stock {
  id: string; symbol: string; name: string; sector: string; exchange: string;
}

export interface TopMover {
  symbol: string; name: string; price: number; changePercent: number;
}

export interface NewsArticle {
  id: string; symbol: string; title: string; url: string; source: string;
  publishedAt: string; sentimentScore?: number; summary: string;
  sentiment?: string;
}

export const stocksApi = {
  search: (q: string) => api.get<Stock[]>('/stocks/search', { params: { q } }).then(r => r.data),
  getQuote: async (symbol: string) => {
    const cacheKey = `quote-${symbol}`;
    try {
      const data = await api.get<StockQuote>(`/stocks/${symbol}/quote`).then(r => r.data);
      await setCache(cacheKey, data, 60000);
      return data;
    } catch {
      const cached = await getCached<StockQuote>(cacheKey);
      if (cached) return cached;
      throw new Error(`No data for ${symbol}`);
    }
  },
  getTopMovers: async () => {
    const cacheKey = 'top-movers';
    try {
      const data = await api.get<TopMover[]>('/stocks/top-movers').then(r => r.data);
      await setCache(cacheKey, data, 120000);
      return data;
    } catch {
      const cached = await getCached<TopMover[]>(cacheKey);
      if (cached) return cached;
      throw new Error('No movers data');
    }
  },
  getIndicators: (symbol: string) => api.get(`/stocks/${symbol}/indicators`).then(r => r.data),
};

export const signalsApi = {
  getSignals: async (type?: string, limit = 50) => {
    const cacheKey = `signals-${type ?? 'all'}-${limit}`;
    try {
      const data = await api.get<Signal[]>('/signals', { params: { type, limit } }).then(r => r.data);
      await setCache(cacheKey, data, 120000);
      return data;
    } catch {
      const cached = await getCached<Signal[]>(cacheKey);
      if (cached) return cached;
      throw new Error('No signals data');
    }
  },
  generateSignal: (symbol: string) =>
    api.post<Signal>('/signals/generate', { symbol }).then(r => r.data),
};

export const newsApi = {
  getMarketNews: async (limit = 20) => {
    const cacheKey = `market-news-${limit}`;
    try {
      const data = await api.get<NewsArticle[]>('/news/market', { params: { limit } }).then(r => r.data);
      await setCache(cacheKey, data, 300000);
      return data;
    } catch {
      const cached = await getCached<NewsArticle[]>(cacheKey);
      if (cached) return cached;
      throw new Error('No news data');
    }
  },
  getNews: (symbol: string, limit = 10) => api.get<NewsArticle[]>(`/news/${symbol}`, { params: { limit } }).then(r => r.data),
};

export const watchlistApi = {
  get: () => api.get('/watchlist').then(r => r.data),
  add: (symbol: string) => api.post('/watchlist', { symbol }).then(r => r.data),
  remove: (symbol: string) => api.delete(`/watchlist/${symbol}`),
};

export const portfolioApi = {
  get: () => api.get('/portfolio').then(r => r.data),
  addPosition: (symbol: string, quantity: number, averageCost: number) =>
    api.post('/portfolio', { symbol, quantity, averageCost }).then(r => r.data),
  removePosition: (id: string) => api.delete(`/portfolio/${id}`),
};

export const alertsApi = {
  get: () => api.get('/alerts').then(r => r.data),
  create: (symbol: string, alertType: number, targetValue: number) =>
    api.post('/alerts', { symbol, alertType, targetValue }).then(r => r.data),
  delete: (id: string) => api.delete(`/alerts/${id}`),
};

export const insightsApi = {
  getThesis: (symbol: string) => api.get(`/insights/thesis/${symbol}`).then(r => r.data),
  getFearGreed: () => api.get('/insights/fear-greed').then(r => r.data),
  getMarketPulse: () => api.get('/insights/market-pulse').then(r => r.data),
  getSmartMoney: () => api.get('/insights/smart-money').then(r => r.data),
};

export const backtestApi = {
  run: (req: any) => api.post('/backtest', req).then(r => r.data),
  getStrategies: () => api.get('/backtest/strategies').then(r => r.data),
};

export const chatApi = {
  send: (message: string, symbol?: string) =>
    api.post('/chat', { message, symbol }).then(r => r.data),
};

export const socialApi = {
  getLeaderboard: () => api.get('/social/leaderboard').then(r => r.data),
};

export const marketApi = {
  getIndices: () => api.get('/market/indices').then(r => r.data),
  getBreadth: () => api.get('/market/breadth').then(r => r.data),
  getSectors: () => api.get('/market/sectors').then(r => r.data),
  getHeatmap: () => api.get('/market/heatmap').then(r => r.data),
  getCorrelation: (symbols?: string) =>
    api.get('/market/correlation', { params: symbols ? { symbols } : undefined }).then(r => r.data),
};
