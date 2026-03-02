import { useState, useEffect, useCallback } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Users, UserPlus, UserMinus, Copy, Star, TrendingUp, Target, BarChart3 } from 'lucide-react';
import api from '../api/client';
import LoadingSpinner from '../components/common/LoadingSpinner';

interface Trader {
  userId: string;
  userName: string;
  avatar: string;
  totalReturn: number;
  winRate: number;
  totalSignals: number;
  followers: number;
  avgConfidence: number;
  rank: number;
}

const STORAGE_KEY = 'signalforge-following';

function getFollowing(): Record<string, { copying: boolean }> {
  try {
    return JSON.parse(localStorage.getItem(STORAGE_KEY) || '{}');
  } catch {
    return {};
  }
}

function saveFollowing(data: Record<string, { copying: boolean }>) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
}

export default function CopyTrading() {
  const [following, setFollowing] = useState<Record<string, { copying: boolean }>>(getFollowing);

  const { data: traders, isLoading, error } = useQuery({
    queryKey: ['copy-trading-leaderboard'],
    queryFn: () => api.get('/social/leaderboard').then(r => r.data as Trader[]),
  });

  useEffect(() => { saveFollowing(following); }, [following]);

  const isFollowing = useCallback((id: string) => id in following, [following]);

  const toggleFollow = (id: string) => {
    setFollowing(prev => {
      const next = { ...prev };
      if (next[id]) delete next[id];
      else next[id] = { copying: false };
      return next;
    });
  };

  const toggleCopy = (id: string) => {
    setFollowing(prev => ({
      ...prev,
      [id]: { ...prev[id], copying: !prev[id]?.copying },
    }));
  };

  const followedTraders = traders?.filter(t => isFollowing(t.userId)) ?? [];
  const discoverTraders = traders?.filter(t => !isFollowing(t.userId)) ?? [];

  if (isLoading) return <LoadingSpinner text="Loading traders..." />;

  if (error) {
    return (
      <div className="bg-danger/10 border border-danger/20 rounded-xl p-4 text-danger text-sm">
        Failed to load traders. Please try again later.
      </div>
    );
  }

  const TraderCard = ({ trader, showCopy }: { trader: Trader; showCopy: boolean }) => (
    <div className="bg-surface border border-border rounded-xl p-5 card-hover animate-fade-up">
      <div className="flex items-start justify-between mb-4">
        <div className="flex items-center gap-3">
          <div className="w-11 h-11 rounded-full bg-gradient-to-br from-accent/20 to-purple/20 flex items-center justify-center text-accent font-black text-sm">
            {trader.avatar}
          </div>
          <div>
            <div className="text-sm font-bold text-text-primary">{trader.userName}</div>
            <div className="text-[10px] text-text-muted flex items-center gap-1">
              <Star className="w-3 h-3 text-warning" /> Rank #{trader.rank}
            </div>
          </div>
        </div>
        <button
          onClick={() => toggleFollow(trader.userId)}
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-colors ${
            isFollowing(trader.userId)
              ? 'bg-danger/10 text-danger border border-danger/20 hover:bg-danger/20'
              : 'bg-accent/10 text-accent border border-accent/20 hover:bg-accent/20'
          }`}
        >
          {isFollowing(trader.userId) ? <><UserMinus className="w-3.5 h-3.5" /> Unfollow</> : <><UserPlus className="w-3.5 h-3.5" /> Follow</>}
        </button>
      </div>

      <div className="grid grid-cols-2 gap-3 mb-4">
        <div className="bg-bg rounded-lg p-2.5 text-center">
          <div className={`text-lg font-black font-mono ${trader.totalReturn >= 0 ? 'text-accent' : 'text-danger'}`}>
            {trader.totalReturn >= 0 ? '+' : ''}{trader.totalReturn}%
          </div>
          <div className="text-[10px] text-text-muted flex items-center justify-center gap-1">
            <TrendingUp className="w-3 h-3" /> Return
          </div>
        </div>
        <div className="bg-bg rounded-lg p-2.5 text-center">
          <div className="text-lg font-black font-mono text-text-primary">{trader.winRate}%</div>
          <div className="text-[10px] text-text-muted flex items-center justify-center gap-1">
            <Target className="w-3 h-3" /> Win Rate
          </div>
        </div>
      </div>

      <div className="flex items-center justify-between text-xs text-text-muted border-t border-border pt-3">
        <span className="flex items-center gap-1"><BarChart3 className="w-3 h-3" /> {trader.totalSignals} signals</span>
        <span className="flex items-center gap-1"><Users className="w-3 h-3" /> {trader.followers} followers</span>
      </div>

      {showCopy && isFollowing(trader.userId) && (
        <div className="mt-3 pt-3 border-t border-border">
          <button
            onClick={() => toggleCopy(trader.userId)}
            className={`w-full flex items-center justify-center gap-2 px-4 py-2 rounded-lg text-xs font-bold transition-colors ${
              following[trader.userId]?.copying
                ? 'bg-accent text-bg btn-shine glow-accent'
                : 'bg-bg text-text-muted border border-border hover:text-text-primary hover:border-accent/30'
            }`}
          >
            <Copy className="w-3.5 h-3.5" />
            {following[trader.userId]?.copying ? 'Copying Signals' : 'Copy Signals'}
          </button>
        </div>
      )}
    </div>
  );

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-xl bg-info/10 flex items-center justify-center">
          <Users className="w-6 h-6 text-info" />
        </div>
        <div>
          <h1 className="text-2xl font-black text-text-primary">Copy Trading</h1>
          <p className="text-xs text-text-muted">Follow top traders and copy their signals</p>
        </div>
      </div>

      {followedTraders.length > 0 && (
        <section>
          <h2 className="text-xs font-bold text-text-muted uppercase tracking-wider mb-4">
            Following ({followedTraders.length})
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {followedTraders.map(t => <TraderCard key={t.userId} trader={t} showCopy />)}
          </div>
        </section>
      )}

      <section>
        <h2 className="text-xs font-bold text-text-muted uppercase tracking-wider mb-4">
          Discover Traders ({discoverTraders.length})
        </h2>
        {discoverTraders.length === 0 ? (
          <div className="text-center py-12">
            <Users className="w-12 h-12 text-text-muted mx-auto mb-3" />
            <p className="text-text-muted">You're following everyone!</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {discoverTraders.map(t => <TraderCard key={t.userId} trader={t} showCopy={false} />)}
          </div>
        )}
      </section>
    </div>
  );
}
