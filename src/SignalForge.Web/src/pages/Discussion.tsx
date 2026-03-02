import { useState, useEffect } from 'react';
import { MessageCircle, Send, ThumbsUp, Search } from 'lucide-react';

interface Comment {
  id: string;
  user: string;
  message: string;
  timestamp: string;
  likes: number;
  likedByMe: boolean;
}

interface DiscussionData {
  [symbol: string]: Comment[];
}

const STORAGE_KEY = 'signalforge-discussions';

const SEED_USERS = ['TraderJoe', 'AlphaHunter', 'DividendKing', 'SwingQueen', 'QuantBot'];

const SEED_DATA: DiscussionData = {
  AAPL: [
    { id: '1', user: 'TraderJoe', message: 'Apple Services revenue keeps surprising to the upside. Long-term bull thesis is intact.', timestamp: '2026-02-28T14:30:00Z', likes: 12, likedByMe: false },
    { id: '2', user: 'AlphaHunter', message: 'Watch the 200 support level. If it holds, could see a move to 210 by earnings.', timestamp: '2026-02-28T15:10:00Z', likes: 8, likedByMe: false },
    { id: '3', user: 'DividendKing', message: 'Dividend yield is low but growth rate is consistent. Added more on the dip.', timestamp: '2026-02-27T09:45:00Z', likes: 5, likedByMe: false },
    { id: '4', user: 'SwingQueen', message: 'RSI divergence on the 4H chart. Setting up a tight stop at 195.', timestamp: '2026-02-27T11:20:00Z', likes: 15, likedByMe: false },
    { id: '5', user: 'QuantBot', message: 'Our model shows 78% probability of positive return over the next 30 days based on current momentum indicators.', timestamp: '2026-02-26T16:00:00Z', likes: 22, likedByMe: false },
  ],
  TSLA: [
    { id: '6', user: 'SwingQueen', message: 'Volatility is insane right now. IV rank above 80 — great for selling premium.', timestamp: '2026-02-28T13:00:00Z', likes: 18, likedByMe: false },
    { id: '7', user: 'AlphaHunter', message: 'Robotaxi narrative is heating up again. This stock trades on vibes more than fundamentals.', timestamp: '2026-02-28T10:30:00Z', likes: 25, likedByMe: false },
    { id: '8', user: 'TraderJoe', message: 'Broke through resistance at 250. Next target 280 if volume holds.', timestamp: '2026-02-27T14:15:00Z', likes: 9, likedByMe: false },
    { id: '9', user: 'QuantBot', message: 'Correlation with BTC has increased to 0.65 over the last 30 days. Interesting crossover.', timestamp: '2026-02-27T08:00:00Z', likes: 14, likedByMe: false },
    { id: '10', user: 'DividendKing', message: 'No dividend, no interest from me. But I respect the momentum play.', timestamp: '2026-02-26T12:30:00Z', likes: 3, likedByMe: false },
  ],
  NVDA: [
    { id: '11', user: 'QuantBot', message: 'AI capex cycle showing no signs of slowing. NVDA is the picks-and-shovels play.', timestamp: '2026-02-28T09:00:00Z', likes: 30, likedByMe: false },
    { id: '12', user: 'AlphaHunter', message: 'PE ratio is rich but growth justifies it. Forward PE of 35 is actually reasonable here.', timestamp: '2026-02-28T11:45:00Z', likes: 17, likedByMe: false },
    { id: '13', user: 'TraderJoe', message: 'Earnings whisper number is way above consensus. Could rip on a beat.', timestamp: '2026-02-27T15:30:00Z', likes: 11, likedByMe: false },
    { id: '14', user: 'SwingQueen', message: 'Bull flag forming on the daily. Entry around 750 with target 850.', timestamp: '2026-02-27T10:00:00Z', likes: 20, likedByMe: false },
    { id: '15', user: 'DividendKing', message: 'Started a small position. The 0.03% yield is laughable but I believe in the growth story.', timestamp: '2026-02-26T14:00:00Z', likes: 7, likedByMe: false },
  ],
};

function loadDiscussions(): DiscussionData {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : SEED_DATA;
  } catch {
    return SEED_DATA;
  }
}

function saveDiscussions(data: DiscussionData) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
}

