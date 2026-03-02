import { useState, useEffect, useCallback } from 'react';
import { Bell, BellRing, Check, CheckCheck, Trash2, Radar, AlertTriangle, Newspaper, Settings, Filter, BellOff } from 'lucide-react';

interface AppNotification {
  id: string;
  type: 'signal' | 'alert' | 'news' | 'system';
  title: string;
  message: string;
  timestamp: string;
  read: boolean;
}

const STORAGE_KEY = 'sf-notification-history';

const TYPE_META: Record<string, { icon: typeof Bell; color: string; label: string }> = {
  signal: { icon: Radar, color: 'text-accent', label: 'Signals' },
  alert: { icon: AlertTriangle, color: 'text-warning', label: 'Alerts' },
  news: { icon: Newspaper, color: 'text-info', label: 'News' },
  system: { icon: Settings, color: 'text-purple', label: 'System' },
};

const SEED_NOTIFICATIONS: AppNotification[] = [
  { id: '1', type: 'signal', title: 'New Buy Signal: AAPL', message: 'AI detected a strong buy signal for Apple Inc. with 87% confidence.', timestamp: new Date(Date.now() - 300000).toISOString(), read: false },
  { id: '2', type: 'alert', title: 'Price Alert Triggered', message: 'TSLA has crossed above your target price of $245.00.', timestamp: new Date(Date.now() - 900000).toISOString(), read: false },
  { id: '3', type: 'news', title: 'Breaking: Fed Rate Decision', message: 'Federal Reserve holds rates steady at 4.5%. Markets react positively.', timestamp: new Date(Date.now() - 1800000).toISOString(), read: true },
  { id: '4', type: 'system', title: 'Maintenance Scheduled', message: 'Planned maintenance window: Mar 5, 2:00-4:00 AM ET. Expect brief interruptions.', timestamp: new Date(Date.now() - 3600000).toISOString(), read: true },
  { id: '5', type: 'signal', title: 'Sell Signal: NVDA', message: 'AI suggests taking profits on NVIDIA. RSI overbought at 78.', timestamp: new Date(Date.now() - 7200000).toISOString(), read: false },
  { id: '6', type: 'alert', title: 'Volume Spike: AMD', message: 'AMD trading at 3.2x average volume. Unusual activity detected.', timestamp: new Date(Date.now() - 10800000).toISOString(), read: true },
  { id: '7', type: 'news', title: 'Earnings Beat: MSFT', message: 'Microsoft Q4 earnings beat estimates. Revenue up 18% YoY.', timestamp: new Date(Date.now() - 14400000).toISOString(), read: true },
  { id: '8', type: 'system', title: 'Welcome to SignalForge', message: 'Your account is set up! Explore AI signals, set alerts, and build your portfolio.', timestamp: new Date(Date.now() - 86400000).toISOString(), read: true },
];

function loadNotifications(): AppNotification[] {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) return JSON.parse(stored);
  } catch { /* ignore */ }
  localStorage.setItem(STORAGE_KEY, JSON.stringify(SEED_NOTIFICATIONS));
  return SEED_NOTIFICATIONS;
}

function timeAgo(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return 'Just now';
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  const days = Math.floor(hrs / 24);
  return `${days}d ago`;
}

type FilterType = 'all' | 'signal' | 'alert' | 'news' | 'system';

