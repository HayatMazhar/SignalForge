import api from './client';
import type { TradeThesis, FearGreed, MarketPulseEvent, SmartMoneyFlow } from '../types';

export const insightsApi = {
  getThesis: (symbol: string) => api.get<TradeThesis>(`/insights/thesis/${symbol}`).then(r => r.data),
  getFearGreed: () => api.get<FearGreed>('/insights/fear-greed').then(r => r.data),
  getMarketPulse: () => api.get<MarketPulseEvent[]>('/insights/market-pulse').then(r => r.data),
  getSmartMoney: () => api.get<SmartMoneyFlow[]>('/insights/smart-money').then(r => r.data),
};