export default function Discussion() {
  const [discussions, setDiscussions] = useState<DiscussionData>(loadDiscussions);
  const [symbol, setSymbol] = useState('AAPL');
  const [symbolInput, setSymbolInput] = useState('AAPL');
  const [newComment, setNewComment] = useState('');

  useEffect(() => { saveDiscussions(discussions); }, [discussions]);

  const comments = discussions[symbol.toUpperCase()] ?? [];

  const handleSearch = () => {
    const s = symbolInput.trim().toUpperCase();
    if (s) setSymbol(s);
  };

  const handlePost = () => {
    if (!newComment.trim()) return;
    const comment: Comment = {
      id: crypto.randomUUID(),
      user: 'You',
      message: newComment.trim(),
      timestamp: new Date().toISOString(),
      likes: 0,
      likedByMe: false,
    };
    setDiscussions(prev => ({
      ...prev,
      [symbol]: [comment, ...(prev[symbol] ?? [])],
    }));
    setNewComment('');
  };

  const handleLike = (commentId: string) => {
    setDiscussions(prev => ({
      ...prev,
      [symbol]: (prev[symbol] ?? []).map(c =>
        c.id === commentId
          ? { ...c, likes: c.likedByMe ? c.likes - 1 : c.likes + 1, likedByMe: !c.likedByMe }
          : c
      ),
    }));
  };

  const getInitial = (name: string) => name.charAt(0).toUpperCase();

  const getAvatarColor = (name: string) => {
    const colors = ['bg-accent', 'bg-purple', 'bg-info', 'bg-warning', 'bg-danger'];
    let hash = 0;
    for (let i = 0; i < name.length; i++) hash = name.charCodeAt(i) + ((hash << 5) - hash);
    return colors[Math.abs(hash) % colors.length];
  };

  const timeAgo = (ts: string) => {
    const diff = Date.now() - new Date(ts).getTime();
    const mins = Math.floor(diff / 60000);
    if (mins < 1) return 'just now';
    if (mins < 60) return `${mins}m ago`;
    const hours = Math.floor(mins / 60);
    if (hours < 24) return `${hours}h ago`;
    const days = Math.floor(hours / 24);
    return `${days}d ago`;
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-xl bg-info/10 flex items-center justify-center">
          <MessageCircle className="w-6 h-6 text-info" />
        </div>
        <div>
          <h1 className="text-2xl font-black text-text-primary">Stock Discussion</h1>
          <p className="text-xs text-text-muted">Share insights & discuss trading ideas</p>
        </div>
      </div>

      <div className="flex gap-2">
        <div className="relative flex-1 max-w-xs">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-text-muted" />
          <input
            value={symbolInput}
            onChange={e => setSymbolInput(e.target.value.toUpperCase())}
            onKeyDown={e => e.key === 'Enter' && handleSearch()}
            placeholder="Enter symbol..."
            className="w-full bg-surface border border-border rounded-lg pl-9 pr-3 py-2 text-sm text-text-primary font-mono focus:outline-none focus:border-accent"
          />
        </div>
        <button onClick={handleSearch}
          className="px-4 py-2 rounded-lg bg-accent text-bg text-sm font-bold hover:bg-accent/90 transition-colors">
          Go
        </button>
      </div>

      <div className="flex gap-2 flex-wrap">
        {Object.keys(discussions).map(s => (
          <button key={s} onClick={() => { setSymbol(s); setSymbolInput(s); }}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-colors ${symbol === s ? 'bg-accent text-bg' : 'bg-surface border border-border text-text-muted hover:text-text-primary'}`}>
            {s}
            <span className="ml-1.5 opacity-70">({discussions[s]?.length ?? 0})</span>
          </button>
        ))}
      </div>

      <div className="bg-surface border border-border rounded-xl p-4 animate-fade-up">
        <div className="flex items-center gap-2 mb-3">
          <h2 className="text-sm font-bold text-text-primary">Discussion for</h2>
          <span className="text-accent font-black text-lg">{symbol}</span>
        </div>

        <div className="flex gap-2 mb-6">
          <input
            value={newComment}
            onChange={e => setNewComment(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && handlePost()}
            placeholder="Share your thoughts..."
            className="flex-1 bg-bg border border-border rounded-lg px-4 py-2.5 text-sm text-text-primary focus:outline-none focus:border-accent"
          />
          <button onClick={handlePost} disabled={!newComment.trim()}
            className="px-4 py-2.5 rounded-lg bg-accent text-bg text-sm font-bold flex items-center gap-1.5 disabled:opacity-50 hover:bg-accent/90 transition-colors">
            <Send className="w-4 h-4" />
            Post
          </button>
        </div>

        <div className="space-y-3">
          {comments.length === 0 && (
            <p className="text-text-muted text-sm text-center py-8">No comments yet for {symbol}. Be the first to share!</p>
          )}
          {comments.map(c => (
            <div key={c.id} className="flex gap-3 p-3 rounded-xl hover:bg-bg/50 transition-colors">
              <div className={`w-9 h-9 rounded-full ${getAvatarColor(c.user)} flex items-center justify-center flex-shrink-0`}>
                <span className="text-sm font-bold text-bg">{getInitial(c.user)}</span>
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1">
                  <span className="text-sm font-bold text-text-primary">{c.user}</span>
                  <span className="text-[10px] text-text-muted">{timeAgo(c.timestamp)}</span>
                </div>
                <p className="text-sm text-text-primary/80 leading-relaxed">{c.message}</p>
                <button onClick={() => handleLike(c.id)}
                  className={`flex items-center gap-1 mt-2 text-xs font-bold transition-colors ${c.likedByMe ? 'text-accent' : 'text-text-muted hover:text-text-primary'}`}>
                  <ThumbsUp className="w-3.5 h-3.5" />
                  {c.likes > 0 && <span>{c.likes}</span>}
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
