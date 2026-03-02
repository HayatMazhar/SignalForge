import { useState } from 'react';
import { Grid3X3 } from 'lucide-react';

const SYMBOLS = ['AAPL', 'MSFT', 'GOOGL', 'AMZN', 'NVDA', 'TSLA', 'META', 'AMD', 'NFLX', 'JPM'];

const RAW: number[][] = [
  [ 1.00,  0.85,  0.78,  0.72,  0.68,  0.35,  0.71,  0.62,  0.55,  0.30],
  [ 0.85,  1.00,  0.82,  0.75,  0.72,  0.30,  0.74,  0.65,  0.50,  0.35],
  [ 0.78,  0.82,  1.00,  0.80,  0.65,  0.28,  0.76,  0.60,  0.52,  0.32],
  [ 0.72,  0.75,  0.80,  1.00,  0.60,  0.32,  0.70,  0.55,  0.58,  0.28],
  [ 0.68,  0.72,  0.65,  0.60,  1.00,  0.45,  0.58,  0.88,  0.42,  0.18],
  [ 0.35,  0.30,  0.28,  0.32,  0.45,  1.00,  0.25,  0.50,  0.30, -0.10],
  [ 0.71,  0.74,  0.76,  0.70,  0.58,  0.25,  1.00,  0.52,  0.60,  0.22],
  [ 0.62,  0.65,  0.60,  0.55,  0.88,  0.50,  0.52,  1.00,  0.38,  0.15],
  [ 0.55,  0.50,  0.52,  0.58,  0.42,  0.30,  0.60,  0.38,  1.00,  0.20],
  [ 0.30,  0.35,  0.32,  0.28,  0.18, -0.10,  0.22,  0.15,  0.20,  1.00],
];

function getCellColor(value: number): string {
  if (value >= 0.8) return 'bg-green-500/80 text-white';
  if (value >= 0.6) return 'bg-green-500/50 text-white';
  if (value >= 0.4) return 'bg-green-500/30 text-text-primary';
  if (value >= 0.2) return 'bg-green-500/15 text-text-primary';
  if (value >= 0) return 'bg-green-500/5 text-text-muted';
  if (value >= -0.2) return 'bg-red-500/10 text-text-muted';
  if (value >= -0.4) return 'bg-red-500/25 text-text-primary';
  if (value >= -0.6) return 'bg-red-500/40 text-text-primary';
  if (value >= -0.8) return 'bg-red-500/60 text-white';
  return 'bg-red-500/80 text-white';
}

export default function CorrelationMatrix() {
  const [hovered, setHovered] = useState<{ row: number; col: number } | null>(null);

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-xl bg-purple/10 flex items-center justify-center">
          <Grid3X3 className="w-6 h-6 text-purple" />
        </div>
        <div>
          <h1 className="text-2xl font-black text-text-primary">Correlation Matrix</h1>
          <p className="text-xs text-text-muted">Cross-stock correlation analysis for top holdings</p>
        </div>
      </div>

      <div className="flex items-center gap-6 text-xs text-text-muted">
        <div className="flex items-center gap-2">
          <div className="flex gap-0.5">
            <div className="w-4 h-4 rounded bg-red-500/60" />
            <div className="w-4 h-4 rounded bg-red-500/25" />
            <div className="w-4 h-4 rounded bg-green-500/5" />
            <div className="w-4 h-4 rounded bg-green-500/30" />
            <div className="w-4 h-4 rounded bg-green-500/60" />
          </div>
          <span>-1.0 → +1.0</span>
        </div>
        <span>Green = positive correlation, Red = negative</span>
      </div>

      <div className="bg-surface border border-border rounded-xl p-5 overflow-x-auto animate-fade-up">
        <table className="w-full">
          <thead>
            <tr>
              <th className="w-16 py-2" />
              {SYMBOLS.map((sym, ci) => (
                <th key={sym}
                  className={`text-center px-1 py-2 text-xs font-bold transition-colors ${hovered?.col === ci ? 'text-accent' : 'text-text-muted'}`}>
                  {sym}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {SYMBOLS.map((rowSym, ri) => (
              <tr key={rowSym}>
                <td className={`text-right pr-3 py-1 text-xs font-bold transition-colors ${hovered?.row === ri ? 'text-accent' : 'text-text-muted'}`}>
                  {rowSym}
                </td>
                {SYMBOLS.map((_, ci) => {
                  const val = RAW[ri][ci];
                  const isHovered = hovered?.row === ri && hovered?.col === ci;
                  const isDiagonal = ri === ci;
                  return (
                    <td key={ci} className="p-0.5">
                      <div
                        onMouseEnter={() => setHovered({ row: ri, col: ci })}
                        onMouseLeave={() => setHovered(null)}
                        className={`
                          relative w-full aspect-square flex items-center justify-center rounded-md text-[11px] font-mono font-bold cursor-default transition-all
                          ${getCellColor(val)}
                          ${isDiagonal ? 'ring-1 ring-border' : ''}
                          ${isHovered ? 'ring-2 ring-accent scale-110 z-10 shadow-lg' : ''}
                        `}
                      >
                        {val.toFixed(2)}
                        {isHovered && (
                          <div className="absolute -top-10 left-1/2 -translate-x-1/2 bg-bg border border-border rounded-lg px-3 py-1.5 shadow-xl whitespace-nowrap z-20">
                            <span className="text-accent font-bold">{SYMBOLS[ri]}</span>
                            <span className="text-text-muted mx-1">×</span>
                            <span className="text-accent font-bold">{SYMBOLS[ci]}</span>
                            <span className="text-text-primary ml-2">{val.toFixed(2)}</span>
                          </div>
                        )}
                      </div>
                    </td>
                  );
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 animate-fade-up">
        <InsightCard
          title="Highest Correlation"
          pair="NVDA × AMD"
          value={0.88}
          description="These semiconductor stocks move closely together, reducing diversification benefit."
          color="text-accent"
        />
        <InsightCard
          title="Lowest Correlation"
          pair="TSLA × JPM"
          value={-0.10}
          description="Negative correlation makes this an excellent diversification pair."
          color="text-danger"
        />
        <InsightCard
          title="Cluster Alert"
          pair="AAPL, MSFT, GOOGL"
          value={0.82}
          description="Big tech names are highly correlated. Consider sector diversification."
          color="text-warning"
        />
      </div>
    </div>
  );
}

function InsightCard({ title, pair, value, description, color }: { title: string; pair: string; value: number; description: string; color: string }) {
  return (
    <div className="bg-surface border border-border rounded-xl p-4 card-hover">
      <div className="text-[10px] font-bold text-text-muted uppercase tracking-wider mb-1">{title}</div>
      <div className="flex items-baseline gap-2 mb-2">
        <span className="text-sm font-bold text-text-primary">{pair}</span>
        <span className={`text-lg font-black font-mono ${color}`}>{value.toFixed(2)}</span>
      </div>
      <p className="text-xs text-text-muted leading-relaxed">{description}</p>
    </div>
  );
}
