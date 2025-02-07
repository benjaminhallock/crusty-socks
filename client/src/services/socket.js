import io from 'socket.io-client';

const SOCKET_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001';

class SocketManager {
  constructor() {
    this.socket = null;
    this.gameData = {
      players: [],
      messages: [],
      gameState: 'waiting'
    };
    this.listeners = new Set();
    this.currentUser = null;
  }

  connect(userData) {
    if (this.socket) return;
    
    this.socket = io(SOCKET_URL);
    this.currentUser = userData;
    this.setupEvents();
  }

  setupEvents() {
    if (!this.socket) return;

    const events = {
      playerUpdate: players => {
        this.gameData.players = players;
        this.notifyListeners();
      },
      chatMessage: message => {
        this.gameData.messages = [...this.gameData.messages, message];
        this.notifyListeners();
      },
      gameStateUpdate: gameState => {
        this.gameData.gameState = gameState;
        this.notifyListeners();
      }
    };

    Object.entries(events).forEach(([event, handler]) => {
      this.socket.on(event, handler);
    });
  }

  joinLobby(roomId, username, userId) {
    this.socket?.emit('joinLobby', { roomId, username, userId });
  }

  leaveLobby(roomId, userId) {
    if (this.socket) {
      this.socket.emit('leaveLobby', { roomId, userId });
      this.resetGameData();
    }
  }

  sendMessage(roomId, message) {
    if (this.currentUser && this.socket) {
      this.socket.emit('chatMessage', {
        roomId,
        message,
        username: this.currentUser.username
      });
    }
  }

  emitDraw(index, color) {
    this.socket?.emit("draw", { index, color });
  }

  subscribe(callback) {
    this.listeners.add(callback);
    callback({ ...this.gameData });
    return () => this.listeners.delete(callback);
  }

  notifyListeners() {
    this.listeners.forEach(callback => callback({ ...this.gameData }));
  }

  resetGameData() {
    this.gameData = {
      players: [],
      messages: [],
      gameState: 'waiting'
    };
    this.notifyListeners();
  }

  disconnect() {
    if (this.socket) {
      this.socket.disconnect();
      this.socket = null;
    }
    this.listeners.clear();
    this.resetGameData();
  }
}

export const socketManager = new SocketManager();
