import { GAME_CONSTANTS } from '../shared/constants.js';

export class GameManager {
  constructor(io) {
    this.io = io;
    this.rooms = new Map();
    this.setupSocketListeners(io);
  }

  setupSocketListeners(io) {
    io.on('connection', (socket) => {
      socket.on('joinLobby', ({ roomId, username }) => {
        if (!roomId || !username) return;

        const room = this.rooms.get(roomId) || {
          players: new Set(),
          messages: [],
          gameState: GAME_CONSTANTS.GAME_STATES.WAITING
        };

        // Remove existing player with same username if exists
        const existingPlayer = Array.from(room.players).find(p => p.username === username);
        if (existingPlayer) {
          room.players.delete(existingPlayer);
        }

        // Add the player
        room.players.add({ username, socketId: socket.id });
        this.rooms.set(roomId, room);
        socket.join(roomId);

        // Emit updated player list
        io.to(roomId).emit(
          'playerUpdate',
          Array.from(room.players).map(p => ({
            username: p.username,
            isOnline: true
          }))
        );
      });

      socket.on('disconnect', () => {
        this.rooms.forEach((room, roomId) => {
          const player = Array.from(room.players).find(p => p.socketId === socket.id);
          if (player) {
            room.players.delete(player);
            if (room.players.size === 0) {
              this.rooms.delete(roomId);
            } else {
              io.to(roomId).emit(
                'playerUpdate',
                Array.from(room.players).map(p => ({
                  username: p.username,
                  isOnline: true
                }))
              );
            }
          }
        });
      });

      socket.on('chatMessage', ({ roomId, message, username }) => {
        if (!roomId || !message || !username) return;
        const room = this.rooms.get(roomId);
        if (!room) return;

        const messageData = { username, message, timestamp: Date.now() };
        io.to(roomId).emit('chatMessage', messageData);
      });
    });
  }
}

export const initializeSocketEvents = (io) => {
  return new GameManager(io);
};
