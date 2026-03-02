import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { Calendar, Clock, TrendingUp, TrendingDown } from 'lucide-react';
import api from '../api/client';
import LoadingSpinner from '../components/common/LoadingSpinner';

interface EarningsEvent {
  symbol: string;
  company: string;
  date: string;
  time: string;
  epsEstimate: number | null;
  revenueEstimate: number | null;
  epsActual: number | null;
  revenueActual: number | null;
  surprisePercent: number | null;
}

type Tab = 'upcoming' | 'past';

export default function Earnings() {
  const [tab, setTab] = useState<Tab>('upcoming');
  const navigate = useNavigate();

  const { data: earnings, isLoading, error } = useQuery({
    queryKey: ['earnings-calendar'],
    queryFn: () => api.get('/calendar/earnings').then(r => r.data as EarningsEvent[]),
  });

  const upcoming = earnings?.filter(e => e.epsActual === null) ?? [];
  const past = earnings?.filter(e => e.epsActual !== null) ?? [];
  const list = tab === 'upcoming' ? upcoming : past;

  const formatRevenue = (val: number | null) => {
    if (val === null) return '—';
    if (Math.abs(val) >= 1e9) return `$${(val / 1e9).toFixed(2)}B`;
    if (Math.abs(val) >= 1e6) return `$${(val / 1e6).toFixed(1)}M`;
    return `$${val.toLocaleString()}`;
  };

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center py-20">
        <p className="text-danger text-sm">Failed to load earnings data</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-xl bg-accent/10 flex items-center justify-center">
          <Calendar className="w-6 h-6 text-accent" />
        </div>
        <div>
          <h1 className="text-2xl font-black text-text-primary">Earnings Calendar</h1>
          <p className="text-xs text-text-muted">AI-powered earnings predictions & results</p>
        </div>
      </div>

      <div className="flex gap-2">
        {(['upcoming', 'past'] as Tab[]).map(t => (
          <button key={t} onClick={() => setTab(t)}
            className={`px-4 py-2 rounded-lg text-sm font-bold transition-colors ${tab === t ? 'bg-accent text-bg' : 'bg-surface border border-border text-text-muted hover:text-text-primary'}`}>
            {t === 'upcoming' ? 'Upcoming' : 'Past Results'}
            <span className="ml-2 text-xs opacity-70">({t === 'upcoming' ? upcoming.length : past.length})</span>
          </button>
        ))}
      </div>

      {isLoading ? <LoadingSpinner text="Loading earnings..." /> : (
        <div className="bg-surface border border-border rounded-xl overflow-hidden animate-fade-up">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-text-muted border-b border-border bg-bg">
                <th className="text-left py-3 px-5">Symbol</th>
                <th className="text-left py-3 px-5">Company</th>
                <th className="text-left py-3 px-5">Date</th>
                <th className="text-left py-3 px-5">Time</th>
                {tab === 'upcoming' ? (
                  <>
                    <th className="text-right py-3 px-5">EPS Est.</th>
                    <th className="text-right py-3 px-5">Rev. Est.</th>
                  </>
                ) : (
                  <>
                    <th className="text-right py-3 px-5">EPS Act.</th>
                    <th className="text-right py-3 px-5">EPS Est.</th>
                    <th className="text-right py-3 px-5">Surprise</th>
                    <th className="text-center py-3 px-5">Result</th>
                  </>
                )}
              </tr>
            </thead>
            <tbody>
              {list.map(e => {
                const beat = e.surprisePercent !== null && e.surprisePercent >= 0;
                return (
                  <tr key={`${e.symbol}-${e.date}`}
                    onClick={() => navigate(`/stocks/${e.symbol}`)}
                    className="border-b border-border/50 hover:bg-bg cursor-pointer transition-colors">
                    <td className="py-3 px-5 font-bold text-accent">{e.symbol}</td>
                    <td className="py-3 px-5 text-text-primary">{e.company}</td>
                    <td className="py-3 px-5 text-text-muted">{new Date(e.date).toLocaleDateString()}</td>
                    <td className="py-3 px-5">
                      <span className="flex items-center gap-1 text-text-muted">
                        <Clock className="w-3 h-3" /> {e.time}
                      </span>
                    </td>
                    {tab === 'upcoming' ? (
                      <>
                        <td className="text-right py-3 px-5 font-mono text-text-primary">{e.epsEstimate !== null ? `$${e.epsEstimate.toFixed(2)}` : '—'}</td>
                        <td className="text-right py-3 px-5 font-mono text-text-primary">{formatRevenue(e.revenueEstimate)}</td>
                      </>
                    ) : (
                      <>
                        <td className="text-right py-3 px-5 font-mono text-text-primary">{e.epsActual !== null ? `$${e.epsActual.toFixed(2)}` : '—'}</td>
                        <td className="text-right py-3 px-5 font-mono text-text-muted">{e.epsEstimate !== null ? `$${e.epsEstimate.toFixed(2)}` : '—'}</td>
                        <td className={`text-right py-3 px-5 font-mono font-bold ${beat ? 'text-accent' : 'text-danger'}`}>
                          {e.surprisePercent !== null ? `${e.surprisePercent >= 0 ? '+' : ''}${e.surprisePercent.toFixed(1)}%` : '—'}
                        </td>
                        <td className="text-center py-3 px-5">
                          <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-bold ${beat ? 'bg-accent/10 text-accent' : 'bg-danger/10 text-danger'}`}>
                            {beat ? <TrendingUp className="w-3 h-3" /> : <TrendingDown className="w-3 h-3" />}
                            {beat ? 'Beat' : 'Missed'}
                          </span>
                        </td>
                      </>
                    )}
                  </tr>
                );
              })}
            </tbody>
          </table>
          {list.length === 0 && (
            <p className="text-text-muted text-sm text-center py-12">No {tab} earnings to show</p>
          )}
        </div>
      )}
    </div>
  );
}
