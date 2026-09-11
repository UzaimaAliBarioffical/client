import api from './api';

export const storyService = {
  async getStories(params = {}) {
    const res = await api.get('/api/stories', { params });
    return res.data;
  },

  async getFeaturedStories() {
    const res = await api.get('/api/stories/featured');
    return res.data;
  },

  async getStoryBySlug(slug) {
    const res = await api.get(`/api/stories/${slug}`);
    return res.data;
  },

  async checkStoryAccess(id) {
    const res = await api.get(`/api/stories/${id}/access`);
    return res.data;
  },

  getPreviewPdfUrl(id) {
    const base = import.meta.env.VITE_API_URL || '';
    return `${base}/api/stories/${id}/preview`;
  },

  getFullPdfUrl(id) {
    const base = import.meta.env.VITE_API_URL || '';
    return `${base}/api/stories/${id}/full-content`;
  }
};
