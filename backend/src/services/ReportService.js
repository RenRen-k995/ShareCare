import ReportRepository from '../repositories/ReportRepository.js';
import PostRepository from '../repositories/PostRepository.js';

class ReportService {
  async createReport(reportData, reporterId) {
    // Verify post exists
    const post = await PostRepository.findById(reportData.post);
    if (!post) {
      throw new Error('Post not found');
    }

    // Check if user already reported this post
    const existingReports = await ReportRepository.findByPost(reportData.post);
    const alreadyReported = existingReports.some(
      report => report.reporter._id.toString() === reporterId
    );

    if (alreadyReported) {
      throw new Error('You have already reported this post');
    }

    const report = await ReportRepository.create({
      ...reportData,
      reporter: reporterId
    });

    return report;
  }

  async getReports(filters = {}, options = {}) {
    const query = {};

    if (filters.status) {
      query.status = filters.status;
    }

    if (filters.reason) {
      query.reason = filters.reason;
    }

    return await ReportRepository.findAll(query, options);
  }

  async getReportById(reportId) {
    const report = await ReportRepository.findById(reportId);
    if (!report) {
      throw new Error('Report not found');
    }
    return report;
  }

  async updateReportStatus(reportId, status, reviewerId, reviewNotes = '') {
    const report = await ReportRepository.findById(reportId);
    if (!report) {
      throw new Error('Report not found');
    }

    const updateData = {
      status,
      reviewedBy: reviewerId,
      reviewNotes
    };

    const updatedReport = await ReportRepository.update(reportId, updateData);
    return updatedReport;
  }

  async deleteReport(reportId) {
    const report = await ReportRepository.findById(reportId);
    if (!report) {
      throw new Error('Report not found');
    }

    await ReportRepository.delete(reportId);
    return { message: 'Report deleted successfully' };
  }
}

export default new ReportService();
