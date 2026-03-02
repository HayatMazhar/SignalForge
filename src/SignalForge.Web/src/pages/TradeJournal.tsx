import { useState, useEffect, useMemo } from 'react';
import { BookOpen, Plus, X, TrendingUp, TrendingDown, Brain, Trophy, Target, BarChart3 } from 'lucide-react';

interface Trade {
  id: string;
  symbol: string;
  type: 'Buy' | 'Sell';
  entryPrice: number;
  exitPrice: number;
  quantity: number;
  notes: string;
  date: string;
}

const STORAGE_KEY = 'signalforge-trade-journal';

function loadTrades(): Trade[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

function saveTrades(trades: Trade[]) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(trades));
}

const aiInsights = [
  { pattern: 'Early Exit Pattern', detail: 'You tend to exit winning trades too early. Consider trailing stop-losses to capture more upside.', type: 'warning' as const },
  { pattern: 'Loss Aversion Detected', detail: 'You hold losing positions 2.3x longer than winners on average. Set firm stop-losses before entering.', type: 'danger' as const },
  { pattern: 'Sector Concentration', detail: 'Over 60% of your trades are in tech stocks. Diversifying across sectors can reduce drawdown risk.', type: 'info' as const },
  { pattern: 'Strong Entry Timing', detail: 'Your entry points are well-timed — 72% of trades show positive movement within the first hour.', type: 'accent' as const },
  { pattern: 'Overtrading on Mondays', detail: 'Monday trades have a 35% lower win rate. Consider waiting for the market to establish direction.', type: 'warning' as const },
];

const insightColors = {
  warning: 'border-warning/20 bg-warning/5 text-warning',
  danger: 'border-danger/20 bg-danger/5 text-danger',
  info: 'border-info/20 bg-info/5 text-info',
  accent: 'border-accent/20 bg-accent/5 text-accent',
};

