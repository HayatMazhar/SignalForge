import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Shield, Plus, Trash2, Check, X, Users } from 'lucide-react';
import { adminApi, type AdminRole } from '../../api/admin';
import LoadingSpinner from '../../components/common/LoadingSpinner';

const permissionLabels: Record<string, { label: string; description: string }> = {
  ManageUsers: { label: 'Manage Users', description: 'Create, edit, lock/unlock user accounts' },
  ManageRoles: { label: 'Manage Roles', description: 'Create, edit, delete roles and permissions' },
  ManageSystem: { label: 'System Config', description: 'Access system configuration and API keys' },
  ViewAllData: { label: 'View All Data', description: 'View all users data, signals, and analytics' },
  GenerateSignals: { label: 'Generate Signals', description: 'Trigger AI signal generation on demand' },
  ManageAlerts: { label: 'Manage Alerts', description: 'Create and manage price/signal alerts' },
  AccessOptionsFlow: { label: 'Options Flow', description: 'Access unusual options flow data' },
  ViewAnalytics: { label: 'View Analytics', description: 'Access admin analytics and dashboards' },
  ManageApiKeys: { label: 'API Keys', description: 'View and manage external API keys' },
};

export default function RoleManagement() {
  const [newRole, setNewRole] = useState('');
  const [showCreate, setShowCreate] = useState(false);
  const queryClient = useQueryClient();

  const { data: roles, isLoading } = useQuery({ queryKey: ['admin-roles'], queryFn: adminApi.getRoles });

  const createMutation = useMutation({
    mutationFn: () => adminApi.createRole(newRole),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['admin-roles'] }); setNewRole(''); setShowCreate(false); },
  });

  const deleteMutation = useMutation({
    mutationFn: (name: string) => adminApi.deleteRole(name),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['admin-roles'] }),
  });

  if (isLoading) return <LoadingSpinner text="Loading roles..." />;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-warning/10 flex items-center justify-center">
            <Shield className="w-6 h-6 text-warning" />
          </div>
          <div>
            <h1 className="text-2xl font-black text-text-primary">Roles & Permissions</h1>
            <p className="text-xs text-text-muted">{roles?.length ?? 0} roles configured</p>
          </div>
        </div>
        <button onClick={() => setShowCreate(!showCreate)}
          className="px-4 py-2 rounded-lg bg-accent text-bg text-sm font-bold flex items-center gap-1 hover:bg-accent-dim btn-shine">
          {showCreate ? <X className="w-4 h-4" /> : <Plus className="w-4 h-4" />}
          {showCreate ? 'Cancel' : 'New Role'}
        </button>
      </div>

      {showCreate && (
        <div className="bg-surface border border-border rounded-xl p-5 animate-fade-up">
          <div className="flex gap-3">
            <input value={newRole} onChange={(e) => setNewRole(e.target.value)} placeholder="Role name..."
              className="flex-1 bg-bg border border-border rounded-lg px-4 py-2 text-sm text-text-primary placeholder-text-muted/50 focus:outline-none focus:border-accent/40" />
            <button onClick={() => createMutation.mutate()} disabled={!newRole.trim()}
              className="px-5 py-2 rounded-lg bg-accent text-bg text-sm font-bold disabled:opacity-50 hover:bg-accent-dim">
              Create
            </button>
          </div>
        </div>
      )}

      {/* Role Cards */}
      <div className="space-y-4">
        {roles?.map((role) => (
          <RoleCard key={role.id} role={role} onDelete={() => deleteMutation.mutate(role.name)} />
        ))}
      </div>
    </div>
  );
}

function RoleCard({ role, onDelete }: { role: AdminRole; onDelete: () => void }) {
  const [expanded, setExpanded] = useState(false);
  const isSystem = role.name === 'Admin' || role.name === 'User';
  const roleColors: Record<string, string> = { Admin: 'border-danger/30', Moderator: 'border-warning/30', Analyst: 'border-info/30', User: 'border-border' };

  return (
    <div className={`bg-surface border ${roleColors[role.name] ?? 'border-border'} rounded-xl overflow-hidden card-hover`}>
      <div className="p-5">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-3">
            <div className={`w-9 h-9 rounded-lg flex items-center justify-center ${
              role.name === 'Admin' ? 'bg-danger/10' : role.name === 'Moderator' ? 'bg-warning/10' : role.name === 'Analyst' ? 'bg-info/10' : 'bg-surface-light'
            }`}>
              <Shield className={`w-5 h-5 ${
                role.name === 'Admin' ? 'text-danger' : role.name === 'Moderator' ? 'text-warning' : role.name === 'Analyst' ? 'text-info' : 'text-text-muted'
              }`} />
            </div>
            <div>
              <h3 className="text-base font-black text-text-primary">{role.name}</h3>
              <div className="flex items-center gap-1 text-[10px] text-text-muted">
                <Users className="w-3 h-3" />
                {role.userCount} user{role.userCount !== 1 ? 's' : ''}
              </div>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button onClick={() => setExpanded(!expanded)}
              className="text-xs text-text-muted hover:text-text-primary transition-colors px-3 py-1 rounded-lg hover:bg-bg">
              {expanded ? 'Hide' : 'Permissions'}
            </button>
            {!isSystem && (
              <button onClick={onDelete} className="p-1.5 rounded-lg text-text-muted hover:text-danger hover:bg-danger/10 transition-colors">
                <Trash2 className="w-4 h-4" />
              </button>
            )}
          </div>
        </div>

        {expanded && (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-2 mt-4 pt-4 border-t border-border animate-fade-up">
            {Object.entries(role.permissions).map(([key, value]) => {
              const config = permissionLabels[key];
              if (!config) return null;
              return (
                <div key={key} className={`flex items-start gap-2 p-2.5 rounded-lg ${value ? 'bg-accent/5' : 'bg-bg'}`}>
                  <div className={`w-4 h-4 rounded flex items-center justify-center flex-shrink-0 mt-0.5 ${
                    value ? 'bg-accent/20 text-accent' : 'bg-border text-text-muted'
                  }`}>
                    {value ? <Check className="w-3 h-3" /> : <X className="w-3 h-3" />}
                  </div>
                  <div>
                    <div className={`text-xs font-semibold ${value ? 'text-text-primary' : 'text-text-muted'}`}>{config.label}</div>
                    <div className="text-[9px] text-text-muted">{config.description}</div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
