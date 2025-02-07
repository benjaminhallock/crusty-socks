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
    ref: 'User',
    required: true
  },
  players: [{
    userId: { 
      type: mongoose.Schema.Types.ObjectId, 
      ref: 'User'
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
  canvasState: {
    pixels: [{
      index: Number,
      color: String
    }],
    lastUpdate: Date
  }
}, {
  timestamps: true
});

// Index for faster queries
lobbySchema.index({ createdAt: -1 });
lobbySchema.index({ 'players.userId': 1, roomId: 1 }, { unique: true });

const Lobby = mongoose.model('Lobby', lobbySchema);
export default Lobby;
