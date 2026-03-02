import { useState } from 'react';
import { Download, Briefcase, BookOpen, Radar, Star, Bell, Package, Check, Loader2 } from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import api from '../api/client';
import LoadingSpinner from '../components/common/LoadingSpinner';

interface ExportItem {
  key: string;
  label: string;
  description: string;
  icon: typeof Briefcase;
  color: string;
  endpoint: string;
  columns: string[];
  mapRow: (item: Record<string, unknown>) => string[];
}

const EXPORTS: ExportItem[] = [
  {
    key: 'portfolio',
    label: 'Portfolio',
    description: 'Holdings, cost basis, current value, and P&L for all positions.',
    icon: Briefcase,
    color: 'text-accent',
    endpoint: '/portfolio',
    columns: ['Symbol', 'Shares', 'Avg Cost', 'Current Price', 'Value', 'P&L', 'P&L %'],
    mapRow: (item) => [
      String(item.symbol ?? ''),
      String(item.shares ?? item.quantity ?? ''),
      String(item.avgCost ?? item.averageCost ?? ''),
      String(item.currentPrice ?? ''),
      String(item.value ?? item.marketValue ?? ''),
      String(item.pnl ?? item.profitLoss ?? ''),
      String(item.pnlPercent ?? item.profitLossPercent ?? ''),
    ],
  },
  {
    key: 'journal',
    label: 'Trade Journal',
    description: 'All logged trades with entry/exit prices, notes, and outcomes.',
    icon: BookOpen,
    color: 'text-info',
    endpoint: '/trade-journal',
    columns: ['Date', 'Symbol', 'Side', 'Quantity', 'Entry', 'Exit', 'P&L', 'Notes'],
    mapRow: (item) => [
      String(item.date ?? item.entryDate ?? ''),
      String(item.symbol ?? ''),
      String(item.side ?? item.direction ?? ''),
      String(item.quantity ?? item.shares ?? ''),
      String(item.entryPrice ?? ''),
      String(item.exitPrice ?? ''),
      String(item.pnl ?? item.profitLoss ?? ''),
      String(item.notes ?? ''),
    ],
  },
  {
    key: 'signals',
    label: 'Signals',
    description: 'AI-generated buy/sell signals with confidence scores and timestamps.',
    icon: Radar,
    color: 'text-purple',
    endpoint: '/signals?limit=500',
    columns: ['Date', 'Symbol', 'Type', 'Confidence', 'Entry Price', 'Target', 'Stop Loss'],
    mapRow: (item) => [
      String(item.timestamp ?? item.date ?? item.createdAt ?? ''),
      String(item.symbol ?? item.ticker ?? ''),
      String(item.type ?? item.signalType ?? ''),
      String(item.confidence ?? ''),
      String(item.entryPrice ?? item.price ?? ''),
      String(item.targetPrice ?? item.target ?? ''),
      String(item.stopLoss ?? ''),
    ],
  },
  {
    key: 'watchlist',
    label: 'Watchlist',
    description: 'All watched stocks with current prices and change data.',
    icon: Star,
    color: 'text-warning',
    endpoint: '/watchlist',
    columns: ['Symbol', 'Name', 'Price', 'Change', 'Change %', 'Added Date'],
    mapRow: (item) => [
      String(item.symbol ?? ''),
      String(item.name ?? item.companyName ?? ''),
      String(item.price ?? item.currentPrice ?? ''),
      String(item.change ?? ''),
      String(item.changePercent ?? ''),
      String(item.addedAt ?? item.addedDate ?? ''),
    ],
  },
  {
    key: 'alerts',
    label: 'Alerts',
    description: 'Active and triggered alert rules with conditions and status.',
    icon: Bell,
    color: 'text-danger',
    endpoint: '/alerts',
    columns: ['Symbol', 'Condition', 'Value', 'Status', 'Created', 'Triggered'],
    mapRow: (item) => [
      String(item.symbol ?? ''),
      String(item.condition ?? item.type ?? ''),
      String(item.value ?? item.targetPrice ?? ''),
      String(item.status ?? ''),
      String(item.createdAt ?? ''),
      String(item.triggeredAt ?? ''),
    ],
  },
];

function escapeCSV(val: string): string {
  if (val.includes(',') || val.includes('"') || val.includes('\n')) {
    return `"${val.replace(/"/g, '""')}"`;
  }
  return val;
}

function downloadCSV(filename: string, columns: string[], rows: string[][]) {
  const header = columns.map(escapeCSV).join(',');
  const body = rows.map((row) => row.map(escapeCSV).join(',')).join('\n');
  const csv = `${header}\n${body}`;
  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = `signalforge-${filename}-${new Date().toISOString().slice(0, 10)}.csv`;
  link.click();
  URL.revokeObjectURL(url);
}

