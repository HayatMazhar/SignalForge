import api from './client';

export interface SystemStats {
  totalUsers: number;
  totalStocks: number;
  totalSignals: number;
  totalAlerts: number;
  totalWatchlist: number;
  totalPortfolio: number;
  signalsToday: number;
  tierBreakdown: { tier: string; count: number }[];
  serverTime: string;
}

export interface AdminUser {
  id: string;
  email: string;
  fullName: string;
  tier: string;
  roles: string[];
  emailConfirmed: boolean;
  lockoutEnd: string | null;
  isLocked: boolean;
  createdAt: string;
}

export interface AdminRole {
  id: string;
  name: string;
  userCount: number;
  permissions: Record<string, boolean>;
}

export const adminApi = {
  getStats: () => api.get<SystemStats>('/admin/stats').then(r => r.data),
  getUsers: () => api.get<AdminUser[]>('/admin/users').then(r => r.data),
  assignRole: (userId: string, role: string) => api.put(`/admin/users/${userId}/role`, { role }),
  updateTier: (userId: string, tier: string) => api.put(`/admin/users/${userId}/tier`, { tier }),
  lockUser: (userId: string) => api.put(`/admin/users/${userId}/lock`),
  unlockUser: (userId: string) => api.put(`/admin/users/${userId}/unlock`),
  getRoles: () => api.get<AdminRole[]>('/admin/roles').then(r => r.data),
  createRole: (name: string) => api.post('/admin/roles', { name }),
  deleteRole: (name: string) => api.delete(`/admin/roles/${name}`),
};
