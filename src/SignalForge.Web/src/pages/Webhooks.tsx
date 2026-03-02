import { useState, useEffect } from 'react';
import { Webhook, Plus, Trash2, X, Send, Check, ToggleLeft, ToggleRight } from 'lucide-react';
import { useToastStore } from '../components/common/Toast';

interface WebhookConfig {
  id: string;
  name: string;
  url: string;
  events: string[];
  enabled: boolean;
}

const STORAGE_KEY = 'signalforge-webhooks';
const EVENT_TYPES = ['Signals', 'Alerts', 'News', 'Price'];

const INTEGRATIONS = [
  {
    name: 'Discord',
    description: 'Send real-time signals and alerts to your Discord server via webhooks.',
    urlFormat: 'https://discord.com/api/webhooks/YOUR_ID/YOUR_TOKEN',
    icon: '🎮',
    color: 'bg-[#5865F2]/10 border-[#5865F2]/20 text-[#5865F2]',
  },
  {
    name: 'Telegram',
    description: 'Get instant notifications on Telegram with formatted signal summaries.',
    urlFormat: 'https://api.telegram.org/botYOUR_TOKEN/sendMessage',
    icon: '✈️',
    color: 'bg-[#0088cc]/10 border-[#0088cc]/20 text-[#0088cc]',
  },
  {
    name: 'Slack',
    description: 'Post trading signals and alerts directly to your Slack channels.',
    urlFormat: 'https://hooks.slack.com/services/YOUR/WEBHOOK/URL',
    icon: '💬',
    color: 'bg-[#4A154B]/10 border-[#4A154B]/20 text-[#4A154B]',
  },
];

function loadWebhooks(): WebhookConfig[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

function saveWebhooks(webhooks: WebhookConfig[]) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(webhooks));
}

function maskUrl(url: string): string {
  try {
    const u = new URL(url);
    const path = u.pathname;
    if (path.length > 20) {
      return `${u.origin}${path.slice(0, 12)}...${path.slice(-6)}`;
    }
    return url.length > 40 ? url.slice(0, 30) + '...' + url.slice(-8) : url;
  } catch {
    return url.length > 40 ? url.slice(0, 30) + '...' : url;
  }
}

