import { useState } from 'react';
import { User, Shield, Bell, CreditCard, Check, Sun, Moon, Activity, TrendingUp, Zap, BarChart3, Star, Palette, Globe, Lock, Smartphone, Mail, Volume2, Clock, Eye, ChevronRight, LogOut } from 'lucide-react';
import { useAuthStore } from '../stores/authStore';
import { useThemeStore } from '../stores/themeStore';
import { useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { signalsApi } from '../api/signals';
import { watchlistApi } from '../api/watchlist';
import { portfolioApi } from '../api/portfolio';

const tiers = [
  { name: 'Free', price: '$0', monthly: '/mo', features: ['5 watchlist stocks', '3 active alerts', 'Delayed signals', 'Basic charts'], color: 'border-border', badge: 'bg-text-muted/20 text-text-muted' },
  { name: 'Pro', price: '$49', monthly: '/mo', features: ['50 watchlist stocks', '25 active alerts', 'Real-time signals', 'Options flow', 'AI signal generation', 'Trade thesis', 'Priority support'], color: 'border-accent/40', badge: 'bg-accent/10 text-accent', popular: true },
  { name: 'Elite', price: '$99', monthly: '/mo', features: ['Unlimited everything', 'API access', 'Backtesting', 'Copy trading', 'Webhook integrations', 'Tax reports', 'Dedicated support'], color: 'border-purple/40', badge: 'bg-purple/10 text-purple' },
];

type ThemeMode = 'dark' | 'light';

export default function SettingsPage() {
  const user = useAuthStore((s) => s.user);
  const logout = useAuthStore((s) => s.logout);
  const theme = useThemeStore((s) => s.theme);
  const setTheme = useThemeStore((s) => s.setTheme);
  const navigate = useNavigate();

  const [activeTab, setActiveTab] = useState('profile');
  const [notifications, setNotifications] = useState({
    signalAlerts: true, priceAlerts: true, newsAlerts: false, earningsAlerts: true,
    emailDigest: false, weeklyReport: true, pushNotifications: true, soundEnabled: true,
    insiderAlerts: false, anomalyAlerts: true, portfolioUpdates: true, marketOpen: false,
  });

  const { data: signals } = useQuery({ queryKey: ['user-signals-settings'], queryFn: () => signalsApi.getSignals(undefined, 100) });
  const { data: watchlist } = useQuery({ queryKey: ['watchlist-settings'], queryFn: watchlistApi.get });
  const { data: portfolio } = useQuery({ queryKey: ['portfolio-settings'], queryFn: portfolioApi.get });

  const buySignals = signals?.filter(s => String(s.type) === 'Buy' || String(s.type) === '0').length ?? 0;
  const totalSignals = signals?.length ?? 1;

  const tabs = [
    { id: 'profile', label: 'Profile', icon: User },
    { id: 'appearance', label: 'Appearance', icon: Palette },
    { id: 'notifications', label: 'Notifications', icon: Bell },
    { id: 'security', label: 'Security', icon: Shield },
    { id: 'subscription', label: 'Subscription', icon: CreditCard },
  ];

  const handleLogout = () => { logout(); navigate('/login'); };

  return (
    <div className="page-enter">
      {/* Profile Hero */}
      <div className="relative overflow-hidden rounded-2xl border border-border mb-6">
        <div className="absolute inset-0 bg-gradient-to-br from-accent/8 via-purple/5 to-info/8 animate-gradient" />
        <div className="absolute inset-0 bg-bg/50" />
        <div className="relative p-6 md:p-8">
          <div className="flex flex-col md:flex-row items-center md:items-start gap-6">
            <div className="relative">
              <div className="w-24 h-24 rounded-2xl bg-gradient-to-br from-accent via-info to-purple flex items-center justify-center text-bg text-4xl font-black shadow-2xl glow-accent">
                {user?.fullName?.charAt(0) ?? 'U'}
              </div>
              <div className="absolute -bottom-1 -right-1 w-6 h-6 rounded-full bg-accent border-2 border-bg flex items-center justify-center">
                <Check className="w-3 h-3 text-bg" />
              </div>
            </div>
            <div className="flex-1 text-center md:text-left">
              <h1 className="text-3xl font-black text-text-primary">{user?.fullName}</h1>
              <p className="text-sm text-text-muted mt-1 flex items-center gap-1 justify-center md:justify-start">
                <Mail className="w-3.5 h-3.5" /> {user?.email}
              </p>
              <div className="flex items-center gap-2 mt-3 justify-center md:justify-start">
                <span className="px-3 py-1 rounded-full bg-gradient-to-r from-accent/20 to-info/20 text-accent text-xs font-bold border border-accent/20">Elite Member</span>
                <span className="px-3 py-1 rounded-full bg-purple/10 text-purple text-xs font-bold flex items-center gap-1">
                  <Zap className="w-3 h-3" /> Active
                </span>
                <span className="px-3 py-1 rounded-full bg-surface-light text-text-muted text-xs font-medium flex items-center gap-1">
                  <Clock className="w-3 h-3" /> Joined Mar 2026
                </span>
              </div>
            </div>
            <div className="hidden lg:grid grid-cols-4 gap-3">
              <MiniStat icon={TrendingUp} value={signals?.length ?? 0} label="Signals" color="text-accent" />
              <MiniStat icon={Star} value={watchlist?.length ?? 0} label="Watchlist" color="text-warning" />
              <MiniStat icon={BarChart3} value={portfolio?.length ?? 0} label="Positions" color="text-info" />
              <MiniStat icon={Zap} value={`${Math.round((buySignals / totalSignals) * 100)}%`} label="Win Rate" color="text-purple" />
            </div>
          </div>
        </div>
      </div>

      {/* Tab Nav */}
      <div className="flex gap-1 mb-6 overflow-x-auto pb-1">
        {tabs.map(({ id, label, icon: Icon }) => (
          <button key={id} onClick={() => setActiveTab(id)}
            className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-medium whitespace-nowrap transition-all ${
              activeTab === id ? 'bg-accent/10 text-accent border border-accent/20' : 'text-text-muted hover:text-text-primary hover:bg-surface'
            }`}>
            <Icon className="w-4 h-4" /> {label}
          </button>
        ))}
      </div>

      {/* Tab Content */}
      <div className="animate-fade-up">

        {/* PROFILE TAB */}
        {activeTab === 'profile' && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className="bg-surface border border-border rounded-2xl p-6 card-hover">
              <h2 className="text-lg font-black text-text-primary mb-5">Personal Information</h2>
              <div className="space-y-4">
                <FormField label="Full Name" defaultValue={user?.fullName} icon={User} />
                <FormField label="Email Address" defaultValue={user?.email} icon={Mail} type="email" />
                <FormField label="Phone" defaultValue="+1 (555) 000-0000" icon={Smartphone} />
                <FormField label="Timezone" defaultValue="Eastern Time (ET)" icon={Globe} />
                <button className="w-full py-2.5 rounded-xl bg-accent text-bg text-sm font-bold hover:bg-accent-dim transition-all btn-shine glow-accent">
                  Save Changes
                </button>
              </div>
            </div>
            <div className="space-y-6">
              <div className="bg-surface border border-border rounded-2xl p-6 card-hover">
                <h2 className="text-lg font-black text-text-primary mb-4">Trading Preferences</h2>
                <div className="space-y-3">
                  <PreferenceRow label="Default Chart Type" value="Candlestick" />
                  <PreferenceRow label="Signal Confidence Threshold" value="65%" />
                  <PreferenceRow label="Auto-refresh Interval" value="30 seconds" />
                  <PreferenceRow label="Default Timeframe" value="1 Day" />
                  <PreferenceRow label="Currency" value="USD ($)" />
                </div>
              </div>
              <div className="bg-surface border border-border rounded-2xl p-6 card-hover">
                <h2 className="text-lg font-black text-text-primary mb-4">Danger Zone</h2>
                <div className="space-y-3">
                  <button onClick={handleLogout}
                    className="w-full py-2.5 rounded-xl bg-danger/10 text-danger text-sm font-bold hover:bg-danger/20 transition-colors flex items-center justify-center gap-2">
                    <LogOut className="w-4 h-4" /> Sign Out
                  </button>
                  <button className="w-full py-2.5 rounded-xl bg-bg text-text-muted text-sm font-medium hover:bg-surface-light transition-colors">
                    Delete Account
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* APPEARANCE TAB */}
        {activeTab === 'appearance' && (
          <div className="max-w-2xl space-y-6">
            <div className="bg-surface border border-border rounded-2xl p-6 card-hover">
              <h2 className="text-lg font-black text-text-primary mb-5">Theme</h2>
              <div className="grid grid-cols-2 gap-4">
                <ThemeCard mode="dark" active={theme === 'dark'} onClick={() => setTheme('dark')}
                  preview={<div className="w-full h-20 rounded-lg bg-[#06060B] border border-[#1A1F35] flex items-center justify-center gap-2">
                    <Moon className="w-5 h-5 text-[#5B6378]" />
                    <div className="space-y-1"><div className="w-12 h-1.5 bg-[#1A1F35] rounded" /><div className="w-8 h-1.5 bg-[#00FF94]/30 rounded" /></div>
                  </div>}
                  label="Dark Mode" description="Easy on the eyes, perfect for trading" />
                <ThemeCard mode="light" active={theme === 'light'} onClick={() => setTheme('light')}
                  preview={<div className="w-full h-20 rounded-lg bg-white border border-gray-200 flex items-center justify-center gap-2">
                    <Sun className="w-5 h-5 text-gray-400" />
                    <div className="space-y-1"><div className="w-12 h-1.5 bg-gray-200 rounded" /><div className="w-8 h-1.5 bg-emerald-200 rounded" /></div>
                  </div>}
                  label="Light Mode" description="Clean and bright interface" />
              </div>
            </div>
            <div className="bg-surface border border-border rounded-2xl p-6 card-hover">
              <h2 className="text-lg font-black text-text-primary mb-5">Accent Color</h2>
              <div className="flex gap-3">
                {[
                  { color: '#00FF94', name: 'Green' }, { color: '#38BDF8', name: 'Blue' },
                  { color: '#A78BFA', name: 'Purple' }, { color: '#FFB020', name: 'Gold' },
                  { color: '#FF3B5C', name: 'Red' }, { color: '#F472B6', name: 'Pink' },
                ].map(c => (
                  <button key={c.color} className={`w-10 h-10 rounded-xl border-2 transition-all ${c.color === '#00FF94' ? 'border-white scale-110' : 'border-transparent hover:scale-105'}`}
                    style={{ backgroundColor: c.color }} title={c.name} />
                ))}
              </div>
            </div>
            <div className="bg-surface border border-border rounded-2xl p-6 card-hover">
              <h2 className="text-lg font-black text-text-primary mb-5">Display</h2>
              <div className="space-y-4">
                <ToggleRow label="Compact Mode" description="Reduce padding for more data density" checked={false} onChange={() => {}} />
                <ToggleRow label="Show Sparklines" description="Mini charts in watchlist and tables" checked={true} onChange={() => {}} />
                <ToggleRow label="Animate Charts" description="Smooth transitions on chart updates" checked={true} onChange={() => {}} />
                <ToggleRow label="Show Scrolling Ticker" description="Price ticker bar at the bottom" checked={true} onChange={() => {}} />
              </div>
            </div>
          </div>
        )}

        {/* NOTIFICATIONS TAB */}
        {activeTab === 'notifications' && (
          <div className="max-w-2xl space-y-6">
            <div className="bg-surface border border-border rounded-2xl p-6 card-hover">
              <div className="flex items-center gap-2 mb-5">
                <Zap className="w-5 h-5 text-accent" />
                <h2 className="text-lg font-black text-text-primary">Signal & Trading Alerts</h2>
              </div>
              <div className="space-y-4">
                <ToggleRow label="AI Signal Alerts" description="Get notified when new buy/sell signals are generated" icon={Zap}
                  checked={notifications.signalAlerts} onChange={() => setNotifications(n => ({ ...n, signalAlerts: !n.signalAlerts }))} />
                <ToggleRow label="Price Alerts" description="Trigger when your target prices are hit" icon={TrendingUp}
                  checked={notifications.priceAlerts} onChange={() => setNotifications(n => ({ ...n, priceAlerts: !n.priceAlerts }))} />
                <ToggleRow label="Anomaly Alerts" description="Unusual price/volume activity detected by AI" icon={Eye}
                  checked={notifications.anomalyAlerts} onChange={() => setNotifications(n => ({ ...n, anomalyAlerts: !n.anomalyAlerts }))} />
                <ToggleRow label="Insider Trading Alerts" description="SEC Form 4 filings for watchlist stocks" icon={User}
                  checked={notifications.insiderAlerts} onChange={() => setNotifications(n => ({ ...n, insiderAlerts: !n.insiderAlerts }))} />
                <ToggleRow label="Earnings Alerts" description="Upcoming earnings for watchlist stocks" icon={BarChart3}
                  checked={notifications.earningsAlerts} onChange={() => setNotifications(n => ({ ...n, earningsAlerts: !n.earningsAlerts }))} />
              </div>
            </div>
            <div className="bg-surface border border-border rounded-2xl p-6 card-hover">
              <div className="flex items-center gap-2 mb-5">
                <Bell className="w-5 h-5 text-info" />
                <h2 className="text-lg font-black text-text-primary">General Notifications</h2>
              </div>
              <div className="space-y-4">
                <ToggleRow label="News Alerts" description="Breaking news for watched stocks" icon={Globe}
                  checked={notifications.newsAlerts} onChange={() => setNotifications(n => ({ ...n, newsAlerts: !n.newsAlerts }))} />
                <ToggleRow label="Portfolio Updates" description="Daily portfolio value changes" icon={BarChart3}
                  checked={notifications.portfolioUpdates} onChange={() => setNotifications(n => ({ ...n, portfolioUpdates: !n.portfolioUpdates }))} />
                <ToggleRow label="Market Open/Close" description="Bell at 9:30 AM and 4:00 PM ET" icon={Clock}
                  checked={notifications.marketOpen} onChange={() => setNotifications(n => ({ ...n, marketOpen: !n.marketOpen }))} />
              </div>
            </div>
            <div className="bg-surface border border-border rounded-2xl p-6 card-hover">
              <div className="flex items-center gap-2 mb-5">
                <Mail className="w-5 h-5 text-purple" />
                <h2 className="text-lg font-black text-text-primary">Email & Sound</h2>
              </div>
              <div className="space-y-4">
                <ToggleRow label="Email Digest" description="Daily summary of signals and portfolio" icon={Mail}
                  checked={notifications.emailDigest} onChange={() => setNotifications(n => ({ ...n, emailDigest: !n.emailDigest }))} />
                <ToggleRow label="Weekly Report" description="Weekly performance report every Monday" icon={BarChart3}
                  checked={notifications.weeklyReport} onChange={() => setNotifications(n => ({ ...n, weeklyReport: !n.weeklyReport }))} />
                <ToggleRow label="Push Notifications" description="Browser and mobile push alerts" icon={Smartphone}
                  checked={notifications.pushNotifications} onChange={() => setNotifications(n => ({ ...n, pushNotifications: !n.pushNotifications }))} />
                <ToggleRow label="Sound Effects" description="Audio chime on new signals and alerts" icon={Volume2}
                  checked={notifications.soundEnabled} onChange={() => setNotifications(n => ({ ...n, soundEnabled: !n.soundEnabled }))} />
              </div>
            </div>
          </div>
        )}

        {/* SECURITY TAB */}
        {activeTab === 'security' && (
          <div className="max-w-2xl space-y-6">
            <div className="bg-surface border border-border rounded-2xl p-6 card-hover">
              <h2 className="text-lg font-black text-text-primary mb-5">Password</h2>
              <div className="space-y-4">
                <FormField label="Current Password" type="password" icon={Lock} />
                <FormField label="New Password" type="password" icon={Lock} />
                <FormField label="Confirm Password" type="password" icon={Lock} />
                <button className="px-6 py-2.5 rounded-xl bg-accent text-bg text-sm font-bold hover:bg-accent-dim btn-shine">
                  Update Password
                </button>
              </div>
            </div>
            <div className="bg-surface border border-border rounded-2xl p-6 card-hover">
              <h2 className="text-lg font-black text-text-primary mb-5">Two-Factor Authentication</h2>
              <div className="flex items-center justify-between p-4 bg-bg rounded-xl">
                <div>
                  <p className="text-sm font-semibold text-text-primary">2FA Status</p>
                  <p className="text-xs text-text-muted">Add extra security to your account</p>
                </div>
                <span className="px-3 py-1 rounded-full bg-warning/10 text-warning text-xs font-bold">Not Enabled</span>
              </div>
              <button className="mt-4 px-5 py-2.5 rounded-xl bg-surface-light text-text-primary text-sm font-medium hover:bg-border transition-colors">
                Enable 2FA
              </button>
            </div>
            <div className="bg-surface border border-border rounded-2xl p-6 card-hover">
              <h2 className="text-lg font-black text-text-primary mb-5">Active Sessions</h2>
              <div className="space-y-3">
                <SessionRow device="Windows PC" location="Chrome Browser" active current />
                <SessionRow device="iPhone 15" location="Expo Go App" active={false} />
              </div>
            </div>
            <div className="bg-surface border border-border rounded-2xl p-6 card-hover">
              <h2 className="text-lg font-black text-text-primary mb-5">API Keys</h2>
              <p className="text-xs text-text-muted mb-3">Generate API keys for programmatic access (Elite plan only)</p>
              <button className="px-5 py-2.5 rounded-xl bg-surface-light text-text-primary text-sm font-medium hover:bg-border transition-colors">
                Generate API Key
              </button>
            </div>
          </div>
        )}

        {/* SUBSCRIPTION TAB */}
        {activeTab === 'subscription' && (
          <div className="space-y-6">
            <div className="bg-surface border border-accent/20 rounded-2xl p-6">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-lg font-black text-text-primary">Current Plan: <span className="gradient-text">Elite</span></h2>
                  <p className="text-sm text-text-muted mt-1">Billed $99/month | Next renewal: Apr 2, 2026</p>
                </div>
                <div className="text-right">
                  <div className="text-2xl font-black text-text-primary">$99<span className="text-sm text-text-muted font-normal">/mo</span></div>
                </div>
              </div>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {tiers.map((tier) => (
                <div key={tier.name} className={`bg-surface border-2 ${tier.color} rounded-2xl p-6 relative card-hover`}>
                  {tier.popular && (
                    <span className="absolute -top-3 left-1/2 -translate-x-1/2 bg-accent text-bg text-[10px] font-black px-4 py-1 rounded-full shadow-lg glow-accent">MOST POPULAR</span>
                  )}
                  <div className="flex items-baseline gap-1 mb-1">
                    <span className="text-3xl font-black text-text-primary">{tier.price}</span>
                    <span className="text-sm text-text-muted">{tier.monthly}</span>
                  </div>
                  <h3 className="text-sm font-bold text-text-muted mb-4">{tier.name}</h3>
                  <ul className="space-y-2 mb-6">
                    {tier.features.map((f) => (
                      <li key={f} className="flex items-center gap-2 text-xs text-text-muted">
                        <Check className="w-3.5 h-3.5 text-accent flex-shrink-0" /> {f}
                      </li>
                    ))}
                  </ul>
                  <button className={`w-full py-2.5 rounded-xl text-sm font-bold transition-all ${
                    tier.popular ? 'bg-accent text-bg hover:bg-accent-dim btn-shine glow-accent' : 'bg-bg text-text-primary hover:bg-surface-light'
                  }`}>
                    {tier.name === 'Elite' ? 'Current Plan' : `Switch to ${tier.name}`}
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Footer */}
      <div className="text-center py-8 mt-8 border-t border-border">
        <div className="flex items-center justify-center gap-2 mb-2">
          <Activity className="w-4 h-4 text-accent" />
          <span className="text-sm font-bold gradient-text">SignalForge</span>
        </div>
        <p className="text-[10px] text-text-muted">Version 1.0.0 | AI Stock Trading Intelligence Platform</p>
        <div className="flex items-center justify-center gap-4 mt-2 text-[10px] text-text-muted">
          <span className="hover:text-text-primary cursor-pointer">Terms</span>
          <span>|</span>
          <span className="hover:text-text-primary cursor-pointer">Privacy</span>
          <span>|</span>
          <span className="hover:text-text-primary cursor-pointer">Support</span>
        </div>
      </div>
    </div>
  );
}

function MiniStat({ icon: Icon, value, label, color }: { icon: typeof TrendingUp; value: number | string; label: string; color: string }) {
  return (
    <div className="bg-bg/50 rounded-xl p-3 text-center min-w-[70px]">
      <Icon className={`w-3.5 h-3.5 ${color} mx-auto mb-1`} />
      <div className={`text-base font-black ${color} font-mono`}>{value}</div>
      <div className="text-[8px] text-text-muted uppercase tracking-wider">{label}</div>
    </div>
  );
}

function FormField({ label, defaultValue, icon: Icon, type = 'text' }: { label: string; defaultValue?: string; icon?: typeof User; type?: string }) {
  return (
    <div>
      <label className="text-[10px] font-bold text-text-muted uppercase tracking-widest mb-1.5 block">{label}</label>
      <div className="relative">
        {Icon && <Icon className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-text-muted" />}
        <input type={type} defaultValue={defaultValue}
          className={`w-full bg-bg border border-border rounded-xl ${Icon ? 'pl-11' : 'pl-4'} pr-4 py-2.5 text-sm text-text-primary focus:outline-none focus:border-accent/40 transition-all`} />
      </div>
    </div>
  );
}

function PreferenceRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between py-2 border-b border-border/30 last:border-0">
      <span className="text-sm text-text-muted">{label}</span>
      <div className="flex items-center gap-1 text-sm text-text-primary font-medium">
        {value} <ChevronRight className="w-3 h-3 text-text-muted" />
      </div>
    </div>
  );
}

function ThemeCard({ mode: _mode, active, onClick, preview, label, description }: { mode: ThemeMode; active: boolean; onClick: () => void; preview: React.ReactNode; label: string; description: string }) {
  return (
    <button onClick={onClick}
      className={`p-4 rounded-2xl border-2 transition-all text-left ${active ? 'border-accent bg-accent/5 shadow-lg' : 'border-border hover:border-text-muted'}`}>
      {preview}
      <div className="mt-3">
        <div className={`text-sm font-bold ${active ? 'text-accent' : 'text-text-primary'}`}>{label}</div>
        <div className="text-[10px] text-text-muted mt-0.5">{description}</div>
      </div>
      {active && <div className="mt-2 flex items-center gap-1 text-[10px] text-accent font-bold"><Check className="w-3 h-3" /> Active</div>}
    </button>
  );
}

function ToggleRow({ label, description, checked, onChange, icon: Icon }: { label: string; description: string; checked: boolean; onChange: () => void; icon?: typeof Bell }) {
  return (
    <div className="flex items-center justify-between py-2">
      <div className="flex items-center gap-3">
        {Icon && <div className="w-8 h-8 rounded-lg bg-bg flex items-center justify-center"><Icon className="w-4 h-4 text-text-muted" /></div>}
        <div>
          <div className="text-sm font-semibold text-text-primary">{label}</div>
          <div className="text-[10px] text-text-muted">{description}</div>
        </div>
      </div>
      <label className="relative inline-flex items-center cursor-pointer">
        <input type="checkbox" checked={checked} onChange={onChange} className="sr-only peer" />
        <div className="w-10 h-5 bg-border rounded-full peer peer-checked:bg-accent/60 peer-checked:after:translate-x-full after:content-[''] after:absolute after:top-0.5 after:left-[2px] after:bg-white after:rounded-full after:h-4 after:w-4 after:transition-all after:shadow-sm" />
      </label>
    </div>
  );
}

function SessionRow({ device, location, active, current }: { device: string; location: string; active: boolean; current?: boolean }) {
  return (
    <div className="flex items-center justify-between p-3 bg-bg rounded-xl">
      <div className="flex items-center gap-3">
        <div className={`w-2 h-2 rounded-full ${active ? 'bg-accent' : 'bg-text-muted'}`} />
        <div>
          <p className="text-sm font-medium text-text-primary">{device}</p>
          <p className="text-[10px] text-text-muted">{location}</p>
        </div>
      </div>
      <div className="flex items-center gap-2">
        {current && <span className="text-[9px] px-2 py-0.5 rounded-full bg-accent/10 text-accent font-bold">Current</span>}
        {!current && <button className="text-xs text-text-muted hover:text-danger transition-colors">Revoke</button>}
      </div>
    </div>
  );
}
