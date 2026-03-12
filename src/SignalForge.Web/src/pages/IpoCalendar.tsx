import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Rocket, Calendar, Building2 } from 'lucide-react';
import api from '../api/client';
import LoadingSpinner from '../components/common/LoadingSpinner';

interface IpoEvent {
  company: string;
  symbol: string;
  date: string;
  exchange: string;
  priceRangeLow: number;
  priceRangeHigh: number;
  shares: number;
  valuation: number;
  sector: string;
  status: 'Upcoming' | 'Filed' | 'Priced' | 'Expected';
  leadUnderwriter: string;
}

type StatusFilter = 'All' | 'Upcoming' | 'Filed' | 'Expected';

const statusStyles: Record<string, string> = {
  Upcoming: 'bg-accent/10 text-accent',
  Filed: 'bg-info/10 text-info',
  Priced: 'bg-purple/10 text-purple',
  Expected: 'bg-warning/10 text-warning',
};

const formatValue = (v: number) => {
  if (v >= 1e9) return `$${(v / 1e9).toFixed(1)}B`;
  if (v >= 1e6) return `$${(v / 1e6).toFixed(0)}M`;
  return `$${v.toLocaleString()}`;
};

export default function IpoCalendar() {
  const [filter, setFilter] = useState<StatusFilter>('All');

  const { data: ipos, isLoading, error } = useQuery({
    queryKey: ['ipo-calendar'],
    queryFn: () => api.get('/calendar/ipos').then(r => r.data as IpoEvent[]),
  });

  const filtered = ipos?.filter(i => filter === 'All' || i.status === filter) ?? [];

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center py-20">
        <p className="text-danger text-sm">Failed to load IPO calendar</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-xl bg-purple/10 flex items-center justify-center">
          <Rocket className="w-6 h-6 text-purple" />
        </div>
        <div>
          <h1 className="text-2xl font-black text-text-primary">IPO Calendar</h1>
          <p className="text-xs text-text-muted">Upcoming & recent initial public offerings</p>
        </div>
      </div>

      <div className="flex gap-2">
        {(['All', 'Upcoming', 'Filed', 'Expected'] as StatusFilter[]).map(f => (
          <button key={f} onClick={() => setFilter(f)}
            className={`px-4 py-2 rounded-lg text-sm font-bold transition-colors ${filter === f ? 'bg-accent text-bg' : 'bg-surface border border-border text-text-muted hover:text-text-primary'}`}>
            {f}
            {f !== 'All' && <span className="ml-2 text-xs opacity-70">({ipos?.filter(i => i.status === f).length ?? 0})</span>}
          </button>
        ))}
      </div>

      {isLoading ? <LoadingSpinner text="Loading IPOs..." /> : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filtered.map(ipo => (
            <div key={`${ipo.symbol}-${ipo.date}`} className="bg-surface border border-border rounded-xl p-5 card-hover animate-fade-up">
              <div className="flex items-start justify-between mb-3">
                <div>
                  <h3 className="text-sm font-bold text-text-primary leading-tight">{ipo.company}</h3>
                  <span className="text-lg font-black text-accent">{ipo.symbol}</span>
                </div>
                <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold ${statusStyles[ipo.status]}`}>
                  {ipo.status}
                </span>
              </div>

              <div className="space-y-2.5 text-xs mb-4">
                <div className="flex items-center gap-2 text-text-muted">
                  <Calendar className="w-3.5 h-3.5" />
                  <span>{new Date(ipo.date).toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric', year: 'numeric' })}</span>
                </div>
                <div className="flex items-center gap-2 text-text-muted">
                  <Building2 className="w-3.5 h-3.5" />
                  <span>{ipo.exchange}</span>
                  <span className="px-2 py-0.5 rounded bg-bg text-text-muted font-bold">{ipo.sector}</span>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3 mb-3">
                <div>
                  <div className="text-[10px] font-bold text-text-muted uppercase tracking-wider">Price Range</div>
                  <div className="text-sm font-black font-mono text-text-primary">
                    ${ipo.priceRangeLow} – ${ipo.priceRangeHigh}
                  </div>
                </div>
                <div>
                  <div className="text-[10px] font-bold text-text-muted uppercase tracking-wider">Valuation</div>
                  <div className="text-sm font-black font-mono text-accent">{formatValue(ipo.valuation)}</div>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3 text-xs">
                <div>
                  <span className="text-text-muted">Shares: </span>
                  <span className="text-text-primary font-mono">{(ipo.shares / 1e6).toFixed(1)}M</span>
                </div>
                <div>
                  <span className="text-text-muted">Lead: </span>
                  <span className="text-text-primary">{ipo.leadUnderwriter}</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {!isLoading && filtered.length === 0 && (
        <div className="bg-surface border border-border rounded-xl p-12 text-center">
          <Rocket className="w-10 h-10 text-text-muted mx-auto mb-3 opacity-30" />
          <p className="text-text-muted text-sm">No IPOs match the current filter</p>
        </div>
      )}
    </div>
  );
}
