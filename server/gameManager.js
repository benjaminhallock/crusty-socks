import { socketManager } from '../client/src/services/socket.js';
import { GAME_STATE, SOCKET_EVENTS } from '../shared/constants.js';
import { WORD_LIST } from '../shared/constants.js';
import Lobby from './models/lobby.js';
import Report from './models/report.js';
import User from './models/user.js';

/**
 * GameManager Class
 * Central hub for managing game state, player connections, and real-time game events
 * Handles all socket.io events for the game's server-side logic
 */
class GameManager {
  constructor(io) {
    console.log('Initializing GameManager');
    this.io = io;
    this.activeConnections = new Map();
    this.wordSelectionTimers = new Map(); // Track active word selection timers
    this.saveLocks = new Map(); // Track ongoing save operations by roomId
    this.setupSocketListeners(io);
  }

  async acquireSaveLock(roomId) {
    while (this.saveLocks.get(roomId)) {
      await new Promise((resolve) => setTimeout(resolve, 50)); // Wait 50ms before checking again
    }
    this.saveLocks.set(roomId, true);
  }

  releaseSaveLock(roomId) {
    this.saveLocks.delete(roomId);
  }

  async setupWordSelectionTimeout(io, roomId, words) {
    console.log('Setting up word selection timeout for room:', roomId);

    // Clear any existing timer for this room
    if (this.wordSelectionTimers.has(roomId)) {
      clearTimeout(this.wordSelectionTimers.get(roomId));
    }

    // Set up new timer
    const timer = setTimeout(async () => {
      try {
        const currentLobby = await Lobby.findOne({ roomId });
        if (currentLobby?.gameState === GAME_STATE.PICKING_WORD) {
          console.log('Word selection timed out for room:', roomId);

          // Select random word
          const randomWord = words[Math.floor(Math.random() * words.length)];
          currentLobby.currentWord = randomWord;
          currentLobby.gameState = GAME_STATE.DRAWING;
          currentLobby.startTime = Date.now();

          await currentLobby.save();

          // Notify clients
          io.to(roomId).emit(SOCKET_EVENTS.GAME_STATE_UPDATE, {
            lobby: currentLobby,
          });
          io.to(roomId).emit(SOCKET_EVENTS.CHAT_MESSAGE, {
            username: 'Server',
            message: 'Word selection timed out... randomly selecting a word.',
            timestamp: Date.now(),
          });

          // Start round timer
          await this.startRoundTimer(io, roomId, currentLobby);
        }
      } catch (error) {
        console.error('Error in word selection timeout:', error);
      } finally {
        this.wordSelectionTimers.delete(roomId);
      }
    }, 15000);

    // Store the timer reference
    this.wordSelectionTimers.set(roomId, timer);
  }

