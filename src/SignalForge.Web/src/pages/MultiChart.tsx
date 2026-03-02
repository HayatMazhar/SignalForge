import { useState, useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from 'recharts';
import { LineChart as LineChartIcon, Search, Zap, TrendingUp, TrendingDown, BarChart3, Activity } from 'lucide-react';
import api from '../api/client';
import LoadingSpinner from '../components/common/LoadingSpinner';

interface PricePoint {
  date: string;
  close: number;
  volume: number;
  high: number;
  low: number;
}

interface TimeframeOption {
  label: string;
  key: string;
  days: number;
}

const TIMEFRAMES: TimeframeOption[] = [
  { label: '1W', key: '1w', days: 7 },
  { label: '1M', key: '1m', days: 30 },
  { label: '3M', key: '3m', days: 90 },
  { label: '6M', key: '6m', days: 180 },
  { label: '1Y', key: '1y', days: 365 },
  { label: '5Y', key: '5y', days: 1825 },
];

function formatDate(days: number): string {
  const d = new Date();
  d.setDate(d.getDate() - days);
  return d.toISOString().split('T')[0];
}

function formatChartDate(dateStr: string, days: number): string {
  const d = new Date(dateStr);
  if (days <= 30) return d.toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
  if (days <= 365) return d.toLocaleDateString(undefined, { month: 'short', year: '2-digit' });
  return d.toLocaleDateString(undefined, { month: 'short', year: 'numeric' });
}

export default function MultiChart() {
  const [symbol, setSymbol] = useState('');
  const [activeSymbol, setActiveSymbol] = useState('');
  const [activeTimeframe, setActiveTimeframe] = useState<TimeframeOption>(TIMEFRAMES[1]);

  const fromDate = formatDate(activeTimeframe.days);
  const toDate = formatDate(0);

  const { data: history, isLoading, error } = useQuery({
    queryKey: ['multi-chart', activeSymbol, activeTimeframe.key],
    queryFn: () =>
      api.get(`/stocks/${activeSymbol}/history?from=${fromDate}&to=${toDate}`)
        .then(r => r.data as PricePoint[]),
    enabled: !!activeSymbol,
  });

  const handleSearch = () => {
    if (symbol.trim()) setActiveSymbol(symbol.trim().toUpperCase());
  };

  const stats = useMemo(() => {
    if (!history || history.length === 0) return null;
    const highs = history.map(p => p.high);
    const lows = history.map(p => p.low);
    const volumes = history.map(p => p.volume);
    const first = history[0].close;
    const last = history[history.length - 1].close;
    const change = ((last - first) / first) * 100;
    return {
      periodHigh: Math.max(...highs),
      periodLow: Math.min(...lows),
      periodChange: change,
      avgVolume: Math.round(volumes.reduce((s, v) => s + v, 0) / volumes.length),
      currentPrice: last,
    };
  }, [history]);

  const chartData = history?.map(p => ({
    date: p.date,
    price: p.close,
    displayDate: formatChartDate(p.date, activeTimeframe.days),
  })) ?? [];

  const isPositive = (stats?.periodChange ?? 0) >= 0;

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-xl bg-accent/10 flex items-center justify-center">
          <LineChartIcon className="w-6 h-6 text-accent" />
        </div>
        <div>
          <h1 className="text-2xl font-black text-text-primary">Multi-Timeframe Chart</h1>
          <p className="text-xs text-text-muted">Analyze price history across multiple timeframes</p>
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
              placeholder="Enter symbol (e.g. AAPL)"
              className="w-full bg-bg border border-border rounded-lg pl-10 pr-4 py-2.5 text-sm text-text-primary font-mono placeholder-text-muted focus:outline-none focus:border-accent"
            />
          </div>
          <button
            onClick={handleSearch}
            disabled={!symbol.trim() || isLoading}
            className="px-6 py-2.5 rounded-xl bg-accent text-bg text-sm font-bold flex items-center gap-2 hover:bg-accent/90 btn-shine glow-accent disabled:opacity-50 transition-colors"
          >
            <Zap className="w-4 h-4" />
            Load
          </button>
        </div>
      </div>

      {activeSymbol && (
        <div className="space-y-4 animate-fade-up">
          {/* Timeframe selector */}
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-black font-mono text-text-primary">{activeSymbol}</h2>
            <div className="flex gap-1 bg-surface border border-border rounded-lg p-0.5">
              {TIMEFRAMES.map(tf => (
                <button
                  key={tf.key}
                  onClick={() => setActiveTimeframe(tf)}
                  className={`px-3 py-1.5 text-xs font-bold rounded-md transition-colors ${
                    activeTimeframe.key === tf.key
                      ? 'bg-accent/10 text-accent'
                      : 'text-text-muted hover:text-text-primary'
                  }`}
                >
                  {tf.label}
                </button>
              ))}
            </div>
          </div>

          {isLoading && <LoadingSpinner text={`Loading ${activeTimeframe.label} data...`} />}

          {error && (
            <div className="bg-danger/10 border border-danger/20 rounded-xl p-4 text-danger text-sm">
              Failed to load chart data. Please check the symbol and try again.
            </div>
          )}

          {history && history.length > 0 && (
            <>
              {/* Chart */}
              <div className="bg-surface border border-border rounded-xl p-5">
                <ResponsiveContainer width="100%" height={400}>
                  <AreaChart data={chartData}>
                    <defs>
                      <linearGradient id="mcGrad" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor={isPositive ? '#00FF94' : '#EF4444'} stopOpacity={0.3} />
                        <stop offset="95%" stopColor={isPositive ? '#00FF94' : '#EF4444'} stopOpacity={0} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="#1A1F35" />
                    <XAxis
                      dataKey="displayDate"
                      tick={{ fill: '#5B6378', fontSize: 10 }}
                      axisLine={false}
                      tickLine={false}
                      interval="preserveStartEnd"
                    />
                    <YAxis
                      tick={{ fill: '#5B6378', fontSize: 10 }}
                      axisLine={false}
                      tickLine={false}
                      tickFormatter={(v: number) => `$${v.toFixed(0)}`}
                      domain={['auto', 'auto']}
                    />
                    <Tooltip
                      contentStyle={{
                        backgroundColor: '#0C0F1A',
                        border: '1px solid #1A1F35',
                        borderRadius: 8,
                        fontSize: 11,
                        color: '#F0F4F8',
                      }}
                      formatter={(v: number) => [`$${v.toFixed(2)}`, 'Price']}
                      labelFormatter={(label: string) => label}
                    />
                    <Area
                      type="monotone"
                      dataKey="price"
                      stroke={isPositive ? '#00FF94' : '#EF4444'}
                      fill="url(#mcGrad)"
                      strokeWidth={2}
                      dot={false}
                      activeDot={{ r: 4, fill: isPositive ? '#00FF94' : '#EF4444' }}
                    />
                  </AreaChart>
                </ResponsiveContainer>
              </div>

              {/* Stats */}
              {stats && (
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <div className="bg-surface border border-border rounded-xl p-4 text-center card-hover">
                    <div className="flex items-center justify-center gap-1 mb-1">
                      <TrendingUp className="w-3.5 h-3.5 text-accent" />
                      <span className="text-[10px] text-text-muted uppercase">Period High</span>
                    </div>
                    <div className="text-lg font-black font-mono text-accent">${stats.periodHigh.toFixed(2)}</div>
                  </div>
                  <div className="bg-surface border border-border rounded-xl p-4 text-center card-hover">
                    <div className="flex items-center justify-center gap-1 mb-1">
                      <TrendingDown className="w-3.5 h-3.5 text-danger" />
                      <span className="text-[10px] text-text-muted uppercase">Period Low</span>
                    </div>
                    <div className="text-lg font-black font-mono text-danger">${stats.periodLow.toFixed(2)}</div>
                  </div>
                  <div className="bg-surface border border-border rounded-xl p-4 text-center card-hover">
                    <div className="flex items-center justify-center gap-1 mb-1">
                      <Activity className="w-3.5 h-3.5 text-info" />
                      <span className="text-[10px] text-text-muted uppercase">Period Change</span>
                    </div>
                    <div className={`text-lg font-black font-mono ${isPositive ? 'text-accent' : 'text-danger'}`}>
                      {isPositive ? '+' : ''}{stats.periodChange.toFixed(2)}%
                    </div>
                  </div>
                  <div className="bg-surface border border-border rounded-xl p-4 text-center card-hover">
                    <div className="flex items-center justify-center gap-1 mb-1">
                      <BarChart3 className="w-3.5 h-3.5 text-purple" />
                      <span className="text-[10px] text-text-muted uppercase">Avg Volume</span>
                    </div>
                    <div className="text-lg font-black font-mono text-text-primary">
                      {stats.avgVolume >= 1_000_000
                        ? `${(stats.avgVolume / 1_000_000).toFixed(1)}M`
                        : stats.avgVolume >= 1_000
                          ? `${(stats.avgVolume / 1_000).toFixed(0)}K`
                          : stats.avgVolume.toLocaleString()
                      }
                    </div>
                  </div>
                </div>
              )}
            </>
          )}

          {history && history.length === 0 && (
            <div className="text-center py-16">
              <LineChartIcon className="w-12 h-12 text-text-muted mx-auto mb-3" />
              <p className="text-text-muted">No price data available for this timeframe</p>
            </div>
          )}
        </div>
      )}

      {!activeSymbol && !isLoading && (
        <div className="text-center py-16">
          <LineChartIcon className="w-12 h-12 text-text-muted mx-auto mb-3" />
          <p className="text-text-muted">Enter a symbol to view multi-timeframe charts</p>
        </div>
      )}
    </div>
  );
}
