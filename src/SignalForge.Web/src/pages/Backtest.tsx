import { useState } from 'react';
import { useQuery, useMutation } from '@tanstack/react-query';
import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from 'recharts';
import { FlaskConical, Play, TrendingUp, TrendingDown, Target, Shield, BarChart3, Trophy } from 'lucide-react';
import { backtestApi } from '../api/backtest';
import LoadingSpinner from '../components/common/LoadingSpinner';

export default function Backtest() {
  const [symbol, setSymbol] = useState('AAPL');
  const [strategy, setStrategy] = useState('RSI');
  const [capital, setCapital] = useState(10000);
  const [days, setDays] = useState(365);
  const [stopLoss, setStopLoss] = useState(3);
  const [takeProfit, setTakeProfit] = useState(8);

  const { data: strategies } = useQuery({ queryKey: ['strategies'], queryFn: backtestApi.getStrategies });

  const mutation = useMutation({
    mutationFn: () => backtestApi.run({ symbol: symbol.toUpperCase(), strategy, initialCapital: capital, lookbackDays: days, stopLossPercent: stopLoss, takeProfitPercent: takeProfit }),
  });

  const result = mutation.data;

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-xl bg-purple/10 flex items-center justify-center">
          <FlaskConical className="w-6 h-6 text-purple" />
        </div>
        <div>
          <h1 className="text-2xl font-black text-text-primary">Backtesting Engine</h1>
          <p className="text-xs text-text-muted">Test trading strategies against historical data</p>
        </div>
      </div>

      {/* Config */}
      <div className="bg-surface border border-border rounded-xl p-5">
        <div className="grid grid-cols-2 md:grid-cols-6 gap-4 mb-4">
          <div>
            <label className="text-[10px] font-bold text-text-muted uppercase tracking-wider mb-1 block">Symbol</label>
            <input value={symbol} onChange={e => setSymbol(e.target.value)}
              className="w-full bg-bg border border-border rounded-lg px-3 py-2 text-sm text-text-primary font-mono focus:outline-none focus:border-accent/40" />
          </div>
          <div>
            <label className="text-[10px] font-bold text-text-muted uppercase tracking-wider mb-1 block">Strategy</label>
            <select value={strategy} onChange={e => setStrategy(e.target.value)}
              className="w-full bg-bg border border-border rounded-lg px-3 py-2 text-sm text-text-primary focus:outline-none focus:border-accent/40 appearance-none">
              {strategies?.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
            </select>
          </div>
          <div>
            <label className="text-[10px] font-bold text-text-muted uppercase tracking-wider mb-1 block">Capital ($)</label>
            <input type="number" value={capital} onChange={e => setCapital(+e.target.value)}
              className="w-full bg-bg border border-border rounded-lg px-3 py-2 text-sm text-text-primary font-mono focus:outline-none focus:border-accent/40" />
          </div>
          <div>
            <label className="text-[10px] font-bold text-text-muted uppercase tracking-wider mb-1 block">Period (days)</label>
            <input type="number" value={days} onChange={e => setDays(+e.target.value)}
              className="w-full bg-bg border border-border rounded-lg px-3 py-2 text-sm text-text-primary font-mono focus:outline-none focus:border-accent/40" />
          </div>
          <div>
            <label className="text-[10px] font-bold text-text-muted uppercase tracking-wider mb-1 block">Stop Loss %</label>
            <input type="number" value={stopLoss} onChange={e => setStopLoss(+e.target.value)} step="0.5"
              className="w-full bg-bg border border-border rounded-lg px-3 py-2 text-sm text-text-primary font-mono focus:outline-none focus:border-accent/40" />
          </div>
          <div>
            <label className="text-[10px] font-bold text-text-muted uppercase tracking-wider mb-1 block">Take Profit %</label>
            <input type="number" value={takeProfit} onChange={e => setTakeProfit(+e.target.value)} step="0.5"
              className="w-full bg-bg border border-border rounded-lg px-3 py-2 text-sm text-text-primary font-mono focus:outline-none focus:border-accent/40" />
          </div>
        </div>
        <button onClick={() => mutation.mutate()} disabled={mutation.isPending}
          className="px-6 py-2.5 rounded-xl bg-accent text-bg text-sm font-bold flex items-center gap-2 hover:bg-accent-dim btn-shine glow-accent disabled:opacity-50">
          {mutation.isPending ? <div className="w-4 h-4 border-2 border-bg/30 border-t-bg rounded-full animate-spin" /> : <Play className="w-4 h-4" />}
          {mutation.isPending ? 'Running...' : 'Run Backtest'}
        </button>
      </div>

      {mutation.isPending && <LoadingSpinner text="Simulating trades..." />}

      {result && (
        <>
          {/* Stats */}
          <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-8 gap-3">
            <Stat icon={TrendingUp} label="Total Return" value={`${result.totalReturnPercent >= 0 ? '+' : ''}${result.totalReturnPercent}%`} color={result.totalReturnPercent >= 0 ? 'text-accent' : 'text-danger'} />
            <Stat icon={Target} label="Final Capital" value={`$${result.finalCapital.toLocaleString()}`} color="text-text-primary" />
            <Stat icon={BarChart3} label="Total Trades" value={result.totalTrades.toString()} color="text-info" />
            <Stat icon={Trophy} label="Win Rate" value={`${result.winRate}%`} color={result.winRate >= 50 ? 'text-accent' : 'text-danger'} />
            <Stat icon={TrendingDown} label="Max Drawdown" value={`-${result.maxDrawdown}%`} color="text-danger" />
            <Stat icon={BarChart3} label="Sharpe Ratio" value={result.sharpeRatio.toFixed(2)} color={result.sharpeRatio >= 1 ? 'text-accent' : 'text-warning'} />
            <Stat icon={Shield} label="Profit Factor" value={result.profitFactor.toFixed(2)} color={result.profitFactor >= 1.5 ? 'text-accent' : 'text-warning'} />
            <Stat icon={TrendingUp} label="Winners" value={`${result.winningTrades}/${result.totalTrades}`} color="text-accent" />
          </div>

          {/* Equity Curve */}
          <div className="bg-surface border border-border rounded-xl p-5">
            <h3 className="text-xs font-bold text-text-muted uppercase tracking-wider mb-4">Equity Curve</h3>
            <ResponsiveContainer width="100%" height={250} minWidth={0}>
              <AreaChart data={result.equityCurve}>
                <defs>
                  <linearGradient id="eqGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor={result.totalReturn >= 0 ? '#00FF94' : '#FF3B5C'} stopOpacity={0.3} />
                    <stop offset="95%" stopColor={result.totalReturn >= 0 ? '#00FF94' : '#FF3B5C'} stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#1A1F35" />
                <XAxis dataKey="date" tick={{ fill: '#5B6378', fontSize: 9 }} axisLine={false} tickLine={false}
                  tickFormatter={(v: string) => new Date(v).toLocaleDateString('en-US', { month: 'short' })} />
                <YAxis tick={{ fill: '#5B6378', fontSize: 9 }} axisLine={false} tickLine={false}
                  tickFormatter={(v: number) => `$${(v / 1000).toFixed(1)}k`} />
                <Tooltip contentStyle={{ backgroundColor: '#0C0F1A', border: '1px solid #1A1F35', borderRadius: 8, fontSize: 11, color: '#F0F4F8' }}
                  formatter={(v: number | undefined) => [`$${(v ?? 0).toLocaleString()}`, 'Equity']} />
                <Area type="monotone" dataKey="equity" stroke={result.totalReturn >= 0 ? '#00FF94' : '#FF3B5C'} fill="url(#eqGrad)" strokeWidth={2} />
              </AreaChart>
            </ResponsiveContainer>
          </div>

          {/* Trade Log */}
          <div className="bg-surface border border-border rounded-xl overflow-hidden">
            <div className="px-5 py-3 border-b border-border bg-bg/30">
              <h3 className="text-xs font-bold text-text-muted uppercase tracking-wider">Trade Log ({result.trades.length})</h3>
            </div>
            <div className="max-h-80 overflow-y-auto">
              <table className="w-full text-[11px]">
                <thead><tr className="text-text-muted border-b border-border sticky top-0 bg-surface">
                  <th className="text-left py-2 px-4">Type</th><th className="text-right py-2 px-4">Entry</th>
                  <th className="text-right py-2 px-4">Exit</th><th className="text-right py-2 px-4">P&L</th>
                  <th className="text-right py-2 px-4">%</th><th className="text-left py-2 px-4">Reason</th>
                </tr></thead>
                <tbody>
                  {result.trades.map((t, i) => (
                    <tr key={i} className="border-b border-border/20 hover:bg-bg/30">
                      <td className="py-1.5 px-4 text-accent font-bold">{t.type}</td>
                      <td className="text-right py-1.5 px-4 text-text-primary font-mono">${t.entryPrice.toFixed(2)}</td>
                      <td className="text-right py-1.5 px-4 text-text-primary font-mono">${t.exitPrice.toFixed(2)}</td>
                      <td className={`text-right py-1.5 px-4 font-bold font-mono ${t.pnL >= 0 ? 'text-accent' : 'text-danger'}`}>{t.pnL >= 0 ? '+' : ''}${t.pnL.toFixed(2)}</td>
                      <td className={`text-right py-1.5 px-4 font-mono ${t.pnLPercent >= 0 ? 'text-accent' : 'text-danger'}`}>{t.pnLPercent >= 0 ? '+' : ''}{t.pnLPercent.toFixed(1)}%</td>
                      <td className="py-1.5 px-4 text-text-muted">{t.reason}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </>
      )}
    </div>
  );
}

function Stat({ icon: Icon, label, value, color }: { icon: typeof TrendingUp; label: string; value: string; color: string }) {
  return (
    <div className="bg-surface border border-border rounded-xl p-3 card-hover">
      <Icon className={`w-4 h-4 ${color} mb-1.5`} />
      <div className={`text-base font-black font-mono ${color}`}>{value}</div>
      <div className="text-[9px] text-text-muted mt-0.5">{label}</div>
    </div>
  );
}
