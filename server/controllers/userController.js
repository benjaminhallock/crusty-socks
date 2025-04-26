import crypto from "crypto";
import Report from "../models/report.js";
import Chat from "../models/chat.js";

import { Filter } from "bad-words";
import bcrypt from "bcrypt";
import dotenv from "dotenv";
import jwt from "jsonwebtoken";

import User from "../models/user.js";
import sendEmail from "../utils/sendEmail.js";
dotenv.config("/config.env");

const generateToken = (userId) =>
  jwt.sign({ userId }, process.env.JWT_SECRET, { expiresIn: "30d" });

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
        user: user,
      });
    } catch (error) {
      res.status(500).json({
        ok: false,
        message: "Failed to fetch user",
      });
    }
  },

  validateUser: (req, res) => {
    if (!req.user) {
      return res.status(401).json({
        ok: false,
        message: "Invalid or missing token",
      });
    }

    res.status(200).json({
      ok: true,
      user: {
        _id: req.user._id,
        username: req.user.username,
        email: req.user.email,
        isAdmin: req.user.isAdmin,
        profile: req.user.profile,
      },
      token: req.token,
    });
  },

  register: async (req, res) => {
    const { username, email, password } = req.body;

    if (!username || !email || !password) {
      return res.status(400).json({
        ok: false,
        message: "Missing required fields",
      });
    }

    const filter = new Filter();
    if (filter.isProfane(username)) {
      return res.status(400).json({
        ok: false,
        message: "Username or email contains inappropriate language",
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
        user: user,
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
      if (!token) {
        return res.status(401).json({
          ok: false,
          message: "Invalid token",
        });
      }

      res.status(200).json({
        user: user,
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
      // Fix: Use only inclusions in select
      const user = await User.findOne({
        username: { $regex: new RegExp(`^${username}$`, "i") },
      }).select("username email profile gameStats chatHistory createdAt");

      if (!user) {
        return res.status(404).json({
          success: false,
          message: "User profile not found",
        });
      }

      // Initialize profile if it doesn't exist
      if (!user.profile) {
        user.profile = {};
        console.log("Profile was missing - initialized empty profile object");
      }

      // Update last visited timestamp
      user.profile.lastActive = new Date();
      await user.save();

      // Format response to include only necessary data
      const profileData = {
        username: user.username,
        displayName: user.profile?.displayName || user.username,
        bio: user.profile?.bio || "",
        avatarUrl: user.profile?.avatarUrl || "",
        gameStats: user.gameStats || {},
        joinedDate: user.createdAt,
        lastActive: user.profile?.lastActive,
      };

      console.log("Profile data prepared:", profileData.username);

      res.status(200).json({
        success: true,
        profile: profileData,
      });
    } catch (error) {
      console.error("Error in getUserProfile:", error);
      res.status(500).json({
        success: false,
        message: "Failed to fetch user profile",
        error: error.message,
        stack: process.env.NODE_ENV === "development" ? error.stack : undefined,
      });
    }
  },

  updateUserProfile: async (req, res) => {
    try {
      const { username } = req.params;
      const { displayName, bio, avatarUrl } = req.body;

      const filter = new Filter();
      if (filter.isProfane(displayName) || filter.isProfane(bio)) {
        return res.status(400).json({
          success: false,
          message: "Profile data contains inappropriate language",
        });
      }

      // Make sure user can only update their own profile unless they're admin
      if (req.user.username !== username && !req.user.isAdmin) {
        return res.status(403).json({
          success: false,
          message: "You can only update your own profile",
        });
      }

      const user = await User.findOne({ username });

      if (!user) {
        return res.status(404).json({
          success: false,
          message: "User not found",
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
        message: "Profile updated successfully",
        profile: {
          username: user.username,
          displayName: user.profile.displayName,
          bio: user.profile.bio,
          avatarUrl: user.profile.avatarUrl,
          lastActive: user.profile.lastActive,
        },
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: "Failed to update profile",
        error: error.message,
      });
    }
  },

  updateProfileById: async (req, res) => {
    try {
      const { userId } = req.params;
      const { displayName, bio, avatarUrl } = req.body;

      const filter = new Filter();
      if (filter.isProfane(displayName) || filter.isProfane(bio)) {
        return res.status(400).json({
          success: false,
          message: "Profile data contains inappropriate language",
        });
      }

      const user = await User.findById(userId);

      if (!user) {
        return res.status(404).json({
          success: false,
          message: "User not found",
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
        message: "Profile updated successfully",
        profile: {
          username: user.username,
          displayName: user.profile.displayName,
          bio: user.profile.bio,
          avatarUrl: user.profile.avatarUrl,
          lastActive: user.profile.lastActive,
        },
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: "Failed to update profile",
        error: error.message,
      });
    }
  },
  updateOwnProfile: async (req, res) => {
    try {
      const { username } = req.params;
      //Check if we received a username or an id

      const { displayName, bio, avatarUrl } = req.body;

      const filter = new Filter();
      if (filter.isProfane(displayName) || filter.isProfane(bio)) {
        return res.status(400).json({
          success: false,
          message: "Profile data contains inappropriate language",
        });
      }
      // Users can only update their own profile
      if (req.user.username !== username && !req.user.isAdmin) {
        return res.status(403).json({
          success: false,
          message: "You can only update your own profile",
        });
      }

      const user = await User.findOne({ username });

      if (!user) {
        return res.status(404).json({
          success: false,
          message: "User not found",
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
        message: "Profile updated successfully",
        profile: {
          username: user.username,
          displayName: user.profile.displayName,
          bio: user.profile.bio,
          avatarUrl: user.profile.avatarUrl,
          lastActive: user.profile.lastActive,
        },
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: "Failed to update profile",
        error: error.message,
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
          message: "User not found",
        });
      }

      res.status(200).json({
        ok: true,
        message: "User updated successfully",
        user: updatedUser,
      });
    } catch (error) {
      res.status(500).json({
        ok: false,
        message: "Failed to update user",
        error: error.message,
      });
    }
  },

  // Get leaderboard data sorted by total score
  getLeaderboard: async (req, res) => {
    try {
      // Query users and sort by totalScore (descending)
      const leaderboard = await User.find({})
        .select("username profile gameStats -_id")
        .sort({ "gameStats.totalScore": -1 })
        .limit(50); // Get top 50 users

      // Ensure all required fields are present and handle missing data gracefully
      const formattedLeaderboard = leaderboard.map((user) => ({
        username: user.username || "Unknown",
        displayName: user.profile?.displayName || user.username || "Unknown",
        avatarUrl: user.profile?.avatarUrl || "",
        totalScore: user.gameStats?.totalScore || 0,
        gamesPlayed: user.gameStats?.gamesPlayed || 0,
        gamesWon: user.gameStats?.gamesWon || 0,
        winRate:
          user.gameStats?.gamesPlayed > 0
            ? Math.round(
                (user.gameStats.gamesWon / user.gameStats.gamesPlayed) * 100
              )
            : 0,
      }));

      res.status(200).json({
        success: true,
        leaderboard: formattedLeaderboard,
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: "Failed to fetch leaderboard data",
        error: error.message,
      });
    }
  },

  sendVerificationEmail: async (req, res) => {
    try {
      const user = await User.findById(req.user._id);
      if (!user) {
        return res
          .status(404)
          .json({ success: false, message: "User not found" });
      }

      if (user.emailVerified) {
        return res
          .status(400)
          .json({ success: false, message: "Email already verified" });
      }

      const token = crypto.randomBytes(32).toString("hex");
      user.emailVerificationToken = token;
      user.emailVerificationExpires = Date.now() + 24 * 60 * 60 * 1000; // 24 hours
      await user.save();

      const verificationUrl = `${process.env.CLIENT_URL}/verify-email/${token}`;
      await sendEmail({
        to: user.email,
        subject: "Verify your email",
        text: `Please click the following link to verify your email: ${verificationUrl}`,
      });

      res
        .status(200)
        .json({ success: true, message: "Verification email sent" });
    } catch (error) {
      res
        .status(500)
        .json({ success: false, message: "Error sending verification email" });
    }
  },

  verifyEmailToken: async (req, res) => {
    try {
      const user = await User.findOne({
        emailVerificationToken: req.params.token,
        emailVerificationExpires: { $gt: Date.now() },
      });

      if (!user) {
        return res
          .status(400)
          .json({ success: false, message: "Invalid or expired token" });
      }

      user.emailVerified = true;
      user.emailVerificationToken = undefined;
      user.emailVerificationExpires = undefined;
      await user.save();

      res
        .status(200)
        .json({ success: true, message: "Email verified successfully" });
    } catch (error) {
      res
        .status(500)
        .json({ success: false, message: "Error verifying email" });
    }
  },

  changePassword: async (req, res) => {
    try {
      const { currentPassword, newPassword } = req.body;
      const user = await User.findById(req.user._id).select("+password");

      if (!(await bcrypt.compare(currentPassword, user.password))) {
        return res
          .status(401)
          .json({ success: false, message: "Current password is incorrect" });
      }

      user.password = newPassword;
      await user.save();

      res
        .status(200)
        .json({ success: true, message: "Password updated successfully" });
    } catch (error) {
      res
        .status(500)
        .json({ success: false, message: "Error changing password" });
    }
  },

  changeEmail: async (req, res) => {
    try {
      const { newEmail, password } = req.body;
      const user = await User.findById(req.user._id).select("+password");

      if (!(await bcrypt.compare(password, user.password))) {
        return res
          .status(401)
          .json({ success: false, message: "Password is incorrect" });
      }

      const existingUser = await User.findOne({ email: newEmail });
      if (existingUser) {
        return res
          .status(400)
          .json({ success: false, message: "Email already in use" });
      }

      const token = crypto.randomBytes(32).toString("hex");
      user.pendingEmail = newEmail;
      user.emailVerificationToken = token;
      user.emailVerificationExpires = Date.now() + 24 * 60 * 60 * 1000;
      await user.save();

      const verificationUrl = `${process.env.CLIENT_URL}/verify-email/${token}`;
      await sendEmail({
        to: newEmail,
        subject: "Verify your new email",
        text: `Please click the following link to verify your new email: ${verificationUrl}`,
      });

      res.status(200).json({
        success: true,
        message: "Verification email sent to new address",
      });
    } catch (error) {
      res.status(500).json({ success: false, message: "Error changing email" });
    }
  },

  updatePreferences: async (req, res) => {
    try {
      const user = await User.findById(req.user._id);
      user.preferences = { ...user.preferences, ...req.body };
      await user.save();

      res.status(200).json({ success: true, preferences: user.preferences });
    } catch (error) {
      res
        .status(500)
        .json({ success: false, message: "Error updating preferences" });
    }
  },

  deleteAccount: async (req, res) => {
    try {
      await User.findByIdAndDelete(req.user._id);
      res
        .status(200)
        .json({ success: true, message: "Account deleted successfully" });
    } catch (error) {
      res
        .status(500)
        .json({ success: false, message: "Error deleting account" });
    }
  },

  // Get all reports for a specific user
  getUserReports: async (req, res) => {
    try {
      const username = req.params.username;

      // Find reports where the user is either the reporter or reportee
      const reports = await Report.find({
        $or: [{ reportedUser: username }, { reportedBy: username }],
      }).sort({ timestamp: -1 }); // Sort by newest first

      return res.json({
        success: true,
        reports,
      });
    } catch (err) {
      console.error("Error fetching user reports:", err);
      return res.status(500).json({
        success: false,
        message: "Error fetching user reports",
        error: err.message,
      });
    }
  },

  // Get chat history for a specific user
  getUserChats: async (req, res) => {
    try {
      const username = req.params.username;

      // Get chat logs with this username
      const chatHistory = await Chat.find({
        username: username,
      })
        .sort({ timestamp: -1 })
        .limit(100); // Sort by newest first, limit to 100 messages

      return res.json({
        success: true,
        chatHistory,
      });
    } catch (err) {
      console.error("Error fetching user chat history:", err);
      return res.status(500).json({
        success: false,
        message: "Error fetching user chat history",
        error: err.message,
      });
    }
  },
};
