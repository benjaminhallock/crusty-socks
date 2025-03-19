import { io } from 'socket.io-client';

import { ENV_CONFIG } from '../../../shared/constants.js';
import { SOCKET_EVENTS } from '../../../shared/constants.js';

/**
 * SocketManager Class
 * Manages all real-time socket connections and event handling for the game
 * Implements the Singleton pattern - only one instance exists across the app
 */
class SocketManager {
  constructor() {
    console.log('Initializing SocketManager');
    this.socket = null;
    // Sets to store callback functions for different event types
    this.messageCallbacks = new Set(); // Handles chat messages
    this.playerCallbacks = new Set();  // Handles player updates (joins/leaves)
    this.gameStateCallbacks = new Set(); // Handles game state changes
    this.canvasCallbacks = new Set(); // Add new callback set for canvas updates
    this.currentRoom = null;
  }

  // Check if socket connection is active
  isConnected() {
    const connected = this.socket && this.socket.connected;
    // console.log('Socket connection status:', connected);
    return connected;
  }

  // Initialize socket connection with user data
  connect(userData) {
    console.log('Attempting socket connection with user data:', userData);
    if (this.isConnected()) return;

    if (!this.socket) {
      console.log('Creating new socket instance');
      this.socket = io(ENV_CONFIG.SOCKET_URL, {
        withCredentials: true,
        transports: ['polling'],
        autoConnect: false,
        reconnection: true,
        reconnectionAttempts: 5,
        reconnectionDelay: 1000,
        reconnectionDelayMax: 5000,
        timeout: 45000
      });

      // Set up event listeners for different socket events
      this.socket.on(SOCKET_EVENTS.CHAT_MESSAGE, (message) => {
        console.log('Received chat message:', message);
        this.messageCallbacks.forEach(callback => callback(message));
      });

      this.socket.on(SOCKET_EVENTS.PLAYER_UPDATE, (players) => {
        console.log('Received player update:', players);
        this.playerCallbacks.forEach(callback => callback(players));
      });

      this.socket.on(SOCKET_EVENTS.GAME_STATE_UPDATE, ({ lobby }) => {
        console.log('Received game state update:', lobby);
        this.gameStateCallbacks.forEach(callback => callback({ lobby }));
      });

      this.socket.on(SOCKET_EVENTS.CANVAS_UPDATE, (canvasData) => {
        // console.log('Received canvas update');
        this.canvasCallbacks.forEach(callback => callback(canvasData));
      });

      this.socket.on('wordGuessResult', (result) => {
        if (result.correct) {
          // Don't show the actual word in chat
          this.messageCallbacks.forEach(callback => 
            callback({
              username: 'Server',
              message: `${result.username} guessed the word correctly! (+${result.points} points)`,
              timestamp: Date.now()
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

    // Connection status handlers
    this.socket.on('connect', () => {
      console.log('Socket successfully connected', this.socket.id);
    });

    this.socket.on('connect_ack', (data) => {
      console.log('Client connection acknowledged:', data);
    });

    this.socket.on('connect_error', (error) => {
      console.error('Socket connection error:', error.message);
    });

    this.socket.on('connect_timeout', () => {
      console.error('Socket connection timeout');
    });

    this.socket.on('error', (error) => {
      console.error('Socket error:', error);
    });

    this.socket.on('disconnect', (reason) => {
      console.log('Socket disconnected - reason:', reason);
      if (reason === 'transport close' || reason === 'transport error') {
        console.log('Attempting reconnection...');
      }
    });

    this.socket.connect();

    // Associate user data with socket if available
    if (this.isConnected() && userData) {
      console.log('Attaching user data to socket:', userData);
      this.socket.userId = userData.userId;
      this.socket.user = userData;
    }
  }

  // Game control methods
  startGame(roomId) {
    console.log('Initiating game start for room:', roomId);
    if (!this.isConnected()) {
      throw new Error('Cannot start game - Socket is not connected');
    }
    this.socket.emit(SOCKET_EVENTS.START_GAME, roomId);
  }

  // Room management methods
  joinLobby(roomId, username) {
    console.log('Joining lobby:', { roomId, username });
    if (!this.isConnected()) {
      throw new Error('Cannot join lobby - Socket is not connected');
    }
    this.currentRoom = { roomId, username };
    this.socket.emit(SOCKET_EVENTS.JOIN_LOBBY, { roomId, username });
  }

  // Chat functionality
  sendMessage(roomId, message, username) {
    console.log('Sending chat message:', { roomId, message, username });
    if (!this.isConnected()) {
      throw new Error('Cannot send message - Socket is not connected');
    }
    
    // Don't emit chat message if it's a potential word guess
    // The server will handle emitting the success message if it's correct
    if (!this.currentRoom?.currentWord?.toLowerCase().includes(message.toLowerCase())) {
      this.socket.emit(SOCKET_EVENTS.CHAT_MESSAGE, { roomId, message, username });
    }
  }

  // Game action methods
  selectWord(roomId, word) {
    console.log('Selecting word for game:', { roomId, word });
    if (!this.isConnected()) {
      throw new Error('Cannot select word - Socket is not connected');
    }
    this.socket.emit('selectWord', { roomId, word });
  }

  checkWordGuess(roomId, guess, username) {
    if (!this.isConnected() || !this.currentRoom) {
      throw new Error('Cannot check word - Socket is not connected or no room joined');
    }
    this.socket.emit(SOCKET_EVENTS.CHECK_WORD_GUESS, { 
      roomId, 
      guess, 
      username 
    });
  }

  updateCanvas(canvasData) {
    // console.log('Sending canvas update');
    if (!this.isConnected() || !this.currentRoom) {
      throw new Error('Cannot update canvas - Socket is not connected or no room joined');
    }
    this.socket.emit(SOCKET_EVENTS.CANVAS_UPDATE, { 
      roomId: this.currentRoom.roomId, 
      canvasData 
    });
  }

  endRound(roomId) {
    console.log('Ending round for room:', roomId);
    if (!this.isConnected()) {
      throw new Error('Cannot end round - Socket is not connected');
    }
    this.socket.emit(SOCKET_EVENTS.END_ROUND, roomId);
  }

  // Event subscription methods
  onMessage(callback) {
    console.log('Adding new message callback');
    if (!this.isConnected()) {
      throw new Error('sages - Socket instance not created');
    }
    this.messageCallbacks.add(callback);
    return () => this.messageCallbacks.delete(callback);
  }

  onPlayerUpdate(callback) {
    console.log('Adding new player update callback');
    if (!this.isConnected()) {
      throw new Error('Cannot subscribe to player updates - Socket instance not created');
    }
    this.playerCallbacks.add(callback);
    return () => this.playerCallbacks.delete(callback);
  }

  onGameStateUpdate(callback) {
    console.log('Adding new game state callback');
    this.gameStateCallbacks.add(callback);
    if (!this.isConnected()) {
      this.connect();
    }
    return () => this.gameStateCallbacks.delete(callback);
  }

  onCanvasUpdate(callback) {
    console.log('Adding new canvas update callback');
    if (!this.isConnected()) {
      throw new Error('Cannot subscribe to canvas updates - Socket instance not created');
    }
    this.canvasCallbacks.add(callback);
    return () => this.canvasCallbacks.delete(callback);
  }

  leaveLobby(roomId, username) {
    console.log('Leaving lobby:', { roomId, username });
    if (!this.isConnected()) {
      throw new Error('Cannot leave lobby - Socket is not connected');
    }
    this.socket.emit(SOCKET_EVENTS.LEAVE_LOBBY, { roomId, username });
  }

  offGameStateUpdate() {
    console.log('Removing game state callbacks');
    this.gameStateCallbacks.clear();
  }

  // Handles kicking a player

  // Cleanup method
  disconnect() {
    console.log('Disconnecting socket');
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
