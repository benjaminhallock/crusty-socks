import mongoose from "mongoose";

import { GAME_STATE } from "../../shared/constants.js";

/**
 * Lobby Schema
 * Central data model for game rooms and their state
 * Handles player management, game settings, and real-time state
 */
const lobbySchema = new mongoose.Schema(
  {
    // Core lobby identifiers
    roomId: {
      type: String,
      required: true,
      unique: true,
      index: true, // Indexed for quick lobby lookups
    },
    // Game configuration
    playerLimit: {
      type: Number,
      default: 8,
      max: 12,
      min: 2,
      required: true,
    },

    // Player roster with scoring
    players: [
      {
        userId: {
          type: mongoose.Schema.Types.ObjectId,
          ref: "User", // Reference to User model
        },
        username: String,
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
        roundScore: {
          type: Number,
          default: 0,
        },
      },
    ],

    // Chat history
    messages: [
      {
        user: String,
        message: String,
        timestamp: {
          type: Date,
          default: Date.now,
        },
      },
    ],

    // Game progression tracking
    currentRound: {
      type: Number,
      default: 1,
    },
    maxRounds: {
      type: Number,
      default: 3,
      min: 1,
      max: 10,
    },

    // Game mode settings
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
    // Active game state
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

    // Drawing canvas state
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
    // Timer end timestamp
    startTime: {
      type: Date,
      default: null,
    },
    },
    {
    timestamps: true, // Adds createdAt and updatedAt
  }
);

/**
 * Instance Methods
 * Helper functions for common lobby operations
 */

// Finds player by username
lobbySchema.methods.findPlayerByUsername = function (username) {
  return this.players.find((p) => p.username === username);
};

// Updates game state with validation
lobbySchema.methods.setGameState = function (state) {
  console.log("Updating game state:", { roomId: this.roomId, newState: state });
  this.gameState = state;
  return this.save();
};

// Adds new player if not already in lobby
lobbySchema.methods.addPlayer = function (username) {
  console.log("Adding player to lobby:", { roomId: this.roomId, username });
  if (!this.players.find((p) => p.username === username)) {
    this.players.push({ username });
    return this.save();
  }
};

// Removes player from lobby
lobbySchema.methods.removePlayerByUsername = function (username) {
  console.log("Removing player from lobby:", { roomId: this.roomId, username });
  this.players = this.players.filter((p) => p.username !== username);
  return this.save();
};

// Adds chat message to history
lobbySchema.methods.addMessage = function (messageData) {
  console.log("Adding message to lobby:", {
    roomId: this.roomId,
    username: messageData.username,
  });
  this.messages.push({
    user: messageData.username,
    message: messageData.message,
    timestamp: new Date(messageData.timestamp),
  });
  return this.save();
};

/**
 * Static Methods
 * Utility functions for lobby management
 */

// Creates or retrieves existing lobby
lobbySchema.statics.findOrCreate = async function (roomId) {
  console.log("Finding or creating lobby:", roomId);
  let lobby = await this.findOne({ roomId });
  if (!lobby) {
    lobby = new this({
      roomId,
      gameState: GAME_STATE.WAITING,
      players: [],
    });
    await lobby.save();
  }
  return lobby;
};

// Performance optimizations
lobbySchema.index({ createdAt: -1 });
lobbySchema.index({ "players.userId": 1, roomId: 1 }, { unique: true });

const Lobby = mongoose.model("Lobby", lobbySchema);
export default Lobby;
