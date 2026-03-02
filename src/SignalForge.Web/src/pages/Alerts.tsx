import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Bell, Plus, Trash2, X, TrendingUp, Zap, Newspaper } from 'lucide-react';
import { alertsApi } from '../api/alerts';
import LoadingSpinner from '../components/common/LoadingSpinner';

const alertTypeOptions = [
  { value: 0, label: 'Price', icon: TrendingUp, description: 'Trigger when price hits target' },
  { value: 1, label: 'Signal', icon: Zap, description: 'Trigger when AI signal is generated' },
  { value: 2, label: 'News', icon: Newspaper, description: 'Trigger on breaking news' },
];

export default function Alerts() {
  const [showForm, setShowForm] = useState(false);
  const [symbol, setSymbol] = useState('');
  const [alertType, setAlertType] = useState(0);
  const [targetValue, setTargetValue] = useState('');
  const queryClient = useQueryClient();

  const { data: alerts, isLoading } = useQuery({ queryKey: ['alerts'], queryFn: alertsApi.get });

  const createMutation = useMutation({
    mutationFn: () => alertsApi.create(symbol.toUpperCase(), alertType, parseFloat(targetValue)),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['alerts'] }); setShowForm(false); setSymbol(''); setTargetValue(''); },
    onError: () => {},
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => alertsApi.delete(id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['alerts'] }),
  });

  const typeLabels = ['Price', 'Signal', 'News'];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Bell className="w-8 h-8 text-accent" />
          <div>
            <h1 className="text-2xl font-bold text-text-primary">Alerts</h1>
            <p className="text-sm text-text-muted">{alerts?.length ?? 0} active alerts</p>
          </div>
        </div>
        <button onClick={() => setShowForm(!showForm)}
          className="px-4 py-2 rounded-lg bg-accent text-bg text-sm font-bold flex items-center gap-1 hover:bg-accent/90">
          {showForm ? <X className="w-4 h-4" /> : <Plus className="w-4 h-4" />}
          {showForm ? 'Cancel' : 'New Alert'}
        </button>
      </div>

      {showForm && (
        <div className="bg-surface border border-border rounded-xl p-6">
          <h3 className="text-sm font-bold text-text-primary mb-4">Create Alert</h3>
          <div className="grid grid-cols-3 gap-3 mb-4">
            {alertTypeOptions.map((opt) => {
              const Icon = opt.icon;
              return (
                <button key={opt.value} onClick={() => setAlertType(opt.value)}
                  className={`p-3 rounded-lg border text-left transition-colors ${
                    alertType === opt.value ? 'border-accent bg-accent/5' : 'border-border hover:border-text-muted'
                  }`}>
                  <Icon className={`w-5 h-5 mb-1 ${alertType === opt.value ? 'text-accent' : 'text-text-muted'}`} />
                  <div className="text-sm font-medium text-text-primary">{opt.label}</div>
                  <div className="text-[10px] text-text-muted">{opt.description}</div>
                </button>
              );
            })}
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-xs text-text-muted mb-1 block">Symbol</label>
              <input value={symbol} onChange={(e) => setSymbol(e.target.value)} placeholder="AAPL"
                className="w-full bg-bg border border-border rounded-lg px-4 py-2 text-text-primary placeholder-text-muted focus:outline-none focus:border-accent" />
            </div>
            <div>
              <label className="text-xs text-text-muted mb-1 block">Target Value</label>
              <input value={targetValue} onChange={(e) => setTargetValue(e.target.value)} placeholder="250.00" type="number"
                className="w-full bg-bg border border-border rounded-lg px-4 py-2 text-text-primary placeholder-text-muted focus:outline-none focus:border-accent" />
            </div>
          </div>
          <button onClick={() => createMutation.mutate()} disabled={!symbol || !targetValue || createMutation.isPending}
            className="mt-4 px-6 py-2 rounded-lg bg-accent text-bg text-sm font-bold disabled:opacity-50 hover:bg-accent/90">
            {createMutation.isPending ? 'Creating...' : 'Create Alert'}
          </button>
        </div>
      )}

      {isLoading ? <LoadingSpinner text="Loading alerts..." /> : (
        <div className="space-y-2">
          {alerts?.map((a) => (
            <div key={a.id} className="bg-surface border border-border rounded-xl p-4 flex items-center justify-between hover:bg-surface-light transition-colors">
              <div className="flex items-center gap-4">
                <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${
                  (a.alertType === 'Price' || a.alertType === 0) ? 'bg-blue-400/10' : (a.alertType === 'Signal' || a.alertType === 1) ? 'bg-accent/10' : 'bg-purple-400/10'
                }`}>
                  {(a.alertType === 'Price' || a.alertType === 0) ? <TrendingUp className="w-5 h-5 text-blue-400" /> :
                   (a.alertType === 'Signal' || a.alertType === 1) ? <Zap className="w-5 h-5 text-accent" /> :
                   <Newspaper className="w-5 h-5 text-purple-400" />}
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-bold text-text-primary">{a.symbol}</span>
                    <span className="text-xs px-2 py-0.5 rounded bg-surface-light text-text-muted">{typeLabels[Number(a.alertType)] ?? a.alertType}</span>
                    <span className={`text-[10px] px-1.5 py-0.5 rounded-full font-bold ${a.isActive ? 'bg-accent/10 text-accent' : 'bg-text-muted/10 text-text-muted'}`}>
                      {a.isActive ? 'Active' : 'Inactive'}
                    </span>
                  </div>
                  <div className="text-xs text-text-muted mt-0.5">Target: ${(a.targetValue ?? 0).toFixed(2)} | Created: {new Date(a.createdAt).toLocaleDateString()}</div>
                </div>
              </div>
              <button onClick={() => deleteMutation.mutate(a.id)} className="text-text-muted hover:text-danger transition-colors p-2">
                <Trash2 className="w-4 h-4" />
              </button>
            </div>
          ))}
          {(!alerts || alerts.length === 0) && (
            <div className="text-center py-16">
              <Bell className="w-12 h-12 text-text-muted mx-auto mb-3" />
              <p className="text-text-muted text-sm">No alerts configured. Create one to get notified.</p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
