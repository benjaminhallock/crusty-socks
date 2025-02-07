import express from 'express';
import { userController } from '../controllers/userController.js';
import { auth } from '../middleware/auth.js';
import { admin } from '../middleware/admin.js';

const router = express.Router();

// Public routes (no auth needed)
router.post('/register', userController.register);  // Create new account
router.post('/login', userController.login);        // Login to account

// Protected routes (need to be logged in)
router.get('/validate', auth, userController.validateToken);  // Check if token is valid

// TODO: Add admin middleware to routes that require it
router.get('/all', auth, userController.getAllUsers);  // Get list of all users

export default router;
