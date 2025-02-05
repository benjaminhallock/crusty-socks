import express from "express";
import { auth } from "../middleware/auth.js";
import Lobby from "../models/lobby.js";

const router = express.Router();

// lobby/create
router.post("/create", auth, async (req, res) => {
  try {
    const { username } = req.body;
    
    if (!req.user || !req.user._id) {
      return res.status(401).json({
        success: false,
        message: "User not authenticated properly",
      });
    }

    const lobbyId = Math.random().toString(36).substring(2, 8);
    const lobby = new Lobby({
      roomId: lobbyId,
      roomLeader: req.user._id,
      users: [{
        userId: req.user._id,
        username: req.user.username,
        isReady: false,
        score: 0,
        isOnline: true
      }]
    });

    const savedLobby = await lobby.save();
    
    // Emit lobby creation event
    req.app.get('io').emit('lobbyCreated', {
      lobbyId,
      users: savedLobby.users
    });

    return res.status(201).json({
      success: true,
      roomId: lobbyId,
      lobby: savedLobby
    });
  } catch (error) {
    console.error("[SERVER] Error creating lobby:", error);
    return res.status(500).json({
      success: false,
      message: error.message || "Failed to create lobby",
    });
  }
});

// Get specific lobby
router.get("/:lobbyId", async (req, res) => {
  try {
    Lobby.findById(req.params.lobbyId, (err, lobby) => {
      if (err) {
        return res.status(404).json({
          success: false,
          message: "Lobby not found",
        });
      }
      res.status(200).json({
        success: true,
        lobby,
      });
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Failed to get lobby",
    });
  }
});

// Update lobby settings
router.patch("/:lobbyId/settings", auth, async (req, res) => {
  try {
    const { settings } = req.body;
    const lobby = await Lobby.findOne({ roomId: req.params.lobbyId });
    
    if (!lobby) {
      return res.status(404).json({
        success: false,
        message: "Lobby not found"
      });
    }

    if (lobby.roomLeader.toString() !== req.user._id.toString()) {
      return res.status(403).json({
        success: false,
        message: "Only the room leader can update settings"
      });
    }

    Object.assign(lobby, { settings });
    await lobby.save();

    // Emit update to all users in the room
    req.app.get('io').to(req.params.lobbyId).emit('lobbyUpdate', {
      settings: lobby.settings
    });

    res.json({
      success: true,
      lobby
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Failed to update lobby settings"
    });
  }
});

export default router;
