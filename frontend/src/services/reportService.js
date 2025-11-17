import api from '../lib/api';

export const reportService = {
  async createReport(reportData) {
    const response = await api.post('/reports', reportData);
    return response.data;
  },

  async getReports(params = {}) {
    const response = await api.get('/reports', { params });
    return response.data;
  },

  async getReport(id) {
    const response = await api.get(`/reports/${id}`);
    return response.data;
  },

  async updateReportStatus(id, status, reviewNotes = '') {
    const response = await api.patch(`/reports/${id}/status`, { status, reviewNotes });
    return response.data;
  },

  async deleteReport(id) {
    const response = await api.delete(`/reports/${id}`);
    return response.data;
  }
};

export default reportService;
