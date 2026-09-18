import api from './api';

export const adminService = {
  getDashboardStats: async () => {
    const res = await api.get('/admin/dashboard-stats');
    return res.data;
  },

  getReports: async (params = {}) => {
    const res = await api.get('/admin/reports', { params });
    return res.data;
  },

  getUsers: async (params = {}) => {
    const res = await api.get('/admin/users', { params });
    return res.data;
  },

  updateUserRole: async (userId, role) => {
    const res = await api.put(`/admin/users/${userId}/role`, { role });
    return res.data;
  },

  getAllReviews: async (params = {}) => {
    const res = await api.get('/admin/reviews', { params });
    return res.data;
  }
};
