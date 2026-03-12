import { useQuery } from '@tanstack/react-query';
import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { TrendingUp, TrendingDown, Activity, Zap, Eye, BarChart3, ArrowRight, Clock, Globe, Flame, Shield, Target, Sparkles } from 'lucide-react';
import { AreaChart, Area, ResponsiveContainer, Tooltip, PieChart, Pie, Cell } from 'recharts';
import { stocksApi } from '../api/stocks';
import { signalsApi } from '../api/signals';
import { watchlistApi } from '../api/watchlist';
import { portfolioApi } from '../api/portfolio';
import api from '../api/client';
import { useMarketHub } from '../hooks/useMarketHub';
import { useWatchlistStore } from '../stores/watchlistStore';
import { usePriceStore } from '../stores/priceStore';
import { useAuthStore } from '../stores/authStore';
import { getSignalLabel } from '../utils/signalType';
import SignalCard from '../components/SignalCard';
import LoadingSpinner from '../components/common/LoadingSpinner';

const MINI_CHART_DATA = (seed: number, trend: number) => Array.from({ length: 20 }, (_, i) => {
  const rng = ((seed * (i + 1) * 9301 + 49297) % 233280) / 233280;
  return { v: 100 + (rng - 0.45) * 8 + i * trend * 0.3 };
});

