import { TrendingUp, TrendingDown } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

interface PriceCardProps {
  symbol: string;
  name?: string;
  price: number;
  change: number;
  changePercent: number;
  compact?: boolean;
}

export default function PriceCard({ symbol, name, price, change, changePercent, compact }: PriceCardProps) {
  const navigate = useNavigate();
  const isPositive = changePercent >= 0;

  if (compact) {
    return (
      <button
        onClick={() => navigate(`/stocks/${symbol}`)}
        className="flex items-center justify-between p-3 rounded-lg bg-bg hover:bg-surface-light transition-colors w-full"
      >
        <div>
          <span className="text-sm font-bold text-text-primary">{symbol}</span>
          {name && <p className="text-xs text-text-muted truncate max-w-[120px]">{name}</p>}
        </div>
        <div className="text-right">
          <div className="text-sm font-medium text-text-primary">${price.toFixed(2)}</div>
          <div className={`text-xs font-medium flex items-center gap-0.5 justify-end ${isPositive ? 'text-accent' : 'text-danger'}`}>
            {isPositive ? <TrendingUp className="w-3 h-3" /> : <TrendingDown className="w-3 h-3" />}
            {isPositive ? '+' : ''}{changePercent.toFixed(2)}%
          </div>
        </div>
      </button>
    );
  }

  return (
    <button
      onClick={() => navigate(`/stocks/${symbol}`)}
      className="bg-surface border border-border rounded-xl p-4 hover:bg-surface-light transition-colors text-left w-full"
    >
      <div className="flex items-start justify-between mb-2">
        <div>
          <h3 className="text-base font-bold text-text-primary">{symbol}</h3>
          {name && <p className="text-xs text-text-muted">{name}</p>}
        </div>
        <div className={`px-2 py-0.5 rounded text-xs font-bold ${isPositive ? 'bg-accent/10 text-accent' : 'bg-danger/10 text-danger'}`}>
          {isPositive ? '+' : ''}{changePercent.toFixed(2)}%
        </div>
      </div>
      <div className="text-xl font-bold text-text-primary">${price.toFixed(2)}</div>
      <div className={`text-sm mt-1 ${isPositive ? 'text-accent' : 'text-danger'}`}>
        {isPositive ? '+' : ''}{change.toFixed(2)} today
      </div>
    </button>
  );
}
