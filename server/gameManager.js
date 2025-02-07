import Lobby from "./models/lobby.js";

export class GameManager {
  constructor(io) {
    this.games = {};
    this.io = io;
    this.initialize();
  }

  async initialize() {
    try {
      // Load active games from database
      const lobbies = await Lobby.find({ isArchived: false });
      lobbies.forEach((lobby) => {
        this.games[lobby.roomId] = {
          players: lobby.players,
          gameState: lobby.gameState,
          currentRound: 0,
          settings: lobby.settings,
        };
      });
      console.log(`[SERVER] Loaded ${lobbies.length} active lobbies`);
      
      // Set up socket connection handling
      this.setupSocketListeners();
    } catch (error) {
      console.error("[SERVER] Error loading lobbies:", error);
    }
  }

  setupSocketListeners() {
    this.io.on("connection", (socket) => {
      console.log("[SERVER] New connection:", socket.id);

      // Handle player joining a lobby
      socket.on("joinLobby", async ({ roomId, username, userId }) => {
        if (!roomId || !username || !userId) {
          console.error("[SERVER] Missing required fields for join:", { roomId, username, userId });
          return;
        }
        await this.handlePlayerJoin(socket, roomId, username, userId);
      });

      // Handle chat messages
      socket.on("chatMessage", async ({ roomId, message, username }) => {
        await this.handleChatMessage(roomId, message, username);
      });

      // Handle player leaving
      socket.on("leaveLobby", async ({ roomId, userId }) => {
        if (!roomId || !userId) return;
        
        try {
          const updatedLobby = await Lobby.findOneAndUpdate(
            { roomId },
            { $pull: { players: { userId: userId } } },
            { new: true }
          );

          if (!updatedLobby) return;

          socket.leave(roomId);
          
          // Update other clients
          const players = updatedLobby.players.map(player => ({
            userId: player.userId?.toString(),
            username: player.username,
            score: player.score
          }));
          this.io.to(roomId).emit("playerUpdate", players);

          // Clean up empty lobby
          if (updatedLobby.players.length === 0) {
            await this.deleteGame(roomId);
          }
        } catch (error) {
          console.error("[SERVER] Error in leaveLobby:", error);
        }
      });

      // Handle disconnection
      socket.on("disconnect", () => {
        console.log("[SERVER] Disconnected:", socket.id);
      });
    });
  }

  async handlePlayerJoin(socket, roomId, username, userId) {
    try {
      // First check if player already exists in the lobby
      const existingLobby = await Lobby.findOne({ 
        roomId,
        'players.userId': userId 
      });

      if (existingLobby) {
        // Player already exists in lobby, just join the socket room
        socket.join(roomId);
        
        // Send current player list
        const players = existingLobby.players.map(player => ({
          userId: player.userId?.toString(),
          username: player.username,
          score: player.score
        }));
        
        this.io.to(roomId).emit("playerUpdate", players);
        return;
      }

      // Player doesn't exist, add them to the lobby
      const lobbyWithNewPlayer = await Lobby.findOneAndUpdate(
        { roomId },
        {
          $addToSet: { // Use addToSet to prevent duplicates
            players: {
              userId,
              username,
              score: 0
            }
          }
        },
        { new: true }
      );

      if (!lobbyWithNewPlayer) {
        console.error("[SERVER] Lobby not found:", roomId);
        return;
      }

      socket.join(roomId);

      // Send updated player list to all clients in room
      const players = lobbyWithNewPlayer.players.map(player => ({
        userId: player.userId?.toString(),
        username: player.username,
        score: player.score
      }));

      this.io.to(roomId).emit("playerUpdate", players);

      // Update local game state
      if (!this.games[roomId]) {
        this.games[roomId] = {
          players: lobbyWithNewPlayer.players,
          gameState: lobbyWithNewPlayer.gameState,
          currentRound: 0,
          settings: lobbyWithNewPlayer.settings,
        };
      } else {
        this.games[roomId].players = lobbyWithNewPlayer.players;
      }
    } catch (error) {
      console.error("[SERVER] Error in handlePlayerJoin:", error);
    }
  }

  async handleChatMessage(roomId, message, username) {
    try {
      const lobby = await Lobby.findOne({ roomId });
      if (!lobby) return;

      const newMessage = {
        user: username,
        message,
        timestamp: new Date(),
      };

      // Save message to database
      lobby.messages = [...(lobby.messages || []), newMessage];
      await lobby.save();

      // Send to all clients in room
      this.io.to(roomId).emit("chatMessage", newMessage);
    } catch (error) {
      console.error("[SERVER] Error in handleChatMessage:", error);
    }
  }

  // Game management methods
  async createGame(gameId, game) {
    this.games[gameId] = game;
    try {
      const lobby = await Lobby.findOne({ roomId: gameId });
      if (lobby) {
        lobby.gameState = game.status;
        lobby.players = game.players;
        await lobby.save();
      }
    } catch (error) {
      console.error("[SERVER] Error creating game:", error);
    }
  }

  async deleteGame(gameId) {
    try {
      await Lobby.findOneAndUpdate(
        { roomId: gameId },
        { gameState: "finished" }
      );
      delete this.games[gameId];
    } catch (error) {
      console.error("[SERVER] Error deleting game:", error);
    }
  }

  async syncGameState(gameId) {
    try {
      const game = this.games[gameId];
      if (!game) return;

      await Lobby.findOneAndUpdate(
        { roomId: gameId },
        {
          gameState: game.status,
          players: game.players,
        }
      );
    } catch (error) {
      console.error("[SERVER] Error syncing game:", error);
    }
  }

  getGame(gameId) {
    return this.games[gameId];
  }
}
