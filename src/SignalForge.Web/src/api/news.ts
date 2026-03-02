import api from './client';
import type { NewsArticle } from '../types';

export const newsApi = {
  getNews: (symbol: string, limit = 10) =>
    api.get<NewsArticle[]>(`/news/${symbol}`, { params: { limit } }).then(r => r.data),
  getMarketNews: (limit = 20) =>
    api.get<NewsArticle[]>('/news/market', { params: { limit } }).then(r => r.data),
};
