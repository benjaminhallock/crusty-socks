import Lobby from '../models/lobby.js';

export const lobbyController = {
  getAllLobbies: async (req, res) => {
    try {
      const lobbies = await Lobby.find();
      
      if (!lobbies || lobbies.length === 0) {
        return res.status(404).json({
          success: false,
          message: 'No lobbies found'
        });
      }

      res.status(200).json({
        success: true,
        lobbies,
      });
    } catch (error) {
      console.error('Get all lobbies error:', error);
      res.status(400).json({
        success: false,
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
          success: false,
          message: 'User ID and room ID are required',
        });
      }
      const lobby = await Lobby.findOne({ roomId });
      if (!lobby) {
        return res.status(404).json({
          success: false,
          message: 'Lobby not found',
        });
      }

      if (lobby.players.length === 0) {
        return res.status(400).json({
          success: false,
          message: 'No players in the lobby to leave',
        });
      }
      const player = lobby.players.find(
        (p) => p.userId.toString() === userId.toString()
      );
      if (!player) {
        return res.status(400).json({
          success: false,
          message: 'Player not found in the lobby',
        });
      }

      // Remove the player from the lobby
      lobby.players = lobby.players.filter(
        (p) => p.userId.toString() !== userId.toString()
      );

      await lobby.save();

      res.status(200).json({
        success: true,
        message: 'Left the lobby successfully',
      });
    } catch (error) {
      console.error('Leave lobby error:', error);
      res.status(400).json({
        success: false,
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
      });
      await lobby.save();
      res.status(201).json({
        success: true,
        roomId: lobby.roomId,
        lobby,
        message: 'Lobby created successfully',
      });
    } catch (error) {
      res.status(400).json({
        success: false,
        error: 'Failed to create lobby',
      });
    }
  },

  getLobbyById: async (req, res) => {
    try {
      const { roomId } = req.params;
      if (!roomId) {
        return res.status(400).json({
          success: false,
          message: 'Room ID is required',
        });
      }
      const lobby = await Lobby.findOne({ roomId });
      if (lobby) {
        res.status(200).json({ lobby });
      } else {
        res.status(404).json({ error: 'Lobby not found' });
      }
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
          success: false,
          message: 'Lobby not found',
        });
      }

      res.status(200).json({
        success: true,
        lobby,
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: 'Failed to update lobby',
        error: error.message,
      });
    }
  },
};
