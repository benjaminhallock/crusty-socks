import express from 'express';
import Report from '../models/report.js';
import { authenticateToken, isAdmin } from '../middleware/auth.js';

const router = express.Router();

// Require authentication and admin rights for all report routes
router.use(authenticateToken);
router.use(isAdmin);

// Get all reports
router.get('/', async (req, res) => {
  try {
    const reports = await Report.find().sort({ timestamp: -1 });
    res.json({ success: true, reports }); // Match the format of other endpoints
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// Update report status
router.put('/:id/status', async (req, res) => {
  try {
    const { status } = req.body;
    if (!['pending', 'reviewed', 'resolved'].includes(status)) {
      return res.status(400).json({ message: 'Invalid status' });
    }

    const report = await Report.findByIdAndUpdate(
      req.params.id, 
      { status }, 
      { new: true }
    );
    
    if (!report) {
      return res.status(404).json({ message: 'Report not found' });
    }
    
    res.send({ report });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

export default router;
