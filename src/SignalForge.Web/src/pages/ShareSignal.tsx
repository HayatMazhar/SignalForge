import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Share2, Copy, ChevronDown, Check, Zap } from 'lucide-react';
import api from '../api/client';
import LoadingSpinner from '../components/common/LoadingSpinner';
import type { Signal } from '../types';

const typeColors: Record<string, { bg: string; text: string }> = {
  Buy: { bg: 'bg-accent/20', text: 'text-accent' },
  Sell: { bg: 'bg-danger/20', text: 'text-danger' },
  Hold: { bg: 'bg-warning/20', text: 'text-warning' },
};

export default function ShareSignal() {
  const [selectedId, setSelectedId] = useState('');
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [copied, setCopied] = useState<string | null>(null);

  const { data: signals, isLoading } = useQuery({
    queryKey: ['share-signals'],
    queryFn: () => api.get('/signals?limit=20').then(r => r.data as Signal[]),
  });

  const selected = signals?.find(s => s.id === selectedId);

  const showCopied = (key: string) => {
    setCopied(key);
    setTimeout(() => setCopied(null), 2000);
  };

  const handleCopyClipboard = () => {
    if (!selected) return;
    const text = [
      `📊 SignalForge Signal`,
      `Symbol: ${selected.symbol}`,
      `Signal: ${selected.type}`,
      `Confidence: ${selected.confidenceScore}%`,
      `Reasoning: ${selected.reasoning}`,
      `Generated: ${new Date(selected.generatedAt).toLocaleString()}`,
      `---`,
      `Powered by SignalForge`,
    ].join('\n');
    navigator.clipboard.writeText(text);
    showCopied('clipboard');
  };

  const handleShareTwitter = () => {
    if (!selected) return;
    const text = encodeURIComponent(
      `${selected.type} signal on $${selected.symbol} with ${selected.confidenceScore}% confidence.\n\n"${selected.reasoning}"\n\nPowered by @SignalForge`
    );
    window.open(`https://twitter.com/intent/tweet?text=${text}`, '_blank');
  };

  const handleShareDiscord = () => {
    if (!selected) return;
    const md = [
      `**SignalForge Signal**`,
      `> **Symbol:** ${selected.symbol}`,
      `> **Signal:** ${selected.type}`,
      `> **Confidence:** ${selected.confidenceScore}%`,
      `> **Reasoning:** ${selected.reasoning}`,
      `> *${new Date(selected.generatedAt).toLocaleString()}*`,
    ].join('\n');
    navigator.clipboard.writeText(md);
    showCopied('discord');
  };

  if (isLoading) return <LoadingSpinner text="Loading signals..." />;

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-xl bg-purple/10 flex items-center justify-center">
          <Share2 className="w-6 h-6 text-purple" />
        </div>
        <div>
          <h1 className="text-2xl font-black text-text-primary">Share Signal</h1>
          <p className="text-xs text-text-muted">Share a signal as a branded card</p>
        </div>
      </div>

      {/* Signal selector */}
      <div className="bg-surface border border-border rounded-xl p-5">
        <label className="text-xs font-bold text-text-muted uppercase tracking-wider block mb-2">Select a Signal</label>
        <div className="relative max-w-lg">
          <button
            onClick={() => setDropdownOpen(!dropdownOpen)}
            className="w-full flex items-center justify-between bg-bg border border-border rounded-lg px-4 py-2.5 text-sm text-text-primary font-mono focus:outline-none focus:border-accent"
          >
            {selected ? `${selected.symbol} — ${selected.type} (${selected.confidenceScore}%)` : 'Choose a signal...'}
            <ChevronDown className={`w-4 h-4 text-text-muted transition-transform ${dropdownOpen ? 'rotate-180' : ''}`} />
          </button>
          {dropdownOpen && (
            <div className="absolute z-20 top-full left-0 right-0 mt-1 bg-surface border border-border rounded-xl shadow-xl max-h-60 overflow-y-auto">
              {signals?.map(s => {
                const tc = typeColors[s.type] ?? typeColors.Hold;
                return (
                  <button
                    key={s.id}
                    onClick={() => { setSelectedId(s.id); setDropdownOpen(false); }}
                    className="w-full flex items-center gap-3 px-4 py-2.5 text-sm hover:bg-bg/50 transition-colors text-left"
                  >
                    <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${tc.bg} ${tc.text}`}>{s.type}</span>
                    <span className="font-mono font-bold text-text-primary">{s.symbol}</span>
                    <span className="text-text-muted ml-auto text-xs">{s.confidenceScore}%</span>
                  </button>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {/* Preview card */}
      {selected && (
        <div className="space-y-4 animate-fade-up">
          <h3 className="text-xs font-bold text-text-muted uppercase tracking-wider">Preview</h3>
          <div className="max-w-lg mx-auto">
            <div className="bg-[#0C0F1A] border border-border rounded-2xl p-6 shadow-2xl">
              <div className="flex items-center justify-between mb-5">
                <div className="flex items-center gap-2">
                  <Zap className="w-5 h-5 text-accent" />
                  <span className="text-sm font-black text-accent tracking-wide">SignalForge</span>
                </div>
                <span className={`px-3 py-1 rounded-full text-xs font-bold ${typeColors[selected.type]?.bg} ${typeColors[selected.type]?.text}`}>
                  {selected.type}
                </span>
              </div>

              <div className="text-3xl font-black font-mono text-text-primary mb-1">{selected.symbol}</div>

              <div className="mt-4 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] text-text-muted uppercase tracking-wider">Confidence</span>
                  <span className="text-sm font-black font-mono text-text-primary">{selected.confidenceScore}%</span>
                </div>
                <div className="w-full h-2 bg-border rounded-full overflow-hidden">
                  <div
                    className={`h-full rounded-full ${selected.confidenceScore >= 70 ? 'bg-accent' : selected.confidenceScore >= 40 ? 'bg-warning' : 'bg-danger'}`}
                    style={{ width: `${selected.confidenceScore}%` }}
                  />
                </div>
              </div>

              <div className="mt-4 bg-bg/50 rounded-xl p-4">
                <div className="text-[10px] text-text-muted uppercase tracking-wider mb-1">Reasoning</div>
                <p className="text-xs text-text-primary leading-relaxed">{selected.reasoning}</p>
              </div>

              <div className="mt-4 flex items-center justify-between text-[10px] text-text-muted">
                <span>{new Date(selected.generatedAt).toLocaleString()}</span>
                <span>signalforge.ai</span>
              </div>
            </div>
          </div>

          {/* Share buttons */}
          <div className="flex flex-wrap justify-center gap-3 pt-2">
            <button
              onClick={handleCopyClipboard}
              className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-surface border border-border text-sm font-bold text-text-primary hover:border-accent/30 transition-colors"
            >
              {copied === 'clipboard' ? <Check className="w-4 h-4 text-accent" /> : <Copy className="w-4 h-4" />}
              {copied === 'clipboard' ? 'Copied!' : 'Copy to Clipboard'}
            </button>
            <button
              onClick={handleShareTwitter}
              className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-[#1DA1F2]/10 border border-[#1DA1F2]/20 text-sm font-bold text-[#1DA1F2] hover:bg-[#1DA1F2]/20 transition-colors"
            >
              Share to Twitter
            </button>
            <button
              onClick={handleShareDiscord}
              className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-[#5865F2]/10 border border-[#5865F2]/20 text-sm font-bold text-[#5865F2] hover:bg-[#5865F2]/20 transition-colors"
            >
              {copied === 'discord' ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
              {copied === 'discord' ? 'Copied!' : 'Share to Discord'}
            </button>
          </div>
        </div>
      )}

      {!selected && !isLoading && (
        <div className="text-center py-16">
          <Share2 className="w-12 h-12 text-text-muted mx-auto mb-3" />
          <p className="text-text-muted">Select a signal to preview and share</p>
        </div>
      )}
    </div>
  );
}
