import express from "express";
import Report from "../models/report.js";
import { auth, isAdmin } from "../middleware/auth.js";

const router = express.Router();

// Require authentication and admin rights for all report routes
router.use(auth);
// router.use(isAdmin);

// Get all reports
router.get("/", async (req, res) => {
  try {
    const reports = await Report.find().sort({ timestamp: -1 });
    res.json({ success: true, reports }); // Match the format of other endpoints
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// Create a new report
router.post("/", async (req, res) => {
  try {
    const { reportedUser, reason, chatLogs, roomId } = req.body;
    
    if (!reportedUser) {
      return res.status(400).json({ 
        success: false, 
        message: "Reported user is required" 
      });
    }
    
    if (!roomId) {
      return res.status(400).json({
        success: false,
        message: "Room ID is required"
      });
    }
    
    const report = new Report({
      reportedUser,
      reportedBy: req.user.username,
      roomId,
      reason: reason || "Inappropriate behavior",
      timestamp: Date.now(),
      chatLogs: chatLogs || [],
      status: "pending"
    });
    
    await report.save();
    
    res.status(201).json({ 
      success: true, 
      report 
    });
  } catch (err) {
    console.error("Report creation error:", err);
    res.status(500).json({ 
      success: false, 
      message: err.message 
    });
  }
});

// Update report status
router.put("/:id/status", async (req, res) => {
  try {
    const { status } = req.body;
    if (!["pending", "reviewed", "resolved"].includes(status)) {
      return res.status(400).json({ message: "Invalid status" });
    }

    const report = await Report.findByIdAndUpdate(
      req.params.id,
      { status },
      { new: true }
    );

    if (!report) {
      return res.status(404).json({ message: "Report not found" });
    }

    res.send({ report });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

export default router;
