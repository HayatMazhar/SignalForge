import { useQuery } from '@tanstack/react-query';
import { TrendingUp, TrendingDown, Activity } from 'lucide-react';
import { stocksApi } from '../api/stocks';
import { watchlistApi } from '../api/watchlist';
import { useMarketHub } from '../hooks/useMarketHub';
import { useWatchlistStore } from '../stores/watchlistStore';
import { usePriceStore } from '../stores/priceStore';
import SignalFeed from '../components/signals/SignalFeed';
import SectorHeatmap from '../components/charts/SectorHeatmap';
import PriceCard from '../components/common/PriceCard';
import LoadingSpinner from '../components/common/LoadingSpinner';
import FearGreedGauge from '../components/insights/FearGreedGauge';
import MarketPulse from '../components/insights/MarketPulse';
import { useEffect } from 'react';

export default function Dashboard() {
  const setSymbols = useWatchlistStore((s) => s.setSymbols);
  const watchlistSymbols = useWatchlistStore((s) => s.symbols);
  const prices = usePriceStore((s) => s.prices);

  const { data: watchlist } = useQuery({
    queryKey: ['watchlist'],
    queryFn: watchlistApi.get,
  });

  useEffect(() => {
    if (watchlist) setSymbols(watchlist.map((w) => w.symbol));
  }, [watchlist, setSymbols]);

  useMarketHub(watchlistSymbols);

  const { data: topMovers, isLoading: moversLoading } = useQuery({
    queryKey: ['top-movers'],
    queryFn: stocksApi.getTopMovers,
    refetchInterval: 120000,
  });

  const gainers = topMovers?.filter((m) => m.changePercent > 0).slice(0, 6) ?? [];
  const losers = topMovers?.filter((m) => m.changePercent < 0).sort((a, b) => a.changePercent - b.changePercent).slice(0, 4) ?? [];

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <Activity className="w-8 h-8 text-accent" />
        <h1 className="text-2xl font-bold text-text-primary">Dashboard</h1>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left: Market Overview */}
        <div className="space-y-4">
          <div className="bg-surface border border-border rounded-xl p-5">
            <h2 className="text-sm font-semibold text-text-muted uppercase tracking-wider mb-4">Market Movers</h2>
            {moversLoading ? <LoadingSpinner size="sm" /> : (
              <div className="space-y-2">
                {gainers.map((m) => (
                  <div key={m.symbol} className="flex items-center justify-between">
                    <span className="text-sm font-medium text-text-primary">{m.symbol}</span>
                    <div className="flex items-center gap-2">
                      <span className="text-sm text-text-primary">${m.price.toFixed(2)}</span>
                      <span className="text-xs font-medium text-accent flex items-center gap-0.5">
                        <TrendingUp className="w-3 h-3" />+{m.changePercent.toFixed(2)}%
                      </span>
                    </div>
                  </div>
                ))}
                <div className="border-t border-border my-2" />
                {losers.map((m) => (
                  <div key={m.symbol} className="flex items-center justify-between">
                    <span className="text-sm font-medium text-text-primary">{m.symbol}</span>
                    <div className="flex items-center gap-2">
                      <span className="text-sm text-text-primary">${m.price.toFixed(2)}</span>
                      <span className="text-xs font-medium text-danger flex items-center gap-0.5">
                        <TrendingDown className="w-3 h-3" />{m.changePercent.toFixed(2)}%
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
          <SectorHeatmap />
          <FearGreedGauge />
        </div>

        {/* Center: Signal Feed + Market Pulse */}
        <div className="space-y-4">
          <div className="bg-surface border border-border rounded-xl p-5">
            <SignalFeed limit={6} />
          </div>
          <MarketPulse />
        </div>

        {/* Right: Watchlist */}
        <div className="bg-surface border border-border rounded-xl p-5">
          <h2 className="text-sm font-semibold text-text-muted uppercase tracking-wider mb-4">Watchlist</h2>
          <div className="space-y-2">
            {watchlist?.map((w) => {
              const quote = prices[w.symbol];
              return quote ? (
                <PriceCard
                  key={w.symbol}
                  symbol={w.symbol}
                  price={quote.price}
                  change={quote.change}
                  changePercent={quote.changePercent}
                  compact
                />
              ) : (
                <div key={w.symbol} className="flex items-center justify-between p-3 rounded-lg bg-bg">
                  <span className="text-sm font-bold text-text-primary">{w.symbol}</span>
                  <span className="text-xs text-text-muted">Loading...</span>
                </div>
              );
            })}
            {(!watchlist || watchlist.length === 0) && (
              <p className="text-text-muted text-sm text-center py-8">Add stocks to your watchlist</p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