  setupSocketListeners(io) {
    io.on('connection', (socket) => {
      console.log('player connected to server:', socket.id);

      // Send immediate acknowledgment of connection
      socket.emit('connect_ack', { id: socket.id });

      // Handle initial connection error
      socket.on('error', (error) => {
        console.error('Socket error:', error);
        socket.emit('error', 'Connection error occurred');
      });

      socket.on(SOCKET_EVENTS.REPORT_PLAYER, async ({ roomId, username, reason }) => {
        console.log('Report player request:', { roomId, username, reason });
        const lobby = await Lobby.findOne({ roomId });
        
        if (!lobby) {
          console.error('Cannot report player - Lobby not found:', roomId);
          return;
        }
        
        if (!username) {
          console.error('Cannot report player - No username provided');
          return;
        }
        
        const reportingUser = socket.username;
        if (!reportingUser) {
          console.error('Cannot report player - Reporting user not found');
          return;
        }
        
        try {
          // Get the reported user's chat history for this room
          const reportedUser = await User.findOne({ username });
          
          // Get relevant chat logs - combine room messages with user's chat history
          const roomChatLogs = lobby.messages?.slice(-20) || [];
          const userChatLogs = reportedUser?.chatHistory
            ?.filter(chat => chat.roomId === roomId)
            ?.slice(-50) || [];
          
          // Create a report with more comprehensive chat logs
          const report = new Report({
            reportedUser: username,
            reportedBy: reportingUser,
            roomId,
            reason: reason || 'Inappropriate behavior',
            timestamp: Date.now(),
            chatLogs: [
              ...roomChatLogs.map(log => ({
                username: log.user,
                message: log.message,
                timestamp: log.timestamp
              })),
              ...userChatLogs.map(log => ({
                username,
                message: log.message,
                timestamp: log.timestamp
              }))
            ].sort((a, b) => new Date(a.timestamp) - new Date(b.timestamp)),
            status: 'pending',
          });
          
          await report.save();
          console.log(`Reported player: ${username} in room: ${roomId}`);
          
          // Notify the reporting user of successful report
          socket.emit(SOCKET_EVENTS.CHAT_MESSAGE, {
            username: 'Server',
            message: `You have reported ${username}. Moderators will review this report.`,
            timestamp: Date.now(),
          });
        } catch (error) {
          console.error('Error creating report:', error);
          socket.emit(SOCKET_EVENTS.CHAT_MESSAGE, {
            username: 'Server',
            message: 'Failed to submit report. Please try again.',
            timestamp: Date.now(),
          });
        }
      });

      // Game initialization event
      socket.on(SOCKET_EVENTS.START_GAME, async (roomId) => {
        try {
          await this.acquireSaveLock(roomId);

          const lobby = await Lobby.findOne({ roomId });
          if (!lobby) {
            console.error('Cannot start game - Lobby not found:', roomId);
            return;
          }

          // Reset game state if the game was finished (Play Again functionality)
          if (lobby.gameState === GAME_STATE.FINISHED) {
            console.log('Resetting game for room:', roomId);
            
            // Reset player scores and states
            lobby.players.forEach(player => {
              player.score = 1000; // Reset to initial score
              player.hasDrawn = false;
              player.hasGuessedCorrect = false;
              player.guessTime = 0;
              player.roundScore = 0;
              player.drawPoints = 0;
            });
            
            // Reset game state variables
            lobby.currentRound = 1;
            lobby.currentWord = '';
            lobby.currentDrawer = '';
            lobby.canvasState = null;
          }

          // Select a random drawer where hasDrawn is false
          const availablePlayers = lobby.players.filter(
            (player) => !player.hasDrawn
          );
          if (!availablePlayers.length) {
            console.error('No available players to draw');
            return;
          }

          // Randomly select a drawer from available players
          const drawerIndex = Math.floor(
            Math.random() * availablePlayers.length
          );
          const drawer = availablePlayers[drawerIndex];

          // Set the drawer regardless of word selection mode
          lobby.currentDrawer = drawer.username;

          // Generate word choices
          const words = await this.generateWordChoices(lobby);

          // Set common lobby properties
          lobby.gameState =
            words.length === 1 ? GAME_STATE.DRAWING : GAME_STATE.PICKING_WORD;
          lobby.currentWord = words.length === 1 ? words[0] : words.join(', ');
          lobby.startTime = Date.now();
          lobby.availableWords = words;

          // Mark the current drawer
          const playerIndex = lobby.players.findIndex(
            (p) => p.username === drawer.username
          );
          if (playerIndex !== -1) {
            lobby.players[playerIndex].hasDrawn = true;
          }

          await lobby.save();

          io.to(roomId).emit(SOCKET_EVENTS.GAME_STATE_UPDATE, { lobby });

          if (lobby.gameState === GAME_STATE.DRAWING) {
            await this.startRoundTimer(io, roomId, lobby);
          } else if (lobby.gameState === GAME_STATE.PICKING_WORD) {
            await this.setupWordSelectionTimeout(io, roomId, words);
          }
        } catch (error) {
          console.error('Error starting game:', error);
          socket.emit('error', 'Failed to start game');
        } finally {
          this.releaseSaveLock(roomId);
        }
      });

      // Chat message handling
      socket.on(
        SOCKET_EVENTS.CHAT_MESSAGE,
        async ({ roomId, message, username }) => {
          console.log('New chat message:', { roomId, username, message });

          if (!roomId || !message || !username) {
            console.error('Invalid chat message data');
            return;
          }

          const messageData = { username, message, timestamp: Date.now() };

          try {
            // Store message in lobby history
            await Lobby.findOneAndUpdate(
              { roomId },
              { $push: { messages: { user: username, message, timestamp: new Date() } } }
            );
            
            // Also store in user's chat history for reporting purposes
            await User.findOneAndUpdate(
              { username },
              { 
                $push: { 
                  chatHistory: { 
                    message, 
                    roomId,
                    timestamp: new Date() 
                  } 
                },
                'profile.lastActive': new Date()
              }
            );
            
            // Broadcast to room
            io.to(roomId).emit('chatMessage', messageData);
          } catch (error) {
            console.error('Error saving chat message:', error);
          }
        }
      );

      // Word selection handling
      socket.on(SOCKET_EVENTS.SELECT_WORD, async ({ roomId, word }) => {
        try {
          await this.acquireSaveLock(roomId);

          console.log('Word selected for room:', { roomId, word });
          const lobby = await Lobby.findOne({ roomId });
          if (!lobby) {
            console.error('Cannot select word - Lobby not found');
            return;
          }

          // Update game state and start timer
          lobby.currentWord = word;
          lobby.gameState = GAME_STATE.DRAWING;
          lobby.startTime = Date.now();

          await lobby.save();
          io.to(roomId).emit(SOCKET_EVENTS.GAME_STATE_UPDATE, { lobby });
          console.log('Starting drawing for room:', roomId);
          await this.startRoundTimer(io, roomId, lobby);
        } catch (error) {
          console.error('Error saving lobby state:', error);
          socket.emit('error', 'Failed to update game state');
        } finally {
          this.releaseSaveLock(roomId);
        }
      });

      // Lobby join handling
      socket.on(SOCKET_EVENTS.JOIN_LOBBY, async ({ roomId, username }) => {
        if (!roomId || !username) {
          console.error('Invalid lobby join data');
          return;
        }
        console.log('Player joining lobby:', { roomId, username });
        socket.username = username; // Store username in socket for later use
        socket.roomId = roomId; // Store roomId in socket for later use

        // Find user by username
        const user = await User.findOne({ username });
        if (!user) {
          console.error('Cannot join - User not found:', username);
          return;
        }

        try {
          // Acquire lock before saving
          await this.acquireSaveLock(roomId);

          let lobby = await Lobby.findOne({ roomId });
          if (!lobby) {
            console.error('Cannot join - Lobby not found:', roomId);
            this.releaseSaveLock(roomId);
            return;
          }

          // Check if player is in the kicked list
          if (lobby.isUserKicked(username)) {
            console.error('Cannot join - User was kicked from this lobby:', username);
            socket.emit('kicked');
            this.releaseSaveLock(roomId);
            return;
          }

          // Check if player is already in lobby
          if (lobby.players.find((p) => p.userId === user._id)) {
            console.error('Player already in lobby:', user.username);
            this.releaseSaveLock(roomId);
            return;
          }

          // Add player to lobby
          lobby.players.push({
            username: user.username,
            userId: user._id,
            score: 1000,
          });
          await lobby.save();
          this.releaseSaveLock(roomId);

          // ✅ Store username in the socket
          socket.username = username;
          socket.roomId = roomId;

          // ✅ Ensure the player is properly tracked
          this.activeConnections.set(socket.id, { roomId, username });

          // Join the room
          socket.join(roomId);

          // Broadcast updates to all players
          io.to(roomId).emit(SOCKET_EVENTS.GAME_STATE_UPDATE, { lobby });

          io.to(roomId).emit(SOCKET_EVENTS.CHAT_MESSAGE, {
            username: 'Server',
            message: `${username} has joined the lobby`,
            timestamp: Date.now(),
          });
        } catch (error) {
          console.error('Error in joinLobby:', error);
          this.releaseSaveLock(roomId);
        }
      });

      // Canvas update handling
      socket.on(SOCKET_EVENTS.CANVAS_UPDATE, async ({ roomId, canvasData }) => {
        if (!roomId || !canvasData) {
          console.error('Invalid canvas update data');
          return;
        }

        try {
          // Skip saving to database for better performance, just broadcast
          socket
            .to(roomId)
            .volatile.emit(SOCKET_EVENTS.CANVAS_UPDATE, canvasData);
        } catch (error) {
          console.error('Error updating canvas:', error);
        }
      });

      // Word guess checking
      socket.on(
        SOCKET_EVENTS.CHECK_WORD_GUESS,
        async ({ roomId, guess, username }) => {
          const lobby = await Lobby.findOne({ roomId });
          if (!lobby || lobby.gameState !== GAME_STATE.DRAWING) {
            console.error('Lobby not found or not in drawing state:', {
              found: !!lobby,
              gameState: lobby?.gameState,
            });
            return;
          }
          if (username === lobby.currentDrawer) {
            console.error('Drawer cannot guess the word');
            socket.emit('chatMessage', {
              username: 'Server',
              message: 'You cannot guess the word while drawing!',
              timestamp: Date.now(),
            });
            return;
          }

          const isCorrect =
            lobby.currentWord.toLowerCase() === guess.toLowerCase();

          if (isCorrect) {
            // Check if player has already guessed correctly
            const playerIndex = lobby.players.findIndex(
              (p) => p.username === username
            );
            if (
              playerIndex !== -1 &&
              !lobby.players[playerIndex].hasGuessedCorrect
            ) {
              // Count number of correct guessers to determine points
              const correctGuessers = lobby.players.filter(
                (p) => p.hasGuessedCorrect
              ).length;
              const totalPlayers = lobby.players.length;
              const pointsForGuess = (totalPlayers - correctGuessers - 1) * 10;

              // Add points to drawPoints and total score
              lobby.players[playerIndex].score += pointsForGuess;
              // Use drawPoints to track points earned in this specific drawing round
              lobby.players[playerIndex].drawPoints = pointsForGuess;
              lobby.players[playerIndex].hasGuessedCorrect = true;
              lobby.players[playerIndex].guessTime = Date.now();

              // Update drawer's points
              const drawerIndex = lobby.players.findIndex(
                (p) => p.username === lobby.currentDrawer
              );
              if (drawerIndex !== -1) {
                const drawerPointsEarned = 10; // Drawer gets 10 points per correct guess
                lobby.players[drawerIndex].score += drawerPointsEarned;
                lobby.players[drawerIndex].drawPoints =
                  (lobby.players[drawerIndex].drawPoints || 0) + drawerPointsEarned;
              }

              await lobby.save();

              // Emit success message with points calculation explanation
              io.to(roomId).emit('chatMessage', {
                username: 'Server',
                message: `${username} guessed the word correctly! (${
                  totalPlayers - correctGuessers - 1
                } remaining players × 10 = ${pointsForGuess} points!)`,
                timestamp: Date.now(),
              });

              // Calculate remaining players who haven't guessed
              const remainingPlayers = lobby.players.filter(
                (player) =>
                  !player.hasGuessedCorrect &&
                  player.username !== lobby.currentDrawer
              );

              // If no players left to guess
              if (remainingPlayers.length === 0) {
                // Add bonus points to drawer
                if (drawerIndex !== -1) {
                  const bonusPoints = 20; // Bonus for getting everyone to guess correctly
                  lobby.players[drawerIndex].score += bonusPoints;
                  lobby.players[drawerIndex].drawPoints += bonusPoints;
                  await lobby.save();

                  io.to(roomId).emit('chatMessage', {
                    username: 'Server',
                    message: `${lobby.currentDrawer} gets a ${bonusPoints} point bonus for everyone guessing correctly!`,
                    timestamp: Date.now(),
                  });
                }

                // Check if there are any players who haven't drawn yet
                const playersLeftToDraw = lobby.players.filter(
                  (p) => !p.hasDrawn && p.username !== lobby.currentDrawer
                );

                // Only end the round after a delay if this was the last drawer
                if (playersLeftToDraw.length === 0) {
                  setTimeout(async () => {
                    const currentLobby = await Lobby.findOne({ roomId });
                    if (currentLobby?.gameState === GAME_STATE.DRAWING) {
                      currentLobby.currentRound =
                        (currentLobby.currentRound || 0) + 1;
                      await currentLobby.save();
                      await this.endRound(io, roomId, currentLobby, true);
                    }
                  }, 3000);
                } else {
                  // If there are more players to draw, wait 3 seconds before moving to next drawer
                  setTimeout(async () => {
                    const currentLobby = await Lobby.findOne({ roomId });
                    if (currentLobby?.gameState === GAME_STATE.DRAWING) {
                      await this.endRound(io, roomId, currentLobby, true);
                    }
                  }, 3000);
                }

                io.to(roomId).emit('chatMessage', {
                  username: 'Server',
                  message: 'Everyone has guessed the word!',
                  timestamp: Date.now(),
                });
              }
            }
          } else {
            // Emit failed guess message
            io.to(roomId).emit('chatMessage', {
              username: username,
              message: `Guessed "${guess}" - Incorrect guess!`,
              timestamp: Date.now(),
            });
          }
        }
      );

      // Disconnect handling
      socket.on(SOCKET_EVENTS.DISCONNECT, async () => {
        console.log('Player disconnected:', socket.username || socket.id);
        const connection = this.activeConnections.get(socket.id);
        if (connection) {
          const { roomId, username } = connection;

          // Remove player from lobby
          const lobby = await Lobby.findOneAndUpdate(
            { roomId },
            { $pull: { players: { username } } },
            { new: true }
          );

          // Clean up empty lobbies or update player list
          if (lobby && lobby.players.length === 0) {
            console.log('Removing empty lobby:', roomId);
            await Lobby.deleteOne({ roomId });
          } else if (lobby) {
            io.to(roomId).emit('playerUpdate', lobby.players);
          }

          this.activeConnections.delete(socket.id);
        }
      });
      // kick handling
      socket.on(SOCKET_EVENTS.KICK_PLAYER, async ({ roomId, username }) => {
        console.log(
          `Kick request received for player: ${username} in room: ${roomId}`
        );
        // Find the player's socket using stored usernames
        const playerToKick = [...io.sockets.sockets.values()].find(
          (s) => s.username === username
        );

        if (playerToKick) {
          console.log(
            `Kicking player: ${username} (Socket ID: ${playerToKick.id})`
          );
          // Notify the kicked player
          playerToKick.emit('kicked');
          // Remove player from activeConnections
          this.activeConnections.delete(playerToKick.id);

          // Remove player from the lobby and add to kicked list
          let lobby = await Lobby.findOne({ roomId });
          if (lobby) {
            // Add player to kicked list
            await lobby.addKickedUser(username);
            
            // Remove player from players array
            lobby.players = lobby.players.filter(
              (player) => player.username !== username
            );
            await lobby.save();

            // Notify all players in the room about the update
            io.to(roomId).emit(SOCKET_EVENTS.GAME_STATE_UPDATE, { lobby });
            
            // Notify players that someone was kicked
            io.to(roomId).emit(SOCKET_EVENTS.CHAT_MESSAGE, {
              username: 'Server',
              message: `${username} has been kicked from the lobby`,
              timestamp: Date.now(),
            });
          }

          // ✅ Forcefully disconnect the socket
          playerToKick.disconnect(true);
        } else {
          console.log(`Player ${username} not found`);
        }
      });

      socket.on(SOCKET_EVENTS.LEAVE_ROOM, async ({ roomId, username }) => {
        console.log(`Player ${username} is voluntarily leaving room: ${roomId}`);
        if (!roomId || !username) {
          console.error('Invalid room leave data');
          return;
        }
        
        try {
          // Remove player from activeConnections
          this.activeConnections.delete(socket.id);
          
          // Remove player from the lobby
          const lobby = await Lobby.findOneAndUpdate(
            { roomId },
            { $pull: { players: { username } } },
            { new: true }
          );
          
          if (lobby) {
            // Notify all players in the room about the update
            io.to(roomId).emit(SOCKET_EVENTS.GAME_STATE_UPDATE, { lobby });
            
            // Send a message to the room
            io.to(roomId).emit(SOCKET_EVENTS.CHAT_MESSAGE, {
              username: 'Server',
              message: `${username} has left the lobby`,
              timestamp: Date.now(),
            });
            
            // Clean up empty lobbies
            if (lobby.players.length === 0) {
              console.log('Removing empty lobby:', roomId);
              await Lobby.deleteOne({ roomId });
            }
          }
          
          // Leave the socket room
          socket.leave(roomId);
        } catch (error) {
          console.error('Error handling player leaving room:', error);
        }
      });
    });
  }

