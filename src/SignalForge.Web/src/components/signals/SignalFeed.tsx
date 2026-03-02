import { useQuery } from '@tanstack/react-query';
import { Zap } from 'lucide-react';
import { signalsApi } from '../../api/signals';
import SignalCard from '../SignalCard';
import LoadingSpinner from '../common/LoadingSpinner';

interface SignalFeedProps {
  limit?: number;
  showHeader?: boolean;
}

export default function SignalFeed({ limit = 10, showHeader = true }: SignalFeedProps) {
  const { data: signals, isLoading } = useQuery({
    queryKey: ['signals-feed', limit],
    queryFn: () => signalsApi.getSignals(undefined, limit),
    refetchInterval: 30000,
  });

  return (
    <div>
      {showHeader && (
        <div className="flex items-center gap-2 mb-4">
          <Zap className="w-4 h-4 text-accent" />
          <h2 className="text-sm font-semibold text-text-muted uppercase tracking-wider">Live Signal Feed</h2>
        </div>
      )}
      {isLoading ? (
        <LoadingSpinner text="Loading signals..." />
      ) : (
        <div className="space-y-4 max-h-[600px] overflow-y-auto">
          {signals?.map((s) => <SignalCard key={s.id} signal={s} />)}
          {(!signals || signals.length === 0) && (
            <p className="text-text-muted text-sm text-center py-8">No signals yet</p>
          )}
        </div>
      )}
    </div>
  );
}
