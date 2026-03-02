import { useNavigate } from 'react-router-dom';
import { LayoutGrid } from 'lucide-react';

interface StockCell {
  symbol: string;
  changePercent: number;
  marketCap: number;
}

interface SectorGroup {
  sector: string;
  stocks: StockCell[];
}

const SECTOR_DATA: SectorGroup[] = [
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
    sector: 'Healthcare',
    stocks: [
      { symbol: 'UNH', changePercent: 0.25, marketCap: 450 },
      { symbol: 'LLY', changePercent: 1.56, marketCap: 400 },
      { symbol: 'JNJ', changePercent: -0.32, marketCap: 420 },
      { symbol: 'MRK', changePercent: 0.78, marketCap: 270 },
      { symbol: 'ABBV', changePercent: -0.95, marketCap: 250 },
      { symbol: 'PFE', changePercent: -1.54, marketCap: 160 },
      { symbol: 'TMO', changePercent: 0.44, marketCap: 200 },
    ],
  },
  {
    sector: 'Financial',
    stocks: [
      { symbol: 'V', changePercent: 0.55, marketCap: 470 },
      { symbol: 'JPM', changePercent: 1.12, marketCap: 430 },
      { symbol: 'MA', changePercent: 0.38, marketCap: 340 },
      { symbol: 'BAC', changePercent: -0.72, marketCap: 230 },
      { symbol: 'GS', changePercent: 1.45, marketCap: 110 },
      { symbol: 'COIN', changePercent: 3.2, marketCap: 40 },
      { symbol: 'MS', changePercent: 0.88, marketCap: 140 },
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
      { symbol: 'NKE', changePercent: -1.32, marketCap: 150 },
    ],
  },
  {
    sector: 'Energy',
    stocks: [
      { symbol: 'XOM', changePercent: -1.22, marketCap: 450 },
      { symbol: 'CVX', changePercent: -0.88, marketCap: 300 },
      { symbol: 'COP', changePercent: -1.45, marketCap: 130 },
      { symbol: 'SLB', changePercent: -0.62, marketCap: 70 },
      { symbol: 'EOG', changePercent: 0.34, marketCap: 60 },
    ],
  },
  {
    sector: 'Industrials',
    stocks: [
      { symbol: 'CAT', changePercent: 0.92, marketCap: 130 },
      { symbol: 'BA', changePercent: -1.85, marketCap: 120 },
      { symbol: 'GE', changePercent: 0.55, marketCap: 120 },
      { symbol: 'UPS', changePercent: -0.42, marketCap: 100 },
      { symbol: 'HON', changePercent: 0.31, marketCap: 130 },
      { symbol: 'RTX', changePercent: 0.67, marketCap: 140 },
    ],
  },
  {
    sector: 'Communication',
    stocks: [
      { symbol: 'CMCSA', changePercent: -0.65, marketCap: 150 },
      { symbol: 'VZ', changePercent: 0.18, marketCap: 150 },
      { symbol: 'T', changePercent: -0.42, marketCap: 110 },
      { symbol: 'TMUS', changePercent: 0.95, marketCap: 180 },
      { symbol: 'SPOT', changePercent: 2.55, marketCap: 60 },
    ],
  },
];

function getCellColor(pct: number): string {
  if (pct >= 3) return 'bg-green-400';
  if (pct >= 2) return 'bg-green-500';
  if (pct >= 1) return 'bg-green-600/80';
  if (pct >= 0.3) return 'bg-green-800/60';
  if (pct > -0.3) return 'bg-slate-700/60';
  if (pct > -1) return 'bg-red-800/60';
  if (pct > -2) return 'bg-red-600/80';
  return 'bg-red-500';
}

function getCellTextColor(pct: number): string {
  if (Math.abs(pct) >= 1) return 'text-white';
  return 'text-slate-300';
}

