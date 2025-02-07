import mongoose from 'mongoose';

const lobbySchema = new mongoose.Schema({
  // Basic lobby info
  roomId: {
    type: String,
    required: true,
    unique: true  // No duplicate room IDs allowed
  },
  roomLeader: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true
  },
  isArchived: {
    type: Boolean,
    default: false  // Used to "soft delete" lobbies
  },

  // Player list in the lobby
  players: [{
    userId: { 
      type: mongoose.Schema.Types.ObjectId, 
      ref: "User",
      required: true 
    },
    username: { 
      type: String, 
      required: true 
    },
    score: { 
      type: Number, 
      default: 50  // Starting score for each player
    }
  }],

  // Chat message history
  messages: [{
    userId: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
    user: String,
    message: String,
    timestamp: Date
  }],

  // Game state and settings
  gameState: {
    type: String,
    default: "waiting",  // Can be: "waiting", "playing", "finished"
  },
  settings: {
    maxPlayers: {
      type: Number,
      default: 8
    },
    rounds: {
      type: Number,
      default: 3
    },
    customWords: {
      type: [String],
      default: []
    }
  }
}, { 
  timestamps: true  // Automatically add createdAt and updatedAt fields
});

// Helper method to check if a user is in the lobby
lobbySchema.methods.hasPlayer = function(userId) {
  return this.players.some(player => player.userId.toString() === userId.toString());
};

const Lobby = mongoose.model('Lobby', lobbySchema);
export default Lobby;
