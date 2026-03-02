import { useState } from 'react';
import { Link, ExternalLink, Check, RefreshCw, Twitter, MessageCircle } from 'lucide-react';

interface BrokerConfig {
  id: string;
  name: string;
  description: string;
  color: string;
  initial: string;
  connected: boolean;
  lastSync?: string;
  positionsSynced?: number;
}

interface SocialConfig {
  id: string;
  name: string;
  description: string;
  color: string;
  icon: typeof Twitter;
  connected: boolean;
  username?: string;
}

const INITIAL_BROKERS: BrokerConfig[] = [
  { id: 'robinhood', name: 'Robinhood', description: 'Commission-free stock, ETF, and crypto trading. Sync your holdings automatically.', color: '#00C805', initial: 'R', connected: false },
  { id: 'td-ameritrade', name: 'TD Ameritrade', description: 'Full-featured brokerage with thinkorswim platform. Import positions and trade history.', color: '#3AA843', initial: 'TD', connected: false },
  { id: 'interactive-brokers', name: 'Interactive Brokers', description: 'Professional-grade trading platform. Sync multi-asset positions including options.', color: '#D81B2C', initial: 'IB', connected: false },
  { id: 'coinbase', name: 'Coinbase', description: 'Leading cryptocurrency exchange. Sync your crypto portfolio and track digital assets.', color: '#0052FF', initial: 'CB', connected: false },
  { id: 'alpaca', name: 'Alpaca', description: 'API-first commission-free brokerage. Perfect for algorithmic trading integration.', color: '#FCD535', initial: 'A', connected: true, lastSync: '2 minutes ago', positionsSynced: 12 },
];

const INITIAL_SOCIALS: SocialConfig[] = [
  { id: 'twitter', name: 'Twitter / X', description: 'Share signals and connect with the trading community', color: '#1DA1F2', icon: Twitter, connected: false },
  { id: 'discord', name: 'Discord', description: 'Join SignalForge trading channels and get real-time alerts', color: '#5865F2', icon: MessageCircle, connected: false },
  { id: 'telegram', name: 'Telegram', description: 'Receive signal notifications via Telegram bot', color: '#26A5E4', icon: MessageCircle, connected: false },
];