export default function Dashboard() {
  const navigate = useNavigate();
  const user = useAuthStore((s) => s.user);
  const setSymbols = useWatchlistStore((s) => s.setSymbols);
  const watchlistSymbols = useWatchlistStore((s) => s.symbols);
  const prices = usePriceStore((s) => s.prices);

  const { data: watchlist } = useQuery({ queryKey: ['watchlist'], queryFn: watchlistApi.get });
  const { data: signals } = useQuery({ queryKey: ['signals-dash'], queryFn: () => signalsApi.getSignals(undefined, 20), refetchInterval: 60000 });
  const { data: topMovers } = useQuery({ queryKey: ['top-movers'], queryFn: stocksApi.getTopMovers, refetchInterval: 120000 });
  const { data: portfolio } = useQuery({ queryKey: ['portfolio-dash'], queryFn: portfolioApi.get });
  const { data: fearGreed } = useQuery({ queryKey: ['fear-greed-dash'], queryFn: () => api.get('/insights/fear-greed').then(r => r.data) });
  const { data: pulse } = useQuery({ queryKey: ['pulse-dash'], queryFn: () => api.get('/insights/market-pulse').then(r => r.data), refetchInterval: 120000 });

  useEffect(() => { if (watchlist) setSymbols(watchlist.map((w: any) => w.symbol)); }, [watchlist, setSymbols]);
  useMarketHub(watchlistSymbols);

  const gainers = topMovers?.filter((m: any) => m.changePercent > 0).slice(0, 5) ?? [];
  const losers = topMovers?.filter((m: any) => m.changePercent < 0).sort((a: any, b: any) => a.changePercent - b.changePercent).slice(0, 5) ?? [];
  const buySignals = signals?.filter((s: any) => getSignalLabel(s.type) === 'Buy').length ?? 0;
  const sellSignals = signals?.filter((s: any) => getSignalLabel(s.type) === 'Sell').length ?? 0;
  const holdSignals = signals?.filter((s: any) => getSignalLabel(s.type) === 'Hold').length ?? 0;
  const portfolioValue = portfolio?.reduce((s: number, p: any) => s + p.quantity * p.averageCost, 0) ?? 0;

  const pieData = [
    { name: 'Buy', value: buySignals, color: '#00FF94' },
    { name: 'Sell', value: sellSignals, color: '#FF3B5C' },
    { name: 'Hold', value: holdSignals, color: '#FFB020' },
  ];

  const fgScore = fearGreed?.score ?? 55;
  const fgLabel = fearGreed?.label ?? 'Neutral';
  const fgColor = fgScore >= 75 ? '#00FF94' : fgScore >= 55 ? '#84CC16' : fgScore >= 45 ? '#FFB020' : fgScore >= 25 ? '#F97316' : '#FF3B5C';

  const hour = new Date().getHours();
  const greeting = hour < 12 ? 'Good morning' : hour < 17 ? 'Good afternoon' : 'Good evening';

  return (
    <div className="space-y-5 page-enter">
      {/* Hero Header */}
      <div className="relative overflow-hidden rounded-2xl border border-border">
        <div className="absolute inset-0 bg-gradient-to-br from-accent/6 via-transparent to-purple/6 animate-gradient" />
        <div className="relative p-6 flex items-center justify-between">
          <div>
            <p className="text-sm text-text-muted">{greeting},</p>
            <h1 className="text-2xl font-black text-text-primary">{user?.fullName ?? 'Trader'}</h1>
            <div className="flex items-center gap-3 mt-2">
              <span className="text-xs text-text-muted flex items-center gap-1"><Clock className="w-3 h-3" /> {new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'short', day: 'numeric' })}</span>
              <span className="text-xs px-2 py-0.5 rounded-full bg-accent/10 text-accent font-bold flex items-center gap-1">
                <div className="w-1.5 h-1.5 rounded-full bg-accent animate-pulse" /> Market Open
              </span>
            </div>
          </div>
          <div className="hidden md:flex items-center gap-4">
            <QuickStat label="Portfolio" value={portfolioValue > 0 ? `$${(portfolioValue/1000).toFixed(1)}K` : '$0'} icon={BarChart3} color="text-info" />
            <QuickStat label="Watchlist" value={watchlist?.length ?? 0} icon={Eye} color="text-warning" />
            <QuickStat label="Signals" value={signals?.length ?? 0} icon={Zap} color="text-accent" />
          </div>
        </div>
      </div>

      {/* Market Indices Row */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <IndexCard name="S&P 500" value="5,248.32" change={0.85} data={MINI_CHART_DATA(1, 1)} />
        <IndexCard name="NASDAQ" value="16,892" change={1.12} data={MINI_CHART_DATA(2, 1.5)} />
        <IndexCard name="DOW" value="39,145" change={0.42} data={MINI_CHART_DATA(3, 0.8)} />
        <IndexCard name="VIX" value="14.82" change={-3.25} data={MINI_CHART_DATA(4, -0.5)} />
      </div>

      {/* Main Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">

        {/* Left Column */}
        <div className="lg:col-span-3 space-y-5">
          {/* Fear & Greed */}
          <div className="bg-surface border border-border rounded-2xl p-5 card-hover">
            <div className="flex items-center justify-between mb-3">
              <h2 className="text-[10px] font-bold text-text-muted uppercase tracking-widest">Fear & Greed</h2>
              <Flame className="w-4 h-4 text-text-muted" />
            </div>
            <div className="text-center">
              <div className="text-5xl font-black font-mono animate-count" style={{ color: fgColor }}>{fgScore}</div>
              <div className="text-sm font-bold mt-1" style={{ color: fgColor }}>{fgLabel}</div>
              <div className="w-full h-2 rounded-full bg-border mt-3 overflow-hidden">
                <div className="h-full rounded-full transition-all duration-1000" style={{ width: `${fgScore}%`, background: `linear-gradient(90deg, #FF3B5C, #FFB020, #00FF94)` }} />
              </div>
              <div className="flex justify-between mt-1 text-[8px] text-text-muted"><span>Fear</span><span>Greed</span></div>
            </div>
          </div>

          {/* Signal Distribution */}
          <div className="bg-surface border border-border rounded-2xl p-5 card-hover">
            <h2 className="text-[10px] font-bold text-text-muted uppercase tracking-widest mb-3">Signal Distribution</h2>
            <div className="flex items-center justify-center">
              <PieChart width={140} height={140}>
                <Pie data={pieData} cx={70} cy={70} innerRadius={40} outerRadius={62} dataKey="value" strokeWidth={0}>
                  {pieData.map((d, i) => <Cell key={i} fill={d.color} />)}
                </Pie>
              </PieChart>
            </div>
            <div className="flex justify-center gap-4 mt-2">
              {pieData.map(d => (
                <div key={d.name} className="flex items-center gap-1.5">
                  <div className="w-2 h-2 rounded-full" style={{ backgroundColor: d.color }} />
                  <span className="text-[10px] text-text-muted">{d.name}</span>
                  <span className="text-[10px] font-bold text-text-primary">{d.value}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Watchlist */}
          <div className="bg-surface border border-border rounded-2xl p-5 card-hover">
            <div className="flex items-center justify-between mb-3">
              <h2 className="text-[10px] font-bold text-text-muted uppercase tracking-widest">Watchlist</h2>
              <button onClick={() => navigate('/watchlist')} className="text-[10px] text-accent font-bold flex items-center gap-0.5 hover:underline">View All <ArrowRight className="w-3 h-3" /></button>
            </div>
            <div className="space-y-1.5">
              {watchlist?.slice(0, 6).map((w: any) => {
                const q = prices[w.symbol];
                return (
                  <button key={w.symbol} onClick={() => navigate(`/stocks/${w.symbol}`)}
                    className="w-full flex items-center justify-between p-2 rounded-lg hover:bg-bg transition-colors">
                    <span className="text-xs font-bold text-text-primary">{w.symbol}</span>
                    {q ? (
                      <div className="flex items-center gap-2">
                        <span className="text-xs text-text-primary font-mono">${q.price.toFixed(2)}</span>
                        <span className={`text-[10px] font-bold ${q.changePercent >= 0 ? 'text-accent' : 'text-danger'}`}>
                          {q.changePercent >= 0 ? '+' : ''}{q.changePercent.toFixed(2)}%
                        </span>
                      </div>
                    ) : <span className="text-[10px] text-text-muted">—</span>}
                  </button>
                );
              })}
              {(!watchlist || watchlist.length === 0) && <p className="text-[10px] text-text-muted text-center py-4">Add stocks to watchlist</p>}
            </div>
          </div>
        </div>

        {/* Center Column */}
        <div className="lg:col-span-6 space-y-5">
          {/* Top Movers */}
          <div className="grid grid-cols-2 gap-3">
            <div className="bg-surface border border-border rounded-2xl p-4 card-hover">
              <div className="flex items-center gap-1.5 mb-3">
                <TrendingUp className="w-4 h-4 text-accent" />
                <h2 className="text-[10px] font-bold text-text-muted uppercase tracking-widest">Top Gainers</h2>
              </div>
              {gainers.map((m: any, i: number) => (
                <button key={m.symbol} onClick={() => navigate(`/stocks/${m.symbol}`)}
                  className="w-full flex items-center justify-between py-1.5 hover:bg-bg rounded px-1 transition-colors">
                  <div className="flex items-center gap-2">
                    <span className="text-[9px] text-text-muted w-3">{i+1}</span>
                    <span className="text-xs font-bold text-text-primary">{m.symbol}</span>
                  </div>
                  <span className="text-xs font-bold text-accent font-mono">+{m.changePercent.toFixed(1)}%</span>
                </button>
              ))}
            </div>
            <div className="bg-surface border border-border rounded-2xl p-4 card-hover">
              <div className="flex items-center gap-1.5 mb-3">
                <TrendingDown className="w-4 h-4 text-danger" />
                <h2 className="text-[10px] font-bold text-text-muted uppercase tracking-widest">Top Losers</h2>
              </div>
              {losers.map((m: any, i: number) => (
                <button key={m.symbol} onClick={() => navigate(`/stocks/${m.symbol}`)}
                  className="w-full flex items-center justify-between py-1.5 hover:bg-bg rounded px-1 transition-colors">
                  <div className="flex items-center gap-2">
                    <span className="text-[9px] text-text-muted w-3">{i+1}</span>
                    <span className="text-xs font-bold text-text-primary">{m.symbol}</span>
                  </div>
                  <span className="text-xs font-bold text-danger font-mono">{m.changePercent.toFixed(1)}%</span>
                </button>
              ))}
            </div>
          </div>

          {/* Latest Signals */}
          <div className="bg-surface border border-border rounded-2xl p-5">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-accent" />
                <h2 className="text-[10px] font-bold text-text-muted uppercase tracking-widest">Latest AI Signals</h2>
              </div>
              <button onClick={() => navigate('/signals')} className="text-[10px] text-accent font-bold flex items-center gap-0.5 hover:underline">All Signals <ArrowRight className="w-3 h-3" /></button>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {signals?.slice(0, 4).map((s: any) => <SignalCard key={s.id} signal={s} />)}
            </div>
            {(!signals || signals.length === 0) && <p className="text-text-muted text-sm text-center py-8">No signals yet</p>}
          </div>
        </div>

        {/* Right Column */}
        <div className="lg:col-span-3 space-y-5">
          {/* Market Pulse */}
          <div className="bg-surface border border-border rounded-2xl p-5 card-hover">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-1.5">
                <Activity className="w-4 h-4 text-info" />
                <h2 className="text-[10px] font-bold text-text-muted uppercase tracking-widest">Market Pulse</h2>
              </div>
              <button onClick={() => navigate('/insights')} className="text-[10px] text-accent font-bold hover:underline">More</button>
            </div>
            <div className="space-y-2.5">
              {(pulse as any[])?.slice(0, 5).map((e: any) => (
                <div key={e.id} className="flex gap-2.5">
                  <div className={`w-1.5 rounded-full flex-shrink-0 ${e.impact === 'Bullish' ? 'bg-accent' : e.impact === 'Bearish' ? 'bg-danger' : 'bg-text-muted'}`} />
                  <div className="min-w-0">
                    <div className="flex items-center gap-1.5">
                      <span className="text-[9px] font-bold text-accent">{e.symbol}</span>
                      <span className={`text-[8px] font-bold ${e.impact === 'Bullish' ? 'text-accent' : e.impact === 'Bearish' ? 'text-danger' : 'text-text-muted'}`}>{e.impact}</span>
                    </div>
                    <p className="text-[10px] text-text-primary leading-snug line-clamp-2">{e.title}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Quick Actions */}
          <div className="bg-surface border border-border rounded-2xl p-5 card-hover">
            <h2 className="text-[10px] font-bold text-text-muted uppercase tracking-widest mb-3">Quick Actions</h2>
            <div className="grid grid-cols-2 gap-2">
              <QuickAction icon={Target} label="AI Predict" to="/price-predictor" color="text-accent" />
              <QuickAction icon={Sparkles} label="Optimizer" to="/portfolio-optimizer" color="text-purple" />
              <QuickAction icon={Shield} label="Anomalies" to="/anomaly-detector" color="text-warning" />
              <QuickAction icon={Globe} label="Heatmap" to="/heatmap" color="text-info" />
            </div>
          </div>

          {/* Portfolio Summary */}
          {portfolioValue > 0 && (
            <div className="bg-surface border border-border rounded-2xl p-5 card-hover">
              <div className="flex items-center justify-between mb-3">
                <h2 className="text-[10px] font-bold text-text-muted uppercase tracking-widest">Portfolio</h2>
                <button onClick={() => navigate('/portfolio')} className="text-[10px] text-accent font-bold hover:underline">Details</button>
              </div>
              <div className="text-2xl font-black text-text-primary font-mono">${portfolioValue.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</div>
              <div className="text-xs text-accent font-bold mt-0.5">+2.4% today</div>
              <div className="mt-3 space-y-1">
                {portfolio?.slice(0, 3).map((p: any) => (
                  <div key={p.id} className="flex justify-between text-[10px]">
                    <span className="text-text-muted">{p.symbol}</span>
                    <span className="text-text-primary font-mono">{p.quantity} shares</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function IndexCard({ name, value, change, data }: { name: string; value: string; change: number; data: { v: number }[] }) {
  const positive = change >= 0;
  return (
    <div className="bg-surface border border-border rounded-2xl p-4 card-hover cursor-pointer">
      <div className="flex items-center justify-between mb-1">
        <span className="text-[10px] font-bold text-text-muted uppercase tracking-wider">{name}</span>
        {positive ? <TrendingUp className="w-3 h-3 text-accent" /> : <TrendingDown className="w-3 h-3 text-danger" />}
      </div>
      <div className="text-lg font-black text-text-primary font-mono">{value}</div>
      <div className={`text-xs font-bold ${positive ? 'text-accent' : 'text-danger'}`}>
        {positive ? '+' : ''}{change.toFixed(2)}%
      </div>
      <div className="mt-2 h-8">
        <ResponsiveContainer width="100%" height={32} minWidth={0}>
          <AreaChart data={data}>
            <defs>
              <linearGradient id={`g-${name}`} x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor={positive ? '#00FF94' : '#FF3B5C'} stopOpacity={0.3} />
                <stop offset="100%" stopColor={positive ? '#00FF94' : '#FF3B5C'} stopOpacity={0} />
              </linearGradient>
            </defs>
            <Area type="monotone" dataKey="v" stroke={positive ? '#00FF94' : '#FF3B5C'} fill={`url(#g-${name})`} strokeWidth={1.5} dot={false} />
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}

function QuickStat({ label, value, icon: Icon, color }: { label: string; value: string | number; icon: typeof Activity; color: string }) {
  return (
    <div className="text-center px-4">
      <Icon className={`w-4 h-4 ${color} mx-auto mb-1`} />
      <div className="text-lg font-black text-text-primary font-mono">{value}</div>
      <div className="text-[9px] text-text-muted uppercase tracking-wider">{label}</div>
    </div>
  );
}

function QuickAction({ icon: Icon, label, to, color }: { icon: typeof Target; label: string; to: string; color: string }) {
  const navigate = useNavigate();
  return (
    <button onClick={() => navigate(to)} className="bg-bg rounded-xl p-3 hover:bg-surface-light transition-colors text-center group">
      <Icon className={`w-5 h-5 ${color} mx-auto mb-1 group-hover:scale-110 transition-transform`} />
      <span className="text-[10px] font-semibold text-text-muted group-hover:text-text-primary transition-colors">{label}</span>
    </button>
  );
}
