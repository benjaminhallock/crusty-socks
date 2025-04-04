import { io } from "socket.io-client";

import { ENV_CONFIG, SOCKET_EVENTS } from "../constants.js";

class SocketManager {
  constructor() {
    console.log("Initializing SocketManager");
    this.socket = null;
    this.messageCallbacks = new Set(); // Handles chat messages
    this.playerCallbacks = new Set(); // Handles player updates (joins/leaves)
    this.gameStateCallbacks = new Set(); // Handles game state changes
    this.canvasCallbacks = new Set(); // Add new callback set for canvas updates
    this.currentRoom = null;
  }

  isConnected() {
    return this.socket && this.socket.connected;
  }

  connect(userData) {
    if (this.isConnected()) {
      console.log("Socket already connected, skipping connection");
      return;
    }

    if (!this.socket) {
      const socketUrl = ENV_CONFIG.getClientSocketUrl();
      console.log("Creating new socket instance connecting to:", socketUrl);
      
      this.socket = io(socketUrl, {
        withCredentials: true,
        transports: ["websocket", "polling"],
        autoConnect: false,
        reconnection: false, // Disable auto-reconnection
        timeout: 45000,
        path: "/socket.io/",
      });

      this._setupSocketListeners();
    }

    if (!this.socket.connected) {
      console.log("Connecting socket...");
      this.socket.connect();
    }

    if (userData) {
      this.socket.userId = userData.id;
      this.socket.user = userData;
      this.socket.emit("user_connected", userData);
    }
  }

  _setupSocketListeners() {
    // Connection status handlers
    this.socket.on("connect", () => {
      console.log("Socket successfully connected", this.socket.id);
    });

    this.socket.on("connect_ack", (data) => {
      console.log("Client connection acknowledged:", data);
    });

    this.socket.on("connect_error", (error) => {
      console.error("Socket connection error:", error.message);
    });

    this.socket.on("connect_timeout", () => {
      console.error("Socket connection timeout");
    });

    this.socket.on("error", (error) => {
      console.error("Socket error:", error);
    });

    this.socket.on("disconnect", (reason) => {
      console.log("Socket disconnected - reason:", reason);
      if (reason === "transport close" || reason === "transport error") {
        console.log("Attempting reconnection...");
      }
    });

    this.socket.on(SOCKET_EVENTS.CHAT_MESSAGE, (message) => {
      console.log("Received chat message:", message);
      this.messageCallbacks.forEach((callback) => callback(message));
    });

    this.socket.on(SOCKET_EVENTS.PLAYER_UPDATE, (players) => {
      console.log("Received player update:", players);
      this.playerCallbacks.forEach((callback) => callback(players));
    });

    this.socket.on(SOCKET_EVENTS.GAME_STATE_UPDATE, ({ lobby }) => {
      console.log("Received game state update:", lobby.gameState);
      this.gameStateCallbacks.forEach((callback) => callback({ lobby }));
    });

    this.socket.on(SOCKET_EVENTS.CANVAS_UPDATE, (canvasData) => {
      this.canvasCallbacks.forEach((callback) => callback(canvasData));
    });

    this.socket.on("wordGuessResult", (result) => {
      if (result.correct) {
        this.messageCallbacks.forEach((callback) =>
          callback({
            username: "Server",
            message: `${result.username} guessed the word correctly! (+${result.points} points)`,
            timestamp: Date.now(),
          })
        );
      }
    });

    this.socket.on("kicked", () => {
      console.warn("You have been kicked from the game!");
      alert("You have been kicked from the game!");
      this.disconnect();
      window.location.href = "/";
    });
  }

  // Game control methods
  startGame(roomId) {
    if (!this.isConnected())
      throw new Error("Cannot start game - Socket is not connected");
    this.socket.emit(SOCKET_EVENTS.START_GAME, roomId);
  }

  // Room management methods
  joinLobby(roomId, username) {
    if (!this.isConnected()) {
      throw new Error("Cannot join lobby - Socket is not connected");
    }

    // Prevent joining same room multiple times
    if (
      this.currentRoom?.roomId === roomId &&
      this.currentRoom?.username === username
    ) {
      console.log("Already in this lobby, skipping join");
      return;
    }

    this.currentRoom = { roomId, username };
    this.socket.emit(SOCKET_EVENTS.JOIN_LOBBY, { roomId, username });
  }

  // Chat functionality
  sendMessage(roomId, message, username) {
    console.log("Sending chat message:", { roomId, message, username });
    if (!this.isConnected())
      throw new Error("Cannot send message - Socket is not connected");

    // Don't emit chat message if it's a potential word guess
    // The server will handle emitting the success message if it's correct
    if (
      !this.currentRoom?.currentWord
        ?.toLowerCase()
        .includes(message.toLowerCase())
    ) {
      this.socket.emit(SOCKET_EVENTS.CHAT_MESSAGE, {
        roomId,
        message,
        username,
      });
    }
  }

