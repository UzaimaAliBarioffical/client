import api from './api';

export const authService = {
  async register(userData) {
    const res = await api.post('/api/auth/register', userData);
    return res.data;
  },

  async login(credentials) {
    const res = await api.post('/api/auth/login', credentials);
    return res.data;
  },

  async logout() {
    const res = await api.post('/api/auth/logout');
    return res.data;
  },

  async getMe() {
    const res = await api.get('/api/auth/me');
    return res.data;
  }
};
