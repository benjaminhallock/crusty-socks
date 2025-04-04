import dotenv from "dotenv";
import jwt from "jsonwebtoken";

import User from "../models/user.js";

dotenv.config("/config.env");

const generateToken = (userId) =>
  jwt.sign({ userId }, process.env.JWT_SECRET, { expiresIn: "24h" });

const cleanUser = (user) => ({
  _id: user._id,
  email: user.email,
  username: user.username,
  isAdmin: user.isAdmin,
  createdAt: user.createdAt,
});

export const userController = {
  getUser: async (req, res) => {
    try {
      const user = await User.findById(req.params.userId).select("-password");
      if (!user) {
        return res.status(404).json({
          ok: false,
          message: "User not found",
        });
      }
      res.status(200).json({
        user: cleanUser(user),
      });
    } catch (error) {
      res.status(500).json({
        ok: false,
        message: "Failed to fetch user",
      });
    }
  },

  validateToken: async (req, res) => {
    try {
      res.status(200).json({
        user: cleanUser(req.user),
        token: req.token,
      });
    } catch (error) {
      res.status(401).json({
        ok: false,
        message: "Invalid token",
      });
    }
  },

  register: async (req, res) => {
    const { username, email, password } = req.body;

    if (!username || !email || !password) {
      return res.status(400).json({
        ok: false,
        message: "Missing required fields",
      });
    }

    if (!/^[a-zA-Z0-9]{6,}$/.test(username)) {
      return res.status(400).json({
        ok: false,
        message:
          "Username must be at least 6 characters and contain only letters and numbers",
      });
    }

    if (!/^[a-zA-Z0-9]{6,}$/.test(password)) {
      return res.status(400).json({
        ok: false,
        message:
          "Password must be at least 6 characters and contain only letters and numbers",
      });
    }

    try {
      const existingUser = await User.findOne({
        $or: [{ email }, { username }],
      });

      if (existingUser) {
        return res.status(400).json({
          ok: false,
          message:
            existingUser.email === email
              ? "Email already exists"
              : "Username already exists",
        });
      }

      const user = await User.create({ username, email, password });
      const token = generateToken(user._id);

      res.status(201).json({
        user: cleanUser(user),
        token,
      });
    } catch (error) {
      res.status(400).json({
        ok: false,
        message: "Registration failed",
      });
    }
  },

  login: async (req, res) => {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({
        ok: false,
        message: "Email and password required",
      });
    }

    try {
      const user = await User.findByCredentials(email, password);

      if (!user) {
        return res.status(401).json({
          ok: false,
          message: "Invalid credentials",
        });
      }

      const token = generateToken(user._id);

      res.status(200).json({
        user: cleanUser(user),
        token,
        message: "Login successful",
      });
    } catch (error) {
      res.status(401).json({
        ok: false,
        message: "Invalid credentials",
      });
    }
  },

  getAllUsers: async (req, res) => {
    try {
      const users = await User.find({}, "-password");
      res.status(200).json({ users });
    } catch (error) {
      res.status(500).json({
        ok: false,
        message: "Failed to get users",
      });
    }
  },

  getUserProfile: async (req, res) => {
    try {
      const { username } = req.params;
      
      const user = await User.findOne({ username })
        .select('-password')
        .select('username email profile gameStats chatHistory createdAt');
      
      if (!user) {
        return res.status(404).json({
          success: false,
          message: 'User profile not found',
        });
      }
      
      // Get recent chat history (last 50 messages)
      const recentChatHistory = user.chatHistory?.slice(-50) || [];
      
      // Update last visited timestamp
      user.profile.lastActive = new Date();
      await user.save();
      
      // Format response to include only necessary data
      const profileData = {
        username: user.username,
        displayName: user.profile?.displayName || user.username,
        bio: user.profile?.bio || '',
        avatarUrl: user.profile?.avatarUrl || '',
        gameStats: user.gameStats,
        joinedDate: user.createdAt,
        lastActive: user.profile?.lastActive,
        recentChat: recentChatHistory
      };
      
      res.status(200).json({
        success: true,
        profile: profileData
      });
    } catch (error) {
      console.error('Error fetching user profile:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to fetch user profile',
        error: error.message
      });
    }
  },

  updateUserProfile: async (req, res) => {
    try {
      const { username } = req.params;
      const { displayName, bio, avatarUrl } = req.body;
      
      // Make sure user can only update their own profile unless they're admin
      if (req.user.username !== username && !req.user.isAdmin) {
        return res.status(403).json({
          success: false,
          message: 'You can only update your own profile'
        });
      }
      
      const user = await User.findOne({ username });
      
      if (!user) {
        return res.status(404).json({
          success: false,
          message: 'User not found'
        });
      }
      
      // Initialize profile if it doesn't exist
      if (!user.profile) {
        user.profile = {};
      }
      
      // Update profile fields if provided
      if (displayName) user.profile.displayName = displayName;
      if (bio !== undefined) user.profile.bio = bio;
      if (avatarUrl) user.profile.avatarUrl = avatarUrl;
      
      user.profile.lastActive = new Date();
      
      await user.save();
      
      res.status(200).json({
        success: true,
        message: 'Profile updated successfully',
        profile: {
          username: user.username,
          displayName: user.profile.displayName,
          bio: user.profile.bio,
          avatarUrl: user.profile.avatarUrl,
          lastActive: user.profile.lastActive
        }
      });
    } catch (error) {
      console.error('Error updating user profile:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to update profile',
        error: error.message
      });
    }
  },

  updateUser: async (req, res) => {
    try {
      const { userId } = req.params;
      const updateData = req.body;
      
      // Remove sensitive fields that shouldn't be updated directly
      delete updateData.password;
      
      const updatedUser = await User.findByIdAndUpdate(
        userId,
        { $set: updateData },
        { new: true, runValidators: true }
      ).select("-password");
      
      if (!updatedUser) {
        return res.status(404).json({
          ok: false,
          message: "User not found"
        });
      }
      
      res.status(200).json({
        ok: true,
        message: "User updated successfully",
        user: cleanUser(updatedUser)
      });
    } catch (error) {
      res.status(500).json({
        ok: false,
        message: "Failed to update user",
        error: error.message
      });
    }
  },

  // Get leaderboard data sorted by total score
  getLeaderboard: async (req, res) => {
    try {
      // Query users and sort by totalScore (descending)
      const leaderboard = await User.find({})
        .select('username profile gameStats -_id')
        .sort({ 'gameStats.totalScore': -1 })
        .limit(50); // Get top 50 users
      
      // Format the response
      const formattedLeaderboard = leaderboard.map(user => ({
        username: user.username,
        displayName: user.profile?.displayName || user.username,
        avatarUrl: user.profile?.avatarUrl || '',
        totalScore: user.gameStats.totalScore,
        gamesPlayed: user.gameStats.gamesPlayed,
        gamesWon: user.gameStats.gamesWon,
        winRate: user.gameStats.gamesPlayed > 0 
          ? Math.round((user.gameStats.gamesWon / user.gameStats.gamesPlayed) * 100) 
          : 0
      }));
      
      res.status(200).json({
        success: true,
        leaderboard: formattedLeaderboard
      });
    } catch (error) {
      console.error('Error fetching leaderboard:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to fetch leaderboard data',
        error: error.message
      });
    }
  },
};
