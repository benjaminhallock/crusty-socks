import mongoose from 'mongoose';

const lobbySchema = new mongoose.Schema({
  roomId: {
    type: String,
    required: true,
    unique: true,
    index: true
  },
  roomLeader: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true
  },
  players: [{
    userId: { 
      type: mongoose.Schema.Types.ObjectId, 
      ref: "User"
    },
    username: String,
    score: {
      type: Number,
      default: 0
    }
  }],
  messages: [{
    user: String,
    message: String,
    timestamp: {
      type: Date,
      default: Date.now
    }
  }],
  gameState: {
    type: String,
    enum: ['waiting', 'playing', 'finished'],
    default: 'waiting'
  },
  settings: {
    maxPlayers: {
      type: Number,
      default: 8,
      min: 2,
      max: 16
    },
    rounds: {
      type: Number,
      default: 3,
      min: 1,
      max: 10
    }
  },
  isArchived: {
    type: Boolean,
    default: false,
    index: true
  },
  canvasState: {
    pixels: [{
      index: Number,
      color: String
    }],
    lastUpdate: {
      type: Date,
      default: Date.now,
      expires: "5h" //hope this works!!!
    }
  }
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// Index for faster queries
lobbySchema.index({ createdAt: -1 });
lobbySchema.index({ gameState: 1, isArchived: 1 });

// Add compound index to prevent duplicate players in a lobby
// and ensure a player can only be in one lobby
lobbySchema.index({ 'players.userId': 1, roomId: 1 }, { unique: true });

const Lobby = mongoose.model('Lobby', lobbySchema);
export default Lobby;
