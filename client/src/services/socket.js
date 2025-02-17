import { io } from "socket.io-client";

import { ENV_CONFIG } from "../../../shared/constants.js";

class SocketManager {
  constructor() {
    this.socket = null;
    this.messageCallbacks = new Set();
    this.playerCallbacks = new Set();
    this.currentRoom = null;
  }

  isConnected() {
    return this.socket && this.socket.connected;
  }

  connect() {
    if (this.isConnected()) return;

    this.socket = io(ENV_CONFIG.SOCKET_URL, {
      withCredentials: true,
      transports: ["websocket", "polling"],
      autoConnect: true,
      reconnection: true,
      extraHeaders: {
        "Access-Control-Allow-Origin": ENV_CONFIG.CLIENT_URL,
      },
    });

    this.socket.on("playerUpdate", (players) => {
      if (this.currentRoom) {
        // Only update if we're in a room
        this.playerCallbacks.forEach((cb) => cb(players));
      }
    });

    this.socket.on("gameStateUpdate", (gameState) => {

    });

    this.socket.on("chatMessage", (msg) =>
      this.messageCallbacks.forEach((cb) => cb(msg))
    );

    // Handle reconnection
    this.socket.on("reconnect", () => {
      if (this.currentRoom) {
        this.joinLobby(this.currentRoom.roomId, this.currentRoom.username);
      }
    });
  }

  updateGameState(gameState) {
    if (!this.isConnected()) {
      throw new Error("Socket is not connected");
    }
    this.socket.emit("gameStateUpdate", gameState);
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
    this.socket.emit("chatMessage", { roomId, message, username });
  }

  onMessage(callback) {
    if (!this.socket) {
      throw new Error("Socket instance not created");
    }
    this.messageCallbacks.add(callback);
    return () => this.messageCallbacks.delete(callback);
  }

  onPlayerUpdate(callback) {
    if (!this.socket) {
      throw new Error("Socket instance not created");
    }
    this.playerCallbacks.add(callback);
    return () => this.playerCallbacks.delete(callback);
  }

  disconnect() {
    if (this.socket) {
      this.socket.disconnect();
      this.socket = null;
    }
  }
}

export const socketManager = new SocketManager();
