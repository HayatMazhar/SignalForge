import { useMutation } from '@tanstack/react-query';
import { Target, Shield, BarChart3, AlertTriangle, TrendingUp, TrendingDown, Minus, Activity, Sparkles } from 'lucide-react';
import api from '../api/client';
import LoadingSpinner from '../components/common/LoadingSpinner';

interface PositionSuggestion {
  symbol: string;
  currentWeight: number;
  targetWeight: number;
  action: 'Reduce' | 'Add' | 'Hold' | 'Take Profits';
  reason: string;
  rsi: number;
  trend: string;
}

interface OptimizationResult {
  totalValue: number;
  positions: number;
  diversificationScore: number;
  concentrationRisk: number;
  health: 'Excellent' | 'Good' | 'Fair' | 'Poor';
  suggestions: PositionSuggestion[];
}

const healthColors: Record<string, string> = {
  Excellent: 'text-accent',
  Good: 'text-info',
  Fair: 'text-warning',
  Poor: 'text-danger',
};

const actionConfig: Record<string, { color: string; bg: string; icon: typeof TrendingUp }> = {
  Reduce: { color: 'text-danger', bg: 'bg-danger/10', icon: TrendingDown },
  Add: { color: 'text-accent', bg: 'bg-accent/10', icon: TrendingUp },
  Hold: { color: 'text-info', bg: 'bg-info/10', icon: Minus },
  'Take Profits': { color: 'text-warning', bg: 'bg-warning/10', icon: Target },
};

export default function PortfolioOptimizer() {
  const mutation = useMutation({
    mutationFn: () => api.post('/ai/optimize-portfolio').then(r => r.data as OptimizationResult),
  });

  const result = mutation.data;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-accent/10 flex items-center justify-center">
            <Sparkles className="w-6 h-6 text-accent" />
          </div>
          <div>
            <h1 className="text-2xl font-black text-text-primary">Portfolio Optimizer</h1>
            <p className="text-xs text-text-muted">AI-powered portfolio analysis & rebalancing</p>
          </div>
        </div>
        <button onClick={() => mutation.mutate()} disabled={mutation.isPending}
          className="px-6 py-2.5 rounded-xl bg-accent text-bg text-sm font-bold flex items-center gap-2 hover:bg-accent/90 btn-shine glow-accent disabled:opacity-50 transition-colors">
          {mutation.isPending ? <div className="w-4 h-4 border-2 border-bg/30 border-t-bg rounded-full animate-spin" /> : <Activity className="w-4 h-4" />}
          {mutation.isPending ? 'Analyzing...' : 'Analyze Portfolio'}
        </button>
      </div>

      {mutation.isPending && <LoadingSpinner text="Optimizing your portfolio..." />}

      {mutation.error && (
        <div className="bg-danger/10 border border-danger/20 rounded-xl p-4 text-danger text-sm">
          Failed to optimize portfolio. Please try again.
        </div>
      )}

      {result && (
        <div className="space-y-6 animate-fade-up">
          <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
            <SummaryCard icon={BarChart3} label="Total Value" value={`$${result.totalValue.toLocaleString()}`} color="text-text-primary" />
            <SummaryCard icon={Target} label="Positions" value={result.positions.toString()} color="text-info" />
            <SummaryCard icon={Shield} label="Diversification" value={`${result.diversificationScore}/100`} color={result.diversificationScore >= 70 ? 'text-accent' : 'text-warning'} />
            <SummaryCard icon={AlertTriangle} label="Concentration Risk" value={`${result.concentrationRisk}%`} color={result.concentrationRisk <= 30 ? 'text-accent' : 'text-danger'} />
            <SummaryCard icon={Activity} label="Health" value={result.health} color={healthColors[result.health] ?? 'text-text-muted'} />
          </div>

          <div>
            <h2 className="text-xs font-bold text-text-muted uppercase tracking-wider mb-4">Position Suggestions</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {result.suggestions.map(s => {
                const config = actionConfig[s.action] ?? actionConfig.Hold;
                const ActionIcon = config.icon;
                return (
                  <div key={s.symbol} className="bg-surface border border-border rounded-xl p-5 card-hover">
                    <div className="flex items-center justify-between mb-3">
                      <span className="text-lg font-black text-accent">{s.symbol}</span>
                      <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold ${config.bg} ${config.color}`}>
                        <ActionIcon className="w-3 h-3" /> {s.action}
                      </span>
                    </div>

                    <div className="grid grid-cols-2 gap-3 mb-3">
                      <div>
                        <span className="text-[10px] text-text-muted uppercase tracking-wider">Current Weight</span>
                        <div className="text-sm font-bold font-mono text-text-primary">{s.currentWeight.toFixed(1)}%</div>
                      </div>
                      <div>
                        <span className="text-[10px] text-text-muted uppercase tracking-wider">Target Weight</span>
                        <div className="text-sm font-bold font-mono text-accent">{s.targetWeight.toFixed(1)}%</div>
                      </div>
                    </div>

                    <div className="flex items-center gap-3 mb-3">
                      <div className="flex items-center gap-1.5">
                        <span className="text-[10px] text-text-muted">RSI</span>
                        <span className={`text-xs font-mono font-bold ${s.rsi > 70 ? 'text-danger' : s.rsi < 30 ? 'text-accent' : 'text-text-primary'}`}>{s.rsi}</span>
                      </div>
                      <div className="flex items-center gap-1.5">
                        <span className="text-[10px] text-text-muted">Trend</span>
                        <span className="text-xs font-bold text-text-primary">{s.trend}</span>
                      </div>
                    </div>

                    <p className="text-xs text-text-muted leading-relaxed">{s.reason}</p>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function SummaryCard({ icon: Icon, label, value, color }: { icon: typeof BarChart3; label: string; value: string; color: string }) {
  return (
    <div className="bg-surface border border-border rounded-xl p-4 card-hover">
      <Icon className={`w-4 h-4 ${color} mb-2`} />
      <div className={`text-lg font-black font-mono ${color}`}>{value}</div>
      <div className="text-[10px] text-text-muted mt-0.5">{label}</div>
    </div>
  );
}
