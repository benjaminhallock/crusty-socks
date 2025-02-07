import io from 'socket.io-client';

const SOCKET_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001';

class SocketManager {
  constructor() {
    this.socket = null;
    // Simplified game data structure
    this.gameData = {
      players: [],
      messages: [],
      gameState: 'waiting'
    };
    this.listeners = new Set();
  }

  // Connect to socket server
  connect() {
    if (this.socket) return;

    this.socket = io(SOCKET_URL);
    
    // Basic connection events
    this.socket.on('connect', () => console.log('Socket connected'));
    this.socket.on('connect_error', (error) => console.log('Socket error:', error));
    this.socket.on('disconnect', (reason) => console.log('Socket disconnected:', reason));

    // Set up game events
    this.setupGameEvents();
  }

  // Handle all game-related socket events
  setupGameEvents() {
    if (!this.socket) return;

    // Update lobby data
    this.socket.on('updateLobbyData', (data) => {
      this.gameData = { ...this.gameData, ...data };
      this.updateAllListeners();
    });

    // Update player list
    this.socket.on('playerUpdate', (players) => {
      this.gameData.players = players;
      this.updateAllListeners();
    });

    // Handle new chat messages
    this.socket.on('chatMessage', (message) => {
      this.gameData.messages.push(message);
      this.updateAllListeners();
    });

    // Update game state
    this.socket.on('gameStateUpdate', (gameState) => {
      this.gameData.gameState = gameState;
      this.updateAllListeners();
    });
  }

  // Join a game lobby
  joinLobby(roomId, username, userId) {
    if (!this.socket) return;

    this.socket.emit('joinLobby', { roomId, username, userId });
  }

  // Leave current lobby
  leaveLobby(roomId, userId) {
    if (!this.socket) return;
    
    this.socket.emit('leaveLobby', { roomId, userId });
    this.resetGameData();
  }

  // Send a chat message
  sendMessage(roomId, message) {
    if (!this.socket) return;

    const user = JSON.parse(localStorage.getItem('user'));
    if (!user) return;

    this.socket.emit('chatMessage', {
      roomId,
      message,
      username: user.username
    });
  }

  // Canvas drawing events
  emitDraw(index, color) {
    if (!this.socket) return;
    this.socket.emit("draw", { index, color });
  }

  emitCanvasState(imageData) {
    if (!this.socket) return;
    this.socket.emit("canvasState", { imageData });
  }

  // Set up canvas event listeners
  setupCanvasListeners(onDraw, onClear) {
    if (!this.socket) return;

    this.socket.on("drawUpdate", onDraw);
    this.socket.on("clearCanvas", onClear);

    // Return cleanup function
    return () => {
      if (this.socket) {
        this.socket.off("drawUpdate", onDraw);
        this.socket.off("clearCanvas", onClear);
      }
    };
  }

  // Subscribe to game data updates
  subscribe(callback) {
    this.listeners.add(callback);
    callback(this.gameData);
    return () => this.listeners.delete(callback);
  }

  // Update all listeners with new game data
  updateAllListeners() {
    this.listeners.forEach(callback => callback(this.gameData));
  }

  // Reset game data to initial state
  resetGameData() {
    this.gameData = {
      players: [],
      messages: [],
      gameState: 'waiting'
    };
  }

  // Disconnect from socket server
  disconnect() {
    if (this.socket) {
      this.socket.disconnect();
      this.socket = null;
    }
    this.listeners.clear();
  }
}

// Export a single instance
export const socketManager = new SocketManager();
