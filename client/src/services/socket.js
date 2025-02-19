import { io } from "socket.io-client";

import { ENV_CONFIG } from "../../../shared/constants.js";
import { SOCKET_EVENTS } from "../../../shared/constants.js";

class SocketManager {
  constructor() {
    this.socket = null;
    //A callback is 1+ functions that get called on a socket emit,
    // You can add a callback function to the set using the onMessage method
    this.messageCallbacks = new Set();
    this.playerCallbacks = new Set();
    this.gameStateCallbacks = new Set();
    this.currentRoom = null;
  }

  isConnected() {
    return this.socket && this.socket.connected;
  }

  connect(userData) {
    if (this.isConnected()) return;

    if (!this.socket) {
      this.socket = io(ENV_CONFIG.SOCKET_URL, {
        withCredentials: true,
        transports: ["websocket", "polling"],
        autoConnect: false,
        reconnection: true,
        extraHeaders: {
          "Access-Control-Allow-Origin": ENV_CONFIG.CLIENT_URL,
        },
      });

      // Add event handlers after socket creation
      this.socket.on("chatMessage", (message) => {
        this.messageCallbacks.forEach((callback) => callback(message));
      });

      this.socket.on("playerUpdate", (players) => {
        this.playerCallbacks.forEach((callback) => callback(players));
      });

      this.socket.on(SOCKET_EVENTS.GAME_STATE_UPDATE, ({ lobby }) => {
        // Handle the game state update here
        console.log('Received lobby update:', { lobby });
        this.gameStateCallbacks.forEach((callback) => callback({ lobby }));
      });

      this.socket.on("gameStateUpdate", (data) => {
        this.gameStateCallbacks.forEach((callback) => callback(data));
      });
    }
    this.socket.on("connect", () => {
      console.log("Socket connected");
    });
    this.socket.connect();
    if (this.isConnected() && userData) {
      this.socket.userId = userData.userId;
      this.socket.user = userData;
      this.socket.emit("authenticate", userData);
    }
    this.socket.on("disconnect", () => {
      console.log("Socket disconnected");
    });
  }

  startGame(roomId) {
    if (!this.isConnected()) {
      throw new Error("Socket is not connected");
    }
    this.socket.emit("startGame", roomId);
  }

  joinLobby(roomId, username) {
    if (!this.isConnected()) {
      throw new Error("Socket is not connected");
    }
    this.currentRoom = { roomId, username };
    this.socket.emit("joinLobby", { roomId, username });
  }

  sendMessage(roomId, message, username) {
    if (!this.isConnected()) {
      throw new Error("Socket is not connected");
    }
    // Remove this.io reference as it doesn't exist
    this.socket.emit("chatMessage", { roomId, message, username });
  }

  selectWord(roomId, word) {
    if (!this.isConnected()) {
      throw new Error("Socket is not connected");
    }
    this.socket.emit("selectWord", { roomId, word });
  }

  onMessage(callback) {
    if (!this.isConnected()) {
      throw new Error("Socket instance not created");
    }
    this.messageCallbacks.add(callback);
    return () => this.messageCallbacks.delete(callback);
  }

  onPlayerUpdate(callback) {
    if (!this.isConnected) {
      throw new Error("Socket instance not created");
    }
    this.playerCallbacks.add(callback);
    return () => this.playerCallbacks.delete(callback);
  }

  onGameStateUpdate(callback) {
    this.gameStateCallbacks.add(callback);

    if (!this.isConnected()) {
      this.connect();
    }

    return () => this.gameStateCallbacks.delete(callback);
  }

  disconnect() {
    if (this.socket) {
      this.socket.disconnect();
      this.socket = null;
    }
  }
}

export const socketManager = new SocketManager();
