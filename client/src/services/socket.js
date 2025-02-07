import { io } from 'socket.io-client';

import { ENV_CONFIG } from '../../../shared/constants.js';

class SocketManager {
  constructor() {
    this.socket = null;
    this.messageCallbacks = new Set();
    this.playerCallbacks = new Set();
    this.currentRoom = null;
  }

  connect() {
    if (this.socket) return;
    
    this.socket = io(ENV_CONFIG.SOCKET_URL, {
      withCredentials: true,
      transports: ['websocket', 'polling'],
      autoConnect: true,
      reconnection: true,
      extraHeaders: {
        'Access-Control-Allow-Origin': ENV_CONFIG.CLIENT_URL
      }
    });
    
    this.socket.on('playerUpdate', players => {
      if (this.currentRoom) {  // Only update if we're in a room
        this.playerCallbacks.forEach(cb => cb(players));
      }
    });
    
    this.socket.on('chatMessage', msg => 
      this.messageCallbacks.forEach(cb => cb(msg))
    );

    // Handle reconnection
    this.socket.on('reconnect', () => {
      if (this.currentRoom) {
        this.joinLobby(this.currentRoom.roomId, this.currentRoom.username);
      }
    });
  }

  joinLobby(roomId, username) {
    if (this.socket) {
      this.currentRoom = { roomId, username };
      this.socket.emit('joinLobby', { roomId, username });
    }
  }

  sendMessage(roomId, message, username) {
    this.socket?.emit('chatMessage', { roomId, message, username });
  }

  onMessage(callback) {
    this.messageCallbacks.add(callback);
    return () => this.messageCallbacks.delete(callback);
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