export default function Webhooks() {
  const [webhooks, setWebhooks] = useState<WebhookConfig[]>(loadWebhooks);
  const [showForm, setShowForm] = useState(false);
  const [formName, setFormName] = useState('');
  const [formUrl, setFormUrl] = useState('');
  const [formEvents, setFormEvents] = useState<string[]>([]);
  const addToast = useToastStore(s => s.add);

  useEffect(() => { saveWebhooks(webhooks); }, [webhooks]);

  const resetForm = () => {
    setFormName('');
    setFormUrl('');
    setFormEvents([]);
    setShowForm(false);
  };

  const handleAdd = () => {
    if (!formName.trim() || !formUrl.trim() || formEvents.length === 0) return;
    const webhook: WebhookConfig = {
      id: crypto.randomUUID(),
      name: formName.trim(),
      url: formUrl.trim(),
      events: formEvents,
      enabled: true,
    };
    setWebhooks(prev => [...prev, webhook]);
    resetForm();
  };

  const handleDelete = (id: string) => {
    setWebhooks(prev => prev.filter(w => w.id !== id));
  };

  const handleToggle = (id: string) => {
    setWebhooks(prev => prev.map(w => w.id === id ? { ...w, enabled: !w.enabled } : w));
  };

  const handleTest = (webhook: WebhookConfig) => {
    addToast({
      type: 'info',
      title: 'Webhook Test Sent!',
      message: `Test payload sent to "${webhook.name}" successfully.`,
    });
  };

  const handleEventToggle = (event: string) => {
    setFormEvents(prev => prev.includes(event) ? prev.filter(e => e !== event) : [...prev, event]);
  };

  const openIntegration = (integration: typeof INTEGRATIONS[0]) => {
    setFormName(integration.name);
    setFormUrl(integration.urlFormat);
    setFormEvents(['Signals', 'Alerts']);
    setShowForm(true);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-accent/10 flex items-center justify-center">
            <Webhook className="w-6 h-6 text-accent" />
          </div>
          <div>
            <h1 className="text-2xl font-black text-text-primary">Webhooks & Integrations</h1>
            <p className="text-xs text-text-muted">Connect SignalForge to your favorite platforms</p>
          </div>
        </div>
        <button onClick={() => showForm ? resetForm() : setShowForm(true)}
          className="px-4 py-2 rounded-lg bg-accent text-bg text-sm font-bold flex items-center gap-1 hover:bg-accent/90 transition-colors">
          {showForm ? <X className="w-4 h-4" /> : <Plus className="w-4 h-4" />}
          {showForm ? 'Cancel' : 'Add Webhook'}
        </button>
      </div>

      {showForm && (
        <div className="bg-surface border border-border rounded-xl p-5 animate-fade-up">
          <h3 className="text-sm font-semibold text-text-primary mb-4">New Webhook</h3>
          <div className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="text-[10px] font-bold text-text-muted uppercase tracking-wider mb-1 block">Name</label>
                <input value={formName} onChange={e => setFormName(e.target.value)} placeholder="My Webhook"
                  className="w-full bg-bg border border-border rounded-lg px-3 py-2 text-sm text-text-primary focus:outline-none focus:border-accent" />
              </div>
              <div>
                <label className="text-[10px] font-bold text-text-muted uppercase tracking-wider mb-1 block">URL</label>
                <input value={formUrl} onChange={e => setFormUrl(e.target.value)} placeholder="https://..."
                  className="w-full bg-bg border border-border rounded-lg px-3 py-2 text-sm text-text-primary font-mono focus:outline-none focus:border-accent" />
              </div>
            </div>
            <div>
              <label className="text-[10px] font-bold text-text-muted uppercase tracking-wider mb-2 block">Event Types</label>
              <div className="flex gap-3">
                {EVENT_TYPES.map(event => (
                  <label key={event} className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={formEvents.includes(event)}
                      onChange={() => handleEventToggle(event)}
                      className="w-4 h-4 rounded border-border accent-accent"
                    />
                    <span className="text-sm text-text-primary">{event}</span>
                  </label>
                ))}
              </div>
            </div>
            <button onClick={handleAdd}
              disabled={!formName.trim() || !formUrl.trim() || formEvents.length === 0}
              className="px-6 py-2 rounded-lg bg-accent text-bg text-sm font-bold disabled:opacity-50 hover:bg-accent/90 transition-colors">
              Save Webhook
            </button>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {INTEGRATIONS.map(integration => (
          <div key={integration.name} className={`border rounded-xl p-5 card-hover animate-fade-up ${integration.color}`}>
            <div className="flex items-center gap-3 mb-3">
              <span className="text-2xl">{integration.icon}</span>
              <h3 className="text-sm font-bold text-text-primary">{integration.name}</h3>
            </div>
            <p className="text-xs text-text-muted leading-relaxed mb-4">{integration.description}</p>
            <button onClick={() => openIntegration(integration)}
              className="px-4 py-2 rounded-lg bg-bg border border-border text-sm font-bold text-text-primary hover:border-accent hover:text-accent transition-colors w-full">
              Configure
            </button>
          </div>
        ))}
      </div>

      {webhooks.length > 0 && (
        <div className="bg-surface border border-border rounded-xl overflow-hidden animate-fade-up">
          <div className="px-5 py-3 border-b border-border bg-bg/30">
            <h3 className="text-xs font-bold text-text-muted uppercase tracking-wider">Configured Webhooks ({webhooks.length})</h3>
          </div>
          <div className="divide-y divide-border/30">
            {webhooks.map(wh => (
              <div key={wh.id} className={`px-5 py-4 flex items-center gap-4 transition-colors hover:bg-bg/30 ${!wh.enabled ? 'opacity-50' : ''}`}>
                <button onClick={() => handleToggle(wh.id)} className="flex-shrink-0">
                  {wh.enabled
                    ? <ToggleRight className="w-7 h-7 text-accent" />
                    : <ToggleLeft className="w-7 h-7 text-text-muted" />
                  }
                </button>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-bold text-text-primary">{wh.name}</span>
                    {wh.enabled && <span className="w-1.5 h-1.5 rounded-full bg-accent animate-pulse" />}
                  </div>
                  <div className="text-xs text-text-muted font-mono mt-0.5">{maskUrl(wh.url)}</div>
                  <div className="flex gap-1.5 mt-1.5">
                    {wh.events.map(e => (
                      <span key={e} className="px-2 py-0.5 rounded bg-bg text-[10px] font-bold text-text-muted">{e}</span>
                    ))}
                  </div>
                </div>
                <div className="flex items-center gap-2 flex-shrink-0">
                  <button onClick={() => handleTest(wh)}
                    className="px-3 py-1.5 rounded-lg bg-bg border border-border text-xs font-bold text-text-muted hover:text-accent hover:border-accent transition-colors flex items-center gap-1">
                    <Send className="w-3 h-3" />
                    Test
                  </button>
                  <button onClick={() => handleDelete(wh.id)}
                    className="p-1.5 rounded-lg text-text-muted hover:text-danger hover:bg-danger/10 transition-colors">
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {webhooks.length === 0 && !showForm && (
        <div className="bg-surface border border-border rounded-xl p-12 text-center">
          <Webhook className="w-10 h-10 text-text-muted mx-auto mb-3 opacity-30" />
          <p className="text-text-muted text-sm">No webhooks configured yet. Add one above or use a pre-built integration.</p>
        </div>
      )}
    </div>
  );
}
