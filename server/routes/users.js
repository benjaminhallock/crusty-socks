import express from 'express';

import { userController } from '../controllers/userController.js';
import { auth, isAdmin } from '../middleware/auth.js';

const router = express.Router();

// Public routes (no auth needed)
router.post('/register', userController.register);  // Create new account
router.post('/login', userController.login);        // Login to account
router.get('/leaderboard', userController.getLeaderboard); // Get top players leaderboard
router.get('/:username', userController.getUserProfile); // Get user profile by username

// Protected routes (need to be logged in)
router.get('/validate', auth, userController.validateToken);  // Check if token is valid
router.put('/:username', auth, userController.updateUserProfile); // Update user profile

// Admin routes
router.get('/all', auth, isAdmin, userController.getAllUsers);  // Get list of all users (admin only)
router.put('/:userId', auth, isAdmin, userController.updateUser); // Update a user (admin only)

export default router;