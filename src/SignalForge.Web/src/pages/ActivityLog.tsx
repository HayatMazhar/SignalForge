import { useState, useEffect } from 'react';
import {
  ClipboardList, LogIn, Radar, Star, Bell, BookOpen, Settings, Filter,
  Monitor, Smartphone, Globe, TrendingUp, Shield, Trash2, ChevronDown,
} from 'lucide-react';

interface ActivityEntry {
  id: string;
  type: string;
  action: string;
  detail: string;
  timestamp: string;
  ip: string;
  device: string;
}

const STORAGE_KEY = 'sf-activity-log';

const TYPE_META: Record<string, { icon: typeof LogIn; color: string }> = {
  login: { icon: LogIn, color: 'text-accent' },
  signal: { icon: Radar, color: 'text-info' },
  watchlist: { icon: Star, color: 'text-warning' },
  alert: { icon: Bell, color: 'text-danger' },
  trade: { icon: TrendingUp, color: 'text-accent' },
  settings: { icon: Settings, color: 'text-purple' },
  security: { icon: Shield, color: 'text-danger' },
};

const DEVICES = ['Chrome on Windows', 'Safari on iPhone', 'Firefox on macOS', 'Edge on Windows'];
const IPS = ['192.168.1.42', '10.0.0.15', '172.16.0.88', '192.168.0.101'];

const SEED_ENTRIES: ActivityEntry[] = [
  { id: '1', type: 'login', action: 'Signed in', detail: 'Successful login via email/password', timestamp: new Date(Date.now() - 120000).toISOString(), ip: IPS[0], device: DEVICES[0] },
  { id: '2', type: 'signal', action: 'Signal Generated', detail: 'AI Buy signal for AAPL at $195.40 (87% confidence)', timestamp: new Date(Date.now() - 600000).toISOString(), ip: IPS[0], device: DEVICES[0] },
  { id: '3', type: 'watchlist', action: 'Added to Watchlist', detail: 'NVDA added to default watchlist', timestamp: new Date(Date.now() - 1200000).toISOString(), ip: IPS[0], device: DEVICES[0] },
  { id: '4', type: 'alert', action: 'Alert Created', detail: 'Price alert set for TSLA above $245.00', timestamp: new Date(Date.now() - 2400000).toISOString(), ip: IPS[1], device: DEVICES[1] },
  { id: '5', type: 'trade', action: 'Trade Logged', detail: 'Bought 50 shares of MSFT at $428.15', timestamp: new Date(Date.now() - 3600000).toISOString(), ip: IPS[0], device: DEVICES[0] },
  { id: '6', type: 'settings', action: 'Settings Changed', detail: 'Theme changed from Light to Dark mode', timestamp: new Date(Date.now() - 7200000).toISOString(), ip: IPS[0], device: DEVICES[0] },
  { id: '7', type: 'security', action: 'Password Changed', detail: 'Account password updated successfully', timestamp: new Date(Date.now() - 10800000).toISOString(), ip: IPS[2], device: DEVICES[2] },
  { id: '8', type: 'login', action: 'Signed in', detail: 'Successful login via Google OAuth', timestamp: new Date(Date.now() - 14400000).toISOString(), ip: IPS[2], device: DEVICES[2] },
  { id: '9', type: 'watchlist', action: 'Removed from Watchlist', detail: 'META removed from default watchlist', timestamp: new Date(Date.now() - 21600000).toISOString(), ip: IPS[0], device: DEVICES[0] },
  { id: '10', type: 'signal', action: 'Signal Generated', detail: 'AI Sell signal for AMZN at $186.20 (72% confidence)', timestamp: new Date(Date.now() - 28800000).toISOString(), ip: IPS[0], device: DEVICES[0] },
  { id: '11', type: 'trade', action: 'Trade Logged', detail: 'Sold 100 shares of GOOG at $165.80', timestamp: new Date(Date.now() - 43200000).toISOString(), ip: IPS[3], device: DEVICES[3] },
  { id: '12', type: 'alert', action: 'Alert Triggered', detail: 'Volume spike alert for AMD — 3.2x average', timestamp: new Date(Date.now() - 50400000).toISOString(), ip: IPS[0], device: DEVICES[0] },
  { id: '13', type: 'settings', action: 'Notification Preferences Updated', detail: 'Enabled push notifications and anomaly alerts', timestamp: new Date(Date.now() - 86400000).toISOString(), ip: IPS[0], device: DEVICES[0] },
  { id: '14', type: 'login', action: 'Signed in', detail: 'Successful login via email/password', timestamp: new Date(Date.now() - 172800000).toISOString(), ip: IPS[1], device: DEVICES[1] },
  { id: '15', type: 'security', action: '2FA Attempt', detail: 'Two-factor authentication setup initiated (not completed)', timestamp: new Date(Date.now() - 259200000).toISOString(), ip: IPS[0], device: DEVICES[0] },
];

function loadEntries(): ActivityEntry[] {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) return JSON.parse(stored);
  } catch { /* ignore */ }
  localStorage.setItem(STORAGE_KEY, JSON.stringify(SEED_ENTRIES));
  return SEED_ENTRIES;
}

