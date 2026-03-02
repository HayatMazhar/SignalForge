export interface Stock {
  id: string;
  symbol: string;
  name: string;
  sector: string;
  exchange: string;
  marketCap: number;
  logoUrl?: string;
}

export interface StockQuote {
  symbol: string;
  price: number;
  change: number;
  changePercent: number;
  high: number;
  low: number;
  open: number;
  volume: number;
  timestamp: string;
}

export interface OhlcBar {
  date: string;
  open: number;
  high: number;
  low: number;
  close: number;
  volume: number;
}

export interface Signal {
  id: string;
  symbol: string;
  type: 'Buy' | 'Sell' | 'Hold';
  confidenceScore: number;
  reasoning: string;
  technicalScore: number;
  sentimentScore: number;
  optionsScore: number;
  generatedAt: string;
}

export interface NewsArticle {
  id: string;
  symbol: string;
  title: string;
  url: string;
  source: string;
  publishedAt: string;
  sentimentScore: number;
  summary: string;
}

export interface OptionsFlow {
  id: string;
  symbol: string;
  strike: number;
  expiry: string;
  type: 'Call' | 'Put';
  volume: number;
  openInterest: number;
  impliedVolatility: number;
  premium: number;
  isUnusual: boolean;
  detectedAt: string;
}

export interface WatchlistItem {
  symbol: string;
  addedAt: string;
}

export interface Alert {
  id: string;
  symbol: string;
  alertType: 'Price' | 'Signal' | 'News';
  targetValue: number;
  isActive: boolean;
  createdAt: string;
}

export interface PortfolioPosition {
  id: string;
  symbol: string;
  quantity: number;
  averageCost: number;
  addedAt: string;
}

export interface User {
  id: string;
  email: string;
  fullName: string;
}

export interface AuthResponse {
  token: string;
  refreshToken: string;
  expiration: string;
  user: User;
}

export interface TopMover {
  symbol: string;
  name: string;
  price: number;
  changePercent: number;
}

export interface TradeThesis {
  symbol: string;
  verdict: string;
  confidenceScore: number;
  executiveSummary: string;
  bullCase: string;
  bearCase: string;
  suggestedEntry: number;
  stopLoss: number;
  targetPrice: number;
  riskRewardRatio: number;
  timeHorizon: string;
  keyFactors: ThesisFactor[];
  generatedAt: string;
}

export interface ThesisFactor {
  name: string;
  score: number;
  impact: string;
  detail: string;
}

export interface FearGreed {
  score: number;
  label: string;
  momentum: number;
  breadth: number;
  putCallRatio: number;
  volatility: number;
  safeHaven: number;
  junkBondDemand: number;
  updatedAt: string;
}

export interface MarketPulseEvent {
  id: string;
  type: string;
  symbol: string;
  title: string;
  description: string;
  impact: string;
  timestamp: string;
}

export interface SmartMoneyFlow {
  symbol: string;
  institutionalBuy: number;
  institutionalSell: number;
  retailBuy: number;
  retailSell: number;
  netFlow: number;
  signal: string;
  darkPoolPercent: number;
}

export interface TechnicalData {
  rsi: number;
  macd: number;
  macdSignal: number;
  sma20: number;
  sma50: number;
  sma200: number;
  bollingerUpper: number;
  bollingerLower: number;
  atr: number;
  trend: string;
}
