import { useQuery } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { formatDistanceToNow } from 'date-fns';
import { Zap, Newspaper, AlertTriangle, BarChart3, Landmark } from 'lucide-react';
import { insightsApi } from '../../api/insights';
import LoadingSpinner from '../common/LoadingSpinner';

const typeConfig: Record<string, { icon: typeof Zap; color: string; bg: string }> = {
  Signal: { icon: Zap, color: 'text-accent', bg: 'bg-accent/10' },
  News: { icon: Newspaper, color: 'text-blue-400', bg: 'bg-blue-400/10' },
  Alert: { icon: AlertTriangle, color: 'text-warning', bg: 'bg-warning/10' },
  Flow: { icon: BarChart3, color: 'text-purple-400', bg: 'bg-purple-400/10' },
  Economic: { icon: Landmark, color: 'text-sky-400', bg: 'bg-sky-400/10' },
};

const impactColors: Record<string, string> = {
  Bullish: 'text-accent',
  Bearish: 'text-danger',
  Neutral: 'text-text-muted',
};

export default function MarketPulse() {
  const navigate = useNavigate();
  const { data: events, isLoading } = useQuery({
    queryKey: ['market-pulse'],
    queryFn: insightsApi.getMarketPulse,
    refetchInterval: 60000,
  });

  if (isLoading) return <LoadingSpinner text="Loading market pulse..." />;

  return (
    <div className="bg-surface border border-border rounded-xl p-5">
      <h2 className="text-sm font-semibold text-text-muted uppercase tracking-wider mb-4">Market Pulse</h2>
      <div className="relative">
        <div className="absolute left-4 top-0 bottom-0 w-px bg-border" />
        <div className="space-y-0">
          {events?.map((event) => {
            const config = typeConfig[event.type] ?? typeConfig.News;
            const Icon = config.icon;
            return (
              <div key={event.id}
                className="relative pl-10 pr-2 py-3 hover:bg-bg/50 rounded-lg transition-colors cursor-pointer group"
                onClick={() => event.symbol !== 'FED' && event.symbol !== 'SPY' && event.symbol !== 'MARKET' ? navigate(`/stocks/${event.symbol}`) : undefined}>
                <div className={`absolute left-2 top-4 w-5 h-5 rounded-full ${config.bg} flex items-center justify-center ring-2 ring-surface z-10`}>
                  <Icon className={`w-3 h-3 ${config.color}`} />
                </div>
                <div className="flex items-start justify-between gap-2">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-0.5">
                      <span className="text-xs font-bold text-accent">{event.symbol}</span>
                      <span className={`text-[10px] font-semibold ${impactColors[event.impact] ?? 'text-text-muted'}`}>
                        {event.impact}
                      </span>
                    </div>
                    <p className="text-sm text-text-primary font-medium leading-snug">{event.title}</p>
                    <p className="text-xs text-text-muted mt-0.5 line-clamp-1 group-hover:line-clamp-none transition-all">{event.description}</p>
                  </div>
                  <span className="text-[10px] text-text-muted whitespace-nowrap flex-shrink-0 mt-1">
                    {formatDistanceToNow(new Date(event.timestamp), { addSuffix: true })}
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
