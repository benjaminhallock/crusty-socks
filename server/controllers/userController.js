import { Filter } from 'bad-words';
import { generateToken } from '../constants.js';
import User from '../models/user.js';

export const userController = {
  getUserById: async (req, res) => {
    try {
      const user = await User.findById(req.params.userId).select('-password');
      if (!user) {
        return res.status(404).json({
          message: 'User not found',
        });
      }
      res.status(200).json({
        user: user,
      });
    } catch (error) {
      res.status(500).json({
        message: 'Failed to fetch user',
      });
    }
  },

  authTokenCheck: (req, res) => {
    if (!req.user) {
      return res.status(401).json({
        message: 'Invalid or missing token',
      });
    }

    res.status(200).json({
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

    try {
      // Validate inputs
      if (!username?.trim() || !email?.trim() || !password?.trim()) {
        throw new Error('Missing required fields');
      }

      // Check for valid email format
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(email)) {
        throw new Error('Invalid email format');
      }
      // Check for valid username format
      // Username must be at least 6 characters long and contain only alphanumeric characters
      // and no spaces or special characters
      if (
        new Filter().isProfane(username) ||
        !/^[a-zA-Z0-9]{6,}$/.test(username)
      ) {
        throw new Error(
          'Invalid username format or contains inappropriate language'
        );
      }

      // Check for valid password format
      // Password must be at least 6 characters long
      if (password.length < 6) {
        throw new Error('Password must be at least 6 characters long');
      }

      // Check existing user
      const existingUser = await User.findOne({
        $or: [{ email }, { username }],
      });
      if (existingUser) {
        throw new Error(
          existingUser.email === email ? 'Email exists' : 'Username exists'
        );
      }

      const user = await User.create({ username, email, password });
      if (!user) {
        throw new Error('User registration failed');
      }
      res.status(201).json({ user, token: generateToken(user._id) });
    } catch (error) {
      res.status(400).json({ message: error.message || 'Registration failed' });
    }
  },

  login: async (req, res) => {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ message: 'Email and password required' });
    }

    const user = await User.findByCredentials(email, password);
    if (!user) {
      return res.status(401).json({ message: 'Invalid credentials' });
    }
    // Check if the user is banned
    if (user.isBanned) {
      return res.status(403).json({
        message: 'Your account is banned. Please contact support.',
      });
    }
    // Check if the user is deleted
    if (user.isDeleted) {
      return res.status(403).json({
        message: 'Your account is deleted. Please contact support.',
      });
    }

    const token = generateToken(user._id);
    res.status(200).json({ token: token, user: user });
  },

  getAllUsers: async (req, res) => {
    try {
      const users = await User.find({}, '-password');
      res.status(200).json({ users });
    } catch (error) {
      res.status(500).json({
        message: 'Failed to get users',
      });
    }
  },

  getUserByUsername: async (req, res) => {
    try {
      const { username } = req.params;
      // Fix: Use only inclusions in select
      const user = await User.findOne({
        username: { $regex: new RegExp(`^${username}$`, 'i') },
      }).select('username email profile gameStats chatHistory createdAt');

      if (!user) {
        return res.status(404).json({
          message: 'User profile not found',
        });
      }

      // Initialize profile if it doesn't exist
      if (!user.profile) {
        user.profile = {};
        console.log('Profile was missing - initialized empty profile object');
      }

      // Update last visited timestamp
      user.profile.lastActive = new Date();
      await user.save();

      // Format response to include only necessary data
      const profileData = {
        username: user.username,
        displayName: user.profile?.displayName || user.username,
        bio: user.profile?.bio || '',
        avatarUrl: user.profile?.avatarUrl || '',
        gameStats: user.gameStats || {},
        joinedDate: user.createdAt,
        lastActive: user.profile?.lastActive,
      };

      console.log('Profile data prepared:', profileData.username);

      res.status(200).json({
        profile: profileData,
      });
    } catch (error) {
      console.error('Error in getUserProfile:', error);
      res.status(500).json({
        message: 'Failed to fetch user profile',
        error: error.message,
        stack: process.env.NODE_ENV === 'development' ? error.stack : undefined,
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
          message: 'Profile data contains inappropriate language',
        });
      }

      // Make sure user can only update their own profile unless they're admin
      if (req.user.username !== username && !req.user.isAdmin) {
        return res.status(403).json({
          message: 'You can only update your own profile',
        });
      }

      const user = await User.findOne({ username });

      if (!user) {
        return res.status(404).json({
          message: 'User not found',
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
        message: 'Profile updated',
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
        message: 'Failed to update profile',
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
          message: 'Profile data contains inappropriate language',
        });
      }

      const user = await User.findById(userId);

      if (!user) {
        return res.status(404).json({
          message: 'User not found',
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
        message: 'Profile updated',
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
        message: 'Failed to update profile',
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
          message: 'Profile data contains inappropriate language',
        });
      }
      // Users can only update their own profile
      if (req.user.username !== username && !req.user.isAdmin) {
        return res.status(403).json({
          message: 'You can only update your own profile',
        });
      }

      const user = await User.findOne({ username });

      if (!user) {
        return res.status(404).json({
          message: 'User not found',
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
        message: 'Profile updated',
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
        message: 'Failed to update profile',
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
      ).select('-password');

      if (!updatedUser) {
        return res.status(404).json({
          message: 'User not found',
        });
      }

      res.status(200).json({
        message: 'User updated',
        user: updatedUser,
      });
    } catch (error) {
      res.status(500).json({
        message: 'Failed to update user',
        error: error.message,
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

      // Ensure all required fields are present and handle missing data gracefully
      const formattedLeaderboard = leaderboard.map((user) => ({
        username: user.username || 'Unknown',
        displayName: user.profile?.displayName || user.username || 'Unknown',
        avatarUrl: user.profile?.avatarUrl || '',
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
        leaderboard: formattedLeaderboard,
        message: 'Leaderboard fetched successfully',
      });
    } catch (error) {
      res.status(500).json({
        message: 'Failed to fetch leaderboard data',
        error: error.message,
      });
    }
  },

  deleteAccount: async (req, res) => {
    try {
      await User.findByIdAndDelete(req.user._id);
      res.status(200).json({ message: 'Account deleted' });
    } catch (error) {
      res.status(500).json({ message: 'Error deleting account' });
    }
  },
};
