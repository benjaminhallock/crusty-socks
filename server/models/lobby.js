import mongoose from "mongoose";

import { GAME_STATE } from "../constants.js";
import Chat from "./chat.js"; // Importing the Chat model
import User from "./user.js"; // Importing the User model
const playerSchema = new mongoose.Schema({
  username: String,
  userId: mongoose.Schema.Types.ObjectId,
  socketId: String,
  connected: {
    type: Boolean,
    default: true,
  },
  score: {
    type: Number,
    default: 0,
  },
  hasGuessedCorrect: {
    type: Boolean,
    default: false,
  },
  hasDrawn: {
    type: Boolean,
    default: false,
  },
  guessTime: {
    type: Number,
    default: 0,
  },
  drawScore: {
    type: Number,
    default: 0,
  },
  roundScore: {
    type: Number,
    default: 0,
  },
});

const lobbySchema = new mongoose.Schema(
  {
    roomId: {
      type: String,
      required: true,
      unique: true,
    },
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User", // Reference to User model
      required: true,
    },
    finished: {
      type: Boolean,
      default: false,
    },
    gridSize: {
      type: Number,
      default: 16,
      max: 20,
      min: 1,
    },
    playerLimit: {
      type: Number,
      default: 8,
      max: 12,
      min: 2,
      required: true,
    },
    players: [playerSchema],
    currentRound: {
      type: Number,
      default: 1,
    },
    maxRounds: {
      type: Number,
      min: 1,
      max: 10,
    },
    revealCharacters: {
      type: Number,
      min: 0,
      max: 75,
      default: 35, // Percentage of characters to reveal (0-75)
    },
    selectWord: {
      type: Number,
      default: 3,
      min: 1,
      max: 5,
    },
    selectCategory: {
      type: String,
      default: "random", // Default category
    },
    currentWord: {
      type: String,
      default: "",
    },
    currentDrawer: {
      type: String,
      ref: "User",
      default: "",
    },
    gameState: {
      type: String,
      enum: Object.values(GAME_STATE),
      default: GAME_STATE.WAITING,
      set: (v) => v || GAME_STATE.WAITING, // Fallback for undefined states
    },
    lobbyCanvas: {
      data: String,
      lastUpdate: Date,
    },
    canvasState: {
      data: String,
      lastUpdate: Date,
    },
    roundTime: {
      type: Number,
      default: 60, // Default round time in seconds
      min: 30,
      max: 180,
    },
    startTime: {
      type: Date,
      default: null,
    },
    usedWords: {
      type: [String],
      default: [],
    },
    kickedUsers: [
      {
        username: {
          type: String,
          required: true,
          ref: "User",
        },
        kickedAt: {
          type: Date,
          default: Date.now,
        },
      },
    ],
  },
  {
    timestamps: true, // Adds createdAt and updatedAt
  }
);

lobbySchema.pre("save", async function (next) {
  if (this.isNew) {
    // Check if the user exists in the database
    const user = await User.findById(this.userId);
    if (!user) {
      const error = new Error("User not found");
      error.statusCode = 404;
      return next(error);
    }
    // Check if the user is banned
    if (user.isBanned) {
      const error = new Error("User is banned");
      error.statusCode = 403;
      return next(error);
    }
  }
  next();
});

lobbySchema.pre("remove", async function (next) {
  // any cleanup logic before removing the lobby
  next();
});

lobbySchema.statics.findById = function (id) {
  return this.findOne({ _id: id }).populate("players.userId");
};

lobbySchema.methods.findPlayerByUsername = function (username) {
  return this.players.find((p) => p.username === username);
};
lobbySchema.methods.findPlayerById = function (userId) {
  return this.players.find((p) => p.userId.toString() === userId.toString());
};

lobbySchema.methods.addKickedUser = function (username) {
  if (!this.isUserKicked(username)) {
    this.kickedUsers.push({ username });
    return this.save();
  }
  return this;
};

lobbySchema.methods.isUserKicked = function (username) {
  return this.kickedUsers.some((kicked) => kicked.username === username);
};

lobbySchema.methods.removePlayer = async function (username) {
  const updatedLobby = await this.constructor.findOneAndUpdate(
    { _id: this._id },
    { $pull: { players: { username: username } } },
    { new: true }
  );
  return updatedLobby;
};

// Add method to clean up disconnected players
lobbySchema.methods.cleanupDisconnectedPlayers = async function () {
  this.players = this.players.filter((player) => player.connected);
  return this.save();
};

lobbySchema.index({ createdAt: -1 });
lobbySchema.index({ "players.userId": 1, roomId: 1 }, { unique: true });

const Lobby = mongoose.model("Lobby", lobbySchema);
export default Lobby;
