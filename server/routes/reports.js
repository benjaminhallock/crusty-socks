import express from 'express';
import { reportController as rs } from '../controllers/reportController.js';
import { auth, isAdmin } from '../middleware/auth.js';

const router = express.Router();

// Auth
router.post('/create', auth, rs.createReport);

// Admin
router.get('/all', auth, isAdmin, rs.getAllReports);
router.get('/:id', auth, isAdmin, rs.getReportById);
router.get('/user/:userId', auth, isAdmin, rs.getReportsByUserId);

router.put('/status/:id', auth, isAdmin, rs.updateReportStatus);
router.put('/:id', auth, isAdmin, rs.updateReport);

router.delete('/:id', auth, isAdmin, rs.deleteReport);

export default router;
