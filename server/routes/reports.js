import express from 'express';

import { auth, isAdmin } from '../middleware/auth.js';
import Report from '../models/report.js';

const router = express.Router();

// Don't use this unless you want to protect creating a report
// router.use(auth);
// router.use(isAdmin);

// Get all reports
router.get('/', auth, isAdmin, async (req, res) => {
  try {
    const reports = await Report.find().sort({ timestamp: -1 });
    res.json({ success: true, reports }); // Match the format of other endpoints
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// Create a new report
router.post('/', auth, async (req, res) => {
  try {
    const { reportedUser, reason, additionalComments, chatLogs, roomId } = req.body;
    
    if (!reportedUser) {
      return res.status(400).json({ 
        success: false, 
        message: 'Reported user is required' 
      });
    }
    
    if (!roomId) {
      return res.status(400).json({
        success: false,
        message: 'Room ID is required'
      });
    }
    
    const report = new Report({
      reportedUser,
      reportedBy: req.user.username,
      roomId,
      reason: reason || 'Inappropriate behavior',
      additionalComments: additionalComments || '',
      timestamp: Date.now(),
      chatLogs: chatLogs || [],
      status: 'pending'
    });
    
    await report.save();
    
    res.status(201).json({ 
      success: true, 
      report 
    });
  } catch (err) {
    console.error('Report creation error:', err);
    res.status(500).json({ 
      success: false, 
      message: err.message 
    });
  }
});

// Update report status
router.put('/:id/status', auth, isAdmin, async (req, res) => {
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

// Update an entire report
router.put('/:id', auth, isAdmin, async (req, res) => {
  try {
    const updates = req.body;
    const report = await Report.findByIdAndUpdate(
      req.params.id,
      updates,
      { new: true, runValidators: true }
    );
    
    if (!report) {
      return res.status(404).json({ 
        success: false, 
        message: 'Report not found' 
      });
    }
    
    res.status(200).json({ 
      success: true, 
      report 
    });
  } catch (err) {
    res.status(500).json({ 
      success: false, 
      message: err.message 
    });
  }
});

export default router;
