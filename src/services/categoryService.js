import api from './api';

export const categoryService = {
  async getCategories() {
    const res = await api.get('/api/categories');
    return res.data;
  },

  async getCategoryBySlug(slug) {
    const res = await api.get(`/api/categories/${slug}`);
    return res.data;
  }
};
