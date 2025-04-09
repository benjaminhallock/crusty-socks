import express from 'express';

import { userController } from '../controllers/userController.js';
import { auth, isAdmin } from '../middleware/auth.js';

const router = express.Router();

// Public routes (no auth needed)
router.post('/register', userController.register);
router.post('/login', userController.login);
router.get('/top', userController.getLeaderboard);

// Protected routes (need to be logged in)
router.get('/auth', auth, userController.validateToken); // Fallback endpoint

// Route for users to update their own profile
router.put('/update/:username', auth, userController.updateOwnProfile); // Update own profile

// Admin routes
router.get('/all', auth, isAdmin, userController.getAllUsers); // Get list of all users (admin only)
router.put('/:userId', auth, isAdmin, userController.updateUser); // Update any user (admin only)
// The username route needs to be last to avoid conflicts, otherwise it may lead to unexpected behavior
router.get('/:username', userController.getUserProfile);

export default router;
