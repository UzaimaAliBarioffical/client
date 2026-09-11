import api from './api';

export const paymentService = {
  async getPaymentMethods() {
    const res = await api.get('/api/payments/methods');
    return res.data;
  },

  async submitPayment(formData) {
    const res = await api.post('/api/payments', formData, {
      headers: {
        'Content-Type': 'multipart/form-data'
      }
    });
    return res.data;
  },

  async getPaymentById(id) {
    const res = await api.get(`/api/payments/${id}`);
    return res.data;
  },

  async getUserPayments() {
    const res = await api.get('/api/users/me/payments');
    return res.data;
  },

  async getUserLibrary() {
    const res = await api.get('/api/users/me/library');
    return res.data;
  }
};