export default function ConnectedAccounts() {
  const [brokers, setBrokers] = useState<BrokerConfig[]>(INITIAL_BROKERS);
  const [socials, setSocials] = useState<SocialConfig[]>(INITIAL_SOCIALS);
  const [connecting, setConnecting] = useState<string | null>(null);

  const toggleBroker = async (id: string) => {
    setConnecting(id);
    await new Promise((r) => setTimeout(r, 1500));
    setBrokers((prev) =>
      prev.map((b) =>
        b.id === id
          ? b.connected
            ? { ...b, connected: false, lastSync: undefined, positionsSynced: undefined }
            : { ...b, connected: true, lastSync: 'Just now', positionsSynced: Math.floor(Math.random() * 20) + 3 }
          : b
      )
    );
    setConnecting(null);
  };

  const toggleSocial = async (id: string) => {
    setConnecting(id);
    await new Promise((r) => setTimeout(r, 1200));
    setSocials((prev) =>
      prev.map((s) =>
        s.id === id
          ? s.connected
            ? { ...s, connected: false, username: undefined }
            : { ...s, connected: true, username: '@signalforge_user' }
          : s
      )
    );
    setConnecting(null);
  };

  const connectedCount = brokers.filter((b) => b.connected).length + socials.filter((s) => s.connected).length;

  return (
    <div className="page-enter max-w-4xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-accent/10 flex items-center justify-center">
            <Link className="w-5 h-5 text-accent" />
          </div>
          <div>
            <h1 className="text-2xl font-black text-text-primary">Connected Accounts</h1>
            <p className="text-xs text-text-muted">{connectedCount} integration{connectedCount !== 1 ? 's' : ''} active</p>
          </div>
        </div>
      </div>

      {/* Broker Integrations */}
      <div className="mb-8">
        <h2 className="text-sm font-bold text-text-muted uppercase tracking-widest mb-4">Broker Integrations</h2>
        <div className="space-y-3">
          {brokers.map((broker, i) => {
            const isConnecting = connecting === broker.id;
            return (
              <div
                key={broker.id}
                style={{ animationDelay: `${i * 50}ms` }}
                className={`animate-fade-up bg-surface border rounded-2xl p-5 card-hover transition-all ${
                  broker.connected ? 'border-accent/20' : 'border-border'
                }`}
              >
                <div className="flex items-center gap-4">
                  {/* Logo placeholder */}
                  <div
                    className="w-12 h-12 rounded-xl flex items-center justify-center text-white font-black text-sm flex-shrink-0 shadow-lg"
                    style={{ backgroundColor: broker.color }}
                  >
                    {broker.initial}
                  </div>

                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <h3 className="text-base font-bold text-text-primary">{broker.name}</h3>
                      {broker.connected && (
                        <span className="text-[9px] px-2 py-0.5 rounded-full bg-accent/10 text-accent font-bold flex items-center gap-1">
                          <Check className="w-2.5 h-2.5" /> Connected
                        </span>
                      )}
                    </div>
                    <p className="text-xs text-text-muted mt-0.5">{broker.description}</p>

                    {broker.connected && (
                      <div className="flex items-center gap-4 mt-2">
                        <span className="text-[10px] text-text-muted flex items-center gap-1 font-mono">
                          <RefreshCw className="w-3 h-3" /> Last sync: {broker.lastSync}
                        </span>
                        <span className="text-[10px] text-text-muted font-mono">
                          {broker.positionsSynced} positions synced
                        </span>
                      </div>
                    )}
                  </div>

                  <button
                    onClick={() => toggleBroker(broker.id)}
                    disabled={isConnecting}
                    className={`px-5 py-2.5 rounded-xl text-sm font-bold transition-all flex items-center gap-2 flex-shrink-0 ${
                      broker.connected
                        ? 'bg-bg border border-border text-text-muted hover:text-danger hover:border-danger/20'
                        : 'bg-accent text-bg hover:bg-accent-dim btn-shine glow-accent'
                    } disabled:opacity-50`}
                  >
                    {isConnecting ? (
                      <>
                        <RefreshCw className="w-4 h-4 animate-spin" />
                        {broker.connected ? 'Disconnecting...' : 'Connecting...'}
                      </>
                    ) : broker.connected ? (
                      'Disconnect'
                    ) : (
                      <>
                        <ExternalLink className="w-4 h-4" /> Connect
                      </>
                    )}
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Social Connections */}
      <div>
        <h2 className="text-sm font-bold text-text-muted uppercase tracking-widest mb-4">Social Connections</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {socials.map((social, i) => {
            const Icon = social.icon;
            const isConnecting = connecting === social.id;
            return (
              <div
                key={social.id}
                style={{ animationDelay: `${(i + brokers.length) * 50}ms` }}
                className={`animate-fade-up bg-surface border rounded-2xl p-5 card-hover transition-all text-center ${
                  social.connected ? 'border-accent/20' : 'border-border'
                }`}
              >
                <div
                  className="w-12 h-12 rounded-xl flex items-center justify-center mx-auto mb-3"
                  style={{ backgroundColor: `${social.color}15` }}
                >
                  <Icon className="w-5 h-5" style={{ color: social.color }} />
                </div>
                <h3 className="text-sm font-bold text-text-primary">{social.name}</h3>
                <p className="text-[10px] text-text-muted mt-1 mb-4">{social.description}</p>

                {social.connected && social.username && (
                  <p className="text-xs text-accent font-mono mb-3">{social.username}</p>
                )}

                <button
                  onClick={() => toggleSocial(social.id)}
                  disabled={isConnecting}
                  className={`w-full py-2.5 rounded-xl text-sm font-bold transition-all flex items-center justify-center gap-2 ${
                    social.connected
                      ? 'bg-bg border border-border text-text-muted hover:text-danger hover:border-danger/20'
                      : 'bg-bg border border-border text-text-primary hover:border-accent/30 hover:text-accent'
                  } disabled:opacity-50`}
                >
                  {isConnecting ? (
                    <RefreshCw className="w-4 h-4 animate-spin" />
                  ) : social.connected ? (
                    'Disconnect'
                  ) : (
                    'Connect'
                  )}
                </button>
              </div>
            );
          })}
        </div>
      </div>

      {/* Security note */}
      <div className="mt-8 bg-surface/50 border border-border rounded-xl p-4 text-center animate-fade-up">
        <p className="text-xs text-text-muted">
          All connections use OAuth 2.0. SignalForge never stores your broker credentials.
          We only request read-only access to sync your positions and trade history.
        </p>
      </div>
    </div>
  );
}
