import express from 'express';

import { userController } from '../controllers/userController.js';
import { auth, authAdmin } from '../middleware/auth.js';

const router = express.Router();

// Public routes (no auth needed)
router.post('/register', userController.register);  // Create new account
router.post('/login', userController.login);        // Login to account

// Protected routes (need to be logged in)
router.get('/validate', auth, userController.validateToken);  // Check if token is valid

// Admin routes
router.get('/all', auth, authAdmin, userController.getAllUsers);  // Get list of all users (admin only)

export default router;