import Chat from "../models/chat.js";
import User from "../models/user.js";

export const chatController = {
  // Get all chats (admin only) - sort by newest first
  getAllChats: async (req, res) => {
    try {
      const page = parseInt(req.query.page) || 1;
      const limit = parseInt(req.query.limit) || 50;
      const skip = (page - 1) * limit;

      const [chats, total] = await Promise.all([
        Chat.find({})
          .sort({ timestamp: -1 })
          .skip(skip)
          .limit(limit)
          .populate("userId", "username"),
        Chat.countDocuments(),
      ]);

      res.json({
        success: true,
        chats,
        total,
        page,
        pages: Math.ceil(total / limit),
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: "Error fetching chats",
        error: error.message,
      });
    }
  },

  getChatByLobbyId: async (req, res) => {
    try {
      const { lobbyObjectId } = req.params;
      const chats = await Chat.find({ lobbyId: lobbyObjectId })
        .sort({ timestamp: -1 })
        .populate("userId", "username");

      res.json({
        success: true,
        chats,
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: "Error fetching lobby chats",
        error: error.message,
      });
    }
  },

  getChatByUserInLobby: async (req, res) => {
    try {
      const { lobbyObjectId, userId } = req.params;
      const chats = await Chat.find({
        lobbyId: lobbyObjectId,
        userId: userId,
      })
        .sort({ timestamp: -1 })
        .populate("userId", "username");

      res.json({
        success: true,
        chats,
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: "Error fetching user lobby chats",
        error: error.message,
      });
    }
  },
};
