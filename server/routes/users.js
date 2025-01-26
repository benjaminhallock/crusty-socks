import express from "express";
import { userController } from "../controllers/userController.js";
import { auth } from "../middleware/auth.js";
import User from "../models/user.js";

const router = express.Router();

// Check user existence
router.post("/check/:id", async (req, res) => {
  try {
    console.log('Checking username:', req.params.id);
    
    if (!req.params.id || req.params.id.length < 3) {
      console.log('Invalid username - too short');
      return res.status(400).json({ message: "Invalid username" });
    }
    
    const user = await User.findByUsername(req.params.id);
    console.log('User found:', !!user);
    
    return res.status(200).json({ found: !!user });
  } catch (err) {
    console.error('Error checking username:', err);
    return res.status(500).json({ message: "Server error while checking username" });
  }
});

// Register route
router.post("/register", userController.register);

// Login route
router.post("/login", userController.login);
// Logout route - should be handled on client side
router.post("/logout", (_req, res) => {
  res.status(200).json({ message: "Logged out successfully" });
  res.clearCookie("token");
  res.redirect("/");
});

// Profile routes
router.get("/profile", auth, userController.getProfile);
router.patch("/profile", auth, userController.updateProfile);

// Report user route
router.post("/report", auth, userController.reportUser);

export default router;