  async startRoundTimer(io, roomId, lobby) {
    console.log('[Timer] Starting round timer for room:', roomId, {
      roundTime: lobby.roundTime,
      currentGameState: lobby.gameState,
      startTime: new Date(lobby.startTime).toISOString(),
      currentRound: lobby.currentRound || 1, // Log current round to help debug
    });

    const startTime = Date.now();
    lobby.startTime = startTime;
    
    // Ensure the currentRound is set properly
    if (!lobby.currentRound) {
      lobby.currentRound = 1;
    }
    
    await lobby.save();

    const timer = setInterval(async () => {
      const currentTime = Date.now();
      const timeLeft = Math.max(
        0,
        (startTime + lobby.roundTime * 1000 - currentTime) / 1000
      );

      //
      if (timeLeft <= 0) {
        console.log('[Timer] Round time expired, clearing timer', {
          roomId,
          startTime: new Date(startTime).toISOString(),
          currentTime: new Date(currentTime).toISOString(),
          roundTime: lobby.roundTime,
        });
        clearInterval(timer);

        try {
          // Fetch fresh lobby state to avoid parallel saves
          const currentLobby = await Lobby.findOne({ roomId });
          if (!currentLobby) {
            console.log('[Timer] Lobby not found, stopping timer');
            return;
          }

          // Only end the round if we're still in DRAWING state
          // This prevents ending rounds that were already ended by word guesses
          if (currentLobby.gameState !== GAME_STATE.DRAWING) {
            console.log(
              `[Timer] Skipping round end - game not in DRAWING state (current: ${currentLobby.gameState})`
            );
            return;
          }

          // Handle round end - set state to DRAW_END and notify clients
          currentLobby.gameState = GAME_STATE.DRAW_END;
          currentLobby.canvasState = null;
          await currentLobby.save();
          io.to(roomId).emit(SOCKET_EVENTS.GAME_STATE_UPDATE, {
            lobby: currentLobby,
          });

          // Wait for cooldown
          const COOLDOWN_DURATION = 10000;
          await new Promise((resolve) =>
            setTimeout(resolve, COOLDOWN_DURATION)
          );

          // Set up next round
          const updatedLobby = await Lobby.findOne({ roomId });
          if (!updatedLobby) return;

          const availablePlayers = updatedLobby.players.filter(
            (p) => !p.hasDrawn && p.username !== updatedLobby.currentDrawer
          );

          // If there are still players who haven't drawn in this round
          if (availablePlayers.length > 0) {
            // Continue with current round
            const nextDrawer =
              availablePlayers[
                Math.floor(Math.random() * availablePlayers.length)
              ];
            const words = await this.generateWordChoices(updatedLobby);

            updatedLobby.currentDrawer = nextDrawer.username;
            updatedLobby.gameState =
              words.length === 1 ? GAME_STATE.DRAWING : GAME_STATE.PICKING_WORD;
            updatedLobby.currentWord =
              words.length === 1 ? words[0] : words.join(', ');
            updatedLobby.startTime = Date.now();
            // Clear canvas state for new drawing
            updatedLobby.canvasState = null;

            const playerIndex = updatedLobby.players.findIndex(
              (p) => p.username === nextDrawer.username
            );
            if (playerIndex !== -1) {
              updatedLobby.players[playerIndex].hasDrawn = true;
            }

            await updatedLobby.save();
            io.to(roomId).emit(SOCKET_EVENTS.GAME_STATE_UPDATE, {
              lobby: updatedLobby,
            });

            if (words.length === 1) {
              await this.startRoundTimer(io, roomId, updatedLobby);
            } else {
              this.setupWordSelectionTimeout(io, roomId, words);
            }
          } else {
            // All players have drawn - only now increment round counter
            // This is the fix - only increment when all players have drawn
            updatedLobby.currentRound = (updatedLobby.currentRound || 0) + 1;
            console.log(
              `Round ${updatedLobby.currentRound} of ${updatedLobby.maxRounds}`
            );

            // Change this condition to check if we've COMPLETED all rounds
            if (updatedLobby.currentRound > updatedLobby.maxRounds) {
              updatedLobby.gameState = GAME_STATE.FINISHED;
              updatedLobby.players.sort((a, b) => b.score - a.score);
              await updatedLobby.save();
              io.to(roomId).emit(SOCKET_EVENTS.GAME_STATE_UPDATE, {
                lobby: updatedLobby,
              });
              return; // End the game
            }

            // Start new round
            updatedLobby.players.forEach((player) => {
              player.hasDrawn = false;
              player.roundScore = 0;
            });
            // Clear canvas state for new round
            updatedLobby.canvasState = null;

            const randomIndex = Math.floor(
              Math.random() * updatedLobby.players.length
            );
            const words = await this.generateWordChoices(updatedLobby);

            updatedLobby.currentDrawer =
              updatedLobby.players[randomIndex].username;
            if (words.length === 1) {
              updatedLobby.gameState = GAME_STATE.DRAWING;
              updatedLobby.currentWord = words[0];
              const playerIndex = updatedLobby.players.findIndex(
                (p) => p.username === updatedLobby.players[randomIndex].username
              );
              if (playerIndex !== -1) {
                updatedLobby.players[playerIndex].hasDrawn = true;
              }
              updatedLobby.startTime = Date.now();
              await updatedLobby.save();
              io.to(roomId).emit(SOCKET_EVENTS.GAME_STATE_UPDATE, {
                lobby: updatedLobby,
              });
              await this.startRoundTimer(io, roomId, updatedLobby);
            } else {
              updatedLobby.gameState = GAME_STATE.PICKING_WORD;
              updatedLobby.currentWord = words.join(', ');
              const playerIndex = updatedLobby.players.findIndex(
                (p) => p.username === updatedLobby.players[randomIndex].username
              );
              if (playerIndex !== -1) {
                updatedLobby.players[playerIndex].hasDrawn = true;
              }
              updatedLobby.startTime = Date.now();
              await updatedLobby.save();
              io.to(roomId).emit(SOCKET_EVENTS.GAME_STATE_UPDATE, {
                lobby: updatedLobby,
              });
              this.setupWordSelectionTimeout(io, roomId, words);
            }
          }
        } catch (error) {
          console.error('[Timer] Error handling round end:', error);
        }
      }
    }, 1000);
  }

