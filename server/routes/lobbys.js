import express from 'express';

import { auth } from '../middleware/auth.js';
import { lobbyController } from '../controllers/lobbyController.js';

const router = express.Router();

// Get all lobbies
router.get('/all', auth, lobbyController.getAllLobbies);

// Create a new lobby
router.post('/create', auth, lobbyController.createLobby);

// Get lobby by ID
router.get('/:roomId', auth, lobbyController.getLobbyById);

export default router;
