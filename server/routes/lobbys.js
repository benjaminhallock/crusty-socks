import express from 'express';

import { lobbyController } from '../controllers/lobbyController.js';
import { auth, isAdmin } from '../middleware/auth.js';

const router = express.Router();

// Get all lobbies
router.get('/all', auth, isAdmin, lobbyController.getAllLobbies);

// Create a new lobby
router.post('/create', auth, lobbyController.createLobby);

// Get lobby by ID
router.get('/:roomId', auth, lobbyController.getLobbyById);

// Update a lobby (admin only)
router.put('/:lobbyId', auth, isAdmin, lobbyController.updateLobby);

export default router;
