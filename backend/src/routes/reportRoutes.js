import express from 'express';
import ReportController from '../controllers/ReportController.js';
import { authenticate, isAdmin } from '../middleware/auth.js';

const router = express.Router();

// User routes
router.post('/', authenticate, ReportController.createReport);

// Admin routes
router.get('/', authenticate, isAdmin, ReportController.getReports);
router.get('/:id', authenticate, isAdmin, ReportController.getReport);
router.patch('/:id/status', authenticate, isAdmin, ReportController.updateReportStatus);
router.delete('/:id', authenticate, isAdmin, ReportController.deleteReport);

export default router;
