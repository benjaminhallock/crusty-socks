import { GAME_STATE } from '../../shared/constants.js';
import Lobby from '../models/lobby.js';

export const lobbyController = {
  /**
   * Get all lobbies
   * Returns the list of all game lobbies
   */
  getAllLobbies: async (req, res) => {
    try {
      const lobbies = await Lobby.find({});
      res.status(200).json({ success: true, lobbies });
    } catch (error) {
      console.error('Get all lobbies error:', error);
      res.status(400).json({
        success: false,
        message: 'Failed to get lobbies'
      });
    }
  },

  /**
   * Create a new lobby
   * Creates a new game room with the provided settings
   */
  createLobby: async (req, res) => {
    try {
      // Generate a random room ID
      const roomId = Math.random().toString(36).substring(2, 8);
      
        // Create a new lobby instance

        
        const lobby = new Lobby({
        roomId,
        maxRounds: req.body.maxRounds || 3,
        revealCharacters: req.body.revealCharacters || 0,
        selectCategory: req.body.selectCategory || 'random',
        playerLimit: req.body.playerLimit || 8,
        selectWord: req.body.selectWord || 1,
        });
    
      await lobby.save();
      
      res.status(201).json({ 
        success: true, 
        roomId, 
        lobby 
      });
    } catch (error) {
      console.error('Create lobby error:', error);
      res.status(400).json({
        success: false,
        message: 'Failed to create lobby'
      });
    }
  },

  /**
   * Get lobby by ID
   * Retrieves a specific lobby by its roomId
   */
  getLobbyById: async (req, res) => {
    try {
      const lobby = await Lobby.findOne({ roomId: req.params.roomId });
      
      if (!lobby) {
        return res.status(404).json({
          success: false,
          message: 'Lobby not found'
        });
      }
      res.json({ success: true, lobby });
    } catch (error) {
      console.error('Get lobby error:', error);
      res.status(400).json({
        success: false,
        message: 'Failed to get lobby'
      });
    }
  }
};
