import { useNavigate } from 'react-router-dom';

interface SectorData {
  sector: string;
  stocks: { symbol: string; changePercent: number; marketCap: number }[];
}

const SECTOR_DATA: SectorData[] = [
  {
    sector: 'Technology',
    stocks: [
      { symbol: 'AAPL', changePercent: 1.37, marketCap: 2900 },
      { symbol: 'MSFT', changePercent: 0.82, marketCap: 2800 },
      { symbol: 'NVDA', changePercent: 2.15, marketCap: 1200 },
      { symbol: 'GOOGL', changePercent: -0.45, marketCap: 1700 },
      { symbol: 'META', changePercent: 1.92, marketCap: 750 },
      { symbol: 'ADBE', changePercent: -1.2, marketCap: 220 },
      { symbol: 'CRM', changePercent: 0.65, marketCap: 210 },
      { symbol: 'AMD', changePercent: -0.88, marketCap: 180 },
      { symbol: 'INTC', changePercent: -2.1, marketCap: 120 },
      { symbol: 'ORCL', changePercent: 0.42, marketCap: 290 },
    ],
  },
  {
    sector: 'Financial Services',
    stocks: [
      { symbol: 'V', changePercent: 0.55, marketCap: 470 },
      { symbol: 'JPM', changePercent: 1.12, marketCap: 430 },
      { symbol: 'MA', changePercent: 0.38, marketCap: 340 },
      { symbol: 'BAC', changePercent: -0.72, marketCap: 230 },
      { symbol: 'GS', changePercent: 1.45, marketCap: 110 },
      { symbol: 'COIN', changePercent: 3.2, marketCap: 40 },
    ],
  },
  {
    sector: 'Healthcare',
    stocks: [
      { symbol: 'UNH', changePercent: 0.25, marketCap: 450 },
      { symbol: 'LLY', changePercent: 1.56, marketCap: 400 },
      { symbol: 'JNJ', changePercent: -0.32, marketCap: 420 },
      { symbol: 'MRK', changePercent: 0.78, marketCap: 270 },
      { symbol: 'ABBV', changePercent: -0.95, marketCap: 250 },
      { symbol: 'PFE', changePercent: -1.54, marketCap: 160 },
    ],
  },
  {
    sector: 'Consumer',
    stocks: [
      { symbol: 'AMZN', changePercent: 0.93, marketCap: 1500 },
      { symbol: 'TSLA', changePercent: -2.14, marketCap: 800 },
      { symbol: 'WMT', changePercent: 0.42, marketCap: 400 },
      { symbol: 'COST', changePercent: 0.68, marketCap: 250 },
      { symbol: 'HD', changePercent: -0.55, marketCap: 300 },
      { symbol: 'NFLX', changePercent: 1.83, marketCap: 200 },
      { symbol: 'DIS', changePercent: 2.03, marketCap: 180 },
    ],
  },
  {
    sector: 'Energy',
    stocks: [
      { symbol: 'XOM', changePercent: -1.22, marketCap: 450 },
      { symbol: 'CVX', changePercent: -0.88, marketCap: 300 },
      { symbol: 'COP', changePercent: -1.45, marketCap: 130 },
    ],
  },
  {
    sector: 'Industrials',
    stocks: [
      { symbol: 'CAT', changePercent: 0.92, marketCap: 130 },
      { symbol: 'BA', changePercent: -1.85, marketCap: 120 },
      { symbol: 'GE', changePercent: 0.55, marketCap: 120 },
    ],
  },
  {
    sector: 'Communication',
    stocks: [
      { symbol: 'CMCSA', changePercent: -0.65, marketCap: 150 },
      { symbol: 'VZ', changePercent: 0.18, marketCap: 150 },
      { symbol: 'T', changePercent: -0.42, marketCap: 110 },
    ],
  },
];

function getColor(pct: number): string {
  if (pct >= 2) return 'bg-green-500';
  if (pct >= 1) return 'bg-green-600/80';
  if (pct >= 0.3) return 'bg-green-800/60';
  if (pct > -0.3) return 'bg-slate-700/60';
  if (pct > -1) return 'bg-red-800/60';
  if (pct > -2) return 'bg-red-600/80';
  return 'bg-red-500';
}

function getTextColor(pct: number): string {
  if (Math.abs(pct) >= 1) return 'text-white';
  return 'text-slate-300';
}

export default function SectorHeatmap() {
  const navigate = useNavigate();
  const totalMarketCap = SECTOR_DATA.reduce(
    (sum, s) => sum + s.stocks.reduce((ss, st) => ss + st.marketCap, 0), 0
  );

  return (
    <div className="bg-surface border border-border rounded-xl p-5">
      <h2 className="text-sm font-semibold text-text-muted uppercase tracking-wider mb-4">Sector Heatmap</h2>
      <div className="space-y-1">
        {SECTOR_DATA.map((sector) => {
          const sectorCap = sector.stocks.reduce((s, st) => s + st.marketCap, 0);
          const sectorPct = (sectorCap / totalMarketCap) * 100;
          if (sectorPct < 2) return null;

          return (
            <div key={sector.sector}>
              <div className="text-[10px] text-text-muted mb-0.5 font-medium">{sector.sector}</div>
              <div className="flex gap-0.5" style={{ height: `${Math.max(36, sectorPct * 1.8)}px` }}>
                {sector.stocks.map((stock) => {
                  const weight = stock.marketCap / sectorCap;
                  return (
                    <button
                      key={stock.symbol}
                      onClick={() => navigate(`/stocks/${stock.symbol}`)}
                      className={`${getColor(stock.changePercent)} rounded-sm flex flex-col items-center justify-center overflow-hidden transition-all hover:opacity-80 hover:ring-1 hover:ring-accent/50`}
                      style={{ width: `${weight * 100}%` }}
                      title={`${stock.symbol}: ${stock.changePercent >= 0 ? '+' : ''}${stock.changePercent.toFixed(2)}%`}
                    >
                      <span className={`text-[10px] font-bold ${getTextColor(stock.changePercent)} leading-none`}>
                        {stock.symbol}
                      </span>
                      <span className={`text-[9px] ${getTextColor(stock.changePercent)} leading-none mt-0.5`}>
                        {stock.changePercent >= 0 ? '+' : ''}{stock.changePercent.toFixed(1)}%
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
