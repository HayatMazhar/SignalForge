import { useState } from 'react';
import { useParams } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Star, Zap, LineChart, Newspaper, BarChart3, Brain, FileText } from 'lucide-react';
import { stocksApi } from '../api/stocks';
import { signalsApi } from '../api/signals';
import { newsApi } from '../api/news';
import { optionsApi } from '../api/options';
import { watchlistApi } from '../api/watchlist';
import { useWatchlistStore } from '../stores/watchlistStore';
import StockChart from '../components/StockChart';
import SignalCard from '../components/SignalCard';
import TradeThesisPanel from '../components/insights/TradeThesisPanel';

const tabs = ['Overview', 'Technicals', 'News', 'Options', 'AI Analysis', 'Trade Thesis'];

export default function StockDetail() {
  const { symbol } = useParams<{ symbol: string }>();
  const [activeTab, setActiveTab] = useState('Overview');
  const queryClient = useQueryClient();
  const watchlistSymbols = useWatchlistStore((s) => s.symbols);
  const isWatched = watchlistSymbols.includes(symbol?.toUpperCase() ?? '');

  const { data: quote } = useQuery({
    queryKey: ['quote', symbol],
    queryFn: () => stocksApi.getQuote(symbol!),
    refetchInterval: 15000,
    enabled: !!symbol,
  });

  const { data: history } = useQuery({
    queryKey: ['history', symbol],
    queryFn: () => {
      const to = new Date().toISOString().split('T')[0];
      const from = new Date(Date.now() - 365 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
      return stocksApi.getHistory(symbol!, from, to);
    },
    enabled: !!symbol,
  });

  const { data: signals } = useQuery({
    queryKey: ['stock-signals', symbol],
    queryFn: () => signalsApi.getSignals(undefined, 10),
    enabled: !!symbol,
  });

  const { data: news } = useQuery({
    queryKey: ['stock-news', symbol],
    queryFn: () => newsApi.getNews(symbol!, 10),
    enabled: !!symbol && activeTab === 'News',
  });

  const { data: options } = useQuery({
    queryKey: ['stock-options', symbol],
    queryFn: () => optionsApi.getSymbolFlow(symbol!),
    enabled: !!symbol && activeTab === 'Options',
  });

  const { data: technicals } = useQuery({
    queryKey: ['stock-indicators', symbol],
    queryFn: () => stocksApi.getIndicators(symbol!),
    enabled: !!symbol && activeTab === 'Technicals',
  });

  const generateMutation = useMutation({
    mutationFn: () => signalsApi.generateSignal(symbol!),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['stock-signals', symbol] }),
  });

  const toggleWatchlist = async () => {
    if (isWatched) {
      await watchlistApi.remove(symbol!);
    } else {
      await watchlistApi.add(symbol!);
    }
    queryClient.invalidateQueries({ queryKey: ['watchlist'] });
  };

  const stockSignals = signals?.filter((s) => s.symbol === symbol?.toUpperCase()) ?? [];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-text-primary">{symbol?.toUpperCase()}</h1>
          {quote && (
            <div className="flex items-center gap-4 mt-1">
              <span className="text-2xl font-bold text-text-primary">${quote.price.toFixed(2)}</span>
              <span className={`text-lg font-medium ${quote.changePercent >= 0 ? 'text-accent' : 'text-danger'}`}>
                {quote.changePercent >= 0 ? '+' : ''}{quote.change.toFixed(2)} ({quote.changePercent.toFixed(2)}%)
              </span>
            </div>
          )}
        </div>
        <div className="flex gap-3">
          <button onClick={toggleWatchlist}
            className={`px-4 py-2 rounded-lg text-sm font-medium flex items-center gap-2 border transition-colors ${
              isWatched ? 'bg-accent/10 text-accent border-accent/30' : 'bg-surface text-text-muted border-border hover:text-text-primary'
            }`}>
            <Star className={`w-4 h-4 ${isWatched ? 'fill-accent' : ''}`} />
            {isWatched ? 'Watching' : 'Watch'}
          </button>
          <button onClick={() => generateMutation.mutate()} disabled={generateMutation.isPending}
            className="px-4 py-2 rounded-lg bg-accent text-bg text-sm font-bold flex items-center gap-2 hover:bg-accent/90 disabled:opacity-50">
            <Zap className="w-4 h-4" />
            {generateMutation.isPending ? 'Analyzing...' : 'Generate Signal'}
          </button>
        </div>
      </div>

      <div className="bg-surface border border-border rounded-xl p-5">
        <StockChart data={history ?? []} height={450} />
      </div>

      <div className="flex gap-2 border-b border-border pb-0">
        {tabs.map((tab) => {
          const icons: Record<string, typeof LineChart> = { Overview: LineChart, Technicals: BarChart3, News: Newspaper, Options: BarChart3, 'AI Analysis': Brain, 'Trade Thesis': FileText };
          const Icon = icons[tab] || LineChart;
          return (
            <button key={tab} onClick={() => setActiveTab(tab)}
              className={`flex items-center gap-2 px-4 py-2.5 text-sm font-medium border-b-2 transition-colors ${
                activeTab === tab ? 'border-accent text-accent' : 'border-transparent text-text-muted hover:text-text-primary'
              }`}>
              <Icon className="w-4 h-4" /> {tab}
            </button>
          );
        })}
      </div>

      <div className="bg-surface border border-border rounded-xl p-5">
        {activeTab === 'Overview' && quote && (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
            <StatBox label="Open" value={`$${quote.open.toFixed(2)}`} />
            <StatBox label="High" value={`$${quote.high.toFixed(2)}`} />
            <StatBox label="Low" value={`$${quote.low.toFixed(2)}`} />
            <StatBox label="Volume" value={quote.volume.toLocaleString()} />
          </div>
        )}
        {activeTab === 'News' && (
          <div className="space-y-4">
            {news?.map((n) => (
              <a key={n.id} href={n.url} target="_blank" rel="noopener noreferrer"
                className="block p-4 rounded-lg bg-bg hover:bg-surface-light transition-colors">
                <h3 className="text-sm font-medium text-text-primary mb-1">{n.title}</h3>
                <div className="flex items-center gap-3 text-xs text-text-muted">
                  <span>{n.source}</span>
                  <span>{new Date(n.publishedAt).toLocaleDateString()}</span>
                </div>
              </a>
            ))}
          </div>
        )}
        {activeTab === 'Options' && (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead><tr className="text-text-muted border-b border-border">
                <th className="text-left py-2 px-3">Type</th><th className="text-right py-2 px-3">Strike</th>
                <th className="text-right py-2 px-3">Volume</th><th className="text-right py-2 px-3">OI</th>
                <th className="text-right py-2 px-3">IV</th><th className="text-right py-2 px-3">Premium</th>
              </tr></thead>
              <tbody>
                {options?.map((o) => (
                  <tr key={o.id} className="border-b border-border/50 hover:bg-bg">
                    <td className={`py-2 px-3 font-medium ${o.type === 'Call' ? 'text-accent' : 'text-danger'}`}>{o.type}</td>
                    <td className="text-right py-2 px-3 text-text-primary">${o.strike.toFixed(2)}</td>
                    <td className="text-right py-2 px-3 text-text-primary">{o.volume.toLocaleString()}</td>
                    <td className="text-right py-2 px-3 text-text-muted">{o.openInterest.toLocaleString()}</td>
                    <td className="text-right py-2 px-3 text-text-muted">{((o.impliedVolatility ?? 0) * 100).toFixed(1)}%</td>
                    <td className="text-right py-2 px-3 text-text-primary">${o.premium.toLocaleString()}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
        {activeTab === 'AI Analysis' && (
          <div className="space-y-4">
            {stockSignals.map((s) => <SignalCard key={s.id} signal={s} />)}
            {stockSignals.length === 0 && (
              <p className="text-text-muted text-center py-8">No signals yet. Click "Generate Signal" to analyze this stock.</p>
            )}
          </div>
        )}
        {activeTab === 'Technicals' && technicals && (
          <div className="space-y-6">
            <div className="flex items-center gap-3 mb-2">
              <span className={`px-3 py-1 rounded-full text-sm font-bold ${technicals.trend === 'Bullish' ? 'bg-accent/10 text-accent' : 'bg-danger/10 text-danger'}`}>
                {technicals.trend}
              </span>
            </div>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
              <IndicatorBox label="RSI (14)" value={technicals.rsi.toFixed(1)} signal={technicals.rsi < 30 ? 'Oversold' : technicals.rsi > 70 ? 'Overbought' : 'Neutral'} />
              <IndicatorBox label="MACD" value={technicals.macd.toFixed(2)} signal={technicals.macd > technicals.macdSignal ? 'Bullish' : 'Bearish'} />
              <IndicatorBox label="MACD Signal" value={technicals.macdSignal.toFixed(2)} />
              <IndicatorBox label="SMA 20" value={`$${technicals.sma20.toFixed(2)}`} />
              <IndicatorBox label="SMA 50" value={`$${technicals.sma50.toFixed(2)}`} />
              <IndicatorBox label="SMA 200" value={`$${technicals.sma200.toFixed(2)}`} />
              <IndicatorBox label="Bollinger Upper" value={`$${technicals.bollingerUpper.toFixed(2)}`} />
              <IndicatorBox label="Bollinger Lower" value={`$${technicals.bollingerLower.toFixed(2)}`} />
              <IndicatorBox label="ATR (14)" value={technicals.atr.toFixed(2)} />
            </div>
          </div>
        )}
        {activeTab === 'Technicals' && !technicals && (
          <p className="text-text-muted text-center py-8">Loading technical indicators...</p>
        )}
        {activeTab === 'Trade Thesis' && symbol && (
          <TradeThesisPanel symbol={symbol.toUpperCase()} />
        )}
      </div>
    </div>
  );
}

function StatBox({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <div className="text-xs text-text-muted mb-1">{label}</div>
      <div className="text-lg font-bold text-text-primary">{value}</div>
    </div>
  );
}

function IndicatorBox({ label, value, signal }: { label: string; value: string; signal?: string }) {
  return (
    <div className="bg-bg rounded-lg p-3">
      <div className="text-xs text-text-muted mb-1">{label}</div>
      <div className="text-base font-bold text-text-primary">{value}</div>
      {signal && (
        <div className={`text-xs font-medium mt-1 ${
          signal === 'Bullish' || signal === 'Oversold' ? 'text-accent' :
          signal === 'Bearish' || signal === 'Overbought' ? 'text-danger' :
          'text-text-muted'
        }`}>
          {signal}
        </div>
      )}
    </div>
  );
}
