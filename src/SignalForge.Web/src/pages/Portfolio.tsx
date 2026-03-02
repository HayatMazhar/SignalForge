import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Briefcase, Plus, Trash2, X } from 'lucide-react';
import { portfolioApi } from '../api/portfolio';
import PortfolioChart from '../components/charts/PortfolioChart';
import PortfolioRiskRadar from '../components/insights/PortfolioRiskRadar';
import LoadingSpinner from '../components/common/LoadingSpinner';

export default function Portfolio() {
  const [symbol, setSymbol] = useState('');
  const [quantity, setQuantity] = useState('');
  const [cost, setCost] = useState('');
  const [showForm, setShowForm] = useState(false);
  const queryClient = useQueryClient();

  const { data: positions, isLoading } = useQuery({ queryKey: ['portfolio'], queryFn: portfolioApi.get });

  const addMutation = useMutation({
    mutationFn: () => portfolioApi.addPosition(symbol.toUpperCase(), parseFloat(quantity), parseFloat(cost)),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['portfolio'] }); setShowForm(false); setSymbol(''); setQuantity(''); setCost(''); },
    onError: () => {},
  });

  const removeMutation = useMutation({
    mutationFn: (id: string) => portfolioApi.removePosition(id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['portfolio'] }),
    onError: () => {},
  });

  const totalValue = positions?.reduce((s, p) => s + p.quantity * p.averageCost, 0) ?? 0;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Briefcase className="w-8 h-8 text-accent" />
          <h1 className="text-2xl font-bold text-text-primary">Portfolio</h1>
        </div>
        <button onClick={() => setShowForm(!showForm)}
          className="px-4 py-2 rounded-lg bg-accent text-bg text-sm font-bold flex items-center gap-1 hover:bg-accent/90 transition-colors">
          {showForm ? <X className="w-4 h-4" /> : <Plus className="w-4 h-4" />}
          {showForm ? 'Cancel' : 'Add Position'}
        </button>
      </div>

      {showForm && (
        <div className="bg-surface border border-border rounded-xl p-5">
          <h3 className="text-sm font-semibold text-text-primary mb-3">New Position</h3>
          <div className="grid grid-cols-3 gap-4">
            <div>
              <label className="text-xs text-text-muted mb-1 block">Symbol</label>
              <input value={symbol} onChange={(e) => setSymbol(e.target.value)} placeholder="AAPL"
                className="w-full bg-bg border border-border rounded-lg px-4 py-2 text-text-primary placeholder-text-muted focus:outline-none focus:border-accent" />
            </div>
            <div>
              <label className="text-xs text-text-muted mb-1 block">Quantity</label>
              <input value={quantity} onChange={(e) => setQuantity(e.target.value)} placeholder="10" type="number"
                className="w-full bg-bg border border-border rounded-lg px-4 py-2 text-text-primary placeholder-text-muted focus:outline-none focus:border-accent" />
            </div>
            <div>
              <label className="text-xs text-text-muted mb-1 block">Avg Cost ($)</label>
              <input value={cost} onChange={(e) => setCost(e.target.value)} placeholder="150.00" type="number"
                className="w-full bg-bg border border-border rounded-lg px-4 py-2 text-text-primary placeholder-text-muted focus:outline-none focus:border-accent" />
            </div>
          </div>
          <button onClick={() => addMutation.mutate()} disabled={!symbol || !quantity || !cost || addMutation.isPending}
            className="mt-4 px-6 py-2 rounded-lg bg-accent text-bg text-sm font-bold disabled:opacity-50 hover:bg-accent/90 transition-colors">
            {addMutation.isPending ? 'Adding...' : 'Add Position'}
          </button>
        </div>
      )}

      {isLoading ? <LoadingSpinner text="Loading portfolio..." /> : (
        <>
          {/* Portfolio Chart + Risk Radar */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2">
              <PortfolioChart positions={positions ?? []} />
            </div>
            <PortfolioRiskRadar positions={positions ?? []} />
          </div>

          {/* Summary */}
          <div className="grid grid-cols-3 gap-4">
            <div className="bg-surface border border-border rounded-xl p-4">
              <div className="text-xs text-text-muted">Total Value</div>
              <div className="text-xl font-bold text-text-primary">${totalValue.toLocaleString(undefined, { minimumFractionDigits: 2 })}</div>
            </div>
            <div className="bg-surface border border-border rounded-xl p-4">
              <div className="text-xs text-text-muted">Positions</div>
              <div className="text-xl font-bold text-text-primary">{positions?.length ?? 0}</div>
            </div>
            <div className="bg-surface border border-border rounded-xl p-4">
              <div className="text-xs text-text-muted">Symbols</div>
              <div className="text-xl font-bold text-accent">{new Set(positions?.map(p => p.symbol) ?? []).size}</div>
            </div>
          </div>

          {/* Positions Table */}
          <div className="bg-surface border border-border rounded-xl overflow-hidden">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-text-muted border-b border-border bg-bg">
                  <th className="text-left py-3 px-5">Symbol</th>
                  <th className="text-right py-3 px-5">Qty</th>
                  <th className="text-right py-3 px-5">Avg Cost</th>
                  <th className="text-right py-3 px-5">Total Value</th>
                  <th className="text-right py-3 px-5">% of Portfolio</th>
                  <th className="text-right py-3 px-5">Actions</th>
                </tr>
              </thead>
              <tbody>
                {positions?.map((p) => {
                  const posValue = p.quantity * p.averageCost;
                  const pct = totalValue > 0 ? (posValue / totalValue) * 100 : 0;
                  return (
                    <tr key={p.id} className="border-b border-border/50 hover:bg-bg transition-colors">
                      <td className="py-3 px-5 font-bold text-text-primary">{p.symbol}</td>
                      <td className="text-right py-3 px-5 text-text-primary">{p.quantity}</td>
                      <td className="text-right py-3 px-5 text-text-muted">${p.averageCost.toFixed(2)}</td>
                      <td className="text-right py-3 px-5 text-text-primary">${posValue.toLocaleString(undefined, { minimumFractionDigits: 2 })}</td>
                      <td className="text-right py-3 px-5">
                        <div className="flex items-center justify-end gap-2">
                          <div className="w-16 h-1.5 bg-border rounded-full overflow-hidden">
                            <div className="h-full bg-accent rounded-full" style={{ width: `${pct}%` }} />
                          </div>
                          <span className="text-xs text-text-muted w-10 text-right">{pct.toFixed(1)}%</span>
                        </div>
                      </td>
                      <td className="text-right py-3 px-5">
                        <button onClick={() => removeMutation.mutate(p.id)}
                          className="text-text-muted hover:text-danger transition-colors">
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
            {(!positions || positions.length === 0) && (
              <p className="text-text-muted text-sm text-center py-12">No positions yet. Add your first position to get started.</p>
            )}
          </div>
        </>
      )}
    </div>
  );
}
