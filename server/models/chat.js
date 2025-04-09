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
    required: false, // Make userId optional
  },
  username: {
    type: String,
    required: true,
  },
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
  visibleTo: String,
});

chatSchema.statics.findOneOrCreate = async function (lobbyObjectId) {
  const chat = await this.findOne({ lobbyObjectId });
  if (chat) {
    return chat;
  }
  return await this.create({ lobbyObjectId });
};

chatSchema.statics.findByLobbyId = async function (lobbyObjectId) {
  const chat = await this.find({ lobbyObjectId }).sort({ timestamp: -1 });
  if (!chat) {
    return null;
  }
  return chat;
};
chatSchema.statics.findByLobbyIdAndUserId = async function (
  lobbyObjectId,
  userId
) {
  const chat = await this.find({ lobbyObjectId, userId }).sort({
    timestamp: -1,
  });
  if (!chat) {
    return null;
  }
  return chat;
};
// Index for faster queries
chatSchema.index({ lobbyObjectId: 1, timestamp: 1 });
chatSchema.index({ lobbyObjectId: 1, timestamp: -1 });
chatSchema.index({ lobbyObjectId: 1, visibleTo: 1 });

const Chat = mongoose.model("Chat", chatSchema);
export default Chat;
