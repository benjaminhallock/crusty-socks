import { GAME_CONSTANTS } from "../shared/constants.js";
import Lobby from "./models/lobby.js";

export class GameManager {
  constructor(io) {
    this.io = io;
    this.activeConnections = new Map(); // socketId -> {roomId, username}
    this.setupSocketListeners(io);
  }

  setupSocketListeners(io) {
    io.on("connection", (socket) => {

      // Handle the start game event
      socket.on("startGame", async (roomId) => {
        const lobby = await Lobby.findOne({ roomId });
        if (!lobby) return;
        
        lobby.gameState = GAME_CONSTANTS.GAME_STATES.PLAYING;
        await lobby.save();
        io.to(roomId).emit("gameStateUpdate", lobby.gameState);
      });

      //Handle join lobby event
      socket.on("joinLobby", async ({ roomId, username }) => {
        if (!roomId || !username) return;

        try {
          // Step 1: Find or create lobby
          let lobby = await Lobby.findOneAndUpdate(
            { roomId },
            { 
              $setOnInsert: { 
                roomId, 
                gameState: GAME_CONSTANTS.GAME_STATES.WAITING,
                players: []
              } 
            },
            { upsert: true, new: true }
          );

          // Step 2: Remove existing player if present
          await Lobby.findOneAndUpdate(
            { roomId },
            { $pull: { players: { username } } }
          );

          // Step 3: Add the player with new socket ID
          lobby = await Lobby.findOneAndUpdate(
            { roomId },
            { $push: { players: { username, socketId: socket.id, score: 0 } } },
            { new: true }
          );

          socket.join(roomId);
          socket.roomId = roomId;
          this.activeConnections.set(socket.id, { roomId, username });

          io.to(roomId).emit("playerUpdate", lobby.players);
        } catch (error) {
          console.error("Error in joinLobby:", error);
        }
      });

      // Handle the update canvas event
      socket.on("updateCanvas", async ({ roomId, pixels }) => {
        if (!roomId || !pixels) return;

        const lobby = await Lobby.findOneAndUpdate
          ({ roomId },
          { canvasState: { pixels, lastUpdate: Date.now() } },
          { new: true }
        );

        io.to(roomId).emit("canvasUpdate", lobby.canvasState);
      });
      
      socket.on("disconnect", async () => {
        const connection = this.activeConnections.get(socket.id);
        if (connection) {
          const { roomId, username } = connection;
          
          const lobby = await Lobby.findOneAndUpdate(
            { roomId },
            { $pull: { players: { username } } },
            { new: true }
          );

          if (lobby && lobby.players.length === 0) {
            await Lobby.deleteOne({ roomId });
          } else if (lobby) {
            io.to(roomId).emit("playerUpdate", lobby.players);
          }

          this.activeConnections.delete(socket.id);
        }
      });

      socket.on("chatMessage", async ({ roomId, message, username }) => {
        if (!roomId || !message || !username) return;
        
        const messageData = { username, message, timestamp: Date.now() };
        await Lobby.findOneAndUpdate(
          { roomId },
          { $push: { messages: messageData } }
        );
        
        io.to(roomId).emit("chatMessage", messageData);
      });
    });
  }
}

export const initializeSocketEvents = (io) => {
  return new GameManager(io);
};
