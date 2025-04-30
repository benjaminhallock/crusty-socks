import Chat from '../models/chat.js';
import User from '../models/user.js';

export const chatController = {
  // Get all chats (admin only) - sort by newest first
  getAllChats: async (req, res) => {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 50;

    try {
      const totalChats = await Chat.countDocuments({});
      const chats = await Chat.find({})
        .sort({ timestamp: -1 })
        .skip((page - 1) * limit)
        .limit(limit);

      res.status(200).json({
        chats,
        total: totalChats,
        page,
        pages: Math.ceil(totalChats / limit),
      });
    } catch (error) {
      res.status(500).json({
        message: 'Error fetching chats',
        error: error.message,
      });
    }
  },

  // Get chat by ID
  getChatById: async (req, res) => {
    try {
      const chat = await Chat.findById(req.params.id).catch((err) => {
        console.error('Error fetching chat by ID:', err);
        return res.status(500).json({
          message: 'Error fetching chat',
          error: err.message,
        });
      });
      if (
        !req.user.isAdmin &&
        chat.userId &&
        chat.userId.toString() !== req.user._id.toString()
      ) {
        return res.status(403).json({
          message: 'Access denied',
        });
      }
      res.json({
        data: chat,
      });
    } catch (error) {
      res.status(500).json({
        message: 'Error fetching chat',
        error: error.message,
      });
    }
  },

  // Get chat by lobby id
  getChatByLobbyId: async (req, res) => {
    try {
      const { lobbyObjectId } = req.params;
      if (!lobbyObjectId) {
        return res.status(400).json({
          message: 'Lobby object ID is required',
        });
      }
      const chats = await Chat.find({ lobbyObjectId }).sort({ timestamp: -1 });
      if (chats.length === 0) {
        return res.status(404).json({
          message: 'No chats found for this lobby',
        });
      }
      res.status(200).json({
        data: chats,
      });
    } catch (error) {
      res.status(500).json({
        message: 'Error fetching chats',
        error: error.message,
      });
    }
  },

  getChatByUserInLobbyId: async (req, res) => {
    try {
      const { lobbyObjectId, userId } = req.params;
      if (!lobbyObjectId || !userId) {
        return res.status(400).json({
          message: 'Lobby object ID and User ID are required',
        });
      }
      const chats = await Chat.find({ lobbyObjectId, userId }).sort({
        timestamp: -1,
      });
      if (chats.length === 0) {
        return res.status(404).json({
          message: 'No chats found for this user in the lobby',
        });
      }
      res.json({ data: chats });
    } catch (error) {
      res.status(500).json({
        message: 'Error fetching chats',
        error: error.message,
      });
    }
  },

  // New: Get chat by user id (admin only) - sort by newest first
  getChatByUserId: async (req, res) => {
    try {
      const { userId } = req.params;
      if (!userId.match(/^[0-9a-fA-F]{24}$/)) {
        return res.status(400).json({
          message: 'Invalid user ID format',
        });
      }
      const user = await User.findById(userId);
      if (!user) {
        return res.status(404).json({
          message: 'User not found',
        });
      }
      const chats = await Chat.find({
        $or: [{ userId: userId }, { username: user.username }],
      }).sort({ timestamp: -1 });
      res.json({
        data: chats,
      });
    } catch (error) {
      res.status(500).json({
        message: 'Error fetching chats by user',
        error: error.message,
      });
    }
  },
};
