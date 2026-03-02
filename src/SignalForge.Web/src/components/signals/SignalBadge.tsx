import { TrendingUp, TrendingDown, Minus } from 'lucide-react';

interface SignalBadgeProps {
  type: 'Buy' | 'Sell' | 'Hold';
  size?: 'sm' | 'md' | 'lg';
}

const config = {
  Buy:  { color: 'text-accent', bg: 'bg-accent/10', icon: TrendingUp, label: 'BUY' },
  Sell: { color: 'text-danger', bg: 'bg-danger/10', icon: TrendingDown, label: 'SELL' },
  Hold: { color: 'text-warning', bg: 'bg-warning/10', icon: Minus, label: 'HOLD' },
};

const sizeClasses = {
  sm: 'text-[10px] px-1.5 py-0.5 gap-0.5',
  md: 'text-xs px-2 py-1 gap-1',
  lg: 'text-sm px-3 py-1.5 gap-1.5',
};

const iconSizes = { sm: 'w-3 h-3', md: 'w-3.5 h-3.5', lg: 'w-4 h-4' };

export default function SignalBadge({ type, size = 'md' }: SignalBadgeProps) {
  const { color, bg, icon: Icon, label } = config[type];

  return (
    <span className={`inline-flex items-center font-bold rounded-full ${color} ${bg} ${sizeClasses[size]}`}>
      <Icon className={iconSizes[size]} />
      {label}
    </span>
  );
}
