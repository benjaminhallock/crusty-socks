import mongoose from "mongoose";

const chatSchema = new mongoose.Schema({
  lobbyObjectId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Lobby",
    required: true,
    index: true,
  },
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
  },
  username: String,
  message: {
    type: String,
    required: true,
  },
  timestamp: {
    type: Date,
    default: Date.now,
  },
  isSystemMessage: {
    type: Boolean,
    default: false,
  },
  isGuessMessage: {
    type: Boolean,
    default: false,
  },
  visibleTo: String, // null means visible to all, string contains username
});

// Fixed findOneOrCreate method
chatSchema.statics.findOneOrCreate = async function (lobbyId) {
  try {
    const chat = await this.findOne({
      lobbyObjectId: lobbyId,
      isSystemMessage: true,
      message: "Chat initialized"
    });
    
    if (!chat) {
      return await this.create({
        lobbyObjectId: lobbyId,
        username: "Server",
        message: "Chat initialized",
        isSystemMessage: true,
        timestamp: Date.now()
      });
    }
    
    return chat;
  } catch (err) {
    console.error("Error finding or creating chat:", err);
    throw err;
  }
};

// Improved method to get chat history
chatSchema.statics.getLobbyMessages = async function (lobbyId, username) {
  try {
    // Get messages visible to all or specifically to this user
    return await this.find({
      lobbyObjectId: lobbyId,
      $or: [
        { visibleTo: { $exists: false } },
        { visibleTo: null },
        { visibleTo: username },
      ],
    })
      .sort({ timestamp: -1 })
      .limit(100)  // Increase limit for better history
      .sort({ timestamp: 1 });
  } catch (err) {
    console.error("Error getting lobby messages:", err);
    return [];
  }
};

// Simple method to add an init message if needed
chatSchema.statics.initializeChat = async function (lobbyId) {
  try {
    const chatExists = await this.findOne({ lobbyObjectId: lobbyId });

    if (!chatExists) {
      await this.create({
        lobbyObjectId: lobbyId,
        username: "Server",
        message: "Chat initialized",
        isSystemMessage: true,
      });
      return true;
    }
    return false;
  } catch (err) {
    console.error("Error initializing chat:", err);
    return false;
  }
};

const Chat = mongoose.model("Chat", chatSchema);
export default Chat;
