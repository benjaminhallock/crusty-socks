import express from 'express';

import { GAME_STATE } from '../../shared/constants.js';
import { auth } from '../middleware/auth.js';
import Lobby from '../models/lobby.js';

const router = express.Router();

router.get('/all', auth, async (req, res) => {
  try {
    const lobbies = await Lobby.find({});
    res.status(200).json({ success: true, lobbies });
  } catch (error) {
    res.status(400).json({
      success: false,
      message: 'Failed to get lobbies'
    });
  }
});

router.post('/create', auth, async (req, res) => {
  try {
    const roomId = Math.random().toString(36).substring(2, 8);
    const lobby = new Lobby({
      roomId,
      roomLeader: req.user._id,
      gameState: GAME_STATE.WAITING, // Explicitly set gameState
      players: [],
      messages: [],
      canvasState: { pixels: [], lastUpdate: Date.now() },
      playerLimit: 8,
      revealCharacters: true,
      maxRounds: 3,
      selectWord: true,
      selectCategory: true
    });
    
    await lobby.save();
    res.status(201).json({ success: true, roomId, lobby });
  } catch (error) {
    console.error('Create lobby error:', error);
    res.status(400).json({
      success: false,
      message: 'Failed to create lobby'
    });
  }
});

router.get('/:roomId', auth, async (req, res) => {
  try {
    const lobby = await Lobby.findOne({ roomId: req.params.roomId });
    if (!lobby) {
      return res.status(404).json({
        success: false,
        message: 'Lobby not found'
      });
    }
    res.json({ success: true, lobby });
  } catch (error) {
    res.status(400).json({
      success: false,
      message: 'Failed to get lobby'
    });
  }
});

export default router;
