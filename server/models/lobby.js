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
      unique: true,
    },
    players: [
      {
        userId: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
        username: String,
        score: { type: Number, default: 0 },
      },
    ],
    messages: [
      {
        userId: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
        username: String,
        message: String,
      },
    ],
    gameState: {
      type: String,
      default: "waiting",
    },
    settings: {
      maxPlayers: {
        type: Number,
        default: 8,
      },
      rounds: {
        type: Number,
        default: 3,
      },
      customWords: {
        type: [String],
        default: [],
      },
    },
  },
  { timestamps: true }
);

// Helper method to check if a user is in the lobby
lobbySchema.methods.hasUser = function (userId) {
  return this.users.some((user) => user.userId.equals(userId));
};

// Helper method to add a user to the lobby
lobbySchema.methods.addUser = async function (user) {
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

lobbySchema.methods.removeUser = function (userId) {
  this.users = this.users.filter((user) => !user.userId.equals(userId));
  return this.save();
};

const Lobby = mongoose.model("Lobby", lobbySchema);

export default Lobby;
