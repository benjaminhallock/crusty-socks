import express from "express";
import { auth } from "../middleware/auth.js";
import Lobby from "../models/lobby.js";

const router = express.Router();

// lobby/create
router.post("/create", auth, async (req, res) => {
  try {
    const { username } = req.body;
    console.log("[SERVER] Creating lobby for user:", req.user);
    
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
      users: [req.user._id],
    });

    console.log("[SERVER] Attempting to save lobby:", lobby);
    const savedLobby = await lobby.save();
    console.log("[SERVER] Saved lobby result:", savedLobby);

    return res.status(201).json({
      success: true,
      roomId: lobbyId,
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

export default router;
