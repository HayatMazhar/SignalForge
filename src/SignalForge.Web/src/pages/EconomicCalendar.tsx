import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Landmark, Clock, AlertTriangle } from 'lucide-react';
import api from '../api/client';
import LoadingSpinner from '../components/common/LoadingSpinner';

interface EconomicEvent {
  id: string;
  date: string;
  time: string;
  name: string;
  impact: 'High' | 'Medium' | 'Low';
  forecast: string | null;
  previous: string | null;
  actual: string | null;
}

const impactFilters = ['All', 'High', 'Medium'] as const;
type ImpactFilter = (typeof impactFilters)[number];

const impactStyles: Record<string, { dot: string; badge: string }> = {
  High: { dot: 'bg-danger', badge: 'bg-danger/10 text-danger border-danger/20' },
  Medium: { dot: 'bg-warning', badge: 'bg-warning/10 text-warning border-warning/20' },
  Low: { dot: 'bg-info', badge: 'bg-info/10 text-info border-info/20' },
};

export default function EconomicCalendar() {
  const [impactFilter, setImpactFilter] = useState<ImpactFilter>('All');

  const { data: events, isLoading, error } = useQuery({
    queryKey: ['economic-calendar'],
    queryFn: () => api.get('/calendar/economic').then(r => r.data as EconomicEvent[]),
  });

  const filtered = events?.filter(e => impactFilter === 'All' || e.impact === impactFilter) ?? [];

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center py-20">
        <p className="text-danger text-sm">Failed to load economic calendar</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-xl bg-info/10 flex items-center justify-center">
          <Landmark className="w-6 h-6 text-info" />
        </div>
        <div>
          <h1 className="text-2xl font-black text-text-primary">Economic Calendar</h1>
          <p className="text-xs text-text-muted">Key economic events & data releases</p>
        </div>
      </div>

      <div className="flex gap-2">
        {impactFilters.map(f => (
          <button key={f} onClick={() => setImpactFilter(f)}
            className={`px-4 py-2 rounded-lg text-sm font-bold transition-colors ${impactFilter === f ? 'bg-accent text-bg' : 'bg-surface border border-border text-text-muted hover:text-text-primary'}`}>
            {f === 'All' ? 'All Events' : f + ' Impact'}
          </button>
        ))}
      </div>

      {isLoading ? <LoadingSpinner text="Loading events..." /> : (
        <div className="bg-surface border border-border rounded-xl p-5 animate-fade-up">
          <div className="relative">
            <div className="absolute left-4 top-0 bottom-0 w-px bg-border" />
            <div className="space-y-0">
              {filtered.map(event => {
                const style = impactStyles[event.impact] ?? impactStyles.Low;
                return (
                  <div key={event.id} className="relative pl-10 pr-2 py-4 hover:bg-bg/50 rounded-lg transition-colors group">
                    <div className={`absolute left-2.5 top-5 w-4 h-4 rounded-full ${style.dot} ring-4 ring-surface z-10 flex items-center justify-center`}>
                      {event.impact === 'High' && <AlertTriangle className="w-2.5 h-2.5 text-bg" />}
                    </div>

                    <div className="flex items-start justify-between gap-4">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${style.badge}`}>
                            {event.impact}
                          </span>
                          <span className="flex items-center gap-1 text-[11px] text-text-muted">
                            <Clock className="w-3 h-3" />
                            {new Date(event.date).toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })}
                            {event.time && ` · ${event.time}`}
                          </span>
                        </div>
                        <p className="text-sm font-semibold text-text-primary">{event.name}</p>

                        <div className="flex items-center gap-4 mt-2">
                          <DataPill label="Forecast" value={event.forecast} />
                          <DataPill label="Previous" value={event.previous} />
                          {event.actual !== null && (
                            <DataPill label="Actual" value={event.actual} highlight />
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
              {filtered.length === 0 && (
                <p className="text-text-muted text-sm text-center py-12 pl-10">No events match your filter</p>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function DataPill({ label, value, highlight }: { label: string; value: string | null; highlight?: boolean }) {
  return (
    <div className="flex items-center gap-1.5">
      <span className="text-[10px] text-text-muted uppercase tracking-wider">{label}</span>
      <span className={`text-xs font-mono font-bold ${highlight ? 'text-accent' : 'text-text-primary'}`}>
        {value ?? '—'}
      </span>
    </div>
  );
}