export default function NotificationCenter() {
  const [notifications, setNotifications] = useState<AppNotification[]>(loadNotifications);
  const [filter, setFilter] = useState<FilterType>('all');
  const [permissionStatus, setPermissionStatus] = useState<NotificationPermission | 'unsupported'>('default');

  useEffect(() => {
    if ('Notification' in window) {
      setPermissionStatus(Notification.permission);
    } else {
      setPermissionStatus('unsupported');
    }
  }, []);

  const persist = useCallback((items: AppNotification[]) => {
    setNotifications(items);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(items));
  }, []);

  const requestPermission = async () => {
    if (!('Notification' in window)) return;
    const perm = await Notification.requestPermission();
    setPermissionStatus(perm);
    if (perm === 'granted') {
      new Notification('SignalForge', { body: 'Push notifications enabled!' });
    }
  };

  const markAllRead = () => persist(notifications.map((n) => ({ ...n, read: true })));
  const toggleRead = (id: string) => persist(notifications.map((n) => (n.id === id ? { ...n, read: !n.read } : n)));
  const clearAll = () => persist([]);

  const filtered = filter === 'all' ? notifications : notifications.filter((n) => n.type === filter);
  const unreadCount = notifications.filter((n) => !n.read).length;

  const filters: { key: FilterType; label: string }[] = [
    { key: 'all', label: 'All' },
    { key: 'signal', label: 'Signals' },
    { key: 'alert', label: 'Alerts' },
    { key: 'news', label: 'News' },
    { key: 'system', label: 'System' },
  ];

  return (
    <div className="page-enter max-w-4xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-accent/10 flex items-center justify-center">
            <Bell className="w-5 h-5 text-accent" />
          </div>
          <div>
            <h1 className="text-2xl font-black text-text-primary">Notifications</h1>
            <p className="text-xs text-text-muted">{unreadCount} unread notification{unreadCount !== 1 ? 's' : ''}</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <button onClick={markAllRead} className="px-3 py-2 rounded-xl bg-surface border border-border text-xs font-medium text-text-muted hover:text-accent hover:border-accent/20 transition-all flex items-center gap-1.5">
            <CheckCheck className="w-3.5 h-3.5" /> Mark all read
          </button>
          <button onClick={clearAll} className="px-3 py-2 rounded-xl bg-surface border border-border text-xs font-medium text-text-muted hover:text-danger hover:border-danger/20 transition-all flex items-center gap-1.5">
            <Trash2 className="w-3.5 h-3.5" /> Clear all
          </button>
        </div>
      </div>

      {/* Permission Banner */}
      {permissionStatus === 'default' && (
        <div className="mb-6 bg-surface border border-accent/20 rounded-2xl p-5 flex items-center justify-between animate-fade-up">
          <div className="flex items-center gap-3">
            <BellRing className="w-5 h-5 text-accent" />
            <div>
              <p className="text-sm font-bold text-text-primary">Enable push notifications</p>
              <p className="text-xs text-text-muted">Get real-time alerts for signals, price targets, and breaking news.</p>
            </div>
          </div>
          <button onClick={requestPermission} className="px-5 py-2.5 rounded-xl bg-accent text-bg text-sm font-bold hover:bg-accent-dim transition-all btn-shine glow-accent">
            Allow
          </button>
        </div>
      )}

      {permissionStatus === 'denied' && (
        <div className="mb-6 bg-surface border border-danger/20 rounded-2xl p-5 flex items-center gap-3 animate-fade-up">
          <BellOff className="w-5 h-5 text-danger" />
          <div>
            <p className="text-sm font-bold text-text-primary">Notifications blocked</p>
            <p className="text-xs text-text-muted">Enable notifications in your browser settings to receive real-time alerts.</p>
          </div>
        </div>
      )}

      {/* Filters */}
      <div className="flex items-center gap-2 mb-5">
        <Filter className="w-4 h-4 text-text-muted" />
        {filters.map(({ key, label }) => (
          <button
            key={key}
            onClick={() => setFilter(key)}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
              filter === key ? 'bg-accent/10 text-accent border border-accent/20' : 'text-text-muted hover:text-text-primary hover:bg-surface'
            }`}
          >
            {label}
          </button>
        ))}
      </div>

      {/* Notification List */}
      <div className="space-y-2">
        {filtered.length === 0 && (
          <div className="text-center py-20">
            <Bell className="w-12 h-12 text-text-muted/20 mx-auto mb-4" />
            <p className="text-text-muted text-sm font-medium">No notifications</p>
            <p className="text-text-muted/50 text-xs mt-1">You're all caught up!</p>
          </div>
        )}
        {filtered.map((n, i) => {
          const meta = TYPE_META[n.type];
          const Icon = meta.icon;
          return (
            <div
              key={n.id}
              style={{ animationDelay: `${i * 40}ms` }}
              className={`animate-fade-up bg-surface border rounded-xl p-4 flex items-start gap-3.5 card-hover cursor-pointer transition-all ${
                n.read ? 'border-border opacity-70' : 'border-accent/15'
              }`}
              onClick={() => toggleRead(n.id)}
            >
              <div className={`w-9 h-9 rounded-lg flex items-center justify-center flex-shrink-0 ${meta.color.replace('text-', 'bg-')}/10`}>
                <Icon className={`w-4.5 h-4.5 ${meta.color}`} />
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <h3 className="text-sm font-bold text-text-primary truncate">{n.title}</h3>
                  <span className={`text-[9px] px-1.5 py-0.5 rounded-full font-bold ${meta.color.replace('text-', 'bg-')}/10 ${meta.color}`}>
                    {meta.label}
                  </span>
                </div>
                <p className="text-xs text-text-muted mt-0.5 line-clamp-2">{n.message}</p>
                <p className="text-[10px] text-text-muted/50 mt-1.5 font-mono">{timeAgo(n.timestamp)}</p>
              </div>
              <div className="flex items-center gap-2 flex-shrink-0">
                {!n.read && <span className="w-2.5 h-2.5 rounded-full bg-accent animate-pulse" />}
                {n.read && <Check className="w-4 h-4 text-text-muted/30" />}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
