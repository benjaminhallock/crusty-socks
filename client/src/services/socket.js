import { io } from 'socket.io-client';

const SOCKET_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001';

class SocketManager {
  constructor() {
    this.socket = null;
    this.initCallbacks = new Set();
    this.playerCallbacks = new Set();
    this.messageCallbacks = new Set();
  }

  connect() {
    if (this.socket) return;
    
    this.socket = io(SOCKET_URL);
    
    this.socket.on('initRoom', data => this.initCallbacks.forEach(cb => cb(data)));
    this.socket.on('playerUpdate', players => this.playerCallbacks.forEach(cb => cb(players)));
    this.socket.on('chatMessage', msg => this.messageCallbacks.forEach(cb => cb(msg)));
  }

  joinLobby(roomId, username) {
    this.socket?.emit('joinLobby', { roomId, username });
  }

  sendMessage(roomId, message, username) {
    this.socket?.emit('chatMessage', { roomId, message, username });
  }

  onMessage(callback) {
    this.messageCallbacks.add(callback);
    return () => this.messageCallbacks.delete(callback);
  }

  onInitRoom(callback) {
    this.initCallbacks.add(callback);
    return () => this.initCallbacks.delete(callback);
  }

  onPlayerUpdate(callback) {
    this.playerCallbacks.add(callback);
    return () => this.playerCallbacks.delete(callback);
  }

  disconnect() {
    this.socket?.disconnect();
    this.socket = null;
  }
}

export const socketManager = new SocketManager();
