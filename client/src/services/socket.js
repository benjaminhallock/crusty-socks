import { io } from "socket.io-client";
import { ENV_CONFIG } from "../../../shared/constants.js";
import { SOCKET_EVENTS } from "../../../shared/constants.js";

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
      console.log("Socket already connected");
      return;
    }

    if (!this.socket) {
      console.log("Creating new socket instance");
      this.socket = io(ENV_CONFIG.SOCKET_URL, {
        withCredentials: true,
        transports: ["polling", "websocket"],
        autoConnect: false,
        reconnection: true,
        reconnectionAttempts: 5,
        reconnectionDelay: 1000,
        reconnectionDelayMax: 5000,
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
      console.log("Received game state update:", lobby);
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
    console.log("Initiating game start for room:", roomId);
    if (!this.isConnected()) {
      throw new Error("Cannot start game - Socket is not connected");
    }
    this.socket.emit(SOCKET_EVENTS.START_GAME, roomId);
  }

  // Room management methods
  joinLobby(roomId, username) {
    if (!this.isConnected())
      throw new Error("Cannot join lobby - Socket is not connected");
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
    this.socket.emit("selectWord", { roomId, word });
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
    // console.log('Sending canvas update');
    if (!this.isConnected() || !this.currentRoom) {
      throw new Error(
        "Cannot update canvas - Socket is not connected or no room joined"
      );
    }
    this.socket.emit(SOCKET_EVENTS.CANVAS_UPDATE, {
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
    console.log("Adding new message callback");
    if (!this.socket) {
      this.connect();
    }
    this.messageCallbacks.add(callback);
    return () => this.messageCallbacks.delete(callback);
  }

  onPlayerUpdate(callback) {
    console.log("Adding new player update callback");
    if (!this.socket) {
      this.connect();
    }
    this.playerCallbacks.add(callback);
    return () => this.playerCallbacks.delete(callback);
  }

  onGameStateUpdate(callback) {
    console.log("Adding new game state callback");
    if (!this.socket) {
      this.connect();
    }
    this.gameStateCallbacks.add(callback);
    return () => this.gameStateCallbacks.delete(callback);
  }

  onCanvasUpdate(callback) {
    console.log("Adding new canvas update callback");
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
    console.log("Removing game state callbacks");
    this.gameStateCallbacks.clear();
  }

  // Handles kicking a player

  // Cleanup method
  disconnect() {
    console.log("Disconnecting socket");
    if (this.socket) {
      this.socket.disconnect();
      this.socket = null;
    }
  }

  // Handles kicking a player
  kickPlayer(roomId, username) {
    console.log(`Attempting to kick player: ${username} from room: ${roomId}`);

    if (!this.isConnected()) {
      console.error("Cannot kick player - Socket is not connected");
      return;
    }

    this.socket.emit("kick", { roomId, username });
  }
}

// Export a singleton instance
export const socketManager = new SocketManager();
