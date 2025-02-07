import Lobby from "./models/lobby.js";

export class GameManager {
  constructor(io) {
    this.games = new Map();
    this.io = io;
    this.initialize();
  }

  async initialize() {
    await this.loadActiveLobbies();
    this.setupSocketListeners();
  }

  async loadActiveLobbies() {
    const lobbies = await Lobby.find({ isArchived: false });
    lobbies.forEach(lobby => {
      this.games.set(lobby.roomId, {
        players: lobby.players,
        gameState: lobby.gameState,
        settings: lobby.settings,
      });
    });
  }

  setupSocketListeners() {
    this.io.on("connection", (socket) => {
      socket.on("joinLobby", data => this.handlePlayerJoin(socket, data));
      socket.on("chatMessage", data => this.handleChatMessage(data));
      socket.on("leaveLobby", data => this.handlePlayerLeave(socket, data));
    });
  }

  async handlePlayerJoin(socket, { roomId, username, userId }) {
    if (!roomId || !username || !userId) return;

    try {
      const lobby = await Lobby.findOneAndUpdate(
        { roomId },
        { $addToSet: { players: { userId, username, score: 0 } } },
        { new: true }
      );

      if (!lobby) return;

      socket.join(roomId);
      
      const players = lobby.players.map(p => ({
        userId: p.userId?.toString(),
        username: p.username,
        score: p.score
      }));

      this.io.to(roomId).emit("playerUpdate", players);
      this.games.set(roomId, {
        players: lobby.players,
        gameState: lobby.gameState,
        settings: lobby.settings,
      });
    } catch (error) {
      console.error("[SERVER] Error in handlePlayerJoin:", error);
    }
  }

  async handleChatMessage({ roomId, message, username }) {
    if (!roomId || !message || !username) return;

    try {
      const newMessage = {
        user: username,
        message,
        timestamp: new Date()
      };

      await Lobby.findOneAndUpdate(
        { roomId },
        { $push: { messages: newMessage } }
      );

      this.io.to(roomId).emit("chatMessage", newMessage);
    } catch (error) {
      console.error("[SERVER] Error in handleChatMessage:", error);
    }
  }

  async handlePlayerLeave(socket, { roomId, userId }) {
    if (!roomId || !userId) return;
    
    try {
      const lobby = await Lobby.findOneAndUpdate(
        { roomId },
        { $pull: { players: { userId } } },
        { new: true }
      );

      if (!lobby) return;

      socket.leave(roomId);
      
      if (lobby.players.length === 0) {
        this.games.delete(roomId);
        await Lobby.findOneAndUpdate(
          { roomId },
          { gameState: "finished" }
        );
      } else {
        const players = lobby.players.map(p => ({
          userId: p.userId?.toString(),
          username: p.username,
          score: p.score
        }));
        
        this.io.to(roomId).emit("playerUpdate", players);
      }
    } catch (error) {
      console.error("[SERVER] Error in handlePlayerLeave:", error);
    }
  }

  getGame(gameId) {
    return this.games.get(gameId);
  }
}
