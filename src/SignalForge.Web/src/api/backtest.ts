import api from './client';

export interface BacktestRequest {
  symbol: string;
  strategy: string;
  initialCapital: number;
  lookbackDays: number;
  stopLossPercent: number;
  takeProfitPercent: number;
}

export interface BacktestResult {
  symbol: string;
  strategy: string;
  initialCapital: number;
  finalCapital: number;
  totalReturn: number;
  totalReturnPercent: number;
  totalTrades: number;
  winningTrades: number;
  losingTrades: number;
  winRate: number;
  maxDrawdown: number;
  sharpeRatio: number;
  profitFactor: number;
  trades: BacktestTrade[];
  equityCurve: EquityPoint[];
}

export interface BacktestTrade {
  type: string;
  entryPrice: number;
  exitPrice: number;
  pnL: number;
  pnLPercent: number;
  entryDate: string;
  exitDate: string;
  reason: string;
}

export interface EquityPoint {
  date: string;
  equity: number;
  drawdownPercent: number;
}

export interface Strategy {
  id: string;
  name: string;
  description: string;
  defaultParams: { stopLoss: number; takeProfit: number };
}

export interface LeaderboardEntry {
  userId: string;
  userName: string;
  avatar: string;
  totalSignals: number;
  winningSignals: number;
  winRate: number;
  avgConfidence: number;
  totalReturn: number;
  followers: number;
  rank: number;
}

export interface ChatResponse {
  response: string;
  symbol?: string;
  suggestedActions?: string[];
}

export const backtestApi = {
  run: (req: BacktestRequest) => api.post<BacktestResult>('/backtest', req).then(r => r.data),
  getStrategies: () => api.get<Strategy[]>('/backtest/strategies').then(r => r.data),
};

export const chatApi = {
  send: (message: string, symbol?: string, history?: { role: string; content: string }[]) =>
    api.post<ChatResponse>('/chat', { message, symbol, history }).then(r => r.data),
};

export const socialApi = {
  getLeaderboard: () => api.get<LeaderboardEntry[]>('/social/leaderboard').then(r => r.data),
};

export const compareApi = {
  compare: (symbols: string[]) => api.get(`/compare?symbols=${symbols.join(',')}`).then(r => r.data),
};