  async generateWordChoices(lobby) {
    const availableCategories = Object.keys(WORD_LIST);
    let selectedCategory = lobby.selectCategory;
    const numWords = lobby.selectWord || 1;
    
    // Handle the "random" category by collecting words from all categories
    if (selectedCategory === 'random') {
      // For "random" category, create a pool of words from all categories
      const allWords = [];
      availableCategories.forEach(category => {
        allWords.push(...WORD_LIST[category]);
      });
      
      // If selectWord is 1 or not set, just return a single random word
      if (numWords === 1) {
        return [allWords[Math.floor(Math.random() * allWords.length)]];
      }
      
      // Otherwise select multiple unique words
      const words = [];
      while (words.length < numWords) {
        const randomWord = allWords[Math.floor(Math.random() * allWords.length)];
        if (!words.includes(randomWord)) {
          words.push(randomWord);
        }
      }
      
      return words;
    } else {
      // For a specific category, continue with the original logic
      const categoryWords = WORD_LIST[selectedCategory];
      
      // If selectWord is 1 or not set, just return a single random word
      if (numWords === 1) {
        return [categoryWords[Math.floor(Math.random() * categoryWords.length)]];
      }
      
      // Otherwise select multiple unique words
      const words = [];
      while (words.length < numWords) {
        const randomWord = categoryWords[Math.floor(Math.random() * categoryWords.length)];
        if (!words.includes(randomWord)) {
          words.push(randomWord);
        }
      }
      
      return words;
    }
  }

