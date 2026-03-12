import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid, ReferenceLine } from 'recharts';
import { Heart, Search, TrendingUp, TrendingDown, Minus, Newspaper } from 'lucide-react';
import api from '../api/client';
import LoadingSpinner from '../components/common/LoadingSpinner';

interface SentimentPoint {
  date: string;
  score: number;
  articles: number;
}

interface SentimentData {
  symbol: string;
  points: SentimentPoint[];
  averageScore: number;
  trendDirection: 'Improving' | 'Declining' | 'Stable';
  totalArticles: number;
}

export default function SentimentTrend() {
  const [symbol, setSymbol] = useState('');
  const [activeSymbol, setActiveSymbol] = useState('');

  const { data, isLoading, error } = useQuery({
    queryKey: ['sentiment-trend', activeSymbol],
    queryFn: () => api.get(`/ai/sentiment-trend/${activeSymbol}`).then(r => r.data as SentimentData),
    enabled: !!activeSymbol,
  });

  const handleSearch = () => {
    if (symbol.trim()) setActiveSymbol(symbol.trim().toUpperCase());
  };

  const trendConfig = {
    Improving: { icon: TrendingUp, color: 'text-accent', bg: 'bg-accent/10' },
    Declining: { icon: TrendingDown, color: 'text-danger', bg: 'bg-danger/10' },
    Stable: { icon: Minus, color: 'text-warning', bg: 'bg-warning/10' },
  };

  const trend = data ? trendConfig[data.trendDirection] : null;
  const TrendIcon = trend?.icon ?? Minus;

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-xl bg-info/10 flex items-center justify-center">
          <Heart className="w-6 h-6 text-info" />
        </div>
        <div>
          <h1 className="text-2xl font-black text-text-primary">Sentiment Trend</h1>
          <p className="text-xs text-text-muted">Track market sentiment over time</p>
        </div>
      </div>

      <div className="bg-surface border border-border rounded-xl p-5">
        <div className="flex gap-3">
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-text-muted" />
            <input
              value={symbol}
              onChange={e => setSymbol(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && handleSearch()}
              placeholder="Enter symbol (e.g. TSLA)"
              className="w-full bg-bg border border-border rounded-lg pl-10 pr-4 py-2.5 text-sm text-text-primary font-mono placeholder-text-muted focus:outline-none focus:border-accent"
            />
          </div>
          <button onClick={handleSearch} disabled={!symbol.trim() || isLoading}
            className="px-6 py-2.5 rounded-xl bg-accent text-bg text-sm font-bold hover:bg-accent/90 btn-shine disabled:opacity-50 transition-colors">
            Analyze
          </button>
        </div>
      </div>

      {isLoading && <LoadingSpinner text={`Analyzing sentiment for ${activeSymbol}...`} />}

      {error && (
        <div className="bg-danger/10 border border-danger/20 rounded-xl p-4 text-danger text-sm">
          Failed to load sentiment data. Please check the symbol and try again.
        </div>
      )}

      {data && (
        <div className="space-y-6 animate-fade-up">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="bg-surface border border-border rounded-xl p-5 card-hover">
              <span className="text-[10px] font-bold text-text-muted uppercase tracking-wider">Average Sentiment</span>
              <div className={`text-2xl font-black font-mono mt-1 ${data.averageScore >= 0 ? 'text-accent' : 'text-danger'}`}>
                {data.averageScore >= 0 ? '+' : ''}{data.averageScore.toFixed(3)}
              </div>
              <div className="w-full h-1.5 bg-border rounded-full overflow-hidden mt-2">
                <div className={`h-full rounded-full ${data.averageScore >= 0 ? 'bg-accent' : 'bg-danger'}`}
                  style={{ width: `${((data.averageScore + 1) / 2) * 100}%` }} />
              </div>
            </div>

            <div className="bg-surface border border-border rounded-xl p-5 card-hover">
              <span className="text-[10px] font-bold text-text-muted uppercase tracking-wider">Trend Direction</span>
              <div className="flex items-center gap-2 mt-1">
                <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-sm font-bold ${trend?.bg} ${trend?.color}`}>
                  <TrendIcon className="w-4 h-4" /> {data.trendDirection}
                </span>
              </div>
            </div>

            <div className="bg-surface border border-border rounded-xl p-5 card-hover">
              <span className="text-[10px] font-bold text-text-muted uppercase tracking-wider">Total Articles</span>
              <div className="flex items-center gap-2 mt-1">
                <Newspaper className="w-5 h-5 text-info" />
                <span className="text-2xl font-black font-mono text-text-primary">{data.totalArticles.toLocaleString()}</span>
              </div>
            </div>
          </div>

          <div className="bg-surface border border-border rounded-xl p-5">
            <h3 className="text-xs font-bold text-text-muted uppercase tracking-wider mb-4">
              Sentiment Over 30 Days — {data.symbol}
            </h3>
            <ResponsiveContainer width="100%" height={300} minWidth={0}>
              <AreaChart data={data.points}>
                <defs>
                  <linearGradient id="sentPos" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#00FF94" stopOpacity={0.4} />
                    <stop offset="95%" stopColor="#00FF94" stopOpacity={0} />
                  </linearGradient>
                  <linearGradient id="sentNeg" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#FF3B5C" stopOpacity={0.4} />
                    <stop offset="95%" stopColor="#FF3B5C" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#1A1F35" />
                <XAxis dataKey="date" tick={{ fill: '#5B6378', fontSize: 9 }} axisLine={false} tickLine={false}
                  tickFormatter={(v: string) => new Date(v).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })} />
                <YAxis domain={[-1, 1]} tick={{ fill: '#5B6378', fontSize: 9 }} axisLine={false} tickLine={false}
                  tickFormatter={(v: number) => v.toFixed(1)} />
                <Tooltip
                  contentStyle={{ backgroundColor: '#0C0F1A', border: '1px solid #1A1F35', borderRadius: 8, fontSize: 11, color: '#F0F4F8' }}
                  formatter={(v: number) => [v.toFixed(3), 'Sentiment']}
                  labelFormatter={(l: string) => new Date(l).toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })}
                />
                <ReferenceLine y={0} stroke="#5B6378" strokeDasharray="4 4" />
                <Area type="monotone" dataKey="score" stroke="#00FF94" fill="url(#sentPos)" strokeWidth={2}
                  activeDot={{ fill: '#00FF94', r: 4 }}
                  baseValue={0}
                />
              </AreaChart>
            </ResponsiveContainer>
            <div className="flex items-center justify-center gap-6 mt-3">
              <span className="flex items-center gap-1.5 text-[10px] text-text-muted">
                <span className="w-3 h-3 rounded-sm bg-accent/40" /> Positive
              </span>
              <span className="flex items-center gap-1.5 text-[10px] text-text-muted">
                <span className="w-3 h-3 rounded-sm bg-danger/40" /> Negative
              </span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