export default function Heatmap() {
  const navigate = useNavigate();

  const totalMarketCap = SECTOR_DATA.reduce(
    (sum, s) => sum + s.stocks.reduce((ss, st) => ss + st.marketCap, 0), 0
  );

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-xl bg-accent/10 flex items-center justify-center">
          <LayoutGrid className="w-6 h-6 text-accent" />
        </div>
        <div>
          <h1 className="text-2xl font-black text-text-primary">Market Heatmap</h1>
          <p className="text-xs text-text-muted">Full market overview &mdash; cell size reflects market cap</p>
        </div>
      </div>

      <div className="flex items-center gap-4 text-[10px] text-text-muted">
        <span className="font-bold uppercase tracking-wider">Change %:</span>
        <div className="flex items-center gap-1">
          <span className="w-4 h-3 rounded-sm bg-red-500 inline-block" />
          <span>&le; -2%</span>
        </div>
        <div className="flex items-center gap-1">
          <span className="w-4 h-3 rounded-sm bg-red-600/80 inline-block" />
          <span>-2 to -1%</span>
        </div>
        <div className="flex items-center gap-1">
          <span className="w-4 h-3 rounded-sm bg-red-800/60 inline-block" />
          <span>-1 to 0%</span>
        </div>
        <div className="flex items-center gap-1">
          <span className="w-4 h-3 rounded-sm bg-slate-700/60 inline-block" />
          <span>~0%</span>
        </div>
        <div className="flex items-center gap-1">
          <span className="w-4 h-3 rounded-sm bg-green-800/60 inline-block" />
          <span>0 to 1%</span>
        </div>
        <div className="flex items-center gap-1">
          <span className="w-4 h-3 rounded-sm bg-green-600/80 inline-block" />
          <span>1 to 2%</span>
        </div>
        <div className="flex items-center gap-1">
          <span className="w-4 h-3 rounded-sm bg-green-500 inline-block" />
          <span>&ge; 2%</span>
        </div>
      </div>

      <div className="bg-surface border border-border rounded-xl p-5 space-y-2">
        {SECTOR_DATA.map((sector) => {
          const sectorCap = sector.stocks.reduce((s, st) => s + st.marketCap, 0);
          const sectorPct = (sectorCap / totalMarketCap) * 100;
          const sectorAvgChange = sector.stocks.reduce((s, st) => s + st.changePercent, 0) / sector.stocks.length;

          return (
            <div key={sector.sector}>
              <div className="flex items-center justify-between mb-1">
                <span className="text-[10px] text-text-muted font-bold uppercase tracking-wider">{sector.sector}</span>
                <span className={`text-[10px] font-mono font-bold ${sectorAvgChange >= 0 ? 'text-accent' : 'text-danger'}`}>
                  avg {sectorAvgChange >= 0 ? '+' : ''}{sectorAvgChange.toFixed(2)}%
                </span>
              </div>
              <div className="flex gap-0.5" style={{ height: `${Math.max(52, sectorPct * 2.2)}px` }}>
                {sector.stocks.map((stock) => {
                  const weight = stock.marketCap / sectorCap;
                  return (
                    <button
                      key={stock.symbol}
                      onClick={() => navigate(`/stocks/${stock.symbol}`)}
                      className={`${getCellColor(stock.changePercent)} rounded-sm flex flex-col items-center justify-center overflow-hidden transition-all hover:opacity-80 hover:ring-1 hover:ring-accent/50 cursor-pointer`}
                      style={{ width: `${weight * 100}%` }}
                      title={`${stock.symbol}: ${stock.changePercent >= 0 ? '+' : ''}${stock.changePercent.toFixed(2)}% | MCap: $${stock.marketCap}B`}
                    >
                      <span className={`text-[11px] font-black ${getCellTextColor(stock.changePercent)} leading-none`}>
                        {stock.symbol}
                      </span>
                      <span className={`text-[9px] font-mono ${getCellTextColor(stock.changePercent)} leading-none mt-1`}>
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

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {(() => {
          const allStocks = SECTOR_DATA.flatMap(s => s.stocks);
          const topGainer = [...allStocks].sort((a, b) => b.changePercent - a.changePercent)[0];
          const topLoser = [...allStocks].sort((a, b) => a.changePercent - b.changePercent)[0];
          const totalStocks = allStocks.length;
          const advancers = allStocks.filter(s => s.changePercent > 0).length;
          return (
            <>
              <div className="bg-surface border border-border rounded-xl p-4 text-center">
                <div className="text-[10px] text-text-muted uppercase mb-1">Total Stocks</div>
                <div className="text-xl font-black font-mono text-text-primary">{totalStocks}</div>
              </div>
              <div className="bg-surface border border-border rounded-xl p-4 text-center">
                <div className="text-[10px] text-text-muted uppercase mb-1">Advancers / Decliners</div>
                <div className="text-xl font-black font-mono">
                  <span className="text-accent">{advancers}</span>
                  <span className="text-text-muted mx-1">/</span>
                  <span className="text-danger">{totalStocks - advancers}</span>
                </div>
              </div>
              <div className="bg-surface border border-accent/20 rounded-xl p-4 text-center">
                <div className="text-[10px] text-text-muted uppercase mb-1">Top Gainer</div>
                <div className="text-lg font-black text-accent">{topGainer.symbol}</div>
                <div className="text-xs font-mono text-accent">+{topGainer.changePercent.toFixed(2)}%</div>
              </div>
              <div className="bg-surface border border-danger/20 rounded-xl p-4 text-center">
                <div className="text-[10px] text-text-muted uppercase mb-1">Top Loser</div>
                <div className="text-lg font-black text-danger">{topLoser.symbol}</div>
                <div className="text-xs font-mono text-danger">{topLoser.changePercent.toFixed(2)}%</div>
              </div>
            </>
          );
        })()}
      </div>
    </div>
  );
}
