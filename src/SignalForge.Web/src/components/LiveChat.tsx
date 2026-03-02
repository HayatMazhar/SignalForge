import { useState, useRef, useEffect } from 'react';
import { MessageCircle, X, Send, Minus } from 'lucide-react';

interface ChatMessage {
  id: string;
  sender: 'user' | 'bot';
  text: string;
  time: string;
}

const AUTO_REPLIES: Record<string, string> = {
  signal: 'Signals are AI-generated buy/sell recommendations based on technical analysis, sentiment data, and market patterns. You can view them in the Signals page and customize confidence thresholds in Settings.',
  alert: 'Alerts notify you when specific conditions are met — price targets, volume spikes, or AI-detected anomalies. Set them up from the Alerts page or any stock detail view.',
  price: 'SignalForge offers three plans: Free ($0/mo), Pro ($49/mo) with real-time signals and AI features, and Elite ($99/mo) with unlimited access, API, and dedicated support.',
  pricing: 'SignalForge offers three plans: Free ($0/mo), Pro ($49/mo) with real-time signals and AI features, and Elite ($99/mo) with unlimited access, API, and dedicated support.',
  backtest: 'Backtesting lets you test trading strategies against historical data. Go to the Backtest page, select a strategy, date range, and symbols to see simulated results.',
  portfolio: 'The Portfolio page shows your holdings, P&L, allocation breakdown, and performance charts. You can add positions manually or connect a broker from Connected Accounts.',
  watchlist: 'Your Watchlist tracks stocks you\'re interested in. Add any stock from the search bar or stock detail page. You\'ll get alerts for price movements on watchlist items.',
  api: 'API access is available on the Elite plan. Generate API keys from Settings > Security. Documentation is available at docs.signalforge.io.',
  hello: 'Hello! Welcome to SignalForge Support. How can I help you today?',
  hi: 'Hi there! How can I assist you with SignalForge?',
  help: 'I can help with signals, alerts, portfolio management, backtesting, pricing, and more. Just ask your question!',
  thanks: 'You\'re welcome! Let me know if there\'s anything else I can help with.',
  thank: 'You\'re welcome! Is there anything else you need?',
};

function getBotReply(message: string): string {
  const lower = message.toLowerCase();
  for (const [keyword, reply] of Object.entries(AUTO_REPLIES)) {
    if (lower.includes(keyword)) return reply;
  }
  return 'Our team will get back to you shortly. In the meantime, check out our Help Center for common questions, or email us at support@signalforge.io.';
}

function timeNow(): string {
  return new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
}

export default function LiveChat() {
  const [open, setOpen] = useState(false);
  const [minimized, setMinimized] = useState(false);
  const [messages, setMessages] = useState<ChatMessage[]>([
    { id: '0', sender: 'bot', text: 'Welcome to SignalForge! 👋 How can we help you today?', time: timeNow() },
  ]);
  const [input, setInput] = useState('');
  const [unread, setUnread] = useState(1);
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const sendMessage = () => {
    const text = input.trim();
    if (!text) return;
    const userMsg: ChatMessage = { id: Date.now().toString(), sender: 'user', text, time: timeNow() };
    setMessages((prev) => [...prev, userMsg]);
    setInput('');

    setTimeout(() => {
      const botMsg: ChatMessage = {
        id: (Date.now() + 1).toString(),
        sender: 'bot',
        text: getBotReply(text),
        time: timeNow(),
      };
      setMessages((prev) => [...prev, botMsg]);
      if (!open || minimized) setUnread((u) => u + 1);
    }, 800);
  };

  const handleOpen = () => {
    setOpen(true);
    setMinimized(false);
    setUnread(0);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  if (!open) {
    return (
      <button
        onClick={handleOpen}
        className="fixed bottom-6 right-6 z-50 w-14 h-14 rounded-full bg-accent text-bg flex items-center justify-center shadow-2xl hover:scale-110 transition-transform glow-accent btn-shine"
      >
        <MessageCircle className="w-6 h-6" />
        {unread > 0 && (
          <span className="absolute -top-1 -right-1 w-5 h-5 rounded-full bg-danger text-white text-[10px] font-bold flex items-center justify-center animate-bounce">
            {unread}
          </span>
        )}
        <span className="absolute bottom-0 right-0 w-3 h-3 rounded-full bg-green-500 border-2 border-bg" />
      </button>
    );
  }

  return (
    <div className="fixed bottom-6 right-6 z-50 animate-fade-up">
      <div
        className={`w-[380px] glass-strong rounded-2xl border border-border shadow-2xl flex flex-col overflow-hidden transition-all duration-300 ${
          minimized ? 'h-14' : 'h-[500px]'
        }`}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-4 py-3 border-b border-border bg-surface/80 flex-shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-full bg-accent/10 flex items-center justify-center">
              <MessageCircle className="w-4 h-4 text-accent" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-text-primary">SignalForge Support</h3>
              <div className="flex items-center gap-1">
                <span className="w-1.5 h-1.5 rounded-full bg-green-500" />
                <span className="text-[10px] text-text-muted">Online</span>
              </div>
            </div>
          </div>
          <div className="flex items-center gap-1">
            <button
              onClick={() => setMinimized(!minimized)}
              className="w-7 h-7 rounded-lg hover:bg-surface-light flex items-center justify-center text-text-muted hover:text-text-primary transition-colors"
            >
              <Minus className="w-4 h-4" />
            </button>
            <button
              onClick={() => setOpen(false)}
              className="w-7 h-7 rounded-lg hover:bg-danger/10 flex items-center justify-center text-text-muted hover:text-danger transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {!minimized && (
          <>
            {/* Messages */}
            <div className="flex-1 overflow-y-auto p-4 space-y-3">
              {messages.map((msg) => (
                <div key={msg.id} className={`flex ${msg.sender === 'user' ? 'justify-end' : 'justify-start'}`}>
                  <div
                    className={`max-w-[80%] rounded-2xl px-3.5 py-2.5 text-[13px] leading-relaxed ${
                      msg.sender === 'user'
                        ? 'bg-accent/15 text-accent rounded-br-md'
                        : 'bg-surface border border-border text-text-primary rounded-bl-md'
                    }`}
                  >
                    {msg.sender === 'bot' && (
                      <div className="text-[9px] font-bold text-text-muted uppercase tracking-wider mb-1">Support Bot</div>
                    )}
                    <p>{msg.text}</p>
                    <div className={`text-[9px] mt-1 ${msg.sender === 'user' ? 'text-accent/50 text-right' : 'text-text-muted/50'}`}>
                      {msg.time}
                    </div>
                  </div>
                </div>
              ))}
              <div ref={bottomRef} />
            </div>

            {/* Input */}
            <div className="flex-shrink-0 p-3 border-t border-border bg-surface/50">
              <div className="flex items-center gap-2">
                <input
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  onKeyDown={handleKeyDown}
                  placeholder="Type a message..."
                  className="flex-1 bg-bg border border-border rounded-xl px-3.5 py-2.5 text-sm text-text-primary placeholder:text-text-muted/40 focus:outline-none focus:border-accent/40 transition-colors"
                />
                <button
                  onClick={sendMessage}
                  disabled={!input.trim()}
                  className="w-10 h-10 rounded-xl bg-accent text-bg flex items-center justify-center hover:bg-accent-dim transition-colors disabled:opacity-30 disabled:cursor-not-allowed btn-shine"
                >
                  <Send className="w-4 h-4" />
                </button>
              </div>
              <p className="text-[9px] text-text-muted/40 text-center mt-2">Powered by SignalForge AI</p>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
