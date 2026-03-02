import api from './client';
import type { PortfolioPosition } from '../types';

export const portfolioApi = {
  get: () => api.get<PortfolioPosition[]>('/portfolio').then(r => r.data),
  addPosition: (symbol: string, quantity: number, averageCost: number) =>
    api.post<PortfolioPosition>('/portfolio', { symbol, quantity, averageCost }).then(r => r.data),
  removePosition: (id: string) => api.delete(`/portfolio/${id}`),
};
