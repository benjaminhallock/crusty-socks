import express from 'express';

import { reportController } from '../controllers/reportController.js';
import { auth, isAdmin } from '../middleware/auth.js';

const router = express.Router();

router.get('/all', auth, isAdmin, reportController.getAllReports);
router.get('/:id', auth, isAdmin, reportController.getReportById);
router.get('/user/:userId', auth, isAdmin, reportController.getReportsByUserId);

router.post('/create', auth, reportController.createReport);

router.put('/update/:id', auth, isAdmin, reportController.updateReportStatus);
router.put('/:id', auth, isAdmin, reportController.updateReport);

export default router;
