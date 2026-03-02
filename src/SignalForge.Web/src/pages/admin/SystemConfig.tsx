import { useState } from 'react';
import { Wrench, Key, ToggleLeft, ToggleRight, Save, AlertTriangle } from 'lucide-react';

interface ConfigSection {
  title: string;
  items: ConfigItem[];
}

interface ConfigItem {
  key: string;
  label: string;
  description: string;
  type: 'text' | 'toggle' | 'number' | 'select';
  value: string | boolean | number;
  options?: string[];
  sensitive?: boolean;
}

const initialConfig: ConfigSection[] = [
  {
    title: 'API Keys',
    items: [
      { key: 'core42_key', label: 'Core42 AI API Key', description: 'Used for sentiment analysis and signal reasoning', type: 'text', value: 'df0d••••••••311b', sensitive: true },
      { key: 'polygon_key', label: 'Polygon.io API Key', description: 'Market data, quotes, and historical prices', type: 'text', value: '', sensitive: true },
      { key: 'newsapi_key', label: 'NewsAPI Key', description: 'News article fetching', type: 'text', value: '', sensitive: true },
      { key: 'unusual_key', label: 'Unusual Whales Key', description: 'Options flow data', type: 'text', value: '', sensitive: true },
    ],
  },
  {
    title: 'Signal Engine',
    items: [
      { key: 'signal_interval', label: 'Signal Generation Interval', description: 'How often to generate signals (minutes)', type: 'number', value: 15 },
      { key: 'tech_weight', label: 'Technical Score Weight', description: 'Weight of technical analysis in final score', type: 'number', value: 40 },
      { key: 'sent_weight', label: 'Sentiment Weight', description: 'Weight of news sentiment in final score', type: 'number', value: 30 },
      { key: 'opt_weight', label: 'Options Flow Weight', description: 'Weight of options flow in final score', type: 'number', value: 30 },
      { key: 'buy_threshold', label: 'Buy Signal Threshold', description: 'Minimum score to trigger Buy signal', type: 'number', value: 65 },
      { key: 'sell_threshold', label: 'Sell Signal Threshold', description: 'Maximum score to trigger Sell signal', type: 'number', value: 35 },
    ],
  },
  {
    title: 'Feature Flags',
    items: [
      { key: 'enable_ai', label: 'AI Signal Generation', description: 'Enable automated AI signal generation', type: 'toggle', value: true },
      { key: 'enable_realtime', label: 'Real-time Price Updates', description: 'Enable SignalR real-time price streaming', type: 'toggle', value: true },
      { key: 'enable_options', label: 'Options Flow', description: 'Enable options flow data for Pro/Elite users', type: 'toggle', value: true },
      { key: 'enable_thesis', label: 'Trade Thesis Generator', description: 'Enable AI trade thesis generation', type: 'toggle', value: true },
      { key: 'enable_smart_money', label: 'Smart Money Tracker', description: 'Enable smart money flow tracking', type: 'toggle', value: true },
      { key: 'maintenance_mode', label: 'Maintenance Mode', description: 'Put the app in maintenance mode', type: 'toggle', value: false },
    ],
  },
  {
    title: 'Subscription Limits',
    items: [
      { key: 'free_watchlist', label: 'Free Tier Watchlist Limit', description: 'Max stocks in watchlist for free users', type: 'number', value: 5 },
      { key: 'free_alerts', label: 'Free Tier Alert Limit', description: 'Max active alerts for free users', type: 'number', value: 3 },
      { key: 'pro_watchlist', label: 'Pro Tier Watchlist Limit', description: 'Max stocks in watchlist for pro users', type: 'number', value: 50 },
      { key: 'pro_alerts', label: 'Pro Tier Alert Limit', description: 'Max active alerts for pro users', type: 'number', value: 25 },
      { key: 'rate_limit', label: 'API Rate Limit', description: 'Max requests per minute per user', type: 'number', value: 100 },
    ],
  },
];

