import { useState } from 'react';
import { useMutation } from '@tanstack/react-query';
import { MessageSquare, Search, Sparkles, ArrowRight } from 'lucide-react';
import api from '../api/client';
import { useNavigate } from 'react-router-dom';
import LoadingSpinner from '../components/common/LoadingSpinner';

interface QueryResult {
  interpretation: string;
  results: Record<string, string | number>[];
  columns: string[];
}

const suggestions = [
  'Show me tech stocks with RSI under 30',
  'Which stocks have the highest dividend yield?',
  'Find stocks that beat earnings by more than 10%',
  'What are the most shorted stocks right now?',
  'Show me stocks near their 52-week low',
  'Find large-cap stocks with bullish MACD crossover',
];

export default function NaturalQuery() {
  const [query, setQuery] = useState('');
  const navigate = useNavigate();

  const mutation = useMutation({
    mutationFn: (q: string) => api.post('/ai/natural-query', { query: q }).then(r => r.data as QueryResult),
  });

  const handleSubmit = () => {
    if (query.trim()) mutation.mutate(query.trim());
  };

  const result = mutation.data;

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-xl bg-purple/10 flex items-center justify-center">
          <MessageSquare className="w-6 h-6 text-purple" />
        </div>
        <div>
          <h1 className="text-2xl font-black text-text-primary">Natural Language Query</h1>
          <p className="text-xs text-text-muted">Ask anything about the market in plain English</p>
        </div>
      </div>

      <div className="bg-surface border border-border rounded-xl p-6">
        <div className="relative">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-text-muted" />
          <input
            value={query}
            onChange={e => setQuery(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && handleSubmit()}
            placeholder="Ask anything... e.g. 'Show me tech stocks with RSI under 30'"
            className="w-full bg-bg border border-border rounded-xl pl-12 pr-24 py-4 text-text-primary placeholder-text-muted focus:outline-none focus:border-accent text-sm"
          />
          <button onClick={handleSubmit} disabled={!query.trim() || mutation.isPending}
            className="absolute right-2 top-1/2 -translate-y-1/2 px-4 py-2 rounded-lg bg-accent text-bg text-sm font-bold flex items-center gap-1.5 hover:bg-accent/90 disabled:opacity-50 transition-colors">
            <Sparkles className="w-3.5 h-3.5" />
            Ask
          </button>
        </div>

        <div className="flex flex-wrap gap-2 mt-4">
          {suggestions.map(s => (
            <button key={s}
              onClick={() => { setQuery(s); mutation.mutate(s); }}
              className="px-3 py-1.5 rounded-full text-xs bg-bg border border-border text-text-muted hover:text-text-primary hover:border-accent/30 transition-colors flex items-center gap-1">
              <ArrowRight className="w-3 h-3 opacity-50" /> {s}
            </button>
          ))}
        </div>
      </div>

      {mutation.isPending && <LoadingSpinner text="Analyzing your query..." />}

      {mutation.error && (
        <div className="bg-danger/10 border border-danger/20 rounded-xl p-4 text-danger text-sm">
          Failed to process your query. Please try rephrasing.
        </div>
      )}

      {result && (
        <div className="space-y-4 animate-fade-up">
          <div className="bg-purple/5 border border-purple/20 rounded-xl p-4">
            <div className="flex items-start gap-2">
              <Sparkles className="w-4 h-4 text-purple flex-shrink-0 mt-0.5" />
              <div>
                <span className="text-[10px] font-bold text-purple uppercase tracking-wider">Interpretation</span>
                <p className="text-sm text-text-primary mt-0.5">{result.interpretation}</p>
              </div>
            </div>
          </div>

          {result.results.length > 0 ? (
            <div className="bg-surface border border-border rounded-xl overflow-hidden">
              <div className="px-5 py-3 border-b border-border bg-bg/30">
                <span className="text-xs font-bold text-text-muted uppercase tracking-wider">{result.results.length} Results</span>
              </div>
              <div className="max-h-[500px] overflow-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="text-text-muted border-b border-border sticky top-0 bg-surface">
                      {result.columns.map(col => (
                        <th key={col} className="text-left py-2.5 px-5 text-xs font-bold uppercase tracking-wider">{col}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {result.results.map((row, i) => (
                      <tr key={i}
                        onClick={() => row['symbol'] && navigate(`/stocks/${row['symbol']}`)}
                        className={`border-b border-border/30 hover:bg-bg/30 transition-colors ${row['symbol'] ? 'cursor-pointer' : ''}`}>
                        {result.columns.map(col => (
                          <td key={col} className={`py-2.5 px-5 ${col === 'symbol' ? 'font-bold text-accent' : 'text-text-primary'} ${typeof row[col] === 'number' ? 'font-mono' : ''}`}>
                            {row[col] !== null && row[col] !== undefined ? String(row[col]) : '—'}
                          </td>
                        ))}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          ) : (
            <p className="text-text-muted text-sm text-center py-12">No results found for your query</p>
          )}
        </div>
      )}
    </div>
  );
}
