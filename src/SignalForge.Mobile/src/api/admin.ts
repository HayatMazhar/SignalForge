import api from './client';

export const adminApi = {
  getStats: () => api.get('/admin/stats').then((r) => r.data),
  getUsers: () => api.get('/admin/users').then((r) => r.data),
  assignRole: (userId: string, role: string) => api.put(`/admin/users/${userId}/role`, { role }),
  updateTier: (userId: string, tier: string) => api.put(`/admin/users/${userId}/tier`, { tier }),
  lockUser: (userId: string) => api.put(`/admin/users/${userId}/lock`),
  unlockUser: (userId: string) => api.put(`/admin/users/${userId}/unlock`),
  getRoles: () => api.get('/admin/roles').then((r) => r.data),
};
