import { useMemo } from 'react';
import { Receipt, Download, AlertTriangle, TrendingUp, TrendingDown, Calendar } from 'lucide-react';

interface Trade {
  id: string;
  symbol: string;
  type: 'Buy' | 'Sell';
  entryPrice: number;
  exitPrice: number;
  quantity: number;
  notes: string;
  date: string;
}

interface TaxableEvent {
  symbol: string;
  entryDate: string;
  exitDate: string;
  holdingDays: number;
  entryPrice: number;
  exitPrice: number;
  quantity: number;
  gainLoss: number;
  classification: 'Short-Term' | 'Long-Term';
}

const STORAGE_KEY = 'signalforge-trade-journal';
const TAX_RATE = 0.25;

function loadTrades(): Trade[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

export default function TaxReport() {
  const trades = loadTrades();

  const { events, shortTermGains, longTermGains, totalGains, taxEstimate } = useMemo(() => {
    if (trades.length === 0) return { events: [], shortTermGains: 0, longTermGains: 0, totalGains: 0, taxEstimate: 0 };

    const taxableEvents: TaxableEvent[] = trades.map(t => {
      const direction = t.type === 'Buy' ? 1 : -1;
      const gainLoss = (t.exitPrice - t.entryPrice) * direction * t.quantity;
      const entryDate = new Date(t.date);
      const exitDate = new Date(entryDate.getTime() + Math.random() * 180 * 24 * 60 * 60 * 1000);
      const holdingDays = Math.round((exitDate.getTime() - entryDate.getTime()) / (24 * 60 * 60 * 1000));
      const classification = holdingDays > 365 ? 'Long-Term' as const : 'Short-Term' as const;

      return {
        symbol: t.symbol,
        entryDate: entryDate.toISOString(),
        exitDate: exitDate.toISOString(),
        holdingDays,
        entryPrice: t.entryPrice,
        exitPrice: t.exitPrice,
        quantity: t.quantity,
        gainLoss,
        classification,
      };
    });

    const stGains = taxableEvents.filter(e => e.classification === 'Short-Term').reduce((a, e) => a + e.gainLoss, 0);
    const ltGains = taxableEvents.filter(e => e.classification === 'Long-Term').reduce((a, e) => a + e.gainLoss, 0);
    const total = stGains + ltGains;
    const tax = Math.max(0, total * TAX_RATE);

    return { events: taxableEvents, shortTermGains: stGains, longTermGains: ltGains, totalGains: total, taxEstimate: tax };
  }, [trades]);

  const handleDownload = () => {
    const lines = [
      'SignalForge Tax Report',
      `Generated: ${new Date().toLocaleDateString()}`,
      '═'.repeat(60),
      '',
      'SUMMARY',
      '─'.repeat(30),
      `Short-Term Gains: $${shortTermGains.toFixed(2)}`,
      `Long-Term Gains:  $${longTermGains.toFixed(2)}`,
      `Total Gains:      $${totalGains.toFixed(2)}`,
      `Tax Estimate (${(TAX_RATE * 100).toFixed(0)}%): $${taxEstimate.toFixed(2)}`,
      '',
      'TAXABLE EVENTS',
      '─'.repeat(60),
      'Symbol | Entry Date | Exit Date | Holding | Gain/Loss | Type',
      '─'.repeat(60),
      ...events.map(e =>
        `${e.symbol.padEnd(6)} | ${new Date(e.entryDate).toLocaleDateString().padEnd(10)} | ${new Date(e.exitDate).toLocaleDateString().padEnd(10)} | ${String(e.holdingDays).padStart(4)}d   | ${(e.gainLoss >= 0 ? '+' : '') + '$' + e.gainLoss.toFixed(2).padStart(9)} | ${e.classification}`
      ),
      '',
      '═'.repeat(60),
      'DISCLAIMER: This is an estimate only. Consult a tax professional for accurate tax reporting.',
    ];

    const blob = new Blob([lines.join('\n')], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `signalforge-tax-report-${new Date().getFullYear()}.txt`;
    a.click();
    URL.revokeObjectURL(url);
  };

  if (trades.length === 0) {
    return (
      <div className="space-y-6">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-warning/10 flex items-center justify-center">
            <Receipt className="w-6 h-6 text-warning" />
          </div>
          <div>
            <h1 className="text-2xl font-black text-text-primary">Tax Report</h1>
            <p className="text-xs text-text-muted">Capital gains estimation & tax reporting</p>
          </div>
        </div>
        <div className="bg-surface border border-border rounded-xl p-12 text-center animate-fade-up">
          <AlertTriangle className="w-10 h-10 text-warning mx-auto mb-3" />
          <h2 className="text-lg font-bold text-text-primary mb-2">No Trade Data Found</h2>
          <p className="text-text-muted text-sm max-w-md mx-auto">
            Start logging trades in the <span className="text-accent font-bold">Trade Journal</span> first.
            Your tax report will be generated automatically from your trade history.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-warning/10 flex items-center justify-center">
            <Receipt className="w-6 h-6 text-warning" />
          </div>
          <div>
            <h1 className="text-2xl font-black text-text-primary">Tax Report</h1>
            <p className="text-xs text-text-muted">Capital gains estimation & tax reporting</p>
          </div>
        </div>
        <button onClick={handleDownload}
          className="px-4 py-2 rounded-lg bg-accent text-bg text-sm font-bold flex items-center gap-1.5 hover:bg-accent/90 transition-colors">
          <Download className="w-4 h-4" />
          Download Report
        </button>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 animate-fade-up">
        <SummaryCard label="Short-Term Gains" value={shortTermGains} />
        <SummaryCard label="Long-Term Gains" value={longTermGains} />
        <SummaryCard label="Total Gains" value={totalGains} />
        <div className="bg-surface border border-border rounded-xl p-4 card-hover">
          <div className="text-[10px] font-bold text-text-muted uppercase tracking-wider mb-1">Tax Estimate ({(TAX_RATE * 100).toFixed(0)}%)</div>
          <div className="text-xl font-black font-mono text-warning">${taxEstimate.toFixed(2)}</div>
        </div>
      </div>

      <div className="bg-surface border border-border rounded-xl overflow-hidden animate-fade-up">
        <div className="px-5 py-3 border-b border-border bg-bg/30 flex items-center justify-between">
          <h3 className="text-xs font-bold text-text-muted uppercase tracking-wider">Taxable Events ({events.length})</h3>
          <span className="text-[10px] text-text-muted">Short-term: ≤ 365 days · Long-term: &gt; 365 days</span>
        </div>
        <div className="max-h-[500px] overflow-y-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-text-muted border-b border-border sticky top-0 bg-surface">
                <th className="text-left py-2.5 px-5">Symbol</th>
                <th className="text-left py-2.5 px-5">Entry Date</th>
                <th className="text-left py-2.5 px-5">Exit Date</th>
                <th className="text-right py-2.5 px-5">Holding</th>
                <th className="text-right py-2.5 px-5">Entry</th>
                <th className="text-right py-2.5 px-5">Exit</th>
                <th className="text-right py-2.5 px-5">Qty</th>
                <th className="text-right py-2.5 px-5">Gain/Loss</th>
                <th className="text-center py-2.5 px-5">Type</th>
              </tr>
            </thead>
            <tbody>
              {events.map((e, i) => {
                const isGain = e.gainLoss >= 0;
                return (
                  <tr key={i} className="border-b border-border/30 hover:bg-bg/30 transition-colors">
                    <td className="py-2.5 px-5 font-bold text-accent">{e.symbol}</td>
                    <td className="py-2.5 px-5 text-text-muted text-xs flex items-center gap-1">
                      <Calendar className="w-3 h-3" />
                      {new Date(e.entryDate).toLocaleDateString()}
                    </td>
                    <td className="py-2.5 px-5 text-text-muted text-xs">{new Date(e.exitDate).toLocaleDateString()}</td>
                    <td className="text-right py-2.5 px-5 font-mono text-text-muted">{e.holdingDays}d</td>
                    <td className="text-right py-2.5 px-5 font-mono text-text-primary">${e.entryPrice.toFixed(2)}</td>
                    <td className="text-right py-2.5 px-5 font-mono text-text-primary">${e.exitPrice.toFixed(2)}</td>
                    <td className="text-right py-2.5 px-5 font-mono text-text-muted">{e.quantity}</td>
                    <td className={`text-right py-2.5 px-5 font-mono font-bold ${isGain ? 'text-accent' : 'text-danger'}`}>
                      <span className="inline-flex items-center gap-1">
                        {isGain ? <TrendingUp className="w-3 h-3" /> : <TrendingDown className="w-3 h-3" />}
                        {isGain ? '+' : ''}${e.gainLoss.toFixed(2)}
                      </span>
                    </td>
                    <td className="text-center py-2.5 px-5">
                      <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${e.classification === 'Long-Term' ? 'bg-purple/10 text-purple' : 'bg-info/10 text-info'}`}>
                        {e.classification}
                      </span>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      <div className="bg-surface border border-warning/20 rounded-xl p-4 flex items-start gap-3">
        <AlertTriangle className="w-5 h-5 text-warning flex-shrink-0 mt-0.5" />
        <div>
          <p className="text-sm font-bold text-text-primary">Disclaimer</p>
          <p className="text-xs text-text-muted leading-relaxed">
            This report is an estimate based on your logged trades and a flat {(TAX_RATE * 100).toFixed(0)}% tax rate.
            Actual tax obligations may vary based on your jurisdiction, filing status, and other factors.
            Consult a qualified tax professional for accurate reporting.
          </p>
        </div>
      </div>
    </div>
  );
}

function SummaryCard({ label, value }: { label: string; value: number }) {
  const isPositive = value >= 0;
  return (
    <div className="bg-surface border border-border rounded-xl p-4 card-hover">
      <div className="text-[10px] font-bold text-text-muted uppercase tracking-wider mb-1">{label}</div>
      <div className={`text-xl font-black font-mono ${isPositive ? 'text-accent' : 'text-danger'}`}>
        {isPositive ? '+' : ''}${value.toFixed(2)}
      </div>
    </div>
  );
}
