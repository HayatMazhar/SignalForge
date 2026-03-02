import { Settings, User, Shield, Bell, CreditCard, Check } from 'lucide-react';
import { useAuthStore } from '../stores/authStore';

const tiers = [
  {
    name: 'Free',
    price: '$0/mo',
    features: ['5 watchlist stocks', '3 active alerts', '15-min delayed signals', 'Basic charts'],
    color: 'border-border',
  },
  {
    name: 'Pro',
    price: '$49/mo',
    features: ['50 watchlist stocks', '25 active alerts', 'Real-time signals', 'Options flow data', 'AI signal generation', 'Priority support'],
    color: 'border-accent',
    popular: true,
  },
  {
    name: 'Elite',
    price: '$99/mo',
    features: ['Unlimited watchlist', 'Unlimited alerts', 'Real-time signals', 'Options flow data', 'AI signal generation', 'API access', 'Backtesting', 'Custom alerts', 'Dedicated support'],
    color: 'border-warning',
  },
];

export default function SettingsPage() {
  const user = useAuthStore((s) => s.user);

  return (
    <div className="space-y-8 max-w-4xl">
      <div className="flex items-center gap-3">
        <Settings className="w-8 h-8 text-accent" />
        <h1 className="text-2xl font-bold text-text-primary">Settings</h1>
      </div>

      {/* Account Section */}
      <div className="bg-surface border border-border rounded-xl p-6">
        <div className="flex items-center gap-2 mb-5">
          <User className="w-5 h-5 text-accent" />
          <h2 className="text-lg font-bold text-text-primary">Account</h2>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label className="text-xs text-text-muted uppercase tracking-wider">Full Name</label>
            <p className="text-text-primary mt-1 text-sm">{user?.fullName ?? 'Not set'}</p>
          </div>
          <div>
            <label className="text-xs text-text-muted uppercase tracking-wider">Email</label>
            <p className="text-text-primary mt-1 text-sm">{user?.email ?? 'Not set'}</p>
          </div>
        </div>
      </div>

      {/* Notification Preferences */}
      <div className="bg-surface border border-border rounded-xl p-6">
        <div className="flex items-center gap-2 mb-5">
          <Bell className="w-5 h-5 text-accent" />
          <h2 className="text-lg font-bold text-text-primary">Notifications</h2>
        </div>
        <div className="space-y-4">
          <ToggleRow label="Signal Alerts" description="Get notified when new AI signals are generated" defaultOn />
          <ToggleRow label="Price Alerts" description="Notifications when price targets are hit" defaultOn />
          <ToggleRow label="News Alerts" description="Breaking news for your watchlist stocks" defaultOn={false} />
          <ToggleRow label="Email Digest" description="Daily summary email of your portfolio and signals" defaultOn={false} />
        </div>
      </div>

      {/* Security */}
      <div className="bg-surface border border-border rounded-xl p-6">
        <div className="flex items-center gap-2 mb-5">
          <Shield className="w-5 h-5 text-accent" />
          <h2 className="text-lg font-bold text-text-primary">Security</h2>
        </div>
        <button className="px-4 py-2 rounded-lg bg-surface-light text-text-primary text-sm font-medium hover:bg-border transition-colors">
          Change Password
        </button>
      </div>

      {/* Subscription Tiers */}
      <div>
        <div className="flex items-center gap-2 mb-5">
          <CreditCard className="w-5 h-5 text-accent" />
          <h2 className="text-lg font-bold text-text-primary">Subscription Plans</h2>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {tiers.map((tier) => (
            <div key={tier.name} className={`bg-surface border-2 ${tier.color} rounded-xl p-5 relative`}>
              {tier.popular && (
                <span className="absolute -top-3 left-1/2 -translate-x-1/2 bg-accent text-bg text-xs font-bold px-3 py-0.5 rounded-full">
                  Most Popular
                </span>
              )}
              <h3 className="text-lg font-bold text-text-primary">{tier.name}</h3>
              <div className="text-2xl font-bold text-text-primary mt-1">{tier.price}</div>
              <ul className="mt-4 space-y-2">
                {tier.features.map((f) => (
                  <li key={f} className="flex items-center gap-2 text-sm text-text-muted">
                    <Check className="w-4 h-4 text-accent flex-shrink-0" />
                    {f}
                  </li>
                ))}
              </ul>
              <button className={`w-full mt-5 py-2 rounded-lg text-sm font-bold transition-colors ${
                tier.popular
                  ? 'bg-accent text-bg hover:bg-accent/90'
                  : 'bg-surface-light text-text-primary hover:bg-border'
              }`}>
                {tier.name === 'Free' ? 'Current Plan' : `Upgrade to ${tier.name}`}
              </button>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

function ToggleRow({ label, description, defaultOn }: { label: string; description: string; defaultOn: boolean }) {
  return (
    <div className="flex items-center justify-between">
      <div>
        <div className="text-sm font-medium text-text-primary">{label}</div>
        <div className="text-xs text-text-muted">{description}</div>
      </div>
      <label className="relative inline-flex items-center cursor-pointer">
        <input type="checkbox" defaultChecked={defaultOn} className="sr-only peer" />
        <div className="w-9 h-5 bg-border rounded-full peer peer-checked:bg-accent/60 peer-checked:after:translate-x-full after:content-[''] after:absolute after:top-0.5 after:left-[2px] after:bg-white after:rounded-full after:h-4 after:w-4 after:transition-all" />
      </label>
    </div>
  );
}