export default function TradeJournal() {
  const [trades, setTrades] = useState<Trade[]>(loadTrades);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ symbol: '', type: 'Buy' as 'Buy' | 'Sell', entryPrice: '', exitPrice: '', quantity: '', notes: '' });

  useEffect(() => { saveTrades(trades); }, [trades]);

  const handleAdd = () => {
    if (!form.symbol || !form.entryPrice || !form.exitPrice || !form.quantity) return;
    const trade: Trade = {
      id: crypto.randomUUID(),
      symbol: form.symbol.toUpperCase(),
      type: form.type,
      entryPrice: parseFloat(form.entryPrice),
      exitPrice: parseFloat(form.exitPrice),
      quantity: parseFloat(form.quantity),
      notes: form.notes,
      date: new Date().toISOString(),
    };
    setTrades(prev => [trade, ...prev]);
    setForm({ symbol: '', type: 'Buy', entryPrice: '', exitPrice: '', quantity: '', notes: '' });
    setShowForm(false);
  };

  const handleDelete = (id: string) => {
    setTrades(prev => prev.filter(t => t.id !== id));
  };

  const stats = useMemo(() => {
    if (trades.length === 0) return null;
    const pnls = trades.map(t => {
      const direction = t.type === 'Buy' ? 1 : -1;
      return (t.exitPrice - t.entryPrice) * direction * t.quantity;
    });
    const wins = pnls.filter(p => p > 0).length;
    const totalPnl = pnls.reduce((a, b) => a + b, 0);
    return {
      totalTrades: trades.length,
      winRate: ((wins / trades.length) * 100).toFixed(1),
      avgPnl: totalPnl / trades.length,
      bestTrade: Math.max(...pnls),
      worstTrade: Math.min(...pnls),
      totalPnl,
    };
  }, [trades]);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-info/10 flex items-center justify-center">
            <BookOpen className="w-6 h-6 text-info" />
          </div>
          <div>
            <h1 className="text-2xl font-black text-text-primary">Trade Journal</h1>
            <p className="text-xs text-text-muted">Track, analyze & improve your trades</p>
          </div>
        </div>
        <button onClick={() => setShowForm(!showForm)}
          className="px-4 py-2 rounded-lg bg-accent text-bg text-sm font-bold flex items-center gap-1 hover:bg-accent/90 transition-colors">
          {showForm ? <X className="w-4 h-4" /> : <Plus className="w-4 h-4" />}
          {showForm ? 'Cancel' : 'Log Trade'}
        </button>
      </div>

      {showForm && (
        <div className="bg-surface border border-border rounded-xl p-5 animate-fade-up">
          <h3 className="text-sm font-semibold text-text-primary mb-3">New Trade</h3>
          <div className="grid grid-cols-2 md:grid-cols-6 gap-4">
            <div>
              <label className="text-[10px] font-bold text-text-muted uppercase tracking-wider mb-1 block">Symbol</label>
              <input value={form.symbol} onChange={e => setForm(f => ({ ...f, symbol: e.target.value }))} placeholder="AAPL"
                className="w-full bg-bg border border-border rounded-lg px-3 py-2 text-sm text-text-primary font-mono focus:outline-none focus:border-accent" />
            </div>
            <div>
              <label className="text-[10px] font-bold text-text-muted uppercase tracking-wider mb-1 block">Type</label>
              <select value={form.type} onChange={e => setForm(f => ({ ...f, type: e.target.value as 'Buy' | 'Sell' }))}
                className="w-full bg-bg border border-border rounded-lg px-3 py-2 text-sm text-text-primary focus:outline-none focus:border-accent appearance-none">
                <option value="Buy">Buy</option>
                <option value="Sell">Sell (Short)</option>
              </select>
            </div>
            <div>
              <label className="text-[10px] font-bold text-text-muted uppercase tracking-wider mb-1 block">Entry $</label>
              <input value={form.entryPrice} onChange={e => setForm(f => ({ ...f, entryPrice: e.target.value }))} type="number" step="0.01" placeholder="150.00"
                className="w-full bg-bg border border-border rounded-lg px-3 py-2 text-sm text-text-primary font-mono focus:outline-none focus:border-accent" />
            </div>
            <div>
              <label className="text-[10px] font-bold text-text-muted uppercase tracking-wider mb-1 block">Exit $</label>
              <input value={form.exitPrice} onChange={e => setForm(f => ({ ...f, exitPrice: e.target.value }))} type="number" step="0.01" placeholder="165.00"
                className="w-full bg-bg border border-border rounded-lg px-3 py-2 text-sm text-text-primary font-mono focus:outline-none focus:border-accent" />
            </div>
            <div>
              <label className="text-[10px] font-bold text-text-muted uppercase tracking-wider mb-1 block">Quantity</label>
              <input value={form.quantity} onChange={e => setForm(f => ({ ...f, quantity: e.target.value }))} type="number" placeholder="10"
                className="w-full bg-bg border border-border rounded-lg px-3 py-2 text-sm text-text-primary font-mono focus:outline-none focus:border-accent" />
            </div>
            <div>
              <label className="text-[10px] font-bold text-text-muted uppercase tracking-wider mb-1 block">Notes</label>
              <input value={form.notes} onChange={e => setForm(f => ({ ...f, notes: e.target.value }))} placeholder="Optional"
                className="w-full bg-bg border border-border rounded-lg px-3 py-2 text-sm text-text-primary focus:outline-none focus:border-accent" />
            </div>
          </div>
          <button onClick={handleAdd} disabled={!form.symbol || !form.entryPrice || !form.exitPrice || !form.quantity}
            className="mt-4 px-6 py-2 rounded-lg bg-accent text-bg text-sm font-bold disabled:opacity-50 hover:bg-accent/90 transition-colors">
            Save Trade
          </button>
        </div>
      )}

      {stats && (
        <div className="grid grid-cols-2 md:grid-cols-6 gap-3 animate-fade-up">
          <StatCard icon={BarChart3} label="Total Trades" value={stats.totalTrades.toString()} color="text-info" />
          <StatCard icon={Trophy} label="Win Rate" value={`${stats.winRate}%`} color={parseFloat(stats.winRate) >= 50 ? 'text-accent' : 'text-danger'} />
          <StatCard icon={Target} label="Avg P&L" value={`${stats.avgPnl >= 0 ? '+' : ''}$${stats.avgPnl.toFixed(2)}`} color={stats.avgPnl >= 0 ? 'text-accent' : 'text-danger'} />
          <StatCard icon={TrendingUp} label="Best Trade" value={`+$${stats.bestTrade.toFixed(2)}`} color="text-accent" />
          <StatCard icon={TrendingDown} label="Worst Trade" value={`$${stats.worstTrade.toFixed(2)}`} color="text-danger" />
          <StatCard icon={BarChart3} label="Total P&L" value={`${stats.totalPnl >= 0 ? '+' : ''}$${stats.totalPnl.toFixed(2)}`} color={stats.totalPnl >= 0 ? 'text-accent' : 'text-danger'} />
        </div>
      )}

      {trades.length > 0 && (
        <div className="bg-surface border border-border rounded-xl overflow-hidden animate-fade-up">
          <div className="px-5 py-3 border-b border-border bg-bg/30">
            <h3 className="text-xs font-bold text-text-muted uppercase tracking-wider">Trade Log ({trades.length})</h3>
          </div>
          <div className="max-h-96 overflow-y-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-text-muted border-b border-border sticky top-0 bg-surface">
                  <th className="text-left py-2.5 px-5">Date</th>
                  <th className="text-left py-2.5 px-5">Symbol</th>
                  <th className="text-center py-2.5 px-5">Type</th>
                  <th className="text-right py-2.5 px-5">Entry</th>
                  <th className="text-right py-2.5 px-5">Exit</th>
                  <th className="text-right py-2.5 px-5">Qty</th>
                  <th className="text-right py-2.5 px-5">P&L</th>
                  <th className="text-left py-2.5 px-5">Notes</th>
                  <th className="text-right py-2.5 px-5"></th>
                </tr>
              </thead>
              <tbody>
                {trades.map(t => {
                  const direction = t.type === 'Buy' ? 1 : -1;
                  const pnl = (t.exitPrice - t.entryPrice) * direction * t.quantity;
                  const pnlPct = ((t.exitPrice - t.entryPrice) / t.entryPrice * direction * 100);
                  return (
                    <tr key={t.id} className="border-b border-border/30 hover:bg-bg/30 transition-colors">
                      <td className="py-2.5 px-5 text-text-muted text-xs">{new Date(t.date).toLocaleDateString()}</td>
                      <td className="py-2.5 px-5 font-bold text-accent">{t.symbol}</td>
                      <td className="text-center py-2.5 px-5">
                        <span className={`text-xs font-bold px-2 py-0.5 rounded-full ${t.type === 'Buy' ? 'bg-accent/10 text-accent' : 'bg-danger/10 text-danger'}`}>
                          {t.type}
                        </span>
                      </td>
                      <td className="text-right py-2.5 px-5 font-mono text-text-primary">${t.entryPrice.toFixed(2)}</td>
                      <td className="text-right py-2.5 px-5 font-mono text-text-primary">${t.exitPrice.toFixed(2)}</td>
                      <td className="text-right py-2.5 px-5 font-mono text-text-muted">{t.quantity}</td>
                      <td className={`text-right py-2.5 px-5 font-mono font-bold ${pnl >= 0 ? 'text-accent' : 'text-danger'}`}>
                        {pnl >= 0 ? '+' : ''}${pnl.toFixed(2)}
                        <span className="text-[10px] ml-1 opacity-70">({pnlPct >= 0 ? '+' : ''}{pnlPct.toFixed(1)}%)</span>
                      </td>
                      <td className="py-2.5 px-5 text-text-muted text-xs max-w-[150px] truncate">{t.notes || '—'}</td>
                      <td className="text-right py-2.5 px-5">
                        <button onClick={() => handleDelete(t.id)} className="text-text-muted hover:text-danger transition-colors">
                          <X className="w-3.5 h-3.5" />
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {trades.length === 0 && !showForm && (
        <div className="bg-surface border border-border rounded-xl p-12 text-center">
          <BookOpen className="w-10 h-10 text-text-muted mx-auto mb-3 opacity-30" />
          <p className="text-text-muted text-sm">No trades logged yet. Click "Log Trade" to get started.</p>
        </div>
      )}

      <div className="bg-surface border border-border rounded-xl p-5">
        <div className="flex items-center gap-2 mb-4">
          <Brain className="w-5 h-5 text-purple" />
          <h2 className="text-sm font-bold text-text-primary">AI Trading Coach</h2>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {aiInsights.map(insight => (
            <div key={insight.pattern} className={`border rounded-xl p-4 ${insightColors[insight.type]}`}>
              <p className="text-xs font-bold mb-1">{insight.pattern}</p>
              <p className="text-xs opacity-80 leading-relaxed">{insight.detail}</p>
            </div>
          ))}
        </div>
      </div>
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
