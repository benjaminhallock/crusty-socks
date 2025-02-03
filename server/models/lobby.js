import mongoose from "mongoose";

const lobbySchema = new mongoose.Schema(
  {
    roomLeader: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    roomId: {
      type: String,
      required: true,
    },
    isPrivate: {
      type: Boolean,
      default: false,
    },
    category: {
      type: String,
      default: "random",
    },
    wordCount: {
      type: Number,
      default: 3,
      min: 1,
      max: 5,
    },
    drawTime: {
      type: Number,
      default: 60,
      min: 30,
      max: 180,
    },
    users: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
      },
    ],
    messages: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Message",
      },
    ],
  },
  {
    timestamps: true,
  }
);
// Helper method to check if a user is in the lobby
lobbySchema.methods.hasUser = function(userId) {
  return this.users.includes(userId);
};

// Helper method to add a user to the lobby
lobbySchema.methods.addUser = function(userId) {
  if (!this.hasUser(userId)) {
    this.users.push(userId);
  }
  return this.save();
};

// Helper method to remove a user from the lobby
lobbySchema.methods.removeUser = function(userId) {
  this.users = this.users.filter(id => !id.equals(userId));
  return this.save();
};

// Export the model
const Lobby = mongoose.model('Lobby', lobbySchema);
export default Lobby;