import { useState, useEffect, useRef } from 'react';
import { useQuery } from '@tanstack/react-query';
import { ArrowLeftRight, Plus, X, TrendingUp, TrendingDown, Search } from 'lucide-react';
import { stocksApi } from '../api/stocks';
import LoadingSpinner from '../components/common/LoadingSpinner';
import type { Stock } from '../types';

export default function Compare() {
  const [symbols, setSymbols] = useState<string[]>(['AAPL', 'MSFT']);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<Stock[]>([]);
  const [showDropdown, setShowDropdown] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (searchQuery.length < 1) { setSearchResults([]); return; }
    const timer = setTimeout(async () => {
      try {
        const results = await stocksApi.search(searchQuery);
        setSearchResults(results.filter(r => !symbols.includes(r.symbol)));
        setShowDropdown(true);
      } catch { setSearchResults([]); }
    }, 250);
    return () => clearTimeout(timer);
  }, [searchQuery, symbols]);

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) setShowDropdown(false);
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const addSymbol = (sym: string) => {
    const upper = sym.toUpperCase();
    if (symbols.length < 5 && !symbols.includes(upper)) {
      setSymbols([...symbols, upper]);
    }
    setSearchQuery('');
    setShowDropdown(false);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-xl bg-info/10 flex items-center justify-center">
          <ArrowLeftRight className="w-6 h-6 text-info" />
        </div>
        <div>
          <h1 className="text-2xl font-black text-text-primary">Stock Comparison</h1>
          <p className="text-xs text-text-muted">Compare up to 5 stocks side by side</p>
        </div>
      </div>

      {/* Symbol Chips + Search */}
      <div className="flex items-center gap-2 flex-wrap">
        {symbols.map(s => (
          <div key={s} className="flex items-center gap-1.5 px-3 py-1.5 bg-surface border border-accent/20 rounded-lg">
            <span className="text-sm font-bold text-accent">{s}</span>
            <button onClick={() => setSymbols(symbols.filter(x => x !== s))} className="text-text-muted hover:text-danger transition-colors">
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
        ))}
        {symbols.length < 5 && (
          <div ref={dropdownRef} className="relative">
            <div className="flex items-center gap-1">
              <div className="relative">
                <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-text-muted" />
                <input value={searchQuery} onChange={e => setSearchQuery(e.target.value)}
                  onFocus={() => searchResults.length > 0 && setShowDropdown(true)}
                  onKeyDown={e => { if (e.key === 'Enter' && searchQuery.trim()) addSymbol(searchQuery); }}
                  className="bg-bg border border-border rounded-lg pl-8 pr-3 py-1.5 text-sm text-text-primary placeholder-text-muted/50 focus:outline-none focus:border-accent/40 w-40"
                  placeholder="Add stock..." />
              </div>
              <button onClick={() => searchQuery.trim() && addSymbol(searchQuery)}
                className="p-1.5 rounded-lg bg-accent/10 text-accent hover:bg-accent/20 transition-colors">
                <Plus className="w-4 h-4" />
              </button>
            </div>
            {showDropdown && searchResults.length > 0 && (
              <div className="absolute top-full left-0 mt-1 w-64 bg-surface border border-border rounded-xl shadow-2xl z-50 max-h-48 overflow-y-auto">
                {searchResults.map(s => (
                  <button key={s.id} onClick={() => addSymbol(s.symbol)}
                    className="w-full flex items-center gap-3 px-3 py-2 hover:bg-bg transition-colors text-left">
                    <span className="text-xs font-bold text-accent w-12">{s.symbol}</span>
                    <span className="text-xs text-text-primary truncate">{s.name}</span>
                  </button>
                ))}
              </div>
            )}
          </div>
        )}
      </div>

      {/* Comparison Cards */}
      {symbols.length === 0 ? (
        <div className="text-center py-16">
          <ArrowLeftRight className="w-12 h-12 text-text-muted mx-auto mb-3" />
          <p className="text-text-muted">Add at least 2 stocks to compare</p>
        </div>
      ) : (
        <div className="grid gap-4" style={{ gridTemplateColumns: `repeat(${Math.min(symbols.length, 5)}, 1fr)` }}>
          {symbols.map(sym => <ComparisonCard key={sym} symbol={sym} />)}
        </div>
      )}
    </div>
  );
}

function ComparisonCard({ symbol }: { symbol: string }) {
  const { data: quote, isLoading: qLoading } = useQuery({
    queryKey: ['compare-quote', symbol],
    queryFn: () => stocksApi.getQuote(symbol),
  });
  const { data: tech, isLoading: tLoading } = useQuery({
    queryKey: ['compare-indicators', symbol],
    queryFn: () => stocksApi.getIndicators(symbol),
  });

  if (qLoading || tLoading) return <div className="bg-surface border border-border rounded-xl p-5"><LoadingSpinner size="sm" /></div>;
  if (!quote) return <div className="bg-surface border border-border rounded-xl p-5 text-center"><p className="text-text-muted text-xs py-4">Failed to load</p></div>;

  const isPositive = (quote?.changePercent ?? 0) >= 0;

  return (
    <div className="bg-surface border border-border rounded-xl p-5 card-hover">
      <div className="text-center mb-4">
        <h3 className="text-xl font-black text-accent">{symbol}</h3>
        <div className="text-2xl font-black text-text-primary mt-1 font-mono">${(quote?.price ?? 0).toFixed(2)}</div>
        <div className={`text-sm font-bold flex items-center justify-center gap-1 mt-0.5 ${isPositive ? 'text-accent' : 'text-danger'}`}>
          {isPositive ? <TrendingUp className="w-3.5 h-3.5" /> : <TrendingDown className="w-3.5 h-3.5" />}
          {isPositive ? '+' : ''}{(quote?.changePercent ?? 0).toFixed(2)}%
        </div>
      </div>

      <div className="space-y-2">
        <MetricRow label="RSI" value={tech ? tech.rsi.toFixed(1) : '—'} good={tech ? tech.rsi > 30 && tech.rsi < 70 : undefined} />
        <MetricRow label="MACD" value={tech ? tech.macd.toFixed(2) : '—'} good={tech ? tech.macd > 0 : undefined} />
        <MetricRow label="Trend" value={tech?.trend ?? '—'} good={tech?.trend === 'Bullish' ? true : tech?.trend === 'Bearish' ? false : undefined} />
        <MetricRow label="SMA 20" value={tech ? `$${tech.sma20.toFixed(0)}` : '—'} />
        <MetricRow label="SMA 50" value={tech ? `$${tech.sma50.toFixed(0)}` : '—'} />
        <MetricRow label="SMA 200" value={tech ? `$${tech.sma200.toFixed(0)}` : '—'} />
        <MetricRow label="ATR" value={tech ? tech.atr.toFixed(2) : '—'} />
        <MetricRow label="Volume" value={quote ? `${(quote.volume / 1e6).toFixed(1)}M` : '—'} />
        <MetricRow label="High" value={quote ? `$${quote.high.toFixed(2)}` : '—'} />
        <MetricRow label="Low" value={quote ? `$${quote.low.toFixed(2)}` : '—'} />
      </div>
    </div>
  );
}

function MetricRow({ label, value, good }: { label: string; value: string; good?: boolean }) {
  return (
    <div className="flex items-center justify-between py-1 border-b border-border/20 last:border-0">
      <span className="text-[10px] text-text-muted uppercase tracking-wider">{label}</span>
      <span className={`text-xs font-bold font-mono ${good === true ? 'text-accent' : good === false ? 'text-danger' : 'text-text-primary'}`}>
        {value}
      </span>
    </div>
  );
}
