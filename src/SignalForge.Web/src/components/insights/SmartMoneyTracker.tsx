import { useQuery } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { TrendingUp, TrendingDown, Eye } from 'lucide-react';
import { insightsApi } from '../../api/insights';
import LoadingSpinner from '../common/LoadingSpinner';

function formatM(n: number) {
  if (Math.abs(n) >= 1e9) return `$${(n / 1e9).toFixed(1)}B`;
  if (Math.abs(n) >= 1e6) return `$${(n / 1e6).toFixed(1)}M`;
  return `$${(n / 1e3).toFixed(0)}K`;
}

export default function SmartMoneyTracker() {
  const navigate = useNavigate();
  const { data: flows, isLoading } = useQuery({
    queryKey: ['smart-money'],
    queryFn: insightsApi.getSmartMoney,
    refetchInterval: 120000,
  });

  if (isLoading) return <LoadingSpinner text="Tracking smart money..." />;

  return (
    <div className="bg-surface border border-border rounded-xl p-5">
      <div className="flex items-center gap-2 mb-4">
        <Eye className="w-4 h-4 text-purple-400" />
        <h2 className="text-sm font-semibold text-text-muted uppercase tracking-wider">Smart Money Flow</h2>
      </div>

      <div className="space-y-2">
        {flows?.map((f) => {
          const isPositive = f.netFlow > 0;
          const maxFlow = Math.max(...(flows?.map(fl => Math.abs(fl.netFlow)) ?? [1]));
          const barWidth = Math.abs(f.netFlow) / maxFlow * 100;

          return (
            <div key={f.symbol}
              onClick={() => navigate(`/stocks/${f.symbol}`)}
              className="bg-bg rounded-lg p-3 hover:bg-surface-light transition-colors cursor-pointer">
              <div className="flex items-center justify-between mb-1.5">
                <div className="flex items-center gap-2">
                  <span className="text-sm font-bold text-text-primary">{f.symbol}</span>
                  <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded-full ${
                    f.signal?.includes('Strong') && isPositive ? 'bg-accent/20 text-accent' :
                    isPositive ? 'bg-accent/10 text-accent' :
                    f.signal?.includes('Strong') ? 'bg-danger/20 text-danger' :
                    'bg-danger/10 text-danger'
                  }`}>
                    {f.signal}
                  </span>
                </div>
                <div className={`flex items-center gap-1 text-sm font-bold ${isPositive ? 'text-accent' : 'text-danger'}`}>
                  {isPositive ? <TrendingUp className="w-3.5 h-3.5" /> : <TrendingDown className="w-3.5 h-3.5" />}
                  {formatM(f.netFlow)}
                </div>
              </div>

              <div className="flex items-center gap-2">
                <div className="flex-1 h-2 bg-border rounded-full overflow-hidden">
                  <div className={`h-full rounded-full transition-all duration-700 ${isPositive ? 'bg-accent/60' : 'bg-danger/60'}`}
                    style={{ width: `${barWidth}%` }} />
                </div>
                <span className="text-[10px] text-text-muted w-16 text-right">
                  DP: {f.darkPoolPercent}%
                </span>
              </div>

              <div className="flex items-center justify-between mt-1.5 text-[10px] text-text-muted">
                <span>Inst: {formatM(f.institutionalBuy)} buy / {formatM(f.institutionalSell)} sell</span>
                <span>Retail: {formatM(f.retailBuy)} buy / {formatM(f.retailSell)} sell</span>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
