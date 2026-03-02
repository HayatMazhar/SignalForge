import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { Search, Bell, X, TrendingUp, TrendingDown, ChevronRight } from 'lucide-react';
import { useAuthStore } from '../stores/authStore';
import { useSignalStore } from '../stores/signalStore';
import { getSignalLabel } from '../utils/signalType';
import { stocksApi } from '../api/stocks';
import type { Stock } from '../types';

export default function TopBar() {
  const user = useAuthStore((s) => s.user);
  const signals = useSignalStore((s) => s.signals);
  const navigate = useNavigate();

  const [query, setQuery] = useState('');
  const [results, setResults] = useState<Stock[]>([]);
  const [showResults, setShowResults] = useState(false);
  const [showNotifications, setShowNotifications] = useState(false);
  const searchRef = useRef<HTMLDivElement>(null);
  const notifRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (query.length < 1) { setResults([]); return; }
    const timer = setTimeout(async () => {
      try { setResults(await stocksApi.search(query)); setShowResults(true); } catch { setResults([]); }
    }, 250);
    return () => clearTimeout(timer);
  }, [query]);

  useEffect(() => {
    const handleClick = (e: MouseEvent) => {
      if (searchRef.current && !searchRef.current.contains(e.target as Node)) setShowResults(false);
      if (notifRef.current && !notifRef.current.contains(e.target as Node)) setShowNotifications(false);
    };
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, []);

  const recentSignals = signals.slice(0, 5);
  const unreadCount = Math.min(recentSignals.length, 9);

  return (
    <div className="h-14 bg-surface/30 backdrop-blur-sm border-b border-border flex items-center justify-between px-5 flex-shrink-0">
      {/* Search */}
      <div ref={searchRef} className="relative w-80 lg:w-96">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-text-muted" />
        <input value={query} onChange={(e) => setQuery(e.target.value)}
          onFocus={() => results.length > 0 && setShowResults(true)}
          className="w-full bg-bg/40 border border-border rounded-xl pl-10 pr-4 py-2 text-sm text-text-primary placeholder-text-muted/60 focus:outline-none focus:border-accent/40 focus:bg-bg/60 transition-all"
          placeholder="Search stocks... ⌘K" />
        {showResults && results.length > 0 && (
          <div className="absolute top-full left-0 right-0 mt-2 glass-strong rounded-xl shadow-2xl z-50 max-h-80 overflow-y-auto">
            {results.map((s) => (
              <button key={s.id} onClick={() => { navigate(`/stocks/${s.symbol}`); setShowResults(false); setQuery(''); }}
                className="w-full flex items-center gap-3 px-4 py-3 hover:bg-accent/5 transition-colors text-left group">
                <span className="text-sm font-bold text-accent w-16">{s.symbol}</span>
                <span className="text-sm text-text-primary truncate flex-1">{s.name}</span>
                <ChevronRight className="w-3 h-3 text-text-muted opacity-0 group-hover:opacity-100 transition-opacity" />
              </button>
            ))}
          </div>
        )}
      </div>

      <div className="flex items-center gap-3">
        {/* Notifications */}
        <div ref={notifRef} className="relative">
          <button onClick={() => setShowNotifications(!showNotifications)}
            className="relative p-2 rounded-lg text-text-muted hover:text-text-primary hover:bg-surface-light transition-all">
            <Bell className="w-5 h-5" />
            {unreadCount > 0 && (
              <span className="absolute -top-0.5 -right-0.5 w-4 h-4 bg-accent text-bg text-[9px] font-black rounded-full flex items-center justify-center animate-pulse-glow">
                {unreadCount}
              </span>
            )}
          </button>
          {showNotifications && (
            <div className="absolute right-0 top-full mt-2 w-80 glass-strong rounded-xl shadow-2xl z-50 border-gradient">
              <div className="flex items-center justify-between px-4 py-3 border-b border-border">
                <span className="text-xs font-bold text-text-primary uppercase tracking-wider">Notifications</span>
                <button onClick={() => setShowNotifications(false)} className="text-text-muted hover:text-text-primary">
                  <X className="w-4 h-4" />
                </button>
              </div>
              <div className="max-h-72 overflow-y-auto">
                {recentSignals.length === 0 ? (
                  <p className="text-xs text-text-muted text-center py-8">No new notifications</p>
                ) : (
                  recentSignals.map((s) => (
                    <button key={s.id} onClick={() => { navigate(`/stocks/${s.symbol}`); setShowNotifications(false); }}
                      className="w-full px-4 py-3 hover:bg-accent/5 transition-colors text-left border-b border-border/30 last:border-0">
                      <div className="flex items-center gap-2 mb-0.5">
                        {getSignalLabel(s.type) === 'Buy' ? <TrendingUp className="w-3 h-3 text-accent" /> :
                         getSignalLabel(s.type) === 'Sell' ? <TrendingDown className="w-3 h-3 text-danger" /> :
                         <div className="w-3 h-3 rounded-full bg-warning" />}
                        <span className="text-[11px] font-bold text-text-primary">{s.symbol}</span>
                        <span className={`text-[9px] font-black px-1.5 py-0.5 rounded ${
                          getSignalLabel(s.type) === 'Buy' ? 'bg-accent/10 text-accent' :
                          getSignalLabel(s.type) === 'Sell' ? 'bg-danger/10 text-danger' : 'bg-warning/10 text-warning'
                        }`}>{getSignalLabel(s.type).toUpperCase()}</span>
                        <span className="text-[9px] text-text-muted ml-auto font-mono">{s.confidenceScore}%</span>
                      </div>
                      <p className="text-[10px] text-text-muted line-clamp-1">{s.reasoning}</p>
                    </button>
                  ))
                )}
              </div>
            </div>
          )}
        </div>

        {/* User */}
        <button onClick={() => navigate('/settings')}
          className="flex items-center gap-2 hover:bg-surface-light rounded-xl px-2 py-1.5 transition-all">
          <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-accent/20 to-info/20 flex items-center justify-center text-accent text-xs font-black">
            {user?.fullName?.charAt(0) ?? 'U'}
          </div>
          <div className="hidden lg:block text-left">
            <div className="text-xs font-semibold text-text-primary leading-tight">{user?.fullName}</div>
            <div className="text-[9px] text-text-muted leading-tight">{user?.email}</div>
          </div>
        </button>
      </div>
    </div>
  );
}
