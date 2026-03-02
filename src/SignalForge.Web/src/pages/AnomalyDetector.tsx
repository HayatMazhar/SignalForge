import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { AlertTriangle, Search, Zap, ShieldAlert, Activity, TrendingUp, BarChart3, Clock } from 'lucide-react';
import api from '../api/client';
import LoadingSpinner from '../components/common/LoadingSpinner';

interface Anomaly {
  id: string;
  type: string;
  severity: 'High' | 'Medium' | 'Low';
  description: string;
  detectedAt: string;
}

interface AnomalyResult {
  symbol: string;
  riskLevel: string;
  anomalies: Anomaly[];
}

const severityConfig = {
  High: { color: 'text-danger', bg: 'bg-danger/10', border: 'border-danger/20' },
  Medium: { color: 'text-warning', bg: 'bg-warning/10', border: 'border-warning/20' },
  Low: { color: 'text-accent', bg: 'bg-accent/10', border: 'border-accent/20' },
};

const typeIcons: Record<string, typeof Activity> = {
  Volume: BarChart3,
  Price: TrendingUp,
  Volatility: Activity,
  default: Zap,
};

function getTypeIcon(type: string) {
  for (const key of Object.keys(typeIcons)) {
    if (type.toLowerCase().includes(key.toLowerCase())) return typeIcons[key];
  }
  return typeIcons.default;
}

export default function AnomalyDetector() {
  const [symbol, setSymbol] = useState('');
  const [activeSymbol, setActiveSymbol] = useState('');

  const { data: result, isLoading, error } = useQuery({
    queryKey: ['anomalies', activeSymbol],
    queryFn: () => api.get(`/ai/anomalies/${activeSymbol}`).then(r => r.data as AnomalyResult),
    enabled: !!activeSymbol,
  });

  const handleScan = () => {
    if (symbol.trim()) setActiveSymbol(symbol.trim().toUpperCase());
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-xl bg-warning/10 flex items-center justify-center">
          <AlertTriangle className="w-6 h-6 text-warning" />
        </div>
        <div>
          <h1 className="text-2xl font-black text-text-primary">Anomaly Detector</h1>
          <p className="text-xs text-text-muted">AI-powered anomaly detection for unusual market activity</p>
        </div>
      </div>

      <div className="bg-surface border border-border rounded-xl p-5">
        <div className="flex gap-3">
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-text-muted" />
            <input
              value={symbol}
              onChange={e => setSymbol(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && handleScan()}
              placeholder="Enter symbol (e.g. AAPL)"
              className="w-full bg-bg border border-border rounded-lg pl-10 pr-4 py-2.5 text-sm text-text-primary font-mono placeholder-text-muted focus:outline-none focus:border-accent"
            />
          </div>
          <button
            onClick={handleScan}
            disabled={!symbol.trim() || isLoading}
            className="px-6 py-2.5 rounded-xl bg-accent text-bg text-sm font-bold flex items-center gap-2 hover:bg-accent/90 btn-shine glow-accent disabled:opacity-50 transition-colors"
          >
            <Zap className="w-4 h-4" />
            Scan
          </button>
        </div>
      </div>

      {isLoading && <LoadingSpinner text={`Scanning ${activeSymbol} for anomalies...`} />}

      {error && (
        <div className="bg-danger/10 border border-danger/20 rounded-xl p-4 text-danger text-sm">
          Failed to scan for anomalies. Please check the symbol and try again.
        </div>
      )}

      {result && (
        <div className="space-y-4 animate-fade-up">
          {/* Risk Level */}
          <div className="bg-surface border border-border rounded-xl p-5 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <ShieldAlert className={`w-6 h-6 ${result.riskLevel === 'Normal' ? 'text-accent' : 'text-warning'}`} />
              <div>
                <div className="text-xs text-text-muted uppercase tracking-wider">Risk Level</div>
                <div className="text-lg font-black text-text-primary">{result.symbol}</div>
              </div>
            </div>
            <span className={`px-4 py-1.5 rounded-full text-sm font-bold ${
              result.riskLevel === 'Normal'
                ? 'bg-accent/10 text-accent border border-accent/20'
                : 'bg-warning/10 text-warning border border-warning/20'
            }`}>
              {result.riskLevel}
            </span>
          </div>

          {/* Anomalies */}
          {result.anomalies.length === 0 ? (
            <div className="text-center py-16">
              <ShieldAlert className="w-12 h-12 text-accent mx-auto mb-3" />
              <p className="text-text-primary font-bold">No anomalies detected</p>
              <p className="text-text-muted text-sm mt-1">All metrics appear normal for {result.symbol}</p>
            </div>
          ) : (
            <div className="space-y-3">
              <h3 className="text-xs font-bold text-text-muted uppercase tracking-wider">
                {result.anomalies.length} Anomal{result.anomalies.length === 1 ? 'y' : 'ies'} Detected
              </h3>
              {result.anomalies.map((anomaly) => {
                const sev = severityConfig[anomaly.severity];
                const Icon = getTypeIcon(anomaly.type);
                return (
                  <div key={anomaly.id} className={`bg-surface border ${sev.border} rounded-xl p-5 card-hover`}>
                    <div className="flex items-start gap-4">
                      <div className={`w-10 h-10 rounded-xl ${sev.bg} flex items-center justify-center flex-shrink-0`}>
                        <Icon className={`w-5 h-5 ${sev.color}`} />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <span className="text-sm font-bold text-text-primary">{anomaly.type}</span>
                          <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${sev.bg} ${sev.color}`}>
                            {anomaly.severity}
                          </span>
                        </div>
                        <p className="text-sm text-text-muted leading-relaxed">{anomaly.description}</p>
                        <div className="flex items-center gap-1 mt-2 text-[10px] text-text-muted">
                          <Clock className="w-3 h-3" />
                          {new Date(anomaly.detectedAt).toLocaleString()}
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {!activeSymbol && !isLoading && (
        <div className="text-center py-16">
          <AlertTriangle className="w-12 h-12 text-text-muted mx-auto mb-3" />
          <p className="text-text-muted">Enter a stock symbol to scan for anomalies</p>
        </div>
      )}
    </div>
  );
}