function formatTime(iso: string): string {
  const d = new Date(iso);
  return d.toLocaleString([], { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' });
}

function groupByDate(entries: ActivityEntry[]): Record<string, ActivityEntry[]> {
  const groups: Record<string, ActivityEntry[]> = {};
  for (const e of entries) {
    const key = new Date(e.timestamp).toLocaleDateString([], { weekday: 'long', month: 'long', day: 'numeric' });
    (groups[key] ??= []).push(e);
  }
  return groups;
}

type FilterType = 'all' | 'login' | 'signal' | 'watchlist' | 'alert' | 'trade' | 'settings' | 'security';

export default function ActivityLog() {
  const [entries, setEntries] = useState<ActivityEntry[]>(loadEntries);
  const [filter, setFilter] = useState<FilterType>('all');
  const [expanded, setExpanded] = useState<Set<string>>(new Set());

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(entries));
  }, [entries]);

  const filtered = filter === 'all' ? entries : entries.filter((e) => e.type === filter);
  const grouped = groupByDate(filtered);

  const toggleExpand = (id: string) => {
    setExpanded((prev) => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  };

  const clearLog = () => {
    setEntries([]);
    localStorage.setItem(STORAGE_KEY, '[]');
  };

  const filters: { key: FilterType; label: string }[] = [
    { key: 'all', label: 'All' },
    { key: 'login', label: 'Logins' },
    { key: 'signal', label: 'Signals' },
    { key: 'watchlist', label: 'Watchlist' },
    { key: 'alert', label: 'Alerts' },
    { key: 'trade', label: 'Trades' },
    { key: 'settings', label: 'Settings' },
    { key: 'security', label: 'Security' },
  ];

  return (
    <div className="page-enter max-w-4xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-purple/10 flex items-center justify-center">
            <ClipboardList className="w-5 h-5 text-purple" />
          </div>
          <div>
            <h1 className="text-2xl font-black text-text-primary">Activity Log</h1>
            <p className="text-xs text-text-muted">{entries.length} events recorded</p>
          </div>
        </div>
        <button onClick={clearLog} className="px-3 py-2 rounded-xl bg-surface border border-border text-xs font-medium text-text-muted hover:text-danger hover:border-danger/20 transition-all flex items-center gap-1.5">
          <Trash2 className="w-3.5 h-3.5" /> Clear log
        </button>
      </div>

      {/* Filters */}
      <div className="flex items-center gap-2 mb-6 overflow-x-auto pb-1">
        <Filter className="w-4 h-4 text-text-muted flex-shrink-0" />
        {filters.map(({ key, label }) => (
          <button
            key={key}
            onClick={() => setFilter(key)}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium whitespace-nowrap transition-all ${
              filter === key ? 'bg-purple/10 text-purple border border-purple/20' : 'text-text-muted hover:text-text-primary hover:bg-surface'
            }`}
          >
            {label}
          </button>
        ))}
      </div>

      {/* Timeline */}
      {filtered.length === 0 ? (
        <div className="text-center py-20">
          <ClipboardList className="w-12 h-12 text-text-muted/20 mx-auto mb-4" />
          <p className="text-text-muted text-sm font-medium">No activity found</p>
          <p className="text-text-muted/50 text-xs mt-1">Your activity trail will appear here.</p>
        </div>
      ) : (
        <div className="space-y-8">
          {Object.entries(grouped).map(([date, items]) => (
            <div key={date}>
              <h2 className="text-xs font-bold text-text-muted uppercase tracking-widest mb-4">{date}</h2>
              <div className="relative">
                {/* Timeline line */}
                <div className="absolute left-[18px] top-0 bottom-0 w-px bg-border" />

                <div className="space-y-1">
                  {items.map((entry, i) => {
                    const meta = TYPE_META[entry.type] ?? { icon: Globe, color: 'text-text-muted' };
                    const Icon = meta.icon;
                    const isExpanded = expanded.has(entry.id);
                    return (
                      <div
                        key={entry.id}
                        style={{ animationDelay: `${i * 30}ms` }}
                        className="animate-fade-up relative pl-10"
                      >
                        {/* Timeline dot */}
                        <div className={`absolute left-2.5 top-3.5 w-3 h-3 rounded-full border-2 border-bg ${meta.color.replace('text-', 'bg-')}`} />

                        <button
                          onClick={() => toggleExpand(entry.id)}
                          className="w-full text-left bg-surface border border-border rounded-xl p-3.5 card-hover transition-all"
                        >
                          <div className="flex items-center gap-3">
                            <div className={`w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 ${meta.color.replace('text-', 'bg-')}/10`}>
                              <Icon className={`w-4 h-4 ${meta.color}`} />
                            </div>
                            <div className="flex-1 min-w-0">
                              <p className="text-sm font-bold text-text-primary">{entry.action}</p>
                              <p className="text-xs text-text-muted truncate">{entry.detail}</p>
                            </div>
                            <div className="flex items-center gap-2 flex-shrink-0">
                              <span className="text-[10px] text-text-muted/50 font-mono">{formatTime(entry.timestamp)}</span>
                              <ChevronDown className={`w-3.5 h-3.5 text-text-muted transition-transform ${isExpanded ? 'rotate-180' : ''}`} />
                            </div>
                          </div>

                          {isExpanded && (
                            <div className="mt-3 pt-3 border-t border-border grid grid-cols-2 gap-3">
                              <div className="flex items-center gap-2 text-xs text-text-muted">
                                <Monitor className="w-3.5 h-3.5" />
                                <span>{entry.device}</span>
                              </div>
                              <div className="flex items-center gap-2 text-xs text-text-muted">
                                <Globe className="w-3.5 h-3.5" />
                                <span className="font-mono">{entry.ip}</span>
                              </div>
                            </div>
                          )}
                        </button>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
