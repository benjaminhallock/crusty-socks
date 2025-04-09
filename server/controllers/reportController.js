import Report from '../models/report.js';

export const reportController = {
  // Get all reports (admin only)
  getAllReports: async (req, res) => {
    try {
      const reports = await Report.find().sort({ timestamp: -1 });
      res.json({ success: true, reports });
    } catch (err) {
      res.status(500).json({ success: false, message: err.message });
    }
  },

  // Create a new report
  createReport: async (req, res) => {
    try {
      const { reportedUser, reason, additionalComments, chatLogs, roomId } = req.body;

      if (!reportedUser) {
        return res.status(400).json({
          success: false,
          message: 'Reported user is required',
        });
      }

      if (!roomId) {
        return res.status(400).json({
          success: false,
          message: 'Room ID is required',
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
        status: 'pending',
      });

      await report.save();

      res.status(201).json({
        success: true,
        report,
      });
    } catch (err) {
      console.error('Report creation error:', err);
      res.status(500).json({
        success: false,
        message: err.message,
      });
    }
  },

  // Update report status
  updateReportStatus: async (req, res) => {
    try {
      const { status } = req.body;
      if (!['pending', 'reviewed', 'resolved'].includes(status)) {
        return res.status(400).json({ 
          success: false,
          message: 'Invalid status' 
        });
      }

      const report = await Report.findByIdAndUpdate(
        req.params.id,
        { status },
        { new: true }
      );

      if (!report) {
        return res.status(404).json({ 
          success: false,
          message: 'Report not found' 
        });
      }

      res.json({ success: true, report });
    } catch (err) {
      res.status(500).json({ 
        success: false,
        message: err.message 
      });
    }
  },

  // Update an entire report
  updateReport: async (req, res) => {
    try {
      const updates = req.body;
      const report = await Report.findByIdAndUpdate(req.params.id, updates, {
        new: true,
        runValidators: true,
      });

      if (!report) {
        return res.status(404).json({
          success: false,
          message: 'Report not found',
        });
      }

      res.status(200).json({
        success: true,
        report,
      });
    } catch (err) {
      res.status(500).json({
        success: false,
        message: err.message,
      });
    }
  }
};
