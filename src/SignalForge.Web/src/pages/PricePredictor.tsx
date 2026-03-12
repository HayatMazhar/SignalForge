import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid, ReferenceLine } from 'recharts';
import { Brain, Search, TrendingUp, TrendingDown, Minus, Zap } from 'lucide-react';
import api from '../api/client';
import LoadingSpinner from '../components/common/LoadingSpinner';
import { useAssetModeStore } from '../stores/assetModeStore';

interface RawPrediction {
  horizon?: string;
  period?: string;
  price?: number;
  predictedPrice?: number;
  change?: number;
  changePercent?: number;
  confidence: number;
  direction: string;
}

interface Prediction {
  period: string;
  days: number;
  predictedPrice: number;
  changePercent: number;
  confidence: number;
  direction: 'up' | 'down' | 'neutral';
}

interface Factor {
  name: string;
  impact: string;
  weight: number;
}

interface RawPredictionResult {
  symbol: string;
  currentPrice: number;
  predictions: RawPrediction[];
  factors: Factor[];
}

interface PredictionResult {
  symbol: string;
  currentPrice: number;
  predictions: Prediction[];
  factors: Factor[];
}

function normalizePredictions(raw: RawPredictionResult): PredictionResult {
  return {
    symbol: raw.symbol,
    currentPrice: raw.currentPrice,
    predictions: (raw.predictions ?? []).map(p => {
      const period = p.horizon ?? p.period ?? '';
      const daysMatch = period.match(/(\d+)/);
      return {
        period,
        days: daysMatch ? parseInt(daysMatch[1]) : 0,
        predictedPrice: p.price ?? p.predictedPrice ?? 0,
        changePercent: p.change ?? p.changePercent ?? 0,
        confidence: p.confidence ?? 0,
        direction: normalizeDirection(p.direction),
      };
    }),
    factors: (raw.factors ?? []).map(f => ({
      ...f,
      weight: f.weight > 1 ? f.weight / 100 : f.weight,
    })),
  };
}

function normalizeDirection(d: string | undefined): 'up' | 'down' | 'neutral' {
  if (!d) return 'neutral';
  const lower = d.toLowerCase();
  if (lower === 'up' || lower === 'bullish') return 'up';
  if (lower === 'down' || lower === 'bearish') return 'down';
  return 'neutral';
}

const directionConfig: Record<string, { icon: typeof TrendingUp; color: string; bg: string }> = {
  up: { icon: TrendingUp, color: 'text-accent', bg: 'bg-accent/10' },
  down: { icon: TrendingDown, color: 'text-danger', bg: 'bg-danger/10' },
  neutral: { icon: Minus, color: 'text-warning', bg: 'bg-warning/10' },
};

const impactColors: Record<string, string> = {
  Bullish: 'text-accent',
  Bearish: 'text-danger',
  Neutral: 'text-warning',
};

