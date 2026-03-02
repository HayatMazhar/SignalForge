import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Filter, Search, TrendingUp, TrendingDown, ArrowUpDown } from 'lucide-react';
import { stocksApi } from '../api/stocks';
import { useNavigate } from 'react-router-dom';
import LoadingSpinner from '../components/common/LoadingSpinner';

const sectors = ['All', 'Technology', 'Healthcare', 'Financial Services', 'Consumer Cyclical', 'Consumer Defensive', 'Energy', 'Industrials', 'Communication Services'];
const exchanges = ['All', 'NASDAQ', 'NYSE'];

export default function Screener() {
  const [query, setQuery] = useState('');
  const [sector, setSector] = useState('All');
  const [exchange, setExchange] = useState('All');
  const [sortBy, setSortBy] = useState<'symbol' | 'name' | 'sector'>('symbol');
  const navigate = useNavigate();

  const { data: results, isLoading } = useQuery({
    queryKey: ['stock-search', query],
    queryFn: () => stocksApi.search(query || 'A'),
    enabled: true,
  });

  const { data: movers } = useQuery({
    queryKey: ['top-movers-screener'],
    queryFn: stocksApi.getTopMovers,
  });

  const filtered = results?.filter(s => {
    if (sector !== 'All' && s.sector !== sector) return false;
    if (exchange !== 'All' && s.exchange !== exchange) return false;
    if (query && !s.symbol.toUpperCase().includes(query.toUpperCase()) && !s.name.toUpperCase().includes(query.toUpperCase())) return false;
    return true;
  }).sort((a, b) => {
    if (sortBy === 'symbol') return a.symbol.localeCompare(b.symbol);
    if (sortBy === 'name') return a.name.localeCompare(b.name);
    return a.sector.localeCompare(b.sector);
  }) ?? [];

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <Filter className="w-8 h-8 text-accent" />
        <div>
          <h1 className="text-2xl font-bold text-text-primary">Stock Screener</h1>
          <p className="text-sm text-text-muted">{filtered.length} stocks found</p>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-surface border border-border rounded-xl p-4">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="relative md:col-span-2">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-text-muted" />
            <input value={query} onChange={(e) => setQuery(e.target.value)}
              className="w-full bg-bg border border-border rounded-lg pl-10 pr-4 py-2.5 text-sm text-text-primary placeholder-text-muted focus:outline-none focus:border-accent"
              placeholder="Search by symbol or company name..." />
          </div>
          <select value={sector} onChange={(e) => setSector(e.target.value)}
            className="bg-bg border border-border rounded-lg px-4 py-2.5 text-sm text-text-primary focus:outline-none focus:border-accent appearance-none cursor-pointer">
            {sectors.map(s => <option key={s} value={s}>{s === 'All' ? 'All Sectors' : s}</option>)}
          </select>
          <select value={exchange} onChange={(e) => setExchange(e.target.value)}
            className="bg-bg border border-border rounded-lg px-4 py-2.5 text-sm text-text-primary focus:outline-none focus:border-accent appearance-none cursor-pointer">
            {exchanges.map(e => <option key={e} value={e}>{e === 'All' ? 'All Exchanges' : e}</option>)}
          </select>
        </div>
      </div>

      {/* Quick Movers */}
      {movers && movers.length > 0 && (
        <div className="flex gap-2 overflow-x-auto pb-2">
          {movers.slice(0, 10).map(m => (
            <button key={m.symbol} onClick={() => navigate(`/stocks/${m.symbol}`)}
              className="flex items-center gap-2 px-3 py-2 bg-surface border border-border rounded-lg hover:bg-surface-light transition-colors flex-shrink-0">
              <span className="text-xs font-bold text-text-primary">{m.symbol}</span>
              <span className={`text-[11px] font-medium flex items-center gap-0.5 ${m.changePercent >= 0 ? 'text-accent' : 'text-danger'}`}>
                {m.changePercent >= 0 ? <TrendingUp className="w-3 h-3" /> : <TrendingDown className="w-3 h-3" />}
                {m.changePercent >= 0 ? '+' : ''}{m.changePercent.toFixed(1)}%
              </span>
            </button>
          ))}
        </div>
      )}

      {/* Results Table */}
      {isLoading ? <LoadingSpinner text="Searching..." /> : (
        <div className="bg-surface border border-border rounded-xl overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-text-muted border-b border-border bg-bg">
                <th className="text-left py-3 px-5 cursor-pointer hover:text-text-primary" onClick={() => setSortBy('symbol')}>
                  <span className="flex items-center gap-1">Symbol <ArrowUpDown className="w-3 h-3" /></span>
                </th>
                <th className="text-left py-3 px-5 cursor-pointer hover:text-text-primary" onClick={() => setSortBy('name')}>
                  <span className="flex items-center gap-1">Company <ArrowUpDown className="w-3 h-3" /></span>
                </th>
                <th className="text-left py-3 px-5 cursor-pointer hover:text-text-primary" onClick={() => setSortBy('sector')}>
                  <span className="flex items-center gap-1">Sector <ArrowUpDown className="w-3 h-3" /></span>
                </th>
                <th className="text-left py-3 px-5">Exchange</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((s) => (
                <tr key={s.id} onClick={() => navigate(`/stocks/${s.symbol}`)}
                  className="border-b border-border/50 hover:bg-bg cursor-pointer transition-colors">
                  <td className="py-3 px-5 font-bold text-accent">{s.symbol}</td>
                  <td className="py-3 px-5 text-text-primary">{s.name}</td>
                  <td className="py-3 px-5">
                    <span className="text-xs px-2 py-0.5 rounded bg-surface-light text-text-muted">{s.sector || '—'}</span>
                  </td>
                  <td className="py-3 px-5 text-text-muted">{s.exchange || '—'}</td>
                </tr>
              ))}
            </tbody>
          </table>
          {filtered.length === 0 && (
            <p className="text-text-muted text-sm text-center py-12">No stocks match your filters</p>
          )}
        </div>
      )}
    </div>
  );
}
