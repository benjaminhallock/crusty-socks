import { io } from "socket.io-client";

import { ENV_CONFIG, SOCKET_EVENTS as se } from "../constants.js";

class SocketManager {
  constructor() {
    this.socket = null;
    this.messageCallbacks = new Set();
    this.chatHistoryCallbacks = new Set();
    this.playerCallbacks = new Set();
    this.gameStateCallbacks = new Set();
    this.soundCallbacks = new Set();
    this.canvasCallbacks = new Set();
    this.wordOptionsCallbacks = new Set();
    this.currentRoom = { roomId: null, lobbyId: null };
    this.connectionStatus = "disconnected";
    this.statusCallbacks = new Set();
    this.navigate = null; // Add navigation function storage
  }

  setNavigate(navigate) {
    this.navigate = navigate;
  }

  async connect(userData, roomId) {
    if (this.isConnected()) {
      console.log("Already connected to socket");
      this.currentRoom = { roomId, username: userData.username };
      this.socket.emit(se.CONNECT_ACK, userData, roomId);
      return Promise.resolve();
    }

    // If we're already trying to connect, return the existing promise
    if (this._connectPromise) {
      return this._connectPromise;
    }

    this._disconnect();
    this.setStatus("connecting");

    this._connectPromise = new Promise((resolve, reject) => {
      try {
        console.log(
          `[SocketManager] Connecting to ${ENV_CONFIG.getClientSocketUrl()}`
        );

        this.socket = io(ENV_CONFIG.getClientSocketUrl(), {
          withCredentials: true,
          transports: ["websocket", "polling"],
          autoConnect: true,
          reconnection: true,
          reconnectionAttempts: 5,
          reconnectionDelay: 1000,
          reconnectionDelayMax: 5000,
          timeout: 20000,
        });

        // Set up connection listeners
        this.socket.on("connect", () => {
          this.setStatus("connected");
          this.currentRoom = { roomId, username: userData.username };
          this.setupEventListeners();
          console.log("Socket connected:", this.socket.id);
          this.socket.emit(se.CONNECT_ACK, userData, roomId);
          resolve();
        });

        // Set connection timeout
        const timeout = setTimeout(() => {
          if (!this.isConnected()) {
            const error = new Error("Connection timeout");
            this._disconnect();
            reject(error);
          }
        }, 10000);

        this.socket.once("connect", () => {
          clearTimeout(timeout);
        });
      } catch (error) {
        this._disconnect();
        reject(error);
      }
    }).finally(() => {
      this._connectPromise = null;
    });

    return this._connectPromise;
  }

  setupEventListeners() {
    if (!this.socket) return;

    // Clear existing listeners
    this.socket.removeAllListeners();

    // Connection related events
    this.socket.on("disconnect", (reason) => {
      console.log(`Socket disconnected: ${reason}`);
      this.setStatus("disconnected");
    });

    this.socket.on("connect_timeout", (timeout) => {
      console.log("Connection timed out:", timeout);
      this.setStatus("connection-timeout");
    });

    this.socket.on("error", (error) => {
      console.error("Socket error:", error);
      this.setStatus("error");

      // Handle specific error cases
      if (error.message?.includes("lobby is full") && this.navigate) {
        alert("This lobby is full. You'll be redirected to the home page.");
        this.navigate("/");
      } else if (
        error.message?.includes("kicked from the game") &&
        this.navigate
      ) {
        alert("You have been kicked from the game.");
        this.navigate("/");
      } else if (error.message) {
        alert("Error: " + error.message);
      }
    });

    this.socket.on("reconnect_attempt", (attemptNumber) => {
      console.log(`Reconnection attempt #${attemptNumber}`);
      this.setStatus("reconnecting");
    });

    this.socket.on("reconnect_failed", () => {
      console.log("Failed to reconnect after maximum attempts");
      this.setStatus("connection-failed");
      if (this.navigate) {
        alert("Connection failed. You'll be redirected to the home page.");
        this.navigate("/");
      }
    });

    // Game events
    this.socket.on(se.SOUND, (data) => {
      if (!data) return console.error("Invalid sound data:", data);
      this.soundCallbacks.forEach((cb) => cb(data));
    });

    this.socket.on(se.GAME_STATE_UPDATE, (data) => {
      if (!data?.lobby) return console.error("Invalid game state data:", data);
      this.gameStateCallbacks.forEach((cb) => cb(data));
    });

    this.socket.on(se.CHAT_MESSAGE, (data) => {
      this.messageCallbacks.forEach((cb) => cb(data));
    });

    this.socket.on(se.CHAT_HISTORY, (data) => {
      this.chatHistoryCallbacks.forEach((cb) => cb(data));
    });

    this.socket.on(se.PLAYER_UPDATE, (data) => {
      this.playerCallbacks.forEach((cb) => cb(data));
    });

    this.socket.on(se.CANVAS_UPDATE, (data) => {
      this.canvasCallbacks.forEach((cb) => cb(data));
    });
  }

  _disconnect() {
    if (!this.socket) return;

    try {
      // Clear any pending connection promise
      this._connectPromise = null;

      // Remove all listeners
      this.socket.offAny();
      this.socket.removeAllListeners();

      // Ensure disconnect
      if (this.socket.connected) {
        this.socket.disconnect();
      }
      this.socket.close();
    } catch (err) {
      console.error("Error during socket disconnect:", err);
    } finally {
      this.socket = null;
      this.setStatus("disconnected");
      this.currentRoom = null;
    }
  }

