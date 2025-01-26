import User from "../models/user.js";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";

export const userController = {
  // Register a new user
  register: async (req, res) => {
    try {
      const { username, email, password } = req.body;

      // Check if user already exists
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

    res.json({ username: user.username, token });
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  },

  // Login user
  login: async (req, res) => {
    try {
      const { email, password } = req.body;
      const user = await User.findByCredentials(email, password);

      const token = jwt.sign({ userId: user._id }, process.env.JWT_SECRET, {
        expiresIn: "24h",
      });

    res.json({ username: user.username, token });
    } catch (error) {
      res.status(401).json({ error: "Invalid login credentials" });
    }
  },

  // Get user profile
  getProfile: async (req, res) => {
    try {
      const user = await User.findById(req.user.userId);
      if (!user) {
        return res.status(404).json({ error: "User not found" });
      }
      res.json(user);
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  },

  // Update user profile
  updateProfile: async (req, res) => {
    const updates = Object.keys(req.body);
    const allowedUpdates = [
      "username",
      "email",
      "password",
      "languagePreference",
    ];
    const isValidOperation = updates.every((update) =>
      allowedUpdates.includes(update)
    );

    if (!isValidOperation) {
      return res.status(400).json({ error: "Invalid updates" });
    }

    try {
      const user = await User.findById(req.user.userId);
      if (!user) {
        return res.status(404).json({ error: "User not found" });
      }

      updates.forEach((update) => (user[update] = req.body[update]));
      await user.save();

      res.json(user);
    } catch (error) {
      res.status(400).json({ error: error.message });
    }
  },

  // Report user
  reportUser: async (req, res) => {
    try {
      const { reportedUserId } = req.body;
      const user = await User.findById(reportedUserId);

      if (!user) {
        return res.status(404).json({ error: "User not found" });
      }

      user.numberOfReports += 1;
      await user.save();

      res.json({ message: "User reported successfully" });
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  },
};
