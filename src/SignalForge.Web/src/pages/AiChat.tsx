import { useState, useRef, useEffect } from 'react';
import { Bot, Send, User, Sparkles } from 'lucide-react';
import { chatApi } from '../api/backtest';
import { useAssetModeStore } from '../stores/assetModeStore';

interface Message {
  role: 'user' | 'assistant';
  content: string;
  timestamp: string;
}

export default function AiChat() {
  const { mode } = useAssetModeStore();
  const isCrypto = mode === 'crypto';
  const [messages, setMessages] = useState<Message[]>([
    { role: 'assistant', content: isCrypto
      ? "Hello! I'm SignalForge AI, your personal crypto analyst. Ask me about any coin, market trends, or trading strategies. Try: \"Analyze BTC\" or \"What's the crypto sentiment?\""
      : "Hello! I'm SignalForge AI, your personal stock market analyst. Ask me about any stock, market trends, or trading strategies. Try: \"Analyze NVDA\" or \"What's the market sentiment?\"", timestamp: new Date().toISOString() },
  ]);
  const [input, setInput] = useState('');
  const [symbol, setSymbol] = useState('');
  const [loading, setLoading] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => { bottomRef.current?.scrollIntoView({ behavior: 'smooth' }); }, [messages]);

  const handleSend = async () => {
    if (!input.trim() || loading) return;
    const userMsg: Message = { role: 'user', content: input, timestamp: new Date().toISOString() };
    setMessages(prev => [...prev, userMsg]);
    setInput('');
    setLoading(true);

    try {
      const detected = input.match(/\b([A-Z]{1,5})\b/)?.[1];
      const sym = detected && detected.length >= 2 ? detected : symbol || undefined;
      const history = messages.slice(-6).map(m => ({ role: m.role, content: m.content }));
      const res = await chatApi.send(input, sym, history);

      if (res.symbol) setSymbol(res.symbol);
      setMessages(prev => [...prev, { role: 'assistant', content: res.response, timestamp: new Date().toISOString() }]);
    } catch {
      setMessages(prev => [...prev, { role: 'assistant', content: "I'm having trouble connecting right now. Please try again.", timestamp: new Date().toISOString() }]);
    } finally {
      setLoading(false);
    }
  };

  const suggestions = isCrypto
    ? ['Analyze BTC', 'Compare ETH vs SOL', "What's the crypto outlook?", 'Best coins to buy now']
    : ['Analyze AAPL', 'Compare NVDA vs AMD', "What's the market outlook?", 'Best stocks to buy now'];

  return (
    <div className="flex flex-col h-[calc(100vh-8rem)]">
      {/* Header */}
      <div className="flex items-center gap-3 mb-4">
        <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-accent/20 to-purple/20 flex items-center justify-center animate-pulse-glow">
          <Bot className="w-6 h-6 text-accent" />
        </div>
        <div>
          <h1 className="text-2xl font-black text-text-primary">AI Assistant</h1>
          <p className="text-xs text-text-muted">
            {symbol ? `Analyzing ${symbol}` : 'Ask me anything about the market'}
          </p>
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto space-y-4 mb-4 pr-2">
        {messages.map((msg, i) => (
          <div key={i} className={`flex gap-3 ${msg.role === 'user' ? 'justify-end' : ''} animate-fade-up`}>
            {msg.role === 'assistant' && (
              <div className="w-8 h-8 rounded-lg bg-accent/10 flex items-center justify-center flex-shrink-0 mt-1">
                <Sparkles className="w-4 h-4 text-accent" />
              </div>
            )}
            <div className={`max-w-[75%] rounded-2xl px-4 py-3 ${
              msg.role === 'user'
                ? 'bg-accent/10 border border-accent/20 text-text-primary'
                : 'bg-surface border border-border text-text-primary'
            }`}>
              <p className="text-sm leading-relaxed whitespace-pre-wrap">{msg.content}</p>
              <span className="text-[9px] text-text-muted mt-1 block">
                {new Date(msg.timestamp).toLocaleTimeString()}
              </span>
            </div>
            {msg.role === 'user' && (
              <div className="w-8 h-8 rounded-lg bg-surface-light flex items-center justify-center flex-shrink-0 mt-1">
                <User className="w-4 h-4 text-text-muted" />
              </div>
            )}
          </div>
        ))}
        {loading && (
          <div className="flex gap-3 animate-fade-up">
            <div className="w-8 h-8 rounded-lg bg-accent/10 flex items-center justify-center">
              <Sparkles className="w-4 h-4 text-accent animate-spin" />
            </div>
            <div className="bg-surface border border-border rounded-2xl px-4 py-3">
              <div className="flex gap-1">
                <div className="w-2 h-2 rounded-full bg-accent/40 animate-bounce" style={{ animationDelay: '0ms' }} />
                <div className="w-2 h-2 rounded-full bg-accent/40 animate-bounce" style={{ animationDelay: '150ms' }} />
                <div className="w-2 h-2 rounded-full bg-accent/40 animate-bounce" style={{ animationDelay: '300ms' }} />
              </div>
            </div>
          </div>
        )}
        <div ref={bottomRef} />
      </div>

      {/* Suggestions */}
      {messages.length <= 1 && (
        <div className="flex gap-2 mb-3 flex-wrap">
          {suggestions.map(s => (
            <button key={s} onClick={() => { setInput(s); }}
              className="text-xs px-3 py-1.5 rounded-full bg-surface border border-border text-text-muted hover:text-accent hover:border-accent/30 transition-colors">
              {s}
            </button>
          ))}
        </div>
      )}

      {/* Input */}
      <div className="flex gap-3">
        <input value={input} onChange={e => setInput(e.target.value)}
          onKeyDown={e => e.key === 'Enter' && handleSend()}
          className="flex-1 bg-surface border border-border rounded-xl px-4 py-3 text-sm text-text-primary placeholder-text-muted/50 focus:outline-none focus:border-accent/40"
          placeholder={isCrypto ? "Ask about any coin or crypto trend..." : "Ask about any stock or market trend..."} disabled={loading} />
        <button onClick={handleSend} disabled={loading || !input.trim()}
          className="px-5 rounded-xl bg-accent text-bg font-bold hover:bg-accent-dim transition-all disabled:opacity-30 btn-shine">
          <Send className="w-5 h-5" />
        </button>
      </div>
    </div>
  );
}
