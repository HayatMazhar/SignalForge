import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Radar, ArrowUpDown, Clock } from 'lucide-react';
import { signalsApi } from '../api/signals';
import api from '../api/client';
import { useAssetModeStore } from '../stores/assetModeStore';
import SignalCard from '../components/SignalCard';
import LoadingSpinner from '../components/common/LoadingSpinner';
import { getSignalLabel } from '../utils/signalType';
import type { Signal } from '../types';

const filters = [
  { label: 'All', value: undefined },
  { label: 'Buy', value: 'Buy' },
  { label: 'Sell', value: 'Sell' },
  { label: 'Hold', value: 'Hold' },
];

const sortOptions = [
  { label: 'Latest', value: 'recent' },
  { label: 'Confidence', value: 'confidence' },
];

const timeRanges = [
  { label: '24h', hours: 24 },
  { label: '3d', hours: 72 },
  { label: '7d', hours: 168 },
  { label: 'All', hours: 0 },
];

export default function Signals() {
  const { mode } = useAssetModeStore();
  const [activeFilter, setActiveFilter] = useState<string | undefined>(undefined);
  const [sortBy, setSortBy] = useState('recent');
  const [timeRange, setTimeRange] = useState(0);

  const { data: signals, isLoading } = useQuery({
    queryKey: ['signals', mode, activeFilter],
    queryFn: () =>
      mode === 'crypto'
        ? api.get<Signal[]>('/crypto/signals', { params: { type: activeFilter, limit: 100 } }).then(r => r.data)
        : signalsApi.getSignals(activeFilter, 100),
    refetchInterval: 30000,
  });

  const filteredSignals = signals?.filter((s: Signal) => {
    if (timeRange > 0) {
      const cutoff = new Date(Date.now() - timeRange * 60 * 60 * 1000);
      return new Date(s.generatedAt) >= cutoff;
    }
    return true;
  }).sort((a: Signal, b: Signal) => {
    if (sortBy === 'confidence') return b.confidenceScore - a.confidenceScore;
    return new Date(b.generatedAt).getTime() - new Date(a.generatedAt).getTime();
  }) ?? [];

  const buyCount = signals?.filter((s: Signal) => getSignalLabel(s.type) === 'Buy').length ?? 0;
  const sellCount = signals?.filter((s: Signal) => getSignalLabel(s.type) === 'Sell').length ?? 0;
  const holdCount = signals?.filter((s: Signal) => getSignalLabel(s.type) === 'Hold').length ?? 0;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Radar className="w-8 h-8 text-accent" />
          <div>
            <h1 className="text-2xl font-bold text-text-primary">{mode === 'crypto' ? 'Crypto Signals' : 'AI Signals'}</h1>
            <p className="text-sm text-text-muted">{filteredSignals.length} signals</p>
          </div>
        </div>
      </div>

      {/* Stats Bar */}
      <div className="grid grid-cols-3 gap-4">
        <div className="bg-surface border border-accent/20 rounded-xl p-3 text-center">
          <div className="text-2xl font-black text-accent">{buyCount}</div>
          <div className="text-[10px] text-text-muted uppercase">Buy Signals</div>
        </div>
        <div className="bg-surface border border-danger/20 rounded-xl p-3 text-center">
          <div className="text-2xl font-black text-danger">{sellCount}</div>
          <div className="text-[10px] text-text-muted uppercase">Sell Signals</div>
        </div>
        <div className="bg-surface border border-warning/20 rounded-xl p-3 text-center">
          <div className="text-2xl font-black text-warning">{holdCount}</div>
          <div className="text-[10px] text-text-muted uppercase">Hold Signals</div>
        </div>
      </div>

      {/* Filter Bar */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div className="flex gap-2">
          {filters.map((f) => (
            <button key={f.label} onClick={() => setActiveFilter(f.value)}
              className={`px-4 py-1.5 rounded-lg text-sm font-medium transition-colors ${
                activeFilter === f.value
                  ? 'bg-accent/10 text-accent border border-accent/30'
                  : 'bg-surface text-text-muted border border-border hover:text-text-primary'
              }`}>
              {f.label}
            </button>
          ))}
        </div>
        <div className="flex gap-2">
          <div className="flex items-center gap-1 bg-surface border border-border rounded-lg overflow-hidden">
            <Clock className="w-3.5 h-3.5 text-text-muted ml-2" />
            {timeRanges.map((t) => (
              <button key={t.label} onClick={() => setTimeRange(t.hours)}
                className={`px-2.5 py-1.5 text-xs font-medium transition-colors ${
                  timeRange === t.hours ? 'bg-accent/10 text-accent' : 'text-text-muted hover:text-text-primary'
                }`}>
                {t.label}
              </button>
            ))}
          </div>
          <div className="flex items-center gap-1 bg-surface border border-border rounded-lg overflow-hidden">
            <ArrowUpDown className="w-3.5 h-3.5 text-text-muted ml-2" />
            {sortOptions.map((s) => (
              <button key={s.value} onClick={() => setSortBy(s.value)}
                className={`px-2.5 py-1.5 text-xs font-medium transition-colors ${
                  sortBy === s.value ? 'bg-accent/10 text-accent' : 'text-text-muted hover:text-text-primary'
                }`}>
                {s.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      {isLoading ? <LoadingSpinner text="Loading signals..." /> : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredSignals.map((s: Signal) => <SignalCard key={s.id} signal={s} />)}
          {filteredSignals.length === 0 && (
            <div className="col-span-full text-center py-12">
              <Radar className="w-12 h-12 text-text-muted mx-auto mb-3" />
              <p className="text-text-muted">No signals match your filters</p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
