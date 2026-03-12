import api from './client';

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
  publishedAt: string; sentimentScore: number; summary: string;
}

export const stocksApi = {
  search: (q: string) => api.get<Stock[]>('/stocks/search', { params: { q } }).then(r => r.data),
  getQuote: (symbol: string) => api.get<StockQuote>(`/stocks/${symbol}/quote`).then(r => r.data),
  getTopMovers: () => api.get<TopMover[]>('/stocks/top-movers').then(r => r.data),
  getIndicators: (symbol: string) => api.get(`/stocks/${symbol}/indicators`).then(r => r.data),
};

export const signalsApi = {
  getSignals: (type?: string, limit = 50) =>
    api.get<Signal[]>('/signals', { params: { type, limit } }).then(r => r.data),
  generateSignal: (symbol: string) =>
    api.post<Signal>('/signals/generate', { symbol }).then(r => r.data),
};

export const newsApi = {
  getMarketNews: (limit = 20) => api.get<NewsArticle[]>('/news/market', { params: { limit } }).then(r => r.data),
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