export default function PricePredictor() {
  const [symbol, setSymbol] = useState('');
  const [activeSymbol, setActiveSymbol] = useState('');
  const { mode } = useAssetModeStore();

  const endpoint = mode === 'crypto' ? `/crypto/predict/${activeSymbol}` : `/ai/predict/${activeSymbol}`;

  const { data: result, isLoading, error } = useQuery({
    queryKey: ['price-prediction', activeSymbol, mode],
    queryFn: () => api.get(endpoint).then(r => normalizePredictions(r.data as RawPredictionResult)),
    enabled: !!activeSymbol,
  });

  const handlePredict = () => {
    if (symbol.trim()) setActiveSymbol(symbol.trim().toUpperCase());
  };

  const chartData = result ? [
    { name: 'Now', price: result.currentPrice },
    ...result.predictions.map(p => ({ name: `${p.days}d`, price: p.predictedPrice })),
  ] : [];

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-xl bg-purple/10 flex items-center justify-center">
          <Brain className="w-6 h-6 text-purple" />
        </div>
        <div>
          <h1 className="text-2xl font-black text-text-primary">{mode === 'crypto' ? 'AI Crypto Predictor' : 'AI Price Predictor'}</h1>
          <p className="text-xs text-text-muted">Machine learning-powered price forecasting</p>
        </div>
      </div>

      <div className="bg-surface border border-border rounded-xl p-5">
        <div className="flex gap-3">
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-text-muted" />
            <input
              value={symbol}
              onChange={e => setSymbol(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && handlePredict()}
              placeholder="Enter symbol (e.g. AAPL)"
              className="w-full bg-bg border border-border rounded-lg pl-10 pr-4 py-2.5 text-sm text-text-primary font-mono placeholder-text-muted focus:outline-none focus:border-accent"
            />
          </div>
          <button onClick={handlePredict} disabled={!symbol.trim() || isLoading}
            className="px-6 py-2.5 rounded-xl bg-accent text-bg text-sm font-bold flex items-center gap-2 hover:bg-accent/90 btn-shine glow-accent disabled:opacity-50 transition-colors">
            <Zap className="w-4 h-4" />
            Predict
          </button>
        </div>
      </div>

      {isLoading && <LoadingSpinner text={`Analyzing ${activeSymbol}...`} />}

      {error && (
        <div className="bg-danger/10 border border-danger/20 rounded-xl p-4 text-danger text-sm">
          Failed to generate predictions. Please check the symbol and try again.
        </div>
      )}

      {result && (
        <div className="space-y-6 animate-fade-up">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {result.predictions.map(p => {
              const config = directionConfig[p.direction] ?? directionConfig.neutral;
              const DirIcon = config.icon;
              return (
                <div key={p.days} className="bg-surface border border-border rounded-xl p-5 card-hover">
                  <div className="flex items-center justify-between mb-3">
                    <span className="text-xs font-bold text-text-muted uppercase tracking-wider">{p.period}</span>
                    <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-bold ${config.bg} ${config.color}`}>
                      <DirIcon className="w-3 h-3" /> {p.direction}
                    </span>
                  </div>
                  <div className="text-2xl font-black font-mono text-text-primary">${p.predictedPrice.toFixed(2)}</div>
                  <div className={`text-sm font-bold font-mono mt-1 ${p.changePercent >= 0 ? 'text-accent' : 'text-danger'}`}>
                    {p.changePercent >= 0 ? '+' : ''}{p.changePercent.toFixed(2)}%
                  </div>
                  <div className="mt-3">
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-[10px] text-text-muted">Confidence</span>
                      <span className="text-[10px] font-bold text-text-primary">{p.confidence}%</span>
                    </div>
                    <div className="w-full h-1.5 bg-border rounded-full overflow-hidden">
                      <div className={`h-full rounded-full transition-all ${p.confidence >= 70 ? 'bg-accent' : p.confidence >= 40 ? 'bg-warning' : 'bg-danger'}`}
                        style={{ width: `${p.confidence}%` }} />
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          <div className="bg-surface border border-border rounded-xl p-5">
            <h3 className="text-xs font-bold text-text-muted uppercase tracking-wider mb-4">Price Trajectory</h3>
            <ResponsiveContainer width="100%" height={250} minWidth={0}>
              <AreaChart data={chartData}>
                <defs>
                  <linearGradient id="predGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#00FF94" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="#00FF94" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#1A1F35" />
                <XAxis dataKey="name" tick={{ fill: '#5B6378', fontSize: 10 }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fill: '#5B6378', fontSize: 10 }} axisLine={false} tickLine={false}
                  tickFormatter={(v: number) => `$${v.toFixed(0)}`} domain={['auto', 'auto']} />
                <Tooltip contentStyle={{ backgroundColor: '#0C0F1A', border: '1px solid #1A1F35', borderRadius: 8, fontSize: 11, color: '#F0F4F8' }}
                  formatter={(v: number | undefined) => [`$${(v ?? 0).toFixed(2)}`, 'Price']} />
                <ReferenceLine y={result.currentPrice} stroke="#5B6378" strokeDasharray="4 4" label={{ value: 'Current', fill: '#5B6378', fontSize: 9 }} />
                <Area type="monotone" dataKey="price" stroke="#00FF94" fill="url(#predGrad)" strokeWidth={2} dot={{ fill: '#00FF94', r: 4 }} />
              </AreaChart>
            </ResponsiveContainer>
          </div>

          <div className="bg-surface border border-border rounded-xl p-5">
            <h3 className="text-xs font-bold text-text-muted uppercase tracking-wider mb-4">Factor Breakdown</h3>
            <div className="space-y-3">
              {result.factors.map(f => (
                <div key={f.name} className="flex items-center gap-4">
                  <span className="text-sm text-text-primary w-40 flex-shrink-0">{f.name}</span>
                  <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full w-16 text-center ${impactColors[f.impact]} ${f.impact === 'Bullish' ? 'bg-accent/10' : f.impact === 'Bearish' ? 'bg-danger/10' : 'bg-warning/10'}`}>
                    {f.impact}
                  </span>
                  <div className="flex-1 h-2 bg-border rounded-full overflow-hidden">
                    <div className={`h-full rounded-full ${f.impact === 'Bullish' ? 'bg-accent' : f.impact === 'Bearish' ? 'bg-danger' : 'bg-warning'}`}
                      style={{ width: `${f.weight * 100}%` }} />
                  </div>
                  <span className="text-xs font-mono text-text-muted w-10 text-right">{(f.weight * 100).toFixed(0)}%</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
