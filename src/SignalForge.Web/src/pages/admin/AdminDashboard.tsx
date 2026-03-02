import { useQuery } from '@tanstack/react-query';
import { Shield, Users, BarChart3, Zap, Bell, Star, Briefcase, Server, Clock } from 'lucide-react';
import { adminApi } from '../../api/admin';
import LoadingSpinner from '../../components/common/LoadingSpinner';

export default function AdminDashboard() {
  const { data: stats, isLoading } = useQuery({
    queryKey: ['admin-stats'],
    queryFn: adminApi.getStats,
    refetchInterval: 30000,
  });

  if (isLoading) return <LoadingSpinner text="Loading system stats..." />;

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-xl bg-purple/10 flex items-center justify-center">
          <Shield className="w-6 h-6 text-purple" />
        </div>
        <div>
          <h1 className="text-2xl font-black text-text-primary">Admin Dashboard</h1>
          <p className="text-xs text-text-muted flex items-center gap-1">
            <Clock className="w-3 h-3" />
            Server: {stats ? new Date(stats.serverTime).toLocaleString() : '—'}
          </p>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <StatCard icon={Users} label="Total Users" value={stats?.totalUsers ?? 0} color="text-info" bg="bg-info/10" />
        <StatCard icon={BarChart3} label="Total Stocks" value={stats?.totalStocks ?? 0} color="text-accent" bg="bg-accent/10" />
        <StatCard icon={Zap} label="Total Signals" value={stats?.totalSignals ?? 0} color="text-purple" bg="bg-purple/10" />
        <StatCard icon={Zap} label="Signals Today" value={stats?.signalsToday ?? 0} color="text-warning" bg="bg-warning/10" />
        <StatCard icon={Bell} label="Active Alerts" value={stats?.totalAlerts ?? 0} color="text-danger" bg="bg-danger/10" />
        <StatCard icon={Star} label="Watchlist Items" value={stats?.totalWatchlist ?? 0} color="text-accent" bg="bg-accent/10" />
        <StatCard icon={Briefcase} label="Portfolio Positions" value={stats?.totalPortfolio ?? 0} color="text-info" bg="bg-info/10" />
        <StatCard icon={Server} label="System Status" value="Online" color="text-accent" bg="bg-accent/10" isText />
      </div>

      {/* Tier Breakdown */}
      <div className="bg-surface border border-border rounded-xl p-6">
        <h2 className="text-sm font-bold text-text-muted uppercase tracking-wider mb-4">User Tier Distribution</h2>
        <div className="grid grid-cols-3 gap-4">
          {stats?.tierBreakdown.map((t) => {
            const total = stats.totalUsers || 1;
            const pct = (t.count / total) * 100;
            const colors: Record<string, string> = { free: 'bg-text-muted', pro: 'bg-accent', elite: 'bg-purple' };
            return (
              <div key={t.tier} className="bg-bg rounded-xl p-4">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm font-semibold text-text-primary capitalize">{t.tier}</span>
                  <span className="text-lg font-black text-text-primary">{t.count}</span>
                </div>
                <div className="w-full h-2 bg-border rounded-full overflow-hidden">
                  <div className={`h-full rounded-full ${colors[t.tier] ?? 'bg-accent'} transition-all duration-700`}
                    style={{ width: `${pct}%` }} />
                </div>
                <span className="text-[10px] text-text-muted mt-1 block">{pct.toFixed(0)}% of users</span>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

function StatCard({ icon: Icon, label, value, color, bg, isText }: {
  icon: typeof Users; label: string; value: number | string; color: string; bg: string; isText?: boolean
}) {
  return (
    <div className="bg-surface border border-border rounded-xl p-4 card-hover">
      <div className={`w-9 h-9 rounded-lg ${bg} flex items-center justify-center mb-3`}>
        <Icon className={`w-5 h-5 ${color}`} />
      </div>
      <div className={`text-2xl font-black text-text-primary ${!isText ? 'font-mono' : ''}`}>
        {typeof value === 'number' ? value.toLocaleString() : value}
      </div>
      <div className="text-[11px] text-text-muted mt-0.5">{label}</div>
    </div>
  );
}
