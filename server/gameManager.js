export class GameManager {
  constructor(io) {
    this.io = io;
    this.rooms = new Map();
    this.setupSocketListeners(io);
  }

  setupSocketListeners(io) {
    io.on("connection", (socket) => {
      socket.on("joinLobby", ({ roomId, username }) => {
        if (!roomId || !username) return;
        
        if (!this.rooms.has(roomId)) {
          this.rooms.set(roomId, { 
            players: new Set(), 
            messages: [], 
            gameState: "waiting" 
          });
        }

        socket.join(roomId);
        const room = this.rooms.get(roomId);
        
        // Remove existing player if exists
        Array.from(room.players).forEach(p => {
          if (p.username === username) room.players.delete(p);
        });
        room.players.add({ username, socketId: socket.id });
        
        socket.emit("initRoom", {
          players: Array.from(room.players).map(p => ({ username: p.username })),
          messages: room.messages,
          gameState: room.gameState
        });

        io.to(roomId).emit("playerUpdate", Array.from(room.players).map(p => ({ 
          username: p.username 
        })));
      });

      socket.on("disconnect", () => {
        this.rooms.forEach((room, roomId) => {
          const player = Array.from(room.players).find(p => p.socketId === socket.id);
          if (player) {
            room.players.delete(player);
            if (room.players.size === 0) {
              this.rooms.delete(roomId);
            } else {
              io.to(roomId).emit("playerUpdate", 
                Array.from(room.players).map(p => ({
                  username: p.username,
                  isOnline: true
                }))
              );
            }
          }
        });
      });

      socket.on("chatMessage", ({ roomId, message, username }) => {
        if (!roomId || !message || !username) return;
        const room = this.rooms.get(roomId);
        if (!room) return;

        const messageData = { username, message, timestamp: Date.now() };
        room.messages.push(messageData);
        io.to(roomId).emit("chatMessage", messageData);
      });
    });
  }
}
