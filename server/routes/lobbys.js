import express from "express";
import { auth } from "../middleware/auth.js";
import Lobby from "../models/lobby.js";

const router = express.Router();

router.post("/create", auth, async (req, res) => {
  try {
    console.log(
      "Creating lobby with user:",
      req.user,
      "id: ",
      req.user._id,
      "and other id: ",
      req._id
    );

    if (!req.user || !req.user._id) {
      return res.status(401).json({
        success: false,
        message: "User not authenticated properly",
      });
    }

    const roomId = Math.random().toString(36).substring(2, 8);
    const lobby = new Lobby({
      roomId: roomId,
      roomLeader: req.user._id,
      players: [
        {
          userId: req.user._id,
          username: req.user.username,
          score: 100,
        },
      ],
      gameState: "waiting",
      settings: {
        maxPlayers: 8,
        rounds: 3,
        customWords: [],
      },
    });

    const savedLobby = await lobby.save();

    console.log("Lobby created:", savedLobby);

    return res.status(201).json({
      success: true,
      roomId: roomId,
      lobby: savedLobby,
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
router.get("/:lobbyId", auth, async (req, res) => {
  try {
    const lobby = await Lobby.findOne({ roomId: req.params.lobbyId });
    if (!lobby) {
      return res.status(404).json({
        success: false,
        message: "Lobby not found",
      });
    }

    console.log("Lobby found id: ", lobby.roomId);

    res.status(200).json({
      success: true,
      lobby: {
        ...lobby.toObject(),
        players: lobby.players,
        gameState: lobby.gameState,
      },
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Failed to get lobby",
    });
  }
});

// Update lobby settings
router.patch("/:lobbyId/", auth, async (req, res) => {
  try {
    const { settings } = req.body;
    const lobby = await Lobby.findOne({ roomId: req.params.lobbyId });
    if (!lobby) {
      return res.status(404).json({
        success: false,
        message: "Lobby not found",
      });
    }

    if (lobby.roomLeader.toString() !== req.user._id.toString()) {
      return res.status(403).json({
        success: false,
        message: "Only the room leader can update settings",
      });
    }

    Object.assign(lobby, { settings });
    await lobby.save();

    // Emit update to all users in the room
    req.app.get("io").to(req.params.lobbyId).emit("lobbyUpdate", {
      settings: lobby.settings,
    });

    res.json({
      success: true,
      lobby,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Failed to update lobby settings",
    });
  }
});

export default router;
