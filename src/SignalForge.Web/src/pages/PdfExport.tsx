import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { FileDown, Search, Printer, Download, Zap, TrendingUp, TrendingDown, Target, ShieldAlert } from 'lucide-react';
import api from '../api/client';
import LoadingSpinner from '../components/common/LoadingSpinner';
import type { TradeThesis } from '../types';

export default function PdfExport() {
  const [symbol, setSymbol] = useState('');
  const [activeSymbol, setActiveSymbol] = useState('');

  const { data: thesis, isLoading, error } = useQuery({
    queryKey: ['pdf-thesis', activeSymbol],
    queryFn: () => api.get(`/insights/thesis/${activeSymbol}`).then(r => r.data as TradeThesis),
    enabled: !!activeSymbol,
  });

  const handleGenerate = () => {
    if (symbol.trim()) setActiveSymbol(symbol.trim().toUpperCase());
  };

  const handleDownloadText = () => {
    if (!thesis) return;
    const lines = [
      `SignalForge Investment Report`,
      `${'='.repeat(40)}`,
      `Symbol: ${thesis.symbol}`,
      `Generated: ${new Date(thesis.generatedAt).toLocaleString()}`,
      ``,
      `VERDICT: ${thesis.verdict} (Confidence: ${thesis.confidenceScore}%)`,
      ``,
      `EXECUTIVE SUMMARY`,
      `${'-'.repeat(20)}`,
      thesis.executiveSummary,
      ``,
      `BULL CASE`,
      `${'-'.repeat(20)}`,
      thesis.bullCase,
      ``,
      `BEAR CASE`,
      `${'-'.repeat(20)}`,
      thesis.bearCase,
      ``,
      `PRICE TARGETS`,
      `${'-'.repeat(20)}`,
      `Entry: $${thesis.suggestedEntry.toFixed(2)}`,
      `Target: $${thesis.targetPrice.toFixed(2)}`,
      `Stop Loss: $${thesis.stopLoss.toFixed(2)}`,
      `Risk/Reward: ${thesis.riskRewardRatio.toFixed(2)}x`,
      `Time Horizon: ${thesis.timeHorizon}`,
      ``,
      `KEY FACTORS`,
      `${'-'.repeat(20)}`,
      ...thesis.keyFactors.map(f => `• ${f.name} (${f.impact}, Score: ${f.score}/10): ${f.detail}`),
      ``,
      `${'='.repeat(40)}`,
      `Powered by SignalForge`,
    ];
    const blob = new Blob([lines.join('\n')], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `SignalForge_${thesis.symbol}_Report.txt`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handlePrint = () => window.print();

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3 print:hidden">
        <div className="w-10 h-10 rounded-xl bg-accent/10 flex items-center justify-center">
          <FileDown className="w-6 h-6 text-accent" />
        </div>
        <div>
          <h1 className="text-2xl font-black text-text-primary">Export Report</h1>
          <p className="text-xs text-text-muted">Generate and download investment reports</p>
        </div>
      </div>

      <div className="bg-surface border border-border rounded-xl p-5 print:hidden">
        <div className="flex gap-3">
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-text-muted" />
            <input
              value={symbol}
              onChange={e => setSymbol(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && handleGenerate()}
              placeholder="Enter symbol (e.g. AAPL)"
              className="w-full bg-bg border border-border rounded-lg pl-10 pr-4 py-2.5 text-sm text-text-primary font-mono placeholder-text-muted focus:outline-none focus:border-accent"
            />
          </div>
          <button
            onClick={handleGenerate}
            disabled={!symbol.trim() || isLoading}
            className="px-6 py-2.5 rounded-xl bg-accent text-bg text-sm font-bold flex items-center gap-2 hover:bg-accent/90 btn-shine glow-accent disabled:opacity-50 transition-colors"
          >
            <Zap className="w-4 h-4" />
            Generate Report
          </button>
        </div>
      </div>

      {isLoading && <LoadingSpinner text={`Generating ${activeSymbol} report...`} />}

      {error && (
        <div className="bg-danger/10 border border-danger/20 rounded-xl p-4 text-danger text-sm print:hidden">
          Failed to generate report. Please check the symbol and try again.
        </div>
      )}

      {thesis && (
        <div className="space-y-6 animate-fade-up">
          {/* Action buttons */}
          <div className="flex gap-3 print:hidden">
            <button
              onClick={handleDownloadText}
              className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-surface border border-border text-sm font-bold text-text-primary hover:border-accent/30 transition-colors"
            >
              <Download className="w-4 h-4" /> Download as Text
            </button>
            <button
              onClick={handlePrint}
              className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-surface border border-border text-sm font-bold text-text-primary hover:border-accent/30 transition-colors"
            >
              <Printer className="w-4 h-4" /> Print Report
            </button>
          </div>

          {/* Report */}
          <div className="bg-surface border border-border rounded-2xl p-8 print:bg-white print:text-black print:border-gray-300">
            {/* Header */}
            <div className="flex items-center justify-between pb-6 border-b border-border print:border-gray-300 mb-6">
              <div>
                <div className="flex items-center gap-2 mb-1">
                  <Zap className="w-5 h-5 text-accent print:text-green-600" />
                  <span className="text-sm font-black text-accent print:text-green-600 tracking-wide">SignalForge</span>
                </div>
                <h2 className="text-3xl font-black text-text-primary print:text-black">{thesis.symbol}</h2>
                <p className="text-xs text-text-muted print:text-gray-500 mt-1">
                  Investment Report &mdash; {new Date(thesis.generatedAt).toLocaleDateString()}
                </p>
              </div>
              <div className="text-right">
                <div className={`text-xl font-black ${thesis.verdict.toLowerCase().includes('bull') ? 'text-accent' : thesis.verdict.toLowerCase().includes('bear') ? 'text-danger' : 'text-warning'} print:text-black`}>
                  {thesis.verdict}
                </div>
                <div className="text-xs text-text-muted print:text-gray-500 mt-1">
                  Confidence: <span className="font-bold font-mono">{thesis.confidenceScore}%</span>
                </div>
              </div>
            </div>

            {/* Executive Summary */}
            <section className="mb-6">
              <h3 className="text-xs font-bold text-text-muted print:text-gray-500 uppercase tracking-wider mb-3">Executive Summary</h3>
              <p className="text-sm text-text-primary print:text-black leading-relaxed">{thesis.executiveSummary}</p>
            </section>

            {/* Bull / Bear */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
              <div className="bg-accent/5 border border-accent/20 rounded-xl p-5 print:border-green-300 print:bg-green-50">
                <div className="flex items-center gap-2 mb-3">
                  <TrendingUp className="w-4 h-4 text-accent print:text-green-600" />
                  <h4 className="text-xs font-bold text-accent print:text-green-600 uppercase tracking-wider">Bull Case</h4>
                </div>
                <p className="text-sm text-text-primary print:text-black leading-relaxed">{thesis.bullCase}</p>
              </div>
              <div className="bg-danger/5 border border-danger/20 rounded-xl p-5 print:border-red-300 print:bg-red-50">
                <div className="flex items-center gap-2 mb-3">
                  <TrendingDown className="w-4 h-4 text-danger print:text-red-600" />
                  <h4 className="text-xs font-bold text-danger print:text-red-600 uppercase tracking-wider">Bear Case</h4>
                </div>
                <p className="text-sm text-text-primary print:text-black leading-relaxed">{thesis.bearCase}</p>
              </div>
            </div>

            {/* Price Targets */}
            <section className="mb-6">
              <h3 className="text-xs font-bold text-text-muted print:text-gray-500 uppercase tracking-wider mb-3 flex items-center gap-2">
                <Target className="w-3.5 h-3.5" /> Price Targets
              </h3>
              <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
                {[
                  { label: 'Entry', value: `$${thesis.suggestedEntry.toFixed(2)}`, color: 'text-text-primary' },
                  { label: 'Target', value: `$${thesis.targetPrice.toFixed(2)}`, color: 'text-accent' },
                  { label: 'Stop Loss', value: `$${thesis.stopLoss.toFixed(2)}`, color: 'text-danger' },
                  { label: 'Risk/Reward', value: `${thesis.riskRewardRatio.toFixed(2)}x`, color: 'text-info' },
                  { label: 'Time Horizon', value: thesis.timeHorizon, color: 'text-purple' },
                ].map(item => (
                  <div key={item.label} className="bg-bg rounded-xl p-3 text-center print:bg-gray-100">
                    <div className={`text-lg font-black font-mono ${item.color} print:text-black`}>{item.value}</div>
                    <div className="text-[10px] text-text-muted print:text-gray-500 uppercase">{item.label}</div>
                  </div>
                ))}
              </div>
            </section>

            {/* Key Factors */}
            <section>
              <h3 className="text-xs font-bold text-text-muted print:text-gray-500 uppercase tracking-wider mb-3 flex items-center gap-2">
                <ShieldAlert className="w-3.5 h-3.5" /> Key Factors
              </h3>
              <div className="space-y-3">
                {thesis.keyFactors.map(f => (
                  <div key={f.name} className="bg-bg rounded-xl p-4 print:bg-gray-100">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-sm font-bold text-text-primary print:text-black">{f.name}</span>
                      <div className="flex items-center gap-2">
                        <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                          f.impact === 'Bullish' ? 'bg-accent/10 text-accent' :
                          f.impact === 'Bearish' ? 'bg-danger/10 text-danger' :
                          'bg-warning/10 text-warning'
                        } print:text-black print:bg-gray-200`}>
                          {f.impact}
                        </span>
                        <span className="text-xs font-mono font-bold text-text-primary print:text-black">{f.score}/10</span>
                      </div>
                    </div>
                    <p className="text-xs text-text-muted print:text-gray-600 leading-relaxed">{f.detail}</p>
                  </div>
                ))}
              </div>
            </section>
          </div>
        </div>
      )}

      {!activeSymbol && !isLoading && (
        <div className="text-center py-16 print:hidden">
          <FileDown className="w-12 h-12 text-text-muted mx-auto mb-3" />
          <p className="text-text-muted">Enter a symbol to generate an investment report</p>
        </div>
      )}
    </div>
  );
}
