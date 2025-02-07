import User from "../models/user.js";
import jwt from "jsonwebtoken";
import dotenv from "dotenv";

dotenv.config("/config.env");

export const userController = {
  validateToken: async (req, res) => {
    try {
      // Send back cleaned user object
      const user = {
        _id: req.user._id,
        email: req.user.email,
        username: req.user.username
      };
      
      res.status(200).json({
        success: true,
        user,
        token: req.token
      });
    } catch (error) {
      res.status(401).json({
        success: false,
        message: "Invalid token"
      });
    }
  },

  register: async (req, res) => {
    const { username, email, password } = req.body;

    // Simple validation
    if (!username || !email || !password) {
      return res.status(400).json({
        success: false,
        message: "Missing required fields"
      });
    }

    try {
      // Check if user exists
      const existingUser = await User.findOne({ 
        $or: [{ email }, { username }] 
      });

      if (existingUser) {
        return res.status(400).json({
          success: false,
          message: existingUser.email === email ? "Email already exists" : "Username already exists"
        });
      }

      // Create user
      const user = await User.create({ username, email, password });
      
      // Generate token
      const token = jwt.sign({ userId: user._id }, process.env.JWT_SECRET, {
        expiresIn: "24h"
      });

      // Send clean user object and token
      res.status(201).json({
        success: true,
        user: {
          _id: user._id,
          email: user.email,
          username: user.username
        },
        token // Send raw token, Bearer prefix handled by client
      });
    } catch (error) {
      res.status(401).json({
        success: false,
        message: "Invalid token"
      });
    }
  },

  login: async (req, res) => {
    const { email, password } = req.body;
    if (!email || !password) {
      return res.status(400).json({
        success: false,
        message: "Email and password required"
      });
    }
    try {
      const user = await User.findByCredentials(email, password);
      
      if (!user) {
        return res.status(401).json({
          success: false,
          message: "Invalid credentials"
        });
      }
      
      const token = jwt.sign({ userId: user._id }, process.env.JWT_SECRET, {
        expiresIn: "24h"
      });
      
      res.status(200).json({
        success: true,
        user: {
          _id: user._id,
          email: user.email,
          username: user.username
        },
        token,
        message: "Login successful"
      });
    } catch (error) {
      res.status(401).json({
        success: false,
        message: error.message || "Invalid credentials"
      });
    }
  },

  getAllUsers: async (req, res) => {
    try {
      const users = await User.find({}, '-password');
      res.status(200).json({
        success: true,
        users
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: "Failed to get users"
      });
    }
  }
};