  // Game action methods
  selectWord(roomId, word) {
    console.log("Selecting word for game:", { roomId, word });
    if (!this.isConnected()) {
      throw new Error("Cannot select word - Socket is not connected");
    }
    this.socket.emit(SOCKET_EVENTS.SELECT_WORD, { roomId, word });
  }

  checkWordGuess(roomId, guess, username) {
    if (!this.isConnected() || !this.currentRoom) {
      throw new Error(
        "Cannot check word - Socket is not connected or no room joined"
      );
    }
    this.socket.emit(SOCKET_EVENTS.CHECK_WORD_GUESS, {
      roomId,
      guess,
      username,
    });
  }

  updateCanvas(canvasData) {
    if (!this.isConnected() || !this.currentRoom) {
      throw new Error(
        "Cannot update canvas - Socket is not connected or no room joined"
      );
    }
    // Emit immediately to all spectators
    this.socket.volatile.emit(SOCKET_EVENTS.CANVAS_UPDATE, {
      roomId: this.currentRoom.roomId,
      canvasData,
    });
  }

  endRound(roomId) {
    console.log("Ending round for room:", roomId);
    if (!this.isConnected()) {
      throw new Error("Cannot end round - Socket is not connected");
    }
    this.socket.emit(SOCKET_EVENTS.END_ROUND, roomId);
  }

  // Event subscription methods
  onMessage(callback) {
    if (!this.isConnected()) {
      console.log("Socket not connected, connecting...");
      this.connect();
    }
    this.messageCallbacks.add(callback);
    return () => this.messageCallbacks.delete(callback);
  }

  onPlayerUpdate(callback) {
    if (!this.isConnected()) {
      console.log("Socket not connected, connecting...");
      this.connect();
    }
    this.playerCallbacks.add(callback);
    return () => this.playerCallbacks.delete(callback);
  }

  onGameStateUpdate(callback) {
    if (!this.socket) {
      this.connect();
    }
    this.gameStateCallbacks.add(callback);
    return () => this.gameStateCallbacks.delete(callback);
  }

  onCanvasUpdate(callback) {
    if (!this.socket) {
      this.connect();
    }
    this.canvasCallbacks.add(callback);
    return () => this.canvasCallbacks.delete(callback);
  }

  leaveLobby(roomId, username) {
    console.log("Leaving lobby:", { roomId, username });
    if (!this.isConnected()) {
      throw new Error("Cannot leave lobby - Socket is not connected");
    }
    this.socket.emit(SOCKET_EVENTS.LEAVE_LOBBY, { roomId, username });
  }

  offGameStateUpdate() {
    this.gameStateCallbacks.clear();
  }

  // Handles kicking a player
  kickPlayer(roomId, username) {
    console.log(`Attempting to kick player: ${username} from room: ${roomId}`);
    if (!this.isConnected()) {
      console.error("Cannot kick player - Socket is not connected");
      return;
    }
    this.socket.emit(SOCKET_EVENTS.KICK_PLAYER, { roomId, username });
  }

  // Handles user leaving a room voluntarily
  leaveRoom(roomId) {
    console.log(`Leaving room: ${roomId}`);
    if (!this.isConnected() || !this.currentRoom) {
      console.error("Cannot leave room - Socket is not connected or no room joined");
      return;
    }
    
    const username = this.currentRoom.username;
    this.socket.emit(SOCKET_EVENTS.LEAVE_ROOM, { roomId, username });
    this.currentRoom = null;
    
    // Redirect to homepage
    window.location.href = "/";
  }

  // Cleanup method
  cleanup() {
    console.log("Cleaning up socket manager");
    this.currentRoom = null;
    this.gameStateCallbacks.clear();
    this.messageCallbacks.clear();
    this.playerCallbacks.clear();
    this.canvasCallbacks.clear();

    if (this.socket && this.socket.connected) {
      this.socket.disconnect();
    }
    // Don't null out the socket, just disconnect it
  }

  reportPlayer(roomId, username) {
    if (!this.isConnected()) {
      throw new Error("Cannot report player - Socket is not connected");
    }
    this.socket.emit(SOCKET_EVENTS.REPORT_PLAYER, { roomId, username });
  }
  
  disconnect() {
    console.log("Disconnecting socket");
    if (this.socket) {
      this.socket.disconnect();
      this.socket = null;
    }
  }
}

// Export a singleton instance
export const socketManager = new SocketManager();
