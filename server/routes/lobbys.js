import express from 'express';
import { lobbyController } from '../controllers/lobbyController.js';
import { auth, isAdmin } from '../middleware/auth.js';

const router = express.Router();
// Auth
router.post('/:id', auth, lobbyController.createLobby);
router.post('/:id/leave', auth, lobbyController.leaveLobby);
router.get('/:id', auth, lobbyController.getLobbyById);

// Admin
router.get('/all', auth, isAdmin, lobbyController.getAllLobbies);
router.put('/:id', auth, isAdmin, lobbyController.updateLobby);
router.delete('/:id', auth, isAdmin, lobbyController.deleteLobby);
router.get('/:id', auth, isAdmin, lobbyController.getLobbyById);

export default router;
