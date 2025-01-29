import User from "../models/user.js";
import jwt from "jsonwebtoken";

export const userController = {
  // Register new user
  register: async (req, res) => {
    try {
      const { username, email, password } = req.body;

      // Validate required fields
      if (!username || !email || !password) {
        return res.status(400).json({ error: "All fields are required" });
      }

      // Validate username format
      if (username.length < 3 || username.length > 20) {
        return res
          .status(400)
          .json({ error: "Username must be between 3 and 20 characters" });
      }

      // Validate email format
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(email)) {
        return res.status(400).json({ error: "Invalid email format" });
      }

      // Validate password strength
      if (password.length < 6) {
        return res
          .status(400)
          .json({ error: "Password must be at least 8 characters" });
      }

      const passwordRegex = /^(?=.*[A-Za-z])(?=.*\d)[A-Za-z\d]{8,}$/;
      if (!passwordRegex.test(password)) {
        return res.status(400).json({
          error: "Password must contain at least one letter and one number",
        });
      }

      // Check for existing email and username
      const existingEmail = await User.findByEmail(email);
      if (existingEmail) {
        return res.status(400).json({ error: "Email already in use" });
      }

      const existingUsername = await User.findByUsername(username);
      if (existingUsername) {
        return res.status(400).json({ error: "Username already taken" });
      }

      // Create new user
      const user = new User({
        username,
        email,
        password,
      });

      await user.save();

      // Generate JWT token
      const token = jwt.sign({ userId: user._id }, process.env.JWT_SECRET, {
        expiresIn: "24h",
      });

      // Return success response with token
      return res.status(201).json({
        success: true,
        username: user.username,
        token: token,
      });
    } catch (error) {
      return res.status(400).json({
        success: false,
        error: error.message,
      });
    }
  },

  // Login user
  login: async (req, res) => {
    try {
      const { email, password } = req.body;

      // Validate required fields
      if (!email || !password) {
        return res
          .status(400)
          .json({ error: "Email and password are required" });
      }

      const user = await User.findByCredentials(email, password);
      if (!user) {
        return res.status(401).json({
          success: false,
          error: "Invalid login credentials",
        });
      }

      const token = jwt.sign({ userId: user._id }, process.env.JWT_SECRET, {
        expiresIn: "24h",
      });

      return res.status(200).json({
        success: true,
        username: user.username,
        token: token,
      });
    } catch (error) {
      if (process.env.NODE_ENV === "development") {
        console.error("Login error:", error.message);
      }
      return res.status(401).json({
        success: false,
        error: "Invalid login credentials",
      });
    }
  },

  logout: async (req, res) => {
    try {
      // Clear user's token (blacklist/invalidate if needed)
      // Here you would typically add the token to a blacklist
      // For now, we'll just return a success response
      return res.status(200).json({
        success: true,
        message: "Successfully logged out",
      });
    } catch (error) {
      return res.status(500).json({
        success: false,
        error: "Error logging out",
      });
    }
  },
  // Get user profile
  getProfile: async (req, res) => {
    try {
      const user = await User.findById(req.user.userId);
      if (!user) {
        return res.status(404).json({ error: "User not found" });
      }
      return res.status(200).json({
        success: true,
        data: {
          username: user.username,
          email: user.email,
        },
      });
    } catch (error) {
      return res.status(500).json({
        success: false,
        error: "Error fetching profile",
      });
    }
  },

  // Update user profile
  updateProfile: async (req, res) => {
    try {
      const updates = Object.keys(req.body);
      const allowedUpdates = ["username", "email"];
      const isValidOperation = updates.every((update) =>
        allowedUpdates.includes(update)
      );

      if (!isValidOperation) {
        return res.status(400).json({ error: "Invalid updates" });
      }

      const user = await User.findById(req.user.userId);
      if (!user) {
        return res.status(404).json({ error: "User not found" });
      }

      updates.forEach((update) => (user[update] = req.body[update]));
      await user.save();

      return res.status(200).json({
        success: true,
        data: {
          username: user.username,
          email: user.email,
        },
      });
    } catch (error) {
      return res.status(400).json({
        success: false,
        error: error.message,
      });
    }
  },
};
