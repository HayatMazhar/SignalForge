import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { TrendingUp, TrendingDown } from 'lucide-react';
import { usePriceStore } from '../stores/priceStore';
import { stocksApi } from '../api/stocks';
import type { StockQuote } from '../types';

const TICKER_SYMBOLS = ['AAPL', 'MSFT', 'GOOGL', 'AMZN', 'NVDA', 'TSLA', 'META', 'NFLX', 'AMD', 'JPM', 'V', 'MA', 'DIS', 'BA', 'XOM', 'LLY', 'CRM', 'COIN'];

export default function ScrollingTicker() {
  const navigate = useNavigate();
  const prices = usePriceStore((s) => s.prices);
  const updatePrice = usePriceStore((s) => s.updatePrice);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    if (loaded) return;
    const loadPrices = async () => {
      const missing = TICKER_SYMBOLS.filter(s => !prices[s]);
      const results = await Promise.allSettled(missing.map(s => stocksApi.getQuote(s)));
      results.forEach(r => { if (r.status === 'fulfilled' && r.value) updatePrice(r.value); });
      setLoaded(true);
    };
    loadPrices();
  }, [loaded, prices, updatePrice]);

  const tickerItems: StockQuote[] = TICKER_SYMBOLS
    .map((s) => prices[s])
    .filter(Boolean) as StockQuote[];

  if (tickerItems.length === 0) return null;

  const doubled = [...tickerItems, ...tickerItems];

  return (
    <div className="h-9 bg-surface border-t border-border overflow-hidden flex-shrink-0">
      <div className="flex items-center h-full animate-scroll">
        {doubled.map((q, i) => (
          <button
            key={`${q.symbol}-${i}`}
            onClick={() => navigate(`/stocks/${q.symbol}`)}
            className="flex items-center gap-2 px-4 whitespace-nowrap hover:bg-bg transition-colors h-full"
          >
            <span className="text-xs font-bold text-text-primary">{q.symbol}</span>
            <span className="text-xs text-text-primary">${q.price.toFixed(2)}</span>
            <span className={`text-[11px] font-medium flex items-center gap-0.5 ${q.changePercent >= 0 ? 'text-accent' : 'text-danger'}`}>
              {q.changePercent >= 0 ? <TrendingUp className="w-3 h-3" /> : <TrendingDown className="w-3 h-3" />}
              {q.changePercent >= 0 ? '+' : ''}{q.changePercent.toFixed(2)}%
            </span>
          </button>
        ))}
      </div>
    </div>
  );
}
