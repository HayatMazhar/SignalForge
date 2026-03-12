import { useState, useEffect, useRef } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Star, Plus, Trash2, TrendingUp, TrendingDown, Search, AlertCircle } from 'lucide-react';
import { watchlistApi } from '../api/watchlist';
import { stocksApi } from '../api/stocks';
import api from '../api/client';
import { usePriceStore } from '../stores/priceStore';
import { useAssetModeStore } from '../stores/assetModeStore';
import { useNavigate } from 'react-router-dom';
import SparkLine from '../components/charts/SparkLine';
import LoadingSpinner from '../components/common/LoadingSpinner';
import type { Stock } from '../types';

export default function Watchlist() {
  const { mode } = useAssetModeStore();
  const isCrypto = mode === 'crypto';
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<Stock[]>([]);
  const [showDropdown, setShowDropdown] = useState(false);
  const [error, setError] = useState('');
  const dropdownRef = useRef<HTMLDivElement>(null);
  const queryClient = useQueryClient();
  const navigate = useNavigate();
  const prices = usePriceStore((s) => s.prices);

  const { data: watchlist, isLoading } = useQuery({ queryKey: ['watchlist'], queryFn: watchlistApi.get });

  useEffect(() => {
    if (searchQuery.length < 1) { setSearchResults([]); return; }
    const timer = setTimeout(async () => {
      try {
        const results = isCrypto
          ? await api.get<Stock[]>('/crypto/search', { params: { q: searchQuery } }).then(r => r.data)
          : await stocksApi.search(searchQuery);
        setSearchResults(results);
        setShowDropdown(true);
      } catch { setSearchResults([]); }
    }, 250);
    return () => clearTimeout(timer);
  }, [searchQuery, isCrypto]);

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) setShowDropdown(false);
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const addMutation = useMutation({
    mutationFn: (symbol: string) => watchlistApi.add(symbol.toUpperCase()),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['watchlist'] });
      setSearchQuery('');
      setError('');
    },
    onError: (err: any) => {
      const msg = err?.response?.data?.error || err?.response?.data?.detail || 'Failed to add. It may already be in your watchlist.';
      setError(msg);
      setTimeout(() => setError(''), 5000);
    },
  });

  const removeMutation = useMutation({
    mutationFn: (symbol: string) => watchlistApi.remove(symbol),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['watchlist'] }),
  });

  const handleAdd = (symbol: string) => {
    setShowDropdown(false);
    setSearchQuery('');
    addMutation.mutate(symbol);
  };

  const generateSparkData = (symbol: string) => {
    const seed = symbol.split('').reduce((s, c) => s + c.charCodeAt(0), 0);
    const rng = (n: number) => ((seed * (n + 1) * 9301 + 49297) % 233280) / 233280;
    const base = 100;
    return Array.from({ length: 20 }, (_, i) => base + (rng(i) - 0.45) * 10 + i * 0.3);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Star className="w-8 h-8 text-accent" />
          <h1 className="text-2xl font-bold text-text-primary">Watchlist</h1>
          {watchlist && <span className="text-sm text-text-muted">({watchlist.length} {isCrypto ? 'coins' : 'stocks'})</span>}
        </div>

        {/* Add with autocomplete */}
        <div ref={dropdownRef} className="relative">
          <div className="flex gap-2">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-text-muted" />
              <input value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)}
                onFocus={() => searchResults.length > 0 && setShowDropdown(true)}
                onKeyDown={(e) => { if (e.key === 'Enter' && searchQuery.trim()) handleAdd(searchQuery.trim()); }}
                className="bg-surface border border-border rounded-lg pl-9 pr-4 py-2 text-sm text-text-primary placeholder-text-muted focus:outline-none focus:border-accent w-52"
                placeholder={isCrypto ? "Search & add coin..." : "Search & add stock..."} />
            </div>
            <button onClick={() => searchQuery.trim() && handleAdd(searchQuery.trim())}
              disabled={addMutation.isPending || !searchQuery.trim()}
              className="px-4 py-2 rounded-lg bg-accent text-bg text-sm font-bold flex items-center gap-1 hover:bg-accent/90 disabled:opacity-50 btn-shine">
              <Plus className="w-4 h-4" /> Add
            </button>
          </div>
          {showDropdown && searchResults.length > 0 && (
            <div className="absolute top-full right-0 mt-1 w-72 bg-surface border border-border rounded-xl shadow-2xl z-50 max-h-56 overflow-y-auto">
              {searchResults.map(s => (
                <button key={s.id} onClick={() => handleAdd(s.symbol)}
                  className="w-full flex items-center gap-3 px-4 py-2.5 hover:bg-bg transition-colors text-left">
                  <span className="text-sm font-bold text-accent w-14">{s.symbol}</span>
                  <span className="text-xs text-text-primary truncate flex-1">{s.name}</span>
                  <Plus className="w-3 h-3 text-text-muted" />
                </button>
              ))}
            </div>
          )}
        </div>
      </div>

      {error && (
        <div className="bg-danger/10 border border-danger/20 text-danger rounded-xl px-4 py-3 text-sm flex items-center gap-2 animate-fade-up">
          <AlertCircle className="w-4 h-4 flex-shrink-0" /> {error}
        </div>
      )}

      {isLoading ? <LoadingSpinner text="Loading watchlist..." /> : (
        <div className="bg-surface border border-border rounded-xl overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-text-muted border-b border-border bg-bg/50 text-[10px] uppercase tracking-wider">
                <th className="text-left py-3 px-5">Symbol</th>
                <th className="text-right py-3 px-5">Price</th>
                <th className="text-right py-3 px-5">Change</th>
                <th className="text-center py-3 px-5">Trend</th>
                <th className="text-left py-3 px-5">Added</th>
                <th className="text-right py-3 px-5">Actions</th>
              </tr>
            </thead>
            <tbody>
              {watchlist?.map((w) => {
                const quote = prices[w.symbol];
                const sparkData = generateSparkData(w.symbol);
                const isPositive = quote ? quote.changePercent >= 0 : sparkData[sparkData.length - 1] > sparkData[0];
                return (
                  <tr key={w.symbol} className="border-b border-border/30 hover:bg-bg/30 cursor-pointer transition-colors"
                    onClick={() => navigate(`/stocks/${w.symbol}`)}>
                    <td className="py-3 px-5 font-bold text-text-primary">{w.symbol}</td>
                    <td className="text-right py-3 px-5 text-text-primary font-mono">{quote ? `$${quote.price.toFixed(2)}` : '—'}</td>
                    <td className="text-right py-3 px-5">
                      {quote ? (
                        <span className={`flex items-center justify-end gap-1 font-medium font-mono ${isPositive ? 'text-accent' : 'text-danger'}`}>
                          {isPositive ? <TrendingUp className="w-3 h-3" /> : <TrendingDown className="w-3 h-3" />}
                          {isPositive ? '+' : ''}{quote.changePercent.toFixed(2)}%
                        </span>
                      ) : <span className="text-text-muted">—</span>}
                    </td>
                    <td className="py-3 px-5"><div className="flex justify-center"><SparkLine data={sparkData} positive={isPositive} /></div></td>
                    <td className="py-3 px-5 text-text-muted text-xs">{new Date(w.addedAt).toLocaleDateString()}</td>
                    <td className="py-3 px-5 text-right">
                      <button onClick={(e) => { e.stopPropagation(); removeMutation.mutate(w.symbol); }}
                        className="text-text-muted hover:text-danger transition-colors p-1">
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
          {(!watchlist || watchlist.length === 0) && (
            <div className="text-center py-16">
              <Star className="w-12 h-12 text-text-muted mx-auto mb-3" />
              <p className="text-text-muted text-sm">Your watchlist is empty. Search and add {isCrypto ? 'coins' : 'stocks'} above.</p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
