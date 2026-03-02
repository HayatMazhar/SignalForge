import { useQuery } from '@tanstack/react-query';
import { Globe, TrendingUp, TrendingDown } from 'lucide-react';
import { stocksApi } from '../api/stocks';
import { useNavigate } from 'react-router-dom';
import SectorHeatmap from '../components/charts/SectorHeatmap';
import LoadingSpinner from '../components/common/LoadingSpinner';

export default function MarketOverview() {
  const navigate = useNavigate();

  const { data: topMovers, isLoading } = useQuery({
    queryKey: ['top-movers'],
    queryFn: stocksApi.getTopMovers,
    refetchInterval: 60000,
  });

  const gainers = topMovers?.filter((m) => m.changePercent > 0) ?? [];
  const losers = topMovers?.filter((m) => m.changePercent < 0)?.sort((a, b) => a.changePercent - b.changePercent) ?? [];

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <Globe className="w-8 h-8 text-accent" />
        <h1 className="text-2xl font-bold text-text-primary">Market Overview</h1>
      </div>

      {/* Index Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <IndexCard name="S&P 500" value="5,248.32" change="+0.85%" positive />
        <IndexCard name="NASDAQ" value="16,892.45" change="+1.12%" positive />
        <IndexCard name="DOW" value="39,145.20" change="+0.42%" positive />
        <IndexCard name="VIX" value="14.82" change="-3.25%" positive={false} />
      </div>

      {/* Sector Heatmap */}
      <SectorHeatmap />

      {/* Gainers + Losers */}
      {isLoading ? (
        <LoadingSpinner text="Loading market data..." />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="bg-surface border border-border rounded-xl p-5">
            <div className="flex items-center gap-2 mb-4">
              <TrendingUp className="w-5 h-5 text-accent" />
              <h2 className="text-sm font-semibold text-text-muted uppercase tracking-wider">Top Gainers</h2>
            </div>
            <div className="space-y-1">
              {gainers.slice(0, 15).map((m, i) => (
                <div
                  key={m.symbol}
                  onClick={() => navigate(`/stocks/${m.symbol}`)}
                  className="flex items-center justify-between p-2.5 rounded-lg hover:bg-bg cursor-pointer transition-colors"
                >
                  <div className="flex items-center gap-3">
                    <span className="text-xs text-text-muted w-5">{i + 1}</span>
                    <span className="text-sm font-bold text-text-primary">{m.symbol}</span>
                    {m.name && <span className="text-xs text-text-muted hidden md:block">{m.name}</span>}
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="text-sm text-text-primary">${m.price.toFixed(2)}</span>
                    <span className="text-sm font-medium text-accent w-20 text-right">+{m.changePercent.toFixed(2)}%</span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="bg-surface border border-border rounded-xl p-5">
            <div className="flex items-center gap-2 mb-4">
              <TrendingDown className="w-5 h-5 text-danger" />
              <h2 className="text-sm font-semibold text-text-muted uppercase tracking-wider">Top Losers</h2>
            </div>
            <div className="space-y-1">
              {losers.slice(0, 15).map((m, i) => (
                <div
                  key={m.symbol}
                  onClick={() => navigate(`/stocks/${m.symbol}`)}
                  className="flex items-center justify-between p-2.5 rounded-lg hover:bg-bg cursor-pointer transition-colors"
                >
                  <div className="flex items-center gap-3">
                    <span className="text-xs text-text-muted w-5">{i + 1}</span>
                    <span className="text-sm font-bold text-text-primary">{m.symbol}</span>
                    {m.name && <span className="text-xs text-text-muted hidden md:block">{m.name}</span>}
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="text-sm text-text-primary">${m.price.toFixed(2)}</span>
                    <span className="text-sm font-medium text-danger w-20 text-right">{m.changePercent.toFixed(2)}%</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function IndexCard({ name, value, change, positive }: { name: string; value: string; change: string; positive: boolean }) {
  return (
    <div className="bg-surface border border-border rounded-xl p-4">
      <div className="text-xs text-text-muted mb-1">{name}</div>
      <div className="text-lg font-bold text-text-primary">{value}</div>
      <div className={`text-sm font-medium mt-1 flex items-center gap-1 ${positive ? 'text-accent' : 'text-danger'}`}>
        {positive ? <TrendingUp className="w-3.5 h-3.5" /> : <TrendingDown className="w-3.5 h-3.5" />}
        {change}
      </div>
    </div>
  );
}