export default function SystemConfig() {
  const [config, setConfig] = useState(initialConfig);
  const [saved, setSaved] = useState(false);

  const updateValue = (sectionIdx: number, itemIdx: number, value: string | boolean | number) => {
    const updated = [...config];
    updated[sectionIdx] = {
      ...updated[sectionIdx],
      items: updated[sectionIdx].items.map((item, i) => i === itemIdx ? { ...item, value } : item),
    };
    setConfig(updated);
    setSaved(false);
  };

  const handleSave = () => {
    setSaved(true);
    setTimeout(() => setSaved(false), 3000);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-accent/10 flex items-center justify-center">
            <Wrench className="w-6 h-6 text-accent" />
          </div>
          <div>
            <h1 className="text-2xl font-black text-text-primary">System Configuration</h1>
            <p className="text-xs text-text-muted">Manage API keys, feature flags, and system limits</p>
          </div>
        </div>
        <button onClick={handleSave}
          className={`px-5 py-2 rounded-lg text-sm font-bold flex items-center gap-2 transition-all btn-shine ${
            saved ? 'bg-accent/20 text-accent' : 'bg-accent text-bg hover:bg-accent-dim glow-accent'
          }`}>
          <Save className="w-4 h-4" />
          {saved ? 'Saved!' : 'Save Changes'}
        </button>
      </div>

      <div className="bg-warning/5 border border-warning/20 rounded-xl p-4 flex items-start gap-3">
        <AlertTriangle className="w-5 h-5 text-warning flex-shrink-0 mt-0.5" />
        <div>
          <div className="text-sm font-semibold text-warning">Admin Only</div>
          <div className="text-xs text-text-muted">Changes here affect all users. API keys are stored server-side and masked for security.</div>
        </div>
      </div>

      {config.map((section, si) => (
        <div key={section.title} className="bg-surface border border-border rounded-xl overflow-hidden">
          <div className="px-5 py-3 border-b border-border bg-bg/30">
            <h2 className="text-xs font-bold text-text-muted uppercase tracking-wider">{section.title}</h2>
          </div>
          <div className="divide-y divide-border/30">
            {section.items.map((item, ii) => (
              <div key={item.key} className="px-5 py-4 flex items-center justify-between gap-6 hover:bg-bg/20 transition-colors">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-semibold text-text-primary">{item.label}</span>
                    {item.sensitive && <Key className="w-3 h-3 text-warning" />}
                  </div>
                  <div className="text-[10px] text-text-muted mt-0.5">{item.description}</div>
                </div>
                <div className="flex-shrink-0 w-48">
                  {item.type === 'toggle' ? (
                    <button onClick={() => updateValue(si, ii, !item.value)}
                      className="flex items-center gap-2">
                      {item.value ? (
                        <ToggleRight className="w-8 h-8 text-accent" />
                      ) : (
                        <ToggleLeft className="w-8 h-8 text-text-muted" />
                      )}
                      <span className={`text-xs font-bold ${item.value ? 'text-accent' : 'text-text-muted'}`}>
                        {item.value ? 'Enabled' : 'Disabled'}
                      </span>
                    </button>
                  ) : item.type === 'number' ? (
                    <input type="number" value={item.value as number}
                      onChange={(e) => updateValue(si, ii, parseInt(e.target.value) || 0)}
                      className="w-full bg-bg border border-border rounded-lg px-3 py-1.5 text-sm text-text-primary font-mono focus:outline-none focus:border-accent/40 text-right" />
                  ) : (
                    <input type={item.sensitive ? 'password' : 'text'} value={item.value as string}
                      onChange={(e) => updateValue(si, ii, e.target.value)}
                      className="w-full bg-bg border border-border rounded-lg px-3 py-1.5 text-sm text-text-primary font-mono focus:outline-none focus:border-accent/40"
                      placeholder="Not configured" />
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}