export default function DataExport() {
  const [exporting, setExporting] = useState<Record<string, boolean>>({});
  const [exported, setExported] = useState<Record<string, boolean>>({});
  const [counts, setCounts] = useState<Record<string, number>>({});

  const { isLoading } = useQuery({
    queryKey: ['export-counts'],
    queryFn: async () => {
      const results: Record<string, number> = {};
      for (const exp of EXPORTS) {
        try {
          const res = await api.get(exp.endpoint);
          const data = Array.isArray(res.data) ? res.data : res.data?.items ?? res.data?.data ?? [];
          results[exp.key] = data.length;
        } catch {
          results[exp.key] = 0;
        }
      }
      setCounts(results);
      return results;
    },
  });

  const handleExport = async (item: ExportItem) => {
    setExporting((prev) => ({ ...prev, [item.key]: true }));
    try {
      const res = await api.get(item.endpoint);
      const data: Record<string, unknown>[] = Array.isArray(res.data) ? res.data : res.data?.items ?? res.data?.data ?? [];
      const rows = data.map(item.mapRow);
      downloadCSV(item.key, item.columns, rows);
      setExported((prev) => ({ ...prev, [item.key]: true }));
      setCounts((prev) => ({ ...prev, [item.key]: data.length }));
    } catch {
      // silently handle — generates empty CSV
      downloadCSV(item.key, item.columns, []);
    } finally {
      setExporting((prev) => ({ ...prev, [item.key]: false }));
    }
  };

  const handleExportAll = async () => {
    for (const item of EXPORTS) {
      await handleExport(item);
    }
  };

  if (isLoading) return <LoadingSpinner text="Loading export data..." />;

  return (
    <div className="page-enter max-w-4xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-info/10 flex items-center justify-center">
            <Download className="w-5 h-5 text-info" />
          </div>
          <div>
            <h1 className="text-2xl font-black text-text-primary">Data Export</h1>
            <p className="text-xs text-text-muted">Download your data as CSV files</p>
          </div>
        </div>
        <button
          onClick={handleExportAll}
          className="px-5 py-2.5 rounded-xl bg-accent text-bg text-sm font-bold hover:bg-accent-dim transition-all btn-shine glow-accent flex items-center gap-2"
        >
          <Package className="w-4 h-4" /> Export All
        </button>
      </div>

      {/* Export Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {EXPORTS.map((item, i) => {
          const Icon = item.icon;
          const isExporting = exporting[item.key];
          const isDone = exported[item.key];
          return (
            <div
              key={item.key}
              style={{ animationDelay: `${i * 60}ms` }}
              className="animate-fade-up bg-surface border border-border rounded-2xl p-5 card-hover transition-all"
            >
              <div className="flex items-start gap-4">
                <div className={`w-11 h-11 rounded-xl flex items-center justify-center flex-shrink-0 ${item.color.replace('text-', 'bg-')}/10`}>
                  <Icon className={`w-5 h-5 ${item.color}`} />
                </div>
                <div className="flex-1 min-w-0">
                  <h3 className="text-base font-bold text-text-primary">{item.label}</h3>
                  <p className="text-xs text-text-muted mt-1 leading-relaxed">{item.description}</p>
                  <div className="flex items-center gap-3 mt-3">
                    <span className="text-[10px] font-bold text-text-muted/50 uppercase tracking-wider font-mono">
                      {counts[item.key] ?? '—'} records
                    </span>
                    {isDone && (
                      <span className="text-[10px] font-bold text-accent flex items-center gap-1">
                        <Check className="w-3 h-3" /> Exported
                      </span>
                    )}
                  </div>
                </div>
              </div>
              <button
                onClick={() => handleExport(item)}
                disabled={isExporting}
                className="mt-4 w-full py-2.5 rounded-xl bg-bg border border-border text-sm font-bold text-text-primary hover:border-accent/30 hover:text-accent transition-all flex items-center justify-center gap-2 disabled:opacity-50"
              >
                {isExporting ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" /> Exporting...
                  </>
                ) : (
                  <>
                    <Download className="w-4 h-4" /> Export CSV
                  </>
                )}
              </button>
            </div>
          );
        })}
      </div>

      {/* Info footer */}
      <div className="mt-8 bg-surface/50 border border-border rounded-xl p-4 text-center">
        <p className="text-xs text-text-muted">
          Exported files are in CSV format and can be opened in Excel, Google Sheets, or any spreadsheet application.
          Data is exported as-is from your account at the time of download.
        </p>
      </div>
    </div>
  );
}
