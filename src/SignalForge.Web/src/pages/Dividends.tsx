import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { DollarSign, ArrowUpDown, TrendingUp, Award } from 'lucide-react';
import api from '../api/client';
import LoadingSpinner from '../components/common/LoadingSpinner';

interface DividendStock {
  symbol: string;
  yield: number;
  annualDividend: number;
  exDate: string;
  payDate: string;
  frequency: string;
  payoutRatio: number;
  growthRate5Y: number;
  consecutiveYears: number;
}

type SortKey = 'yield' | 'growthRate5Y' | 'payoutRatio';

const sortLabels: Record<SortKey, string> = {
  yield: 'Yield',
  growthRate5Y: 'Growth Rate',
  payoutRatio: 'Payout Ratio',
};

export default function Dividends() {
  const [sortBy, setSortBy] = useState<SortKey>('yield');

  const { data: dividends, isLoading, error } = useQuery({
    queryKey: ['dividends'],
    queryFn: () => api.get('/calendar/dividends').then(r => r.data as DividendStock[]),
  });

  const sorted = [...(dividends ?? [])].sort((a, b) => b[sortBy] - a[sortBy]);

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center py-20">
        <p className="text-danger text-sm">Failed to load dividend data</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-accent/10 flex items-center justify-center">
            <DollarSign className="w-6 h-6 text-accent" />
          </div>
          <div>
            <h1 className="text-2xl font-black text-text-primary">Dividend Tracker</h1>
            <p className="text-xs text-text-muted">Monitor yields, growth & payout schedules</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <ArrowUpDown className="w-4 h-4 text-text-muted" />
          {(Object.keys(sortLabels) as SortKey[]).map(key => (
            <button key={key} onClick={() => setSortBy(key)}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-colors ${sortBy === key ? 'bg-accent text-bg' : 'bg-surface border border-border text-text-muted hover:text-text-primary'}`}>
              {sortLabels[key]}
            </button>
          ))}
        </div>
      </div>

      {isLoading ? <LoadingSpinner text="Loading dividends..." /> : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {sorted.map(d => (
            <div key={d.symbol} className="bg-surface border border-border rounded-xl p-5 card-hover animate-fade-up">
              <div className="flex items-start justify-between mb-4">
                <div>
                  <span className="text-lg font-black text-accent">{d.symbol}</span>
                  {d.consecutiveYears >= 10 && (
                    <span className="ml-2 inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-warning/10 text-warning">
                      <Award className="w-3 h-3" />
                      {d.consecutiveYears}Y Streak
                    </span>
                  )}
                </div>
                <span className="text-xs font-bold text-text-muted bg-bg px-2 py-1 rounded-lg">{d.frequency}</span>
              </div>

              <div className="grid grid-cols-2 gap-3 mb-4">
                <div>
                  <div className="text-[10px] font-bold text-text-muted uppercase tracking-wider">Yield</div>
                  <div className="text-2xl font-black font-mono text-accent">{d.yield.toFixed(2)}%</div>
                </div>
                <div>
                  <div className="text-[10px] font-bold text-text-muted uppercase tracking-wider">Annual Div</div>
                  <div className="text-2xl font-black font-mono text-text-primary">${d.annualDividend.toFixed(2)}</div>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3 text-xs mb-4">
                <div>
                  <span className="text-text-muted">Ex-Date: </span>
                  <span className="text-text-primary font-mono">{new Date(d.exDate).toLocaleDateString()}</span>
                </div>
                <div>
                  <span className="text-text-muted">Pay Date: </span>
                  <span className="text-text-primary font-mono">{new Date(d.payDate).toLocaleDateString()}</span>
                </div>
              </div>

              <div className="mb-3">
                <div className="flex justify-between text-[10px] mb-1">
                  <span className="text-text-muted font-bold uppercase tracking-wider">Payout Ratio</span>
                  <span className={`font-mono font-bold ${d.payoutRatio > 80 ? 'text-danger' : d.payoutRatio > 60 ? 'text-warning' : 'text-accent'}`}>
                    {d.payoutRatio.toFixed(0)}%
                  </span>
                </div>
                <div className="w-full h-2 bg-bg rounded-full overflow-hidden">
                  <div
                    className={`h-full rounded-full transition-all ${d.payoutRatio > 80 ? 'bg-danger' : d.payoutRatio > 60 ? 'bg-warning' : 'bg-accent'}`}
                    style={{ width: `${Math.min(d.payoutRatio, 100)}%` }}
                  />
                </div>
              </div>

              <div className="flex items-center justify-between text-xs">
                <div className="flex items-center gap-1">
                  <TrendingUp className="w-3.5 h-3.5 text-accent" />
                  <span className="text-text-muted">5Y Growth:</span>
                  <span className={`font-mono font-bold ${d.growthRate5Y >= 0 ? 'text-accent' : 'text-danger'}`}>
                    {d.growthRate5Y >= 0 ? '+' : ''}{d.growthRate5Y.toFixed(1)}%
                  </span>
                </div>
                {d.consecutiveYears > 0 && d.consecutiveYears < 10 && (
                  <span className="text-text-muted font-mono">{d.consecutiveYears}Y streak</span>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {!isLoading && sorted.length === 0 && (
        <div className="bg-surface border border-border rounded-xl p-12 text-center">
          <DollarSign className="w-10 h-10 text-text-muted mx-auto mb-3 opacity-30" />
          <p className="text-text-muted text-sm">No dividend data available</p>
        </div>
      )}
    </div>
  );
}
