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

// Instance methods
lobbySchema.methods.setGameState = function(state) {
  this.gameState = state;
  return this.save();
};

lobbySchema.methods.addPlayer = function(username, socketId) {
  if (!this.players.find(p => p.username === username)) {
    this.players.push({ username });
    return this.save();
  }
};

lobbySchema.methods.removePlayerByUsername = function(username) {
  this.players = this.players.filter(p => p.username !== username);
  return this.save();
};

lobbySchema.methods.addMessage = function(messageData) {
  this.messages.push({
    user: messageData.username,
    message: messageData.message,
    timestamp: new Date(messageData.timestamp)
  });
  return this.save();
};

// Static methods
lobbySchema.statics.findOrCreate = async function(roomId) {
  let lobby = await this.findOne({ roomId });
  if (!lobby) {
    lobby = new this({
      roomId,
      gameState: 'waiting'
    });
    await lobby.save();
  }
  return lobby;
};

// Index for faster queries
lobbySchema.index({ createdAt: -1 });
lobbySchema.index({ 'players.userId': 1, roomId: 1 }, { unique: true });

const Lobby = mongoose.model('Lobby', lobbySchema);
export default Lobby;
