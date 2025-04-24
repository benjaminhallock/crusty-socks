import express from 'express';
import { chatController as ct } from '../controllers/chatController.js';
import { auth, isAdmin } from '../middleware/auth.js';
import { API_ENDPOINTS_BACKEND as as } from '../constants.js';

const router = express.Router();

// Must be at top of the file to catch all routes
router.get(as.CHAT_ALL, auth, isAdmin, ct.getAllChats);

// Admin
router.get(as.CHAT_BY_ID, auth, isAdmin, ct.getChatById);
router.get(as.CHAT_BY_LOBBY, auth, isAdmin, ct.getChatByLobbyId);
router.get(as.CHAT_BY_USER_IN_LOBBY, auth, isAdmin, ct.getChatByUserInLobbyId);
router.get(as.CHAT_BY_USER, auth, isAdmin, ct.getChatByUserId);

export default router;
