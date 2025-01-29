import express from "express";
import { userController } from "../controllers/userController.js";
import { auth } from "../middleware/auth.js";
import User from "../models/user.js";

const router = express.Router();

//route to validate token
router.get("/validate", auth, async (req, res) => {
  try {
    // Get user from database to verify they exist
    const user = await User.findById(req.user.userId);
    if (!user) {
      return res.status(401).json({
        success: false,
        message: "User not found"
      });
    }

    return res.status(200).json({
      success: true,
      username: user.username
    });
  } catch (error) {
    console.error('Validation error:', error);
    return res.status(401).json({
      success: false,
      message: "Token validation failed"
    });
  }
});

//route to get all users - fix the path
router.get("/all", auth, async (req, res) => {
  try {
    const users = await User.find().select('-password -email');  // Exclude sensitive data
    res.status(200).json(users);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Register route
router.post("/register", userController.register);
// Login route
router.post("/login", userController.login);

export default router;
