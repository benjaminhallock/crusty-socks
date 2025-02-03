export class SocketHandler {
  constructor(io, gameManager) {
    this.io = io;
    this.gameManager = gameManager;
    this.setupSocketEvents();
  }

  setupSocketEvents() {
    this.io.on('connection', (socket) => {
      console.log('\n[SOCKET] 🔌 New connection:', socket.id);

      // Setup all event listeners
      this.setupGameEvents(socket);
      this.setupDisconnectEvent(socket);
    });
  }

  setupGameEvents(socket) {
    socket.on('createLobby', ({ username }, callback) => {
      console.log('[SOCKET] 🎮 Create lobby request:', { username, socketId: socket.id });
    // Join the socket room after lobby is created via REST API
    socket.join(roomId);
    socket.emit('roomJoined', {
      roomId,
      users: [{id: socket.id, username}],
      hostId: socket.id
    });
      if (callback) callback(roomId);
    });

    socket.on('joinGame', ({ username }) => {
      try {
        console.log('[SOCKET] 👋 Join game request:', { username, socketId: socket.id });
        const success = this.gameManager.addPlayer(socket, username);
        if (!success) {
          socket.emit('error', 'Username already taken or already connected');
        }
      } catch (error) {
        console.error('Error in joinGame:', error);
        socket.emit('error', 'Failed to join game');
      }
    });

    socket.on('playerReady', () => this.gameManager.handlePlayerReady(socket.id));
    socket.on('playerNotReady', () => this.gameManager.handlePlayerNotReady(socket.id));
    socket.on('draw', (data) => this.gameManager.handleDraw(socket, data));
    socket.on('guess', ({ user, message }) => this.gameManager.handleGuess(user, message));
  }

  setupDisconnectEvent(socket) {
    socket.on('disconnect', () => {
      console.log('[SOCKET] 🔌 Client disconnected:', socket.id);
      this.gameManager.removePlayer(socket.id);
    });
  }
}
