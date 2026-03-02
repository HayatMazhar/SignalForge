import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { Users, ArrowUpRight, ArrowDownRight } from 'lucide-react';
import api from '../api/client';
import LoadingSpinner from '../components/common/LoadingSpinner';

interface InsiderTrade {
  id: string;
  date: string;
  symbol: string;
  insiderName: string;
  title: string;
  type: 'Buy' | 'Sell';
  shares: number;
  value: number;
}

type TradeFilter = 'All' | 'Buy' | 'Sell';

const formatValue = (v: number) => {
  if (v >= 1e9) return `$${(v / 1e9).toFixed(2)}B`;
  if (v >= 1e6) return `$${(v / 1e6).toFixed(1)}M`;
  if (v >= 1e3) return `$${(v / 1e3).toFixed(0)}K`;
  return `$${v.toLocaleString()}`;
};

export default function InsiderTrades() {
  const [filter, setFilter] = useState<TradeFilter>('All');
  const navigate = useNavigate();

  const { data: trades, isLoading, error } = useQuery({
    queryKey: ['insider-trades'],
    queryFn: () => api.get('/calendar/insider-trades').then(r => r.data as InsiderTrade[]),
  });

  const filtered = trades?.filter(t => filter === 'All' || t.type === filter) ?? [];

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center py-20">
        <p className="text-danger text-sm">Failed to load insider trades</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-xl bg-purple/10 flex items-center justify-center">
          <Users className="w-6 h-6 text-purple" />
        </div>
        <div>
          <h1 className="text-2xl font-black text-text-primary">Insider Trades</h1>
          <p className="text-xs text-text-muted">Track insider buying & selling activity</p>
        </div>
      </div>

      <div className="flex gap-2">
        {(['All', 'Buy', 'Sell'] as TradeFilter[]).map(f => (
          <button key={f} onClick={() => setFilter(f)}
            className={`px-4 py-2 rounded-lg text-sm font-bold transition-colors ${filter === f ? 'bg-accent text-bg' : 'bg-surface border border-border text-text-muted hover:text-text-primary'}`}>
            {f === 'All' ? 'All Trades' : f === 'Buy' ? 'Purchases' : 'Sales'}
          </button>
        ))}
      </div>

      {isLoading ? <LoadingSpinner text="Loading insider trades..." /> : (
        <div className="bg-surface border border-border rounded-xl overflow-hidden animate-fade-up">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-text-muted border-b border-border bg-bg">
                <th className="text-left py-3 px-5">Date</th>
                <th className="text-left py-3 px-5">Symbol</th>
                <th className="text-left py-3 px-5">Insider</th>
                <th className="text-left py-3 px-5">Title</th>
                <th className="text-center py-3 px-5">Type</th>
                <th className="text-right py-3 px-5">Shares</th>
                <th className="text-right py-3 px-5">Value</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map(t => {
                const isBuy = t.type === 'Buy';
                return (
                  <tr key={t.id}
                    onClick={() => navigate(`/stocks/${t.symbol}`)}
                    className={`border-b border-border/50 hover:bg-bg cursor-pointer transition-colors ${isBuy ? 'hover:border-l-2 hover:border-l-accent' : 'hover:border-l-2 hover:border-l-danger'}`}>
                    <td className="py-3 px-5 text-text-muted">{new Date(t.date).toLocaleDateString()}</td>
                    <td className="py-3 px-5 font-bold text-accent">{t.symbol}</td>
                    <td className="py-3 px-5 text-text-primary">{t.insiderName}</td>
                    <td className="py-3 px-5 text-text-muted text-xs">{t.title}</td>
                    <td className="text-center py-3 px-5">
                      <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold ${isBuy ? 'bg-accent/10 text-accent' : 'bg-danger/10 text-danger'}`}>
                        {isBuy ? <ArrowUpRight className="w-3 h-3" /> : <ArrowDownRight className="w-3 h-3" />}
                        {t.type}
                      </span>
                    </td>
                    <td className="text-right py-3 px-5 font-mono text-text-primary">{t.shares.toLocaleString()}</td>
                    <td className={`text-right py-3 px-5 font-mono font-bold ${isBuy ? 'text-accent' : 'text-danger'}`}>
                      {formatValue(t.value)}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
          {filtered.length === 0 && (
            <p className="text-text-muted text-sm text-center py-12">No insider trades to show</p>
          )}
        </div>
      )}
    </div>
  );
}
