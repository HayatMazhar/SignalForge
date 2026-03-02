import api from './client';
import type { OptionsFlow } from '../types';

export const optionsApi = {
  getUnusualFlow: () => api.get<OptionsFlow[]>('/options/unusual').then(r => r.data),
  getSymbolFlow: (symbol: string) => api.get<OptionsFlow[]>(`/options/${symbol}`).then(r => r.data),
};
