import { useQuery } from '@tanstack/react-query';
import { Newspaper, ExternalLink, TrendingUp, TrendingDown, Minus } from 'lucide-react';
import { newsApi } from '../api/news';
import { formatDistanceToNow } from 'date-fns';
import LoadingSpinner from '../components/common/LoadingSpinner';

function getSentimentConfig(score: number) {
  if (score >= 0.3) return { label: 'Bullish', color: 'text-accent', bg: 'bg-accent/10', icon: TrendingUp };
  if (score <= -0.3) return { label: 'Bearish', color: 'text-danger', bg: 'bg-danger/10', icon: TrendingDown };
  return { label: 'Neutral', color: 'text-text-muted', bg: 'bg-surface-light', icon: Minus };
}

export default function News() {
  const { data: news, isLoading } = useQuery({
    queryKey: ['market-news'],
    queryFn: () => newsApi.getMarketNews(30),
    refetchInterval: 300000,
  });

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <Newspaper className="w-8 h-8 text-accent" />
        <div>
          <h1 className="text-2xl font-bold text-text-primary">Market News</h1>
          <p className="text-sm text-text-muted">{news?.length ?? 0} articles</p>
        </div>
      </div>

      {/* Sentiment Summary */}
      {news && news.length > 0 && (
        <div className="grid grid-cols-3 gap-4">
          <SentimentStat label="Bullish" count={news.filter(n => n.sentimentScore >= 0.3).length} total={news.length} color="text-accent" />
          <SentimentStat label="Neutral" count={news.filter(n => n.sentimentScore > -0.3 && n.sentimentScore < 0.3).length} total={news.length} color="text-text-muted" />
          <SentimentStat label="Bearish" count={news.filter(n => n.sentimentScore <= -0.3).length} total={news.length} color="text-danger" />
        </div>
      )}

      {isLoading ? <LoadingSpinner text="Loading news..." /> : (
        <div className="space-y-3">
          {news?.map((n) => {
            const sentiment = getSentimentConfig(n.sentimentScore);
            const Icon = sentiment.icon;
            return (
              <a key={n.id} href={n.url} target="_blank" rel="noopener noreferrer"
                className="block bg-surface border border-border rounded-xl p-5 hover:bg-surface-light transition-colors group">
                <div className="flex gap-4">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-2">
                      <span className="text-xs font-bold text-accent">{n.symbol}</span>
                      <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded-full flex items-center gap-0.5 ${sentiment.bg} ${sentiment.color}`}>
                        <Icon className="w-3 h-3" />
                        {sentiment.label}
                      </span>
                      <span className="text-xs text-text-muted">{n.source}</span>
                    </div>
                    <h3 className="text-sm font-semibold text-text-primary mb-1.5 group-hover:text-accent transition-colors">{n.title}</h3>
                    <p className="text-xs text-text-muted line-clamp-2 mb-2">{n.summary}</p>
                    <div className="flex items-center gap-4">
                      <span className="text-[10px] text-text-muted">
                        {formatDistanceToNow(new Date(n.publishedAt), { addSuffix: true })}
                      </span>
                      {/* Sentiment bar */}
                      <div className="flex items-center gap-1.5">
                        <span className="text-[10px] text-text-muted">Sentiment:</span>
                        <div className="w-20 h-1.5 bg-border rounded-full overflow-hidden">
                          <div className={`h-full rounded-full ${n.sentimentScore >= 0 ? 'bg-accent' : 'bg-danger'}`}
                            style={{ width: `${Math.abs(n.sentimentScore ?? 0) * 100}%`, marginLeft: (n.sentimentScore ?? 0) < 0 ? `${(1 - Math.abs(n.sentimentScore ?? 0)) * 100}%` : '0' }} />
                        </div>
                        <span className={`text-[10px] font-bold ${n.sentimentScore >= 0 ? 'text-accent' : 'text-danger'}`}>
                          {(n.sentimentScore ?? 0) >= 0 ? '+' : ''}{(n.sentimentScore ?? 0).toFixed(2)}
                        </span>
                      </div>
                    </div>
                  </div>
                  <ExternalLink className="w-4 h-4 text-text-muted flex-shrink-0 mt-1 opacity-0 group-hover:opacity-100 transition-opacity" />
                </div>
              </a>
            );
          })}
        </div>
      )}
    </div>
  );
}

function SentimentStat({ label, count, total, color }: { label: string; count: number; total: number; color: string }) {
  const pct = total > 0 ? (count / total) * 100 : 0;
  return (
    <div className="bg-surface border border-border rounded-xl p-4">
      <div className="flex items-center justify-between mb-2">
        <span className="text-xs text-text-muted">{label}</span>
        <span className={`text-lg font-bold ${color}`}>{count}</span>
      </div>
      <div className="w-full h-1.5 bg-border rounded-full overflow-hidden">
        <div className={`h-full rounded-full transition-all duration-700 ${
          label === 'Bullish' ? 'bg-accent' : label === 'Bearish' ? 'bg-danger' : 'bg-text-muted'
        }`} style={{ width: `${pct}%` }} />
      </div>
      <div className="text-[10px] text-text-muted mt-1">{pct.toFixed(0)}% of articles</div>
    </div>
  );
}