  startGame(roomId) {
    if (!this.isConnected())
      return console.warn("Cannot start game - Socket is not connected");
    this.socket.emit(se.START_GAME, roomId);
  }

  selectWord(roomId, word) {
    if (!this.isConnected())
      return console.warn("Cannot select word - Socket is not connected");
    this.socket.emit(se.SELECT_WORD, { roomId, word });
  }

  checkWordGuess(roomId, guess, username) {
    if (!this.isConnected()) {
      throw new Error("Cannot check word guess - Socket is not connected");
    }
    roomId = roomId || this.currentRoom?.roomId;

    if (!roomId || !guess || !username) {
      throw new Error("Invalid guess parameters");
    }

    this.socket.emit(se.CHECK_WORD_GUESS, {
      roomId,
      guess: guess.trim(),
      username,
      timestamp: Date.now(),
    });
  }

  endRound(roomId) {
    if (!this.isConnected()) console.warn("Socket not connected");
    this.socket.emit(se.END_ROUND, roomId);
  }

  leaveLobby(roomId, currentUsername) {
    if (!this.isConnected())
      return console.warn("Cannot leave lobby - Socket is not connected");
    this.socket.emit(se.LEAVE_LOBBY, { roomId, username: currentUsername });
    this._disconnect();
  }

  kickPlayer(roomId, username) {
    if (!this.isConnected())
      return console.error("Cannot kick player - Socket is not connected");
    console.log(`Kicking player: ${username} from room: ${roomId}`);
    this.socket.emit(se.KICK_PLAYER, { roomId, username });
  }

  reportPlayer(roomId, username) {
    if (!this.isConnected())
      throw new Error("Cannot report player - Socket is not connected");
    console.log(`Reporting player: ${username} in room: ${roomId}`);
    this.socket.emit(se.REPORT_PLAYER, { roomId, username });
  }
  sendMessage(lobbyObjectId, message, username) {
    if (!this.isConnected()) {
      throw new Error("Cannot send message - Socket is not connected");
    }

    if (!lobbyObjectId || !message || !username) {
      throw new Error("Invalid message parameters");
    }

    this.socket.emit(se.CHAT_MESSAGE, {
      _id: lobbyObjectId,
      roomId: this.currentRoom.roomId,
      lobbyObjectId,
      message,
      username,
    });
  }

  updateCanvas({ canvasState, roomId }) {
    if (!this.isConnected()) {
      console.warn("Socket not connected, canvas update will be dropped");
      return false;
    }

    if (!canvasState?.data) {
      console.warn("Invalid canvas state");
      return false;
    }

    roomId = roomId || this.currentRoom?.roomId;
    if (!roomId) {
      console.warn("No room ID for canvas update");
      return false;
    }

    // Use socket.io's built-in throttling mechanism
    this.socket.volatile.compress(true).emit(se.CANVAS_UPDATE, {
      roomId,
      canvasState: {
        data: canvasState.data,
        timestamp: canvasState.timestamp || Date.now(),
      },
    });
    return true;
  }

  // Add a method to request chat history
  requestChatHistory(lobbyObjectId, username) {
    if (!this.isConnected()) {
      console.warn("Cannot request chat history - Socket not connected");
      return;
    }
    this.socket.emit(se.REQUEST_CHAT_HISTORY, {
      lobbyObjectId,
      username,
    });
  }

  // Connection status management
  getStatus() {
    return this.connectionStatus;
  }

  setStatus(status) {
    this.connectionStatus = status;
    this.statusCallbacks.forEach((callback) => callback(status));
  }

  onStatusChange(callback) {
    this.statusCallbacks.add(callback);
    callback(this.connectionStatus);
    return () => this.statusCallbacks.delete(callback);
  }

  isConnected() {
    return this.socket?.connected;
  }

  onSoundNotification(callback) {
    if (!this.isConnected()) {
      console.warn("Socket not connected, sound notification will be dropped");
      return false;
    }

    this.soundCallbacks.add(callback);
    return () => this.soundCallbacks.delete(callback);
  }

  // Event subscriptions
  onMessage(callback) {
    this.messageCallbacks.add(callback);
    return () => this.messageCallbacks.delete(callback);
  }

  onPlayerUpdate(callback) {
    this.playerCallbacks.add(callback);
    return () => this.playerCallbacks.delete(callback);
  }

  onGameStateUpdate(callback) {
    this.gameStateCallbacks.add(callback);
    return () => this.gameStateCallbacks.delete(callback);
  }

  onCanvasUpdate(callback) {
    // Add requestAnimationFrame to smooth out canvas updates
    const wrappedCallback = (data) => {
      if (!data?.canvasState?.data) return;
      requestAnimationFrame(() => callback(data));
    };

    this.canvasCallbacks.add(wrappedCallback);
    return () => this.canvasCallbacks.delete(wrappedCallback);
  }

  onWordOptions(callback) {
    this.wordOptionsCallbacks.add(callback);
    return () => this.wordOptionsCallbacks.delete(callback);
  }

  // Add subscription method for chat history
  onChatHistory(callback) {
    this.chatHistoryCallbacks.add(callback);
    return () => this.chatHistoryCallbacks.delete(callback);
  }
}
// Export a singleton instance
export const socketManager = new SocketManager();
