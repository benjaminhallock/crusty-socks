import { GAME_STATE, SOCKET_EVENTS } from "../shared/constants.js";
import { WORD_LIST } from "../shared/constants.js";
import Lobby from "./models/lobby.js";
import User from "./models/user.js";

/**
 * GameManager Class
 * Central hub for managing game state, player connections, and real-time game events
 * Handles all socket.io events for the game's server-side logic
 */
class GameManager {
  constructor(io) {
    console.log('Initializing GameManager');
    this.io = io; // Socket.io server instance
    // Map to track active player connections: socketId -> {roomId, username}
    this.activeConnections = new Map();
    this.setupSocketListeners(io);
  }

  setupSocketListeners(io) {
    console.log('Setting up socket event listeners');
    
    io.on("connection", (socket) => {
      console.log('New player connected:', socket.id);

      // Send immediate acknowledgment of connection
      socket.emit('connect_ack', { id: socket.id });

      // Handle initial connection error
      socket.on("error", (error) => {
        console.error("Socket error:", error);
        socket.emit("error", "Connection error occurred");
      });

      // Game initialization event
      socket.on("startGame", async (roomId) => {
        console.log('Starting new game in room:', roomId);
        socket.join(roomId);
        
        const lobby = await Lobby.findOne({ roomId });
        if (!lobby) {
          console.error("Cannot start game - Lobby not found:", roomId);
          return;
        }

        // Initialize game state with random drawer and words
        const drawerIndex = Math.floor(Math.random() * lobby.players.length);
        const drawer = lobby.players[drawerIndex];
        const words = WORD_LIST.sort(() => 0.5 - Math.random()).slice(0, 3);
        
        console.log('Selected drawer:', drawer.username);
        console.log('Selected words:', words);

        // Update lobby state
        lobby.currentDrawer = drawer.username;
        lobby.gameState = GAME_STATE.PICKING_WORD;
        lobby.currentWord = words.join(", ");
        await lobby.save();

        // Broadcast new game state to all players in room
        io.to(roomId).emit(SOCKET_EVENTS.GAME_STATE_UPDATE, { lobby });
      });

      // Chat message handling
      socket.on("chatMessage", async ({ roomId, message, username }) => {
        console.log('New chat message:', { roomId, username, message });
        
        if (!roomId || !message || !username) {
          console.error('Invalid chat message data');
          return;
        }

        const messageData = { username, message, timestamp: Date.now() };
        
        // Store message in database and broadcast to room
        await Lobby.findOneAndUpdate(
          { roomId },
          { $push: { messages: messageData } }
        );
        io.to(roomId).emit("chatMessage", messageData);
      });

      // Word selection handling
      socket.on("selectWord", async ({ roomId, word }) => {
        console.log('Word selected for room:', { roomId, word });
        
        const lobby = await Lobby.findOne({ roomId });
        if (!lobby) {
          console.error('Cannot select word - Lobby not found');
          return;
        }

        // Update game state and broadcast
        lobby.currentWord = word;
        lobby.gameState = GAME_STATE.DRAWING;
        await lobby.save();
        
        io.to(roomId).emit(SOCKET_EVENTS.GAME_STATE_UPDATE, { lobby });
      });

      // Lobby join handling
      socket.on(SOCKET_EVENTS.JOIN_LOBBY, async ({ roomId, username }) => {
        console.log('Player joining lobby:', { roomId, username });
        
        if (!roomId || !username) {
          console.error('Invalid lobby join data');
          return;
        }

        // Find user by username
        const user = await User.findOne({ username });
        if (!user) {
          console.error("Cannot join - User not found:", username);
          return;
        }

        try {
          let lobby = await Lobby.findOne({ roomId });
          if (!lobby) {
            console.error("Cannot join - Lobby not found:", roomId);
            return;
          }

          // Check if player is already in lobby
          if (lobby.players.find((p) => p.userId === user._id)) {
            console.error("Player already in lobby:", user.username);
            return;
          }

          // Add player to lobby
          lobby.players.push({ username: user.username, userId: user._id, score: 1000 });
          await lobby.save();
          
          // Set up socket room and track connection
          socket.join(roomId);
          socket.roomId = roomId;
          this.activeConnections.set(socket.id, { roomId, username });

          // Broadcast updates to all players
          io.to(roomId).emit(SOCKET_EVENTS.GAME_STATE_UPDATE, { lobby });
          io.to(roomId).emit("chatMessage", {
            username: "Server",
            message: `${username} has joined the lobby`,
            timestamp: Date.now(),
          });
        } catch (error) {
          console.error("Error in joinLobby:", error);
        }
      });

      // Canvas update handling
      socket.on("updateCanvas", async ({ roomId, pixels }) => {
        console.log('Canvas update received for room:', roomId);
        
        if (!roomId || !pixels) {
          console.error('Invalid canvas update data');
          return;
        }

        // Store canvas state and broadcast update
        const lobby = await Lobby.findOneAndUpdate(
          { roomId },
          { canvasState: { pixels, lastUpdate: Date.now() } },
          { new: true }
        );
        io.to(roomId).emit("canvasUpdate", lobby.canvasState);
      });

      // Disconnect handling
      socket.on("disconnect", async () => {
        console.log('Player disconnected:', socket.id);
        
        const connection = this.activeConnections.get(socket.id);
        if (connection) {
          const { roomId, username } = connection;
          
          // Remove player from lobby
          const lobby = await Lobby.findOneAndUpdate(
            { roomId },
            { $pull: { players: { username } } },
            { new: true }
          );

          // Clean up empty lobbies or update player list
          if (lobby && lobby.players.length === 0) {
            console.log('Removing empty lobby:', roomId);
            await Lobby.deleteOne({ roomId });
          } else if (lobby) {
            io.to(roomId).emit("playerUpdate", lobby.players);
          }

          this.activeConnections.delete(socket.id);
        }
      });
    });
  }
}

// Export factory function to create GameManager instance
export const initializeSocketEvents = (io) => {
  return new GameManager(io);
};
