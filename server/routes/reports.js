import express from 'express';

import { reportController } from '../controllers/reportController.js';
import { auth, isAdmin } from '../middleware/auth.js';

const router = express.Router();

// Get all reports (admin only)
router.get('/all', auth, isAdmin, reportController.getAllReports);

// Create a new report
router.post('/create', auth, reportController.createReport);

// Update report status
router.put('/status/:id', auth, isAdmin, reportController.updateReportStatus);

// Update an entire report
router.put('/:id', auth, isAdmin, reportController.updateReport);

export default router;
