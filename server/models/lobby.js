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
        userId: {
          type: mongoose.Schema.Types.ObjectId,
          ref: "User",
        },
        username: String,
        isReady: {
          type: Boolean,
          default: false,
        },
        score: {
          type: Number,
          default: 0,
        },
        isOnline: {
          type: Boolean,
          default: true,
        },
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
  return this.users.some(user => user.userId.equals(userId));
};

// Helper method to add a user to the lobby
lobbySchema.methods.addUser = async function(user) {
  if (!this.hasUser(user._id)) {
    this.users.push({
      userId: user._id,
      username: user.username,
      isReady: false,
      score: 0,
    });
  }
  return this.save();
};

// Helper method to remove a user from the lobby
lobbySchema.methods.removeUser = function(userId) {
  this.users = this.users.filter(user => !user.userId.equals(userId));
  return this.save();
};

// Export the model
const Lobby = mongoose.model('Lobby', lobbySchema);
export default Lobby;