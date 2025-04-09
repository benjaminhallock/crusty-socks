import mongoose from 'mongoose';

import { GAME_STATE } from '../constants.js';
import Chat from './chat.js'; // Importing the Chat model
import User from './user.js'; // Importing the User model
const lobbySchema = new mongoose.Schema(
  {
    roomId: {
      type: String,
      required: true,
      unique: true,
      index: true, // Indexed for quick lobby lookups
    },
    playerLimit: {
      type: Number,
      default: 8,
      max: 12,
      min: 2,
      required: true,
    },
    players: [
      {
        userId: {
          type: mongoose.Schema.Types.ObjectId,
          ref: 'User', // Reference to User model
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
        drawPoints: {
          type: Number,
          default: 0,
        },
        roundScore: {
          type: Number,
          default: 0,
        },
      },
    ],
    messages: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Chat',
      },
    ],
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
      default: 'random', // Default category
    },
    currentWord: {
      type: String,
      default: '',
    },
    currentDrawer: {
      type: String,
      ref: 'User',
      default: '',
    },
    gameState: {
      type: String,
      enum: Object.values(GAME_STATE),
      default: GAME_STATE.WAITING,
      set: (v) => v || GAME_STATE.WAITING, // Fallback for undefined states
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
          ref: 'User',
        },
        kickedAt: {
          type: Date,
          default: Date.now,
        },
      },
    ],
  },
  {
    timestamps: true // Adds createdAt and updatedAt
  }
);

lobbySchema.methods.findPlayerByUsername = function (username) {
  return this.players.find((p) => p.username === username);
};
lobbySchema.methods.findPlayerById = function (userId) {
  return this.players.find((p) => p.userId.toString() === userId.toString());
};

lobbySchema.methods.addMessage = function ({ username, message, timestamp }) {
  this.messages.push({
    user: username,
    message,
    timestamp: new Date(timestamp),
  });
  return this.save();
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


lobbySchema.statics.findByRoomId = async function (roomId) {
  if (!roomId) throw new Error('Room ID is required');
  const lobby = await this.findOne({ roomId })
    .populate('messages')
    .populate('players.userId', 'username email profileImage');
  lobby._id = lobby._id.toString();
  if (!lobby) throw new Error('Lobby not found');
  return lobby;
};

lobbySchema.methods.removePlayer = function (username) {
  this.players = this.players.filter(player => player.username !== username);
  return this.save();
};

lobbySchema.index({ createdAt: -1 });
lobbySchema.index({ 'players.userId': 1, roomId: 1 }, { unique: true });

const Lobby = mongoose.model('Lobby', lobbySchema);
export default Lobby;
