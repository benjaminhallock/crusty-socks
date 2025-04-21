import Chat from "../models/chat.js";
import User from "../models/user.js";

export const chatController = {
  // Get all chats (admin only) - sort by newest first
  getAllChats: async (req, res) => {
    try {
      const chats = await Chat.find({}).sort({ timestamp: -1 });
      res.json({
        success: true,
        data: chats,
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: "Error fetching chats",
        error: error.message,
      });
    }
  },

  // Get chat by ID
  getChatById: async (req, res) => {
    try {
      const chat = await Chat.findById(req.params.id);

      if (!chat) {
        return res.status(404).json({
          success: false,
          message: "Chat not found",
        });
      }

      // Check if user has access to this chat
      if (
        !req.user.isAdmin &&
        chat.userId &&
        chat.userId.toString() !== req.user._id.toString()
      ) {
        return res.status(403).json({
          success: false,
          message: "Access denied",
        });
      }

      res.json({
        success: true,
        data: chat,
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: "Error fetching chat",
        error: error.message,
      });
    }
  },

  // Get chat history for specific user (admin only) - sort by newest first
  getChatHistoryByUserId: async (req, res) => {
    try {
      const { userId } = req.params;

      // Validate userId format for MongoDB
      if (!userId.match(/^[0-9a-fA-F]{24}$/)) {
        return res.status(400).json({
          success: false,
          message: "Invalid user ID format",
        });
      }

      // Find the user's username
      const user = await User.findById(userId);
      if (!user) {
        return res.status(404).json({
          success: false,
          message: "User not found",
        });
      }

      // Now get all chats from this user
      const chats = await Chat.find({
        $or: [{ userId: userId }, { username: user.username }],
      })
        .sort({ timestamp: -1 })
        .limit(100);

      res.json({
        success: true,
        data: chats,
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: "Error fetching chat history",
        error: error.message,
      });
    }
  },
};
