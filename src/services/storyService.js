import api, { apiUrl } from './api';

export const storyService = {
  async getStories(params = {}, options = {}) {
    const res = await api.get('/api/stories', { ...options, params });
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

  async getStoryById(id) {
    const res = await api.get('/api/stories/id/' + id);
    return res.data;
  },

  getPreviewPdfUrl(id) {
    return apiUrl(`/api/stories/${id}/preview`);
  },

  getFullPdfUrl(id) {
    return apiUrl(`/api/stories/${id}/full-content`);
  }
};
