import Lobby from '../models/lobby.js';

export const lobbyController = {
  deleteLobby: async (req, res) => {
    try {
      const { lobbyId } = req.params;
      if (!lobbyId) {
        return res.status(400).json({
          message: 'Lobby ID is required',
        });
      }
      const lobby = await Lobby.findByIdAndDelete(lobbyId);
      if (!lobby) {
        return res.status(404).json({
          message: 'Lobby not found',
        });
      }
      res.status(200).json({
        message: 'Lobby deleted successfully',
      });
    } catch (error) {
      console.error('Delete lobby error:', error);
      res.status(400).json({
        error: 'Failed to delete lobby',
      });
    }
  },
  getAllLobbies: async (req, res) => {
    try {
      const lobbies = await Lobby.find();

      if (!lobbies || lobbies.length === 0) {
        return res.status(404).json({
          message: 'No lobbies found',
        });
      }

      res.status(200).json({
        lobbies,
      });
    } catch (error) {
      console.error('Get all lobbies error:', error);
      res.status(400).json({
        error: 'Failed to get lobbies',
      });
    }
  },

  leaveLobby: async (req, res) => {
    try {
      const { roomId, user, token } = req.params;
      const userId = user._id;
      if (!userId || !roomId) {
        return res.status(400).json({
          message: 'User ID and room ID are required',
        });
      }
      const lobby = await Lobby.findOne({ roomId });
      if (!lobby) {
        return res.status(404).json({
          message: 'Lobby not found',
        });
      }

      if (lobby.players.length === 0) {
        return res.status(400).json({
          message: 'No players in the lobby to leave',
        });
      }
      const player = lobby.players.find(
        (p) => p.userId.toString() === userId.toString()
      );
      if (!player) {
        return res.status(400).json({
          message: 'Player not found in the lobby',
        });
      }

      // Remove the player from the lobby
      lobby.players = lobby.players.filter(
        (p) => p.userId.toString() !== userId.toString()
      );

      await lobby.save();

      res.status(200).json({
        message: 'Left the lobby successfully',
      });
    } catch (error) {
      console.error('Leave lobby error:', error);
      res.status(400).json({
        error: 'Failed to leave lobby',
      });
    }
  },
  
  createLobby: async (req, res) => {
    try {
      const lobby = new Lobby({
        roomId: Math.random().toString(36).substring(2, 8),
        maxRounds: req.body.maxRounds || 3,
        revealCharacters: req.body.revealCharacters || 0,
        selectCategory: req.body.selectCategory || 'random',
        playerLimit: req.body.playerLimit || 8,
        selectWord: req.body.selectWord || 1,
        roundTime: req.body.roundTime || 60,
        gridSize: req.body.gridSize || 16,
        userId: req.body._id,
      });

      await lobby.save().catch((error) => {
        return res.status(500).json({
          error: 'Failed to save lobby',
        });
      });

      res.status(201).json({
        roomId: lobby.roomId,
        lobby,
        message: 'Lobby created successfully',
      });
    } catch (error) {
      console.error('Create lobby error:', error);
      res.status(400).json({
        error: 'Failed to create lobby',
      });
    }
  },

  getLobbyById: async (req, res) => {
    try {
      const { roomId } = req.params;
      if (!roomId)
        return res.status(400).json({ message: 'Room ID is required' });

      const lobby = await Lobby.findOne({ roomId });
      if (!lobby)
        return res.status(404).json({
          message: 'Lobby not found',
        });

      res.status(200).json({
        lobby,
      });
    } catch (error) {
      console.error('Get lobby error:', error);
      res.status(400).json({
        error: 'Failed to get lobby',
      });
    }
  },

  updateLobby: async (req, res) => {
    try {
      const { lobbyId } = req.params;
      const updates = req.body;

      const lobby = await Lobby.findOneAndUpdate({ _id: lobbyId }, updates, {
        new: true,
        runValidators: true,
      });

      if (!lobby) {
        return res.status(404).json({
          message: 'Lobby not found',
        });
      }

      res.status(200).json({
        lobby,
      });
    } catch (error) {
      res.status(500).json({
        message: 'Failed to update lobby',
        error: error.message,
      });
    }
  },
};