  // End the round and update game state
  async endRound(io, roomId, lobby, allGuessedCorrectly) {
    try {
      console.log(
        `[endRound] Starting for room ${roomId}, all guessed: ${allGuessedCorrectly}`
      );

      // Only change state if we're still in DRAWING
      if (
        lobby.gameState !== GAME_STATE.DRAWING &&
        lobby.gameState !== GAME_STATE.DRAW_END
      ) {
        console.log(
          `[endRound] Aborting - game not in drawable state: ${lobby.gameState}`
        );
        return;
      }

      // Set game state to DRAW_END
      lobby.gameState = GAME_STATE.DRAW_END;
      lobby.canvasState = null;
      
      // Make sure drawPoints are preserved for display in the RoundEndModal
      // Don't reset them here, only add them to roundPoints which are cumulative for the entire round
      lobby.players.forEach((player) => {
        player.roundPoints = (player.roundPoints || 0) + (player.drawPoints || 0);
      });
      
      await lobby.save();

      io.to(roomId).emit(SOCKET_EVENTS.GAME_STATE_UPDATE, { lobby });

      // Wait for cooldown period before starting next round
      const COOLDOWN_DURATION = 10000;
      await new Promise((resolve) => setTimeout(resolve, COOLDOWN_DURATION));

      // Set up next round
      const updatedLobby = await Lobby.findOne({ roomId });
      if (!updatedLobby || updatedLobby.gameState === GAME_STATE.FINISHED)
        return;

      // By this point, the modal has been shown with drawPoints - now it's safe to reset them
      // but preserve roundPoints until the end of the entire round (all players have drawn)
      updatedLobby.players.forEach((player) => {
        player.drawPoints = 0; // Reset just the draw points, not the accumulated round points
        player.hasGuessedCorrect = false;
      });

      // Get a list of players who haven't drawn yet
      const availablePlayers = updatedLobby.players.filter(
        (p) => !p.hasDrawn && p.username !== updatedLobby.currentDrawer
      );

      // If there are still players who haven't drawn
      if (availablePlayers.length > 0) {
        const nextDrawer =
          availablePlayers[Math.floor(Math.random() * availablePlayers.length)];
        const words = await this.generateWordChoices(updatedLobby);

        // Update lobby state
        updatedLobby.currentDrawer = nextDrawer.username;
        // Clear canvas state
        updatedLobby.canvasState = null;
        if (words.length === 1) {
          updatedLobby.gameState = GAME_STATE.DRAWING;
          updatedLobby.currentWord = words[0];
          const playerIndex = updatedLobby.players.findIndex(
            (p) => p.username === nextDrawer.username
          );
          if (playerIndex !== -1) {
            updatedLobby.players[playerIndex].hasDrawn = true;
          }
          updatedLobby.startTime = Date.now();
          await updatedLobby.save();
          io.to(roomId).emit(SOCKET_EVENTS.GAME_STATE_UPDATE, {
            lobby: updatedLobby,
          });
          await this.startRoundTimer(io, roomId, updatedLobby);
        } else {
          updatedLobby.gameState = GAME_STATE.PICKING_WORD;
          updatedLobby.currentWord = words.join(', ');
          const playerIndex = updatedLobby.players.findIndex(
            (p) => p.username === nextDrawer.username
          );
          if (playerIndex !== -1) {
            updatedLobby.players[playerIndex].hasDrawn = true;
          }
          updatedLobby.startTime = Date.now();
          await updatedLobby.save();
          io.to(roomId).emit(SOCKET_EVENTS.GAME_STATE_UPDATE, {
            lobby: updatedLobby,
          });
          this.setupWordSelectionTimeout(io, roomId, words);
        }
      } else {
        // All players have drawn - only now increment round counter
        updatedLobby.currentRound = (updatedLobby.currentRound || 0) + 1;
        console.log(
          `Round ${updatedLobby.currentRound} of ${updatedLobby.maxRounds}`
        );

        // Check if game should end - change to > instead of >=
        if (updatedLobby.currentRound > updatedLobby.maxRounds) {
          updatedLobby.gameState = GAME_STATE.FINISHED;
          updatedLobby.players.sort((a, b) => b.score - a.score);
          
          // Update player stats when the game is finished
          const updatePromises = updatedLobby.players.map(async (player) => {
            try {
              // Find the player in the database
              const user = await User.findOne({ username: player.username });
              if (user) {
                // Update game stats
                user.gameStats.totalScore += player.score;
                user.gameStats.gamesPlayed += 1;
                
                // Give a win to the player with the highest score
                if (player === updatedLobby.players[0]) {
                  user.gameStats.gamesWon += 1;
                }
                
                // Save the updated user
                await user.save();
                console.log(`Updated stats for user ${player.username}: Score: ${player.score}, Total: ${user.gameStats.totalScore}`);
              }
            } catch (error) {
              console.error(`Error updating stats for ${player.username}:`, error);
            }
          });
          
          // Wait for all updates to complete
          await Promise.all(updatePromises);
          
          await updatedLobby.save();
          io.to(roomId).emit(SOCKET_EVENTS.GAME_STATE_UPDATE, {
            lobby: updatedLobby,
          });
        } else {
          // Reset for new round
          updatedLobby.players.forEach((player) => {
            player.hasDrawn = false;
            player.roundPoints = 0;
            player.drawPoints = 0;
          });
          // Clear canvas state for new round
          updatedLobby.canvasState = null;

          const randomIndex = Math.floor(
            Math.random() * updatedLobby.players.length
          );
          const words = await this.generateWordChoices(updatedLobby);

          updatedLobby.currentDrawer =
            updatedLobby.players[randomIndex].username;
          if (words.length === 1) {
            updatedLobby.gameState = GAME_STATE.DRAWING;
            updatedLobby.currentWord = words[0];
            const playerIndex = updatedLobby.players.findIndex(
              (p) => p.username === updatedLobby.players[randomIndex].username
            );
            if (playerIndex !== -1) {
              updatedLobby.players[playerIndex].hasDrawn = true;
            }
            updatedLobby.startTime = Date.now();
            await updatedLobby.save();
            io.to(roomId).emit(SOCKET_EVENTS.GAME_STATE_UPDATE, {
              lobby: updatedLobby,
            });
            await this.startRoundTimer(io, roomId, updatedLobby);
          } else {
            updatedLobby.gameState = GAME_STATE.PICKING_WORD;
            updatedLobby.currentWord = words.join(', ');
            const playerIndex = updatedLobby.players.findIndex(
              (p) => p.username === updatedLobby.players[randomIndex].username
            );
            if (playerIndex !== -1) {
              updatedLobby.players[playerIndex].hasDrawn = true;
            }
            updatedLobby.startTime = Date.now();
            await updatedLobby.save();
            io.to(roomId).emit(SOCKET_EVENTS.GAME_STATE_UPDATE, {
              lobby: updatedLobby,
            });
            this.setupWordSelectionTimeout(io, roomId, words);
          }
        }
      }
    } catch (error) {
      console.error('[endRound] Error:', error);
    }
  }
}

// Export factory function to create GameManager instance
export const initializeSocketEvents = (io) => {
  return new GameManager(io);
};
