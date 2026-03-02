import { useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { BarChart3, TrendingUp, TrendingDown, Minus, Target } from 'lucide-react';
import { PieChart, Pie, Cell, BarChart, Bar, AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from 'recharts';
import api from '../api/client';
import LoadingSpinner from '../components/common/LoadingSpinner';

interface Signal {
  id: string;
  symbol: string;
  type: 'Buy' | 'Sell' | 'Hold';
  confidence: number;
  createdAt: string;
}

const COLORS = {
  Buy: '#22c55e',
  Sell: '#ef4444',
  Hold: '#eab308',
};

export default function Analytics() {
  const { data: signals, isLoading, error } = useQuery({
    queryKey: ['analytics-signals'],
    queryFn: () => api.get('/signals?limit=200').then(r => r.data as Signal[]),
  });

  const stats = useMemo(() => {
    if (!signals || signals.length === 0) return null;

    const buyCount = signals.filter(s => s.type === 'Buy').length;
    const sellCount = signals.filter(s => s.type === 'Sell').length;
    const holdCount = signals.filter(s => s.type === 'Hold').length;
    const avgConfidence = signals.reduce((a, s) => a + s.confidence, 0) / signals.length;

    const pieData = [
      { name: 'Buy', value: buyCount },
      { name: 'Sell', value: sellCount },
      { name: 'Hold', value: holdCount },
    ];

    const now = new Date();
    const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
    const dailyCounts: Record<string, number> = {};
    for (let d = new Date(thirtyDaysAgo); d <= now; d.setDate(d.getDate() + 1)) {
      dailyCounts[d.toISOString().split('T')[0]] = 0;
    }
    signals.forEach(s => {
      const day = s.createdAt.split('T')[0];
      if (day in dailyCounts) dailyCounts[day]++;
    });
    const barData = Object.entries(dailyCounts).map(([date, count]) => ({
      date: new Date(date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
      count,
    }));

    const sortedByDate = [...signals].sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime());
    const windowSize = 5;
    const confidenceTrend = sortedByDate.map((s, i) => {
      const window = sortedByDate.slice(Math.max(0, i - windowSize + 1), i + 1);
      const avg = window.reduce((a, w) => a + w.confidence, 0) / window.length;
      return {
        date: new Date(s.createdAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
        confidence: Math.round(s.confidence),
        avg: Math.round(avg),
      };
    });

    const symbolMap: Record<string, { buys: number; totalConfidence: number; count: number }> = {};
    signals.filter(s => s.type === 'Buy').forEach(s => {
      if (!symbolMap[s.symbol]) symbolMap[s.symbol] = { buys: 0, totalConfidence: 0, count: 0 };
      symbolMap[s.symbol].buys++;
      symbolMap[s.symbol].totalConfidence += s.confidence;
      symbolMap[s.symbol].count++;
    });
    const topSymbols = Object.entries(symbolMap)
      .map(([symbol, data]) => ({ symbol, buys: data.buys, avgConfidence: Math.round(data.totalConfidence / data.count) }))
      .sort((a, b) => b.buys - a.buys || b.avgConfidence - a.avgConfidence)
      .slice(0, 10);

    return { buyCount, sellCount, holdCount, avgConfidence, pieData, barData, confidenceTrend, topSymbols, total: signals.length };
  }, [signals]);

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center py-20">
        <p className="text-danger text-sm">Failed to load signal analytics</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-xl bg-accent/10 flex items-center justify-center">
          <BarChart3 className="w-6 h-6 text-accent" />
        </div>
        <div>
          <h1 className="text-2xl font-black text-text-primary">Performance Analytics</h1>
          <p className="text-xs text-text-muted">Signal distribution, trends & top performers</p>
        </div>
      </div>

      {isLoading ? <LoadingSpinner text="Crunching numbers..." /> : stats && (
        <>
          <div className="grid grid-cols-2 md:grid-cols-5 gap-3 animate-fade-up">
            <StatCard icon={BarChart3} label="Total Signals" value={stats.total.toString()} color="text-info" />
            <StatCard icon={TrendingUp} label="Buy Signals" value={stats.buyCount.toString()} color="text-accent" />
            <StatCard icon={TrendingDown} label="Sell Signals" value={stats.sellCount.toString()} color="text-danger" />
            <StatCard icon={Minus} label="Hold Signals" value={stats.holdCount.toString()} color="text-warning" />
            <StatCard icon={Target} label="Avg Confidence" value={`${stats.avgConfidence.toFixed(0)}%`} color="text-purple" />
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
            <div className="bg-surface border border-border rounded-xl p-5 animate-fade-up">
              <h3 className="text-xs font-bold text-text-muted uppercase tracking-wider mb-4">Signal Distribution</h3>
              <ResponsiveContainer width="100%" height={220}>
                <PieChart>
                  <Pie data={stats.pieData} cx="50%" cy="50%" innerRadius={55} outerRadius={85} paddingAngle={4} dataKey="value">
                    {stats.pieData.map(entry => (
                      <Cell key={entry.name} fill={COLORS[entry.name as keyof typeof COLORS]} />
                    ))}
                  </Pie>
                  <Tooltip
                    contentStyle={{ backgroundColor: 'var(--color-surface)', border: '1px solid var(--color-border)', borderRadius: '0.75rem', fontSize: '0.75rem' }}
                    itemStyle={{ color: 'var(--color-text-primary)' }}
                  />
                </PieChart>
              </ResponsiveContainer>
              <div className="flex justify-center gap-4 mt-2">
                {stats.pieData.map(entry => (
                  <div key={entry.name} className="flex items-center gap-1.5 text-xs">
                    <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: COLORS[entry.name as keyof typeof COLORS] }} />
                    <span className="text-text-muted">{entry.name}</span>
                    <span className="font-mono font-bold text-text-primary">{entry.value}</span>
                  </div>
                ))}
              </div>
            </div>

            <div className="lg:col-span-2 bg-surface border border-border rounded-xl p-5 animate-fade-up">
              <h3 className="text-xs font-bold text-text-muted uppercase tracking-wider mb-4">Signals Per Day (30D)</h3>
              <ResponsiveContainer width="100%" height={250}>
                <BarChart data={stats.barData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="var(--color-border)" />
                  <XAxis dataKey="date" tick={{ fontSize: 10, fill: 'var(--color-text-muted)' }} interval="preserveStartEnd" />
                  <YAxis tick={{ fontSize: 10, fill: 'var(--color-text-muted)' }} allowDecimals={false} />
                  <Tooltip
                    contentStyle={{ backgroundColor: 'var(--color-surface)', border: '1px solid var(--color-border)', borderRadius: '0.75rem', fontSize: '0.75rem' }}
                    itemStyle={{ color: 'var(--color-text-primary)' }}
                  />
                  <Bar dataKey="count" fill="var(--color-accent)" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          <div className="bg-surface border border-border rounded-xl p-5 animate-fade-up">
            <h3 className="text-xs font-bold text-text-muted uppercase tracking-wider mb-4">Confidence Trend</h3>
            <ResponsiveContainer width="100%" height={250}>
              <AreaChart data={stats.confidenceTrend}>
                <defs>
                  <linearGradient id="confGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="var(--color-accent)" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="var(--color-accent)" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--color-border)" />
                <XAxis dataKey="date" tick={{ fontSize: 10, fill: 'var(--color-text-muted)' }} interval="preserveStartEnd" />
                <YAxis domain={[0, 100]} tick={{ fontSize: 10, fill: 'var(--color-text-muted)' }} />
                <Tooltip
                  contentStyle={{ backgroundColor: 'var(--color-surface)', border: '1px solid var(--color-border)', borderRadius: '0.75rem', fontSize: '0.75rem' }}
                  itemStyle={{ color: 'var(--color-text-primary)' }}
                />
                <Area type="monotone" dataKey="confidence" stroke="var(--color-accent)" strokeOpacity={0.3} fill="url(#confGradient)" />
                <Area type="monotone" dataKey="avg" stroke="var(--color-accent)" strokeWidth={2} fill="none" />
              </AreaChart>
            </ResponsiveContainer>
          </div>

          {stats.topSymbols.length > 0 && (
            <div className="bg-surface border border-border rounded-xl overflow-hidden animate-fade-up">
              <div className="px-5 py-3 border-b border-border bg-bg/30">
                <h3 className="text-xs font-bold text-text-muted uppercase tracking-wider">Top Performing Symbols</h3>
              </div>
              <table className="w-full text-sm">
                <thead>
                  <tr className="text-text-muted border-b border-border">
                    <th className="text-left py-2.5 px-5">#</th>
                    <th className="text-left py-2.5 px-5">Symbol</th>
                    <th className="text-right py-2.5 px-5">Buy Signals</th>
                    <th className="text-right py-2.5 px-5">Avg Confidence</th>
                    <th className="text-left py-2.5 px-5">Strength</th>
                  </tr>
                </thead>
                <tbody>
                  {stats.topSymbols.map((s, i) => (
                    <tr key={s.symbol} className="border-b border-border/30 hover:bg-bg/30 transition-colors">
                      <td className="py-2.5 px-5 text-text-muted font-mono">{i + 1}</td>
                      <td className="py-2.5 px-5 font-bold text-accent">{s.symbol}</td>
                      <td className="text-right py-2.5 px-5 font-mono text-text-primary">{s.buys}</td>
                      <td className="text-right py-2.5 px-5 font-mono text-text-primary">{s.avgConfidence}%</td>
                      <td className="py-2.5 px-5">
                        <div className="w-24 h-1.5 bg-bg rounded-full overflow-hidden">
                          <div className="h-full bg-accent rounded-full" style={{ width: `${s.avgConfidence}%` }} />
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </>
      )}

      {!isLoading && (!stats || stats.total === 0) && (
        <div className="bg-surface border border-border rounded-xl p-12 text-center">
          <BarChart3 className="w-10 h-10 text-text-muted mx-auto mb-3 opacity-30" />
          <p className="text-text-muted text-sm">No signals to analyze yet</p>
        </div>
      )}
    </div>
  );
}

function StatCard({ icon: Icon, label, value, color }: { icon: typeof BarChart3; label: string; value: string; color: string }) {
  return (
    <div className="bg-surface border border-border rounded-xl p-3 card-hover">
      <Icon className={`w-4 h-4 ${color} mb-1.5`} />
      <div className={`text-base font-black font-mono ${color}`}>{value}</div>
      <div className="text-[9px] text-text-muted mt-0.5">{label}</div>
    </div>
  );
}
