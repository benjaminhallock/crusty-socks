import Lobby from '../models/lobby.js';

export const lobbyController = {
  getAllLobbies: async (req, res) => {
    try {
      const lobbies = await Lobby.find({});
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
      const lobby = await Lobby.findOne({ roomId: req.params.roomId });
      if (lobby) {
        res.status(200).json({ lobby });
      } else {
        res.status(404).json({ error: 'Lobby not found' });
      }
    } catch (error) {
      console.error('Get lobby error:', error);
      res.status(400).json({
        success: false,
        error: 'Failed to get lobby',
      });
    }
  },

  updateLobby: async (req, res) => {
    try {
      const { lobbyId } = req.params;
      const updates = req.body;
      
      const lobby = await Lobby.findOneAndUpdate(
        { _id: lobbyId },
        updates,
        { new: true, runValidators: true }
      );
      
      if (!lobby) {
        return res.status(404).json({
          success: false,
          message: 'Lobby not found'
        });
      }
      
      res.status(200).json({
        success: true,
        lobby
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: 'Failed to update lobby',
        error: error.message
      });
    }
  },
};
