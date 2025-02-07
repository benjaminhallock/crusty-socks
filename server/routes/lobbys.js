import express from 'express';
import { auth } from '../middleware/auth.js';
import Lobby from '../models/lobby.js';

const router = express.Router();

// Get all active lobbies
router.get('/all', auth, async (req, res) => {
  try {
    const lobbies = await Lobby.find({ isArchived: false });
    res.status(200).json({
      success: true,
      lobbies: lobbies
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      message: "Failed to get lobbies"
    });
  }
});

// Create a new game lobby
router.post('/create', auth, async (req, res) => {
  try {
    // Generate a random room ID
    const roomId = Math.random().toString(36).substring(2, 8);
    
    // Create new lobby with current user as leader
    const lobby = new Lobby({
      roomId,
      roomLeader: req.user._id,
      players: [{
        userId: req.user._id,
        username: req.user.username,
        score: 0
      }]
    });
    
    await lobby.save();
    
    res.json({
      success: true,
      roomId,
      lobby
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      message: "Failed to create lobby"
    });
  }
});

// Get a specific lobby by room ID
router.get('/:roomId', auth, async (req, res) => {
  try {
    const lobby = await Lobby.findOne({ roomId: req.params.roomId });
    if (!lobby) {
      return res.status(404).json({
        success: false,
        message: "Lobby not found"
      });
    }
    res.json({
      success: true,
      lobby
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      message: "Failed to get lobby"
    });
  }
});



export default router;
