import api from './api';

export const adminService = {
  async getDashboard() {
    const res = await api.get('/api/admin/dashboard');
    return res.data;
  },

  // Stories
  async getStories(params = {}) {
    const res = await api.get('/api/stories', { params });
    return res.data;
  },

  async createStory(formData) {
    const res = await api.post('/api/stories', formData, {
      headers: { 'Content-Type': 'multipart/form-data' }
    });
    return res.data;
  },

  async updateStory(id, formData) {
    const res = await api.put(`/api/stories/${id}`, formData, {
      headers: { 'Content-Type': 'multipart/form-data' }
    });
    return res.data;
  },

  async deleteStory(id) {
    const res = await api.delete(`/api/stories/${id}`);
    return res.data;
  },

  // Categories
  async getCategories() {
    const res = await api.get('/api/categories');
    return res.data;
  },

  async createCategory(formData) {
    const res = await api.post('/api/categories', formData, {
      headers: { 'Content-Type': 'multipart/form-data' }
    });
    return res.data;
  },

  async updateCategory(id, formData) {
    const res = await api.put(`/api/categories/${id}`, formData, {
      headers: { 'Content-Type': 'multipart/form-data' }
    });
    return res.data;
  },

  async deleteCategory(id) {
    const res = await api.delete(`/api/categories/${id}`);
    return res.data;
  },

  // Payments Review
  async getPayments(params = {}) {
    const res = await api.get('/api/payments/admin/all', { params });
    return res.data;
  },

  async approvePayment(id) {
    const res = await api.patch(`/api/payments/admin/${id}/approve`);
    return res.data;
  },

  async rejectPayment(id, reason) {
    const res = await api.patch(`/api/payments/admin/${id}/reject`, { reason });
    return res.data;
  },

  // Payment Settings
  async updatePaymentSetting(method, formData) {
    const res = await api.put(`/api/payments/admin/settings/${method}`, formData, {
      headers: { 'Content-Type': 'multipart/form-data' }
    });
    return res.data;
  },

  // Users
  async getUsers(params = {}) {
    const res = await api.get('/api/users/admin/all', { params });
    return res.data;
  },

  async toggleUserStatus(id) {
    const res = await api.patch(`/api/users/admin/${id}/status`);
    return res.data;
  }
};
