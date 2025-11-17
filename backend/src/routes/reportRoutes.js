import express from 'express';
import ReportController from '../controllers/ReportController.js';
import { authenticate, isAdmin } from '../middleware/auth.js';
import { apiLimiter, reportLimiter } from '../middleware/rateLimiter.js';

const router = express.Router();

// User routes
router.post('/', reportLimiter, authenticate, ReportController.createReport);

// Admin routes
router.get('/', apiLimiter, authenticate, isAdmin, ReportController.getReports);
router.get('/:id', apiLimiter, authenticate, isAdmin, ReportController.getReport);
router.patch('/:id/status', apiLimiter, authenticate, isAdmin, ReportController.updateReportStatus);
router.delete('/:id', apiLimiter, authenticate, isAdmin, ReportController.deleteReport);

export default router;
