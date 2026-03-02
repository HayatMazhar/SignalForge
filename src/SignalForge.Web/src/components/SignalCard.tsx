import { useNavigate } from 'react-router-dom';
import { TrendingUp, TrendingDown, Minus, Clock, ArrowRight } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import type { Signal } from '../types';

const typeConfig: Record<string, { color: string; bg: string; border: string; glow: string; icon: typeof TrendingUp; gradient: string; label: string }> = {
  Buy: { color: 'text-accent', bg: 'bg-accent/10', border: 'border-accent/20', glow: 'glow-accent', icon: TrendingUp, gradient: 'from-accent/5 to-transparent', label: 'BUY' },
  Sell: { color: 'text-danger', bg: 'bg-danger/10', border: 'border-danger/20', glow: 'glow-danger', icon: TrendingDown, gradient: 'from-danger/5 to-transparent', label: 'SELL' },
  Hold: { color: 'text-warning', bg: 'bg-warning/10', border: 'border-warning/20', glow: '', icon: Minus, gradient: 'from-warning/5 to-transparent', label: 'HOLD' },
  '0': { color: 'text-accent', bg: 'bg-accent/10', border: 'border-accent/20', glow: 'glow-accent', icon: TrendingUp, gradient: 'from-accent/5 to-transparent', label: 'BUY' },
  '1': { color: 'text-danger', bg: 'bg-danger/10', border: 'border-danger/20', glow: 'glow-danger', icon: TrendingDown, gradient: 'from-danger/5 to-transparent', label: 'SELL' },
  '2': { color: 'text-warning', bg: 'bg-warning/10', border: 'border-warning/20', glow: '', icon: Minus, gradient: 'from-warning/5 to-transparent', label: 'HOLD' },
};

const defaultConfig = typeConfig.Hold;

export default function SignalCard({ signal }: { signal: Signal }) {
  const navigate = useNavigate();
  const config = typeConfig[String(signal.type)] ?? defaultConfig;
  const Icon = config.icon;

  return (
    <div className={`bg-surface border ${config.border} rounded-xl overflow-hidden card-hover group`}>
      {/* Gradient top accent */}
      <div className={`h-0.5 bg-gradient-to-r ${config.gradient}`} />

      <div className="p-5">
        <div className="flex items-start justify-between mb-3">
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-lg font-black text-text-primary tracking-tight">{signal.symbol}</h3>
              <span className={`${config.bg} ${config.color} px-2.5 py-0.5 rounded-full text-[11px] font-bold flex items-center gap-1`}>
                <Icon className="w-3 h-3" />
                {config.label}
              </span>
            </div>
            <div className="flex items-center gap-1.5 text-text-muted text-[10px] mt-1">
              <Clock className="w-3 h-3" />
              {formatDistanceToNow(new Date(signal.generatedAt), { addSuffix: true })}
            </div>
          </div>

          {/* Confidence Ring */}
          <div className="relative w-12 h-12 flex-shrink-0">
            <svg viewBox="0 0 36 36" className="w-12 h-12 -rotate-90">
              <circle cx="18" cy="18" r="14" fill="none" stroke="#1A1F35" strokeWidth="3" />
              <circle cx="18" cy="18" r="14" fill="none"
                stroke={signal.confidenceScore >= 65 ? '#00FF94' : signal.confidenceScore <= 35 ? '#FF3B5C' : '#FFB020'}
                strokeWidth="3" strokeLinecap="round"
                strokeDasharray={`${signal.confidenceScore * 0.88} 88`} />
            </svg>
            <div className="absolute inset-0 flex items-center justify-center">
              <span className="text-[10px] font-black text-text-primary">{signal.confidenceScore}%</span>
            </div>
          </div>
        </div>

        {/* Score Bars */}
        <div className="grid grid-cols-3 gap-3 mb-3">
          <ScoreBar label="Technical" value={signal.technicalScore} />
          <ScoreBar label="Sentiment" value={signal.sentimentScore} />
          <ScoreBar label="Options" value={signal.optionsScore} />
        </div>

        <p className="text-xs text-text-muted leading-relaxed line-clamp-2 mb-4">{signal.reasoning}</p>

        <button onClick={() => navigate(`/stocks/${signal.symbol}`)}
          className="w-full py-2 rounded-lg bg-bg text-text-primary text-xs font-semibold flex items-center justify-center gap-1.5 hover:bg-surface-light transition-colors group-hover:text-accent">
          View Analysis <ArrowRight className="w-3 h-3 group-hover:translate-x-0.5 transition-transform" />
        </button>
      </div>
    </div>
  );
}

function ScoreBar({ label, value }: { label: string; value: number }) {
  const color = value >= 65 ? 'bg-accent' : value <= 35 ? 'bg-danger' : 'bg-warning';
  return (
    <div>
      <div className="flex items-center justify-between mb-1">
        <span className="text-[9px] text-text-muted uppercase tracking-wider">{label}</span>
        <span className="text-[10px] font-bold text-text-primary font-mono">{value}%</span>
      </div>
      <div className="w-full bg-border rounded-full h-1">
        <div className={`h-1 rounded-full ${color} transition-all duration-700`} style={{ width: `${value}%` }} />
      </div>
    </div>
  );
}
