import { GAME_STATE, SOCKET_EVENTS } from '../shared/constants.js';
import { WORD_LIST } from '../shared/constants.js';
import Lobby from './models/lobby.js';

export class GameManager {
  constructor(io) {
    this.io = io;
    this.activeConnections = new Map(); // socketId -> {roomId, username}
    this.setupSocketListeners(io);
  }

  setupSocketListeners(io) {
    //A socket represents a player's connection to the server
    //They call socket.emit to send messages to the server
    io.on('connection', (socket) => {
      // Handle the start game event
      socket.on('startGame', async (roomId) => {
        socket.join(roomId); //delete later

        console.log('Starting game in room:', roomId);
        const lobby = await Lobby.findOne({ roomId });
        if (!lobby) return console.error('Lobby not found:', roomId);

        // Pick random drawer and words
        const drawerIndex = Math.floor(Math.random() * lobby.players.length);
        const drawer = lobby.players[drawerIndex];

        // Select 3 random words
        const words = WORD_LIST.sort(() => 0.5 - Math.random()).slice(0, 3);

        lobby.currentDrawer = drawer.username;
        lobby.gameState = GAME_STATE.PICKING_WORD;
        lobby.currentWord = words.join(', ');
        await lobby.save();

        console.log('Sharing lobby object to roomid:', roomId, lobby);

        // Emit game state to all players
        io.to(roomId).emit(SOCKET_EVENTS.GAME_STATE_UPDATE, {
          lobby,
        });
      });

      socket.on('wordSelected', async ({ roomId, word }) => {
        const lobby = await Lobby.findOne({ roomId });
        if (!lobby) return;

        lobby.currentWord = word;
        lobby.gameState = GAME_STATE.DRAWING;
        await lobby.save();

        // Emit word to drawer only
        socket.emit(SOCKET_EVENTS.WORD_SELECTED, word);

        console.log('Emitting lobby update to all players');
        // Emit game state update to all players
        io.to(roomId).emit(SOCKET_EVENTS.GAME_STATE_UPDATE, {
          gameState: lobby.gameState,
          drawer: lobby.drawer,
        });
      });

      // Handle join lobby event
      socket.on('joinLobby', async ({ roomId, username }) => {
        if (!roomId || !username) return;

        try {
          // Step 1: Find or create lobby with explicit gameState
          let lobby = await Lobby.findOneAndUpdate(
            { roomId },
            {
              $setOnInsert: {
                roomId,
                gameState: GAME_STATE.WAITING,
                players: [],
              },
            },
            { upsert: true, new: true }
          );

          // Step 2: Remove existing player if present
          await Lobby.findOneAndUpdate(
            { roomId },
            { $pull: { players: { username } } }
          );

          // Step 3: Add the player with new socket ID
          lobby = await Lobby.findOneAndUpdate(
            { roomId },
            { $push: { players: { username, socketId: socket.id, score: 0 } } },
            { new: true }
          );

          socket.join(roomId);
          socket.roomId = roomId;
          this.activeConnections.set(socket.id, { roomId, username });

          io.to(roomId).emit('playerUpdate', lobby.players);
        } catch (error) {
          console.error('Error in joinLobby:', error);
        }
      });

      // Handle the update canvas event
      socket.on('updateCanvas', async ({ roomId, pixels }) => {
        if (!roomId || !pixels) return;

        const lobby = await Lobby.findOneAndUpdate(
          { roomId },
          { canvasState: { pixels, lastUpdate: Date.now() } },
          { new: true }
        );

        io.to(roomId).emit('canvasUpdate', lobby.canvasState);
      });

      socket.on('disconnect', async () => {
        const connection = this.activeConnections.get(socket.id);
        if (connection) {
          const { roomId, username } = connection;

          const lobby = await Lobby.findOneAndUpdate(
            { roomId },
            { $pull: { players: { username } } },
            { new: true }
          );

          if (lobby && lobby.players.length === 0) {
            await Lobby.deleteOne({ roomId });
          } else if (lobby) {
            io.to(roomId).emit('playerUpdate', lobby.players);
          }

          this.activeConnections.delete(socket.id);
        }
      });

      socket.on('chatMessage', async ({ roomId, message, username }) => {
        if (!roomId || !message || !username) return;

        const messageData = { username, message, timestamp: Date.now() };
        await Lobby.findOneAndUpdate(
          { roomId },
          { $push: { messages: messageData } }
        );

        io.to(roomId).emit('chatMessage', messageData);
      });
    });
  }
}

export const initializeSocketEvents = (io) => {
  return new GameManager(io);
};
