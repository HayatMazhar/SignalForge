import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Users, Shield, Lock, Unlock, Crown, Search } from 'lucide-react';
import { adminApi, type AdminUser } from '../../api/admin';
import LoadingSpinner from '../../components/common/LoadingSpinner';

const tiers = ['free', 'pro', 'elite'];
const roles = ['User', 'Analyst', 'Moderator', 'Admin'];
const tierColors: Record<string, string> = { free: 'bg-text-muted/20 text-text-muted', pro: 'bg-accent/10 text-accent', elite: 'bg-purple/10 text-purple' };
const roleColors: Record<string, string> = { Admin: 'bg-danger/10 text-danger', Moderator: 'bg-warning/10 text-warning', Analyst: 'bg-info/10 text-info', User: 'bg-surface-light text-text-muted' };

export default function UserManagement() {
  const [search, setSearch] = useState('');
  const [editingUser, setEditingUser] = useState<AdminUser | null>(null);
  const queryClient = useQueryClient();

  const { data: users, isLoading } = useQuery({ queryKey: ['admin-users'], queryFn: adminApi.getUsers });

  const roleMutation = useMutation({
    mutationFn: ({ userId, role }: { userId: string; role: string }) => adminApi.assignRole(userId, role),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['admin-users'] }); setEditingUser(null); },
  });

  const tierMutation = useMutation({
    mutationFn: ({ userId, tier }: { userId: string; tier: string }) => adminApi.updateTier(userId, tier),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['admin-users'] }); setEditingUser(null); },
  });

  const lockMutation = useMutation({
    mutationFn: ({ userId, lock }: { userId: string; lock: boolean }) => lock ? adminApi.lockUser(userId) : adminApi.unlockUser(userId),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['admin-users'] }),
  });

  const filtered = users?.filter(u =>
    u.email.toLowerCase().includes(search.toLowerCase()) ||
    u.fullName.toLowerCase().includes(search.toLowerCase())
  ) ?? [];

  if (isLoading) return <LoadingSpinner text="Loading users..." />;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-info/10 flex items-center justify-center">
            <Users className="w-6 h-6 text-info" />
          </div>
          <div>
            <h1 className="text-2xl font-black text-text-primary">User Management</h1>
            <p className="text-xs text-text-muted">{users?.length ?? 0} registered users</p>
          </div>
        </div>
      </div>

      {/* Search */}
      <div className="relative">
        <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-text-muted" />
        <input value={search} onChange={(e) => setSearch(e.target.value)}
          className="w-full bg-surface border border-border rounded-xl pl-10 pr-4 py-2.5 text-sm text-text-primary placeholder-text-muted/50 focus:outline-none focus:border-accent/40"
          placeholder="Search by name or email..." />
      </div>

      {/* User Table */}
      <div className="bg-surface border border-border rounded-xl overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="text-text-muted border-b border-border bg-bg/50 text-[11px] uppercase tracking-wider">
              <th className="text-left py-3 px-5">User</th>
              <th className="text-left py-3 px-5">Tier</th>
              <th className="text-left py-3 px-5">Role</th>
              <th className="text-left py-3 px-5">Status</th>
              <th className="text-right py-3 px-5">Actions</th>
            </tr>
          </thead>
          <tbody>
            {filtered.map((u) => (
              <tr key={u.id} className="border-b border-border/30 hover:bg-bg/30 transition-colors">
                <td className="py-3 px-5">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-accent/20 to-purple/20 flex items-center justify-center text-accent text-xs font-black">
                      {u.fullName.charAt(0)}
                    </div>
                    <div>
                      <div className="text-sm font-semibold text-text-primary">{u.fullName}</div>
                      <div className="text-[10px] text-text-muted">{u.email}</div>
                    </div>
                  </div>
                </td>
                <td className="py-3 px-5">
                  <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full uppercase ${tierColors[u.tier] ?? tierColors.free}`}>
                    {u.tier}
                  </span>
                </td>
                <td className="py-3 px-5">
                  {u.roles.map(r => (
                    <span key={r} className={`text-[10px] font-bold px-2 py-0.5 rounded-full mr-1 ${roleColors[r] ?? roleColors.User}`}>
                      {r}
                    </span>
                  ))}
                </td>
                <td className="py-3 px-5">
                  <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${u.isLocked ? 'bg-danger/10 text-danger' : 'bg-accent/10 text-accent'}`}>
                    {u.isLocked ? 'Locked' : 'Active'}
                  </span>
                </td>
                <td className="py-3 px-5 text-right">
                  <div className="flex items-center justify-end gap-1">
                    <button onClick={() => setEditingUser(u)} title="Edit"
                      className="p-1.5 rounded-lg text-text-muted hover:text-info hover:bg-info/10 transition-colors">
                      <Crown className="w-3.5 h-3.5" />
                    </button>
                    <button onClick={() => lockMutation.mutate({ userId: u.id, lock: !u.isLocked })}
                      title={u.isLocked ? 'Unlock' : 'Lock'}
                      className={`p-1.5 rounded-lg transition-colors ${u.isLocked ? 'text-accent hover:bg-accent/10' : 'text-text-muted hover:text-danger hover:bg-danger/10'}`}>
                      {u.isLocked ? <Unlock className="w-3.5 h-3.5" /> : <Lock className="w-3.5 h-3.5" />}
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Edit Modal */}
      {editingUser && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50"
          onClick={() => setEditingUser(null)}>
          <div className="bg-surface border border-border rounded-2xl p-6 w-full max-w-md shadow-2xl animate-fade-up"
            onClick={e => e.stopPropagation()}>
            <div className="flex items-center gap-3 mb-5">
              <Shield className="w-5 h-5 text-purple" />
              <h3 className="text-lg font-black text-text-primary">Edit User</h3>
            </div>
            <div className="mb-4">
              <div className="text-sm font-semibold text-text-primary">{editingUser.fullName}</div>
              <div className="text-xs text-text-muted">{editingUser.email}</div>
            </div>
            <div className="space-y-4">
              <div>
                <label className="text-xs font-bold text-text-muted uppercase tracking-wider mb-2 block">Role</label>
                <div className="grid grid-cols-2 gap-2">
                  {roles.map(r => (
                    <button key={r} onClick={() => roleMutation.mutate({ userId: editingUser.id, role: r })}
                      className={`py-2 rounded-lg text-xs font-bold transition-colors ${
                        editingUser.roles.includes(r) ? 'bg-accent/10 text-accent border border-accent/30' : 'bg-bg text-text-muted border border-border hover:border-text-muted'
                      }`}>{r}</button>
                  ))}
                </div>
              </div>
              <div>
                <label className="text-xs font-bold text-text-muted uppercase tracking-wider mb-2 block">Tier</label>
                <div className="grid grid-cols-3 gap-2">
                  {tiers.map(t => (
                    <button key={t} onClick={() => tierMutation.mutate({ userId: editingUser.id, tier: t })}
                      className={`py-2 rounded-lg text-xs font-bold capitalize transition-colors ${
                        editingUser.tier === t ? 'bg-accent/10 text-accent border border-accent/30' : 'bg-bg text-text-muted border border-border hover:border-text-muted'
                      }`}>{t}</button>
                  ))}
                </div>
              </div>
            </div>
            <button onClick={() => setEditingUser(null)}
              className="w-full mt-5 py-2 rounded-lg bg-bg text-text-muted text-sm font-medium hover:bg-surface-light transition-colors">
              Close
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
