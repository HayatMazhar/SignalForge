import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { Search } from 'lucide-react';
import { stocksApi } from '../../api/stocks';
import type { Stock } from '../../types';

interface StockSearchProps {
  onSelect?: (symbol: string) => void;
  placeholder?: string;
}

export default function StockSearch({ onSelect, placeholder = 'Search stocks...' }: StockSearchProps) {
  const navigate = useNavigate();
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<Stock[]>([]);
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (query.length < 1) { setResults([]); return; }
    const t = setTimeout(async () => {
      try {
        setResults(await stocksApi.search(query));
        setOpen(true);
      } catch { setResults([]); }
    }, 300);
    return () => clearTimeout(t);
  }, [query]);

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const handleSelect = (symbol: string) => {
    setOpen(false);
    setQuery('');
    if (onSelect) onSelect(symbol);
    else navigate(`/stocks/${symbol}`);
  };

  return (
    <div ref={ref} className="relative">
      <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-text-muted" />
      <input
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        onFocus={() => results.length > 0 && setOpen(true)}
        className="w-full bg-bg border border-border rounded-lg pl-10 pr-4 py-2 text-sm text-text-primary placeholder-text-muted focus:outline-none focus:border-accent"
        placeholder={placeholder}
      />
      {open && results.length > 0 && (
        <div className="absolute top-full left-0 right-0 mt-1 bg-surface border border-border rounded-lg shadow-xl z-50 max-h-60 overflow-y-auto">
          {results.map((s) => (
            <button key={s.id} onClick={() => handleSelect(s.symbol)}
              className="w-full flex items-center gap-3 px-4 py-2.5 hover:bg-bg transition-colors text-left">
              <span className="text-sm font-bold text-accent w-14">{s.symbol}</span>
              <span className="text-sm text-text-primary truncate flex-1">{s.name}</span>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
