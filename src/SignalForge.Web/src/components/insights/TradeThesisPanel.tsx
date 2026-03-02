import { useQuery } from '@tanstack/react-query';
import { FileText, TrendingUp, TrendingDown, Target, Shield, Clock, ArrowRight } from 'lucide-react';
import { insightsApi } from '../../api/insights';
import LoadingSpinner from '../common/LoadingSpinner';

const verdictConfig: Record<string, { color: string; bg: string }> = {
  'Strong Buy': { color: 'text-accent', bg: 'bg-accent/10' },
  'Buy': { color: 'text-green-400', bg: 'bg-green-400/10' },
  'Hold': { color: 'text-warning', bg: 'bg-warning/10' },
  'Sell': { color: 'text-orange-400', bg: 'bg-orange-400/10' },
  'Strong Sell': { color: 'text-danger', bg: 'bg-danger/10' },
};

export default function TradeThesisPanel({ symbol }: { symbol: string }) {
  const { data: thesis, isLoading, refetch } = useQuery({
    queryKey: ['thesis', symbol],
    queryFn: () => insightsApi.getThesis(symbol),
    enabled: false,
  });

  if (!thesis && !isLoading) {
    return (
      <div className="text-center py-8">
        <FileText className="w-12 h-12 text-text-muted mx-auto mb-3" />
        <h3 className="text-lg font-bold text-text-primary mb-2">AI Trade Thesis</h3>
        <p className="text-sm text-text-muted mb-4 max-w-md mx-auto">
          Generate a comprehensive investment thesis with bull/bear cases, entry/exit prices, and risk analysis powered by AI.
        </p>
        <button onClick={() => refetch()}
          className="px-6 py-2.5 rounded-lg bg-accent text-bg font-bold hover:bg-accent/90 transition-colors inline-flex items-center gap-2">
          <FileText className="w-4 h-4" /> Generate Thesis
        </button>
      </div>
    );
  }

  if (isLoading) return <LoadingSpinner text="AI is analyzing all available data..." />;
  if (!thesis) return null;

  const vc = verdictConfig[thesis.verdict] ?? verdictConfig['Hold'];

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <span className={`text-2xl font-black ${vc.color}`}>{thesis.verdict.toUpperCase()}</span>
          <div className={`${vc.bg} ${vc.color} px-3 py-1 rounded-full text-sm font-bold`}>
            {thesis.confidenceScore}% Confidence
          </div>
        </div>
        <div className="flex items-center gap-1 text-text-muted text-xs">
          <Clock className="w-3 h-3" />
          {thesis.timeHorizon}
        </div>
      </div>

      {/* Executive Summary */}
      <div className="bg-bg rounded-xl p-4 border-l-4" style={{ borderColor: vc.color.includes('accent') || vc.color.includes('green') ? '#00FF94' : vc.color.includes('danger') || vc.color.includes('orange') ? '#EF4444' : '#F59E0B' }}>
        <p className="text-sm text-text-primary leading-relaxed">{thesis.executiveSummary}</p>
      </div>

      {/* Price Targets */}
      <div className="grid grid-cols-4 gap-3">
        <PriceBox icon={ArrowRight} label="Entry" value={thesis.suggestedEntry} color="text-blue-400" />
        <PriceBox icon={Target} label="Target" value={thesis.targetPrice} color="text-accent" />
        <PriceBox icon={Shield} label="Stop Loss" value={thesis.stopLoss} color="text-danger" />
        <div className="bg-bg rounded-xl p-3 text-center">
          <div className="text-[10px] text-text-muted uppercase mb-1">R/R Ratio</div>
          <div className={`text-xl font-black ${thesis.riskRewardRatio >= 2 ? 'text-accent' : 'text-warning'}`}>
            {thesis.riskRewardRatio}:1
          </div>
        </div>
      </div>

      {/* Bull / Bear Case */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="bg-accent/5 border border-accent/20 rounded-xl p-4">
          <div className="flex items-center gap-2 mb-2">
            <TrendingUp className="w-4 h-4 text-accent" />
            <h4 className="text-sm font-bold text-accent">Bull Case</h4>
          </div>
          <p className="text-xs text-text-muted leading-relaxed">{thesis.bullCase}</p>
        </div>
        <div className="bg-danger/5 border border-danger/20 rounded-xl p-4">
          <div className="flex items-center gap-2 mb-2">
            <TrendingDown className="w-4 h-4 text-danger" />
            <h4 className="text-sm font-bold text-danger">Bear Case</h4>
          </div>
          <p className="text-xs text-text-muted leading-relaxed">{thesis.bearCase}</p>
        </div>
      </div>

      {/* Key Factors */}
      <div>
        <h4 className="text-xs font-semibold text-text-muted uppercase tracking-wider mb-3">Key Factors</h4>
        <div className="space-y-2">
          {thesis.keyFactors.map((f) => (
            <div key={f.name} className="bg-bg rounded-lg p-3">
              <div className="flex items-center justify-between mb-1">
                <div className="flex items-center gap-2">
                  <span className="text-sm font-medium text-text-primary">{f.name}</span>
                  <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded ${
                    f.impact === 'Positive' || f.impact === 'Bullish' || f.impact === 'Favorable' ? 'bg-accent/10 text-accent' :
                    f.impact === 'Negative' || f.impact === 'Bearish' ? 'bg-danger/10 text-danger' :
                    'bg-warning/10 text-warning'
                  }`}>{f.impact}</span>
                </div>
                <span className="text-sm font-bold text-text-primary">{f.score.toFixed(0)}/100</span>
              </div>
              <div className="w-full bg-border rounded-full h-1.5 mb-1.5">
                <div className="h-1.5 rounded-full bg-accent/50 transition-all duration-700" style={{ width: `${f.score}%` }} />
              </div>
              <p className="text-[11px] text-text-muted">{f.detail}</p>
            </div>
          ))}
        </div>
      </div>

      <button onClick={() => refetch()}
        className="w-full py-2 rounded-lg bg-surface-light text-text-primary text-sm font-medium hover:bg-border transition-colors">
        Regenerate Thesis
      </button>
    </div>
  );
}

function PriceBox({ icon: Icon, label, value, color }: { icon: typeof Target; label: string; value: number; color: string }) {
  return (
    <div className="bg-bg rounded-xl p-3 text-center">
      <Icon className={`w-4 h-4 ${color} mx-auto mb-1`} />
      <div className="text-[10px] text-text-muted uppercase">{label}</div>
      <div className="text-base font-bold text-text-primary">${value.toFixed(2)}</div>
    </div>
  );
}
