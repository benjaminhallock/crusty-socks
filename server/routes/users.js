import express from 'express';

import { userController } from '../controllers/userController.js';
import { auth, isAdmin } from '../middleware/auth.js';

const router = express.Router();

// Public routes (no auth needed)
router.post('/register', userController.register);
router.post('/login', userController.login);
router.get('/top', userController.getLeaderboard);

// Protected routes (need to be logged in)
router.get('/auth', auth, userController.validateUser); // Validate user
router.put('/update/:username', auth, userController.updateOwnProfile); // Update own
router.put('/:userId', auth, userController.updateProfileById); // Update own profile by

// Public route to get basic user profile
router.get('/:username', userController.getUserByUsername);

// Admin routes
router.get('/all', auth, isAdmin, userController.getAllUsers); // Get list of all user
router.put('/:userId', auth, isAdmin, userController.updateUser); // Update any user

export default router;
