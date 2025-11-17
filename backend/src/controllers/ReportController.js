import ReportService from '../services/ReportService.js';

class ReportController {
  async createReport(req, res, next) {
    try {
      const { post, reason, description } = req.body;

      if (!post || !reason) {
        return res.status(400).json({ message: 'Post and reason are required' });
      }

      const report = await ReportService.createReport({ post, reason, description }, req.user.id);

      res.status(201).json({
        message: 'Report submitted successfully',
        report
      });
    } catch (error) {
      next(error);
    }
  }

  async getReports(req, res, next) {
    try {
      const { status, reason, page = 1, limit = 20 } = req.query;

      const filters = {};
      if (status) filters.status = status;
      if (reason) filters.reason = reason;

      const options = {
        page: parseInt(page),
        limit: parseInt(limit)
      };

      const result = await ReportService.getReports(filters, options);
      res.json(result);
    } catch (error) {
      next(error);
    }
  }

  async getReport(req, res, next) {
    try {
      const report = await ReportService.getReportById(req.params.id);
      res.json({ report });
    } catch (error) {
      next(error);
    }
  }

  async updateReportStatus(req, res, next) {
    try {
      const { status, reviewNotes } = req.body;

      if (!status) {
        return res.status(400).json({ message: 'Status is required' });
      }

      const report = await ReportService.updateReportStatus(
        req.params.id,
        status,
        req.user.id,
        reviewNotes
      );

      res.json({
        message: 'Report status updated successfully',
        report
      });
    } catch (error) {
      next(error);
    }
  }

  async deleteReport(req, res, next) {
    try {
      const result = await ReportService.deleteReport(req.params.id);
      res.json(result);
    } catch (error) {
      next(error);
    }
  }
}

export default new ReportController();
