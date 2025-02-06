import User from "../models/user.js";
import jwt from "jsonwebtoken";
import dotenv from "dotenv";

dotenv.config("/config.env");

export const userController = {
  validateToken: async (req, res) => {
    try {
      console.log(
        "Validating token for user:",
        req.user + "id: " + req.user._id + "and other id: " + req._id
      );
      return res.status(200).json({
        success: true,
        user: req.user,
        token: req.token,
        _id: req.user._id,
      });
    } catch (error) {
      console.error("Validation error:", error);
      return res.status(401).json({
        success: false,
        message: "Token validation failed",
      });
    }
  },

  register: async (req, res) => {
    try {
      const { username, email, password } = req.body;

      // Validate required fields
      if (!username || !email || !password) {
        return res.status(400).json({
          success: false,
          message: "All fields are required",
        });
      }

      // Validate username format
      if (username.length < 3 || username.length > 20) {
        return res.status(400).json({
          success: false,
          message: "Username must be between 3 and 20 characters",
        });
      }

      // Validate email format
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(email)) {
        return res.status(400).json({
          success: false,
          message: "Invalid email format",
        });
      }
      if (password.length < 8)
        return res.status(400).json({
          success: false,
          message: "Password must be at least 8 characters long",
        });
      if (!/[A-Z]/.test(password))
        return res.status(400).json({
          success: false,
          message: "Password must contain at least one uppercase letter",
        });
      if (!/[a-z]/.test(password))
        return res.status(400).json({
          success: false,
          message: "Password must contain at least one lowercase letter",
        });
      if (!/[0-9]/.test(password))
        return res.status(400).json({
          success: false,
          message: "Password must contain at least one number",
        });

      // Check for existing email and username
      const existingEmail = await User.findByEmail(email);
      if (existingEmail) {
        return res.status(400).json({
          success: false,
          message: "Email already in use",
        });
      }

      const existingUsername = await User.findByUsername(username);
      if (existingUsername) {
        return res.status(400).json({
          success: false,
          message: "Username already taken",
        });
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
        message: "User registered successfully",
        username: user.username,
        token: token,
        _id: user._id,
        user: user,
      });
    } catch (error) {
      return res.status(400).json({
        success: false,
        message: error.message,
      });
    }
  },

  login: async (req, res) => {
    try {
      const { email, password } = req.body;

      // Validate required fields
      if (!email || !password) {
        return res.status(400).json({
          success: false,
          message: "Email and password are required",
        });
      }

      const user = await User.findByCredentials(email, password);
      if (!user) {
        return res.status(401).json({
          success: false,
          message: "Invalid login credentials",
        });
      }

      const token = jwt.sign({ userId: user._id }, process.env.JWT_SECRET, {
        expiresIn: "24h",
      });

      return res.status(200).json({
        success: true,
        message: "Login successful",
        username: user.username,
        _id: user._id,
        user: user,
        token: token,
      });
    } catch (error) {
      console.error("Login error:", error.message);
      return res.status(401).json({
        success: false,
        message: "Invalid login credentials",
      });
    }
  },
};
