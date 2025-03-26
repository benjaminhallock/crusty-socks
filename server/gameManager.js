import { socketManager } from "../client/src/services/socket.js";
import { GAME_STATE, SOCKET_EVENTS } from "../shared/constants.js";
import { WORD_LIST } from "../shared/constants.js";
import Lobby from "./models/lobby.js";
import User from "./models/user.js";
import Report from "./models/report.js";

/**
 * GameManager Class
 * Central hub for managing game state, player connections, and real-time game events
 * Handles all socket.io events for the game's server-side logic
 */
class GameManager {
  constructor(io) {
    console.log("Initializing GameManager");
    this.io = io; // Socket.io server instance
    // Map to track active player connections: socketId -> {roomId, username}
    this.activeConnections = new Map();
    this.setupSocketListeners(io);
  }

  setupSocketListeners(io) {
    io.on("connection", (socket) => {
      console.log("player connected to server:", socket.id);

      // Send immediate acknowledgment of connection
      socket.emit("connect_ack", { id: socket.id });

      // Handle initial connection error
      socket.on("error", (error) => {
        console.error("Socket error:", error);
        socket.emit("error", "Connection error occurred");
      });

      socket.on(SOCKET_EVENTS.REPORT_PLAYER, async ({ roomId, username }) => {
        console.log("Report player request:", { roomId, username });
        const lobby = await Lobby.findOne({ roomId });
        const reportedUser = await User.findOne({ username });
        if (!lobby || !reportedUser) {
          console.error("Cannot report player - Lobby not found:", roomId);
          return;
        }
        const user = socket.username;
        if (!user) {
          console.error("Cannot report player - User not found:", user);
          return;
        }
        const report = new Report({
          reportedUser: username,
          reportedBy: user,
          roomId,
          reason: "Inappropriate behavior", // Default reason
          timestamp: Date.now(),
          chatLogs: lobby.messages || [], // Include recent chat logs
          status: "pending"
        });
        await report.save();
        console.log(`Reported player: ${username} in room: ${roomId}`);
      });

      socket.on(SOCKET_EVENTS.END_DRAWING, async ({ roomId }) => {
        console.log("Time's up! Ending drawing for room:", roomId);
        const lobby = await Lobby.findOne({ roomId });
        if (!lobby) {
          console.error("Cannot end drawing - Lobby not found:", roomId);
          return;
        }

        lobby.gameState = GAME_STATE.DRAW_END;
        await lobby.save();
        io.to(roomId).emit(SOCKET_EVENTS.GAME_STATE_UPDATE, { lobby });

        // After 10 seconds, start next round
        setTimeout(async () => {
          const currentLobby = await Lobby.findOne({ roomId });
          if (currentLobby) {
            io.to(roomId).emit(SOCKET_EVENTS.START_GAME, roomId);
          }
        }, 10000);
      });

      // Game initialization event
      socket.on(SOCKET_EVENTS.START_GAME, async (roomId) => {
        const lobby = await Lobby.findOne({ roomId });
        if (!lobby) {
          console.error("Cannot start game - Lobby not found:", roomId);
          return;
        }

        // Select a random drawer where hasDrawn is false
        const availablePlayers = lobby.players.filter(
          (player) => !player.hasDrawn
        );
        if (!availablePlayers.length) {
          console.error("No available players to draw");
          return;
        }

        // Randomly select a drawer from available players
        const drawerIndex = Math.floor(Math.random() * availablePlayers.length);
        const drawer = availablePlayers[drawerIndex];

        // Set the drawer regardless of word selection mode
        lobby.currentDrawer = drawer.username;

        // Determine the category to use for word selection
        if (!lobby.selectCategory) {
          console.warn(
            "No category selected, using random category for word selection"
          );
        }
        const availableCategories = Object.keys(WORD_LIST);
        let selectedCategory;
        // Use the requested category if valid, otherwise pick random
        if (lobby.selectCategory !== "random") {
          // Find category case-insensitively
          const lowerCaseCategory = lobby.selectCategory.toLowerCase();
          selectedCategory = availableCategories.find(
            (cat) => cat.toLowerCase() === lowerCaseCategory
          );
        } else {
          // Pick a random category
          selectedCategory =
            availableCategories[
              Math.floor(Math.random() * availableCategories.length)
            ];
        }
        // Save the selected category to the lobby
        lobby.selectCategory = selectedCategory;

        // Initialize array to store word choices
        const words = [];

        // Get all words from the selected category
        const categoryWords = WORD_LIST[selectedCategory];

        // Determine how many words to select (basically length of array(0) or 1 )
        const numWords = Math.min(lobby.selectWord || 1, categoryWords.length);

        // Select random unique words from category
        while (words.length < numWords) {
          // Pick a random word
          const randomWord =
            categoryWords[Math.floor(Math.random() * categoryWords.length)];

          // Only add if it's not already selected
          if (!words.includes(randomWord)) {
            words.push(randomWord);
          }
        }

        // Set common lobby properties
        lobby.gameState =
          words.length === 1 ? GAME_STATE.DRAWING : GAME_STATE.PICKING_WORD;
        lobby.currentWord = words.length === 1 ? words[0] : words.join(", ");
        lobby.startTime = Date.now();
        lobby.currentDrawer = drawer.username;
        lobby.availableWords = words;

        // Mark the current drawer
        const playerIndex = lobby.players.findIndex(
          (p) => p.username === drawer.username
        );
        if (playerIndex !== -1) {
          lobby.players[playerIndex].hasDrawn = true;
        }

        if (lobby.gameState === GAME_STATE.DRAWING) {
          lobby.startTime = Date.now();
          io.to(roomId).emit(SOCKET_EVENTS.GAME_STATE_UPDATE, { lobby });
          this.startRoundTimer(io, roomId, lobby);
        } else {
          // Auto-select word after 15 seconds if not chosen
          setTimeout(async () => {
            const currentLobby = await Lobby.findOne({ roomId });
            if (currentLobby?.gameState === GAME_STATE.PICKING_WORD) {
              currentLobby.currentWord =
                words[Math.floor(Math.random() * words.length)];
              currentLobby.gameState = GAME_STATE.DRAWING;
              currentLobby.startTime = Date.now();
              await currentLobby.save();
              io.to(roomId).emit(SOCKET_EVENTS.GAME_STATE_UPDATE, {
                lobby: currentLobby,
              });
              this.startRoundTimer(io, roomId, currentLobby);
            }
          }, 15000);
        }
        await lobby.save();
        io.to(roomId).emit(SOCKET_EVENTS.GAME_STATE_UPDATE, { lobby });
      });

      // Chat message handling
      socket.on(
        SOCKET_EVENTS.CHAT_MESSAGE,
        async ({ roomId, message, username }) => {
          console.log("New chat message:", { roomId, username, message });

          if (!roomId || !message || !username) {
            console.error("Invalid chat message data");
            return;
          }

          const messageData = { username, message, timestamp: Date.now() };

          // Store message in database and broadcast to room
          await Lobby.findOneAndUpdate(
            { roomId },
            { $push: { messages: messageData } }
          );
          io.to(roomId).emit("chatMessage", messageData);
        }
      );

      // Word selection handling
      socket.on(SOCKET_EVENTS.SELECT_WORD, async ({ roomId, word }) => {
        console.log("Word selected for room:", { roomId, word });
        const lobby = await Lobby.findOne({ roomId });
        if (!lobby) {
          console.error("Cannot select word - Lobby not found");
          return;
        }
        // Update game state and start timer
        lobby.currentWord = word;
        lobby.gameState = GAME_STATE.DRAWING;
        lobby.startTime = Date.now();
        await lobby.save();
        io.to(roomId).emit(SOCKET_EVENTS.GAME_STATE_UPDATE, { lobby });
        // Start timer for this round
        const timer = setInterval(async () => {
          const currentTime = Date.now();
          const endTime = lobby.startTime + lobby.roundTime * 1000;

          if (currentTime >= endTime) {
            clearInterval(timer);
            await this.endRound(io, roomId, lobby, false);
          }
        }, 1000);
      });

      // Lobby join handling
      socket.on(SOCKET_EVENTS.JOIN_LOBBY, async ({ roomId, username }) => {
        if (!roomId || !username) {
          console.error("Invalid lobby join data");
          return;
        }
        console.log("Player joining lobby:", { roomId, username });
        socket.username = username; // Store username in socket for later use
        socket.roomId = roomId; // Store roomId in socket for later use

        // Find user by username
        const user = await User.findOne({ username });
        if (!user) {
          console.error("Cannot join - User not found:", username);
          return;
        }

        try {
          let lobby = await Lobby.findOne({ roomId });
          if (!lobby) {
            console.error("Cannot join - Lobby not found:", roomId);
            return;
          }

          // Check if player is already in lobby
          if (lobby.players.find((p) => p.userId === user._id)) {
            console.error("Player already in lobby:", user.username);
            return;
          }

          // Add player to lobby
          lobby.players.push({
            username: user.username,
            userId: user._id,
            score: 1000,
          });
          await lobby.save();

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
            username: "Server",
            message: `${username} has joined the lobby`,
            timestamp: Date.now(),
          });
        } catch (error) {
          console.error("Error in joinLobby:", error);
        }
      });

      // Canvas update handling
      socket.on(SOCKET_EVENTS.CANVAS_UPDATE, async ({ roomId, canvasData }) => {
        if (!roomId || !canvasData) {
          console.error("Invalid canvas update data");
          return;
        }

        try {
          // Store canvas state in the lobby
          Lobby.findOneAndUpdate(
            { roomId },
            { canvasState: { data: canvasData, lastUpdate: Date.now() } },
            { new: true }
          ).catch((err) => console.error("Error saving canvas state:", err));

          // Broadcast the update to all clients in the room except the sender
          socket.to(roomId).emit("canvasUpdate", canvasData);
        } catch (error) {
          console.error("Error updating canvas:", error);
        }
      });

      // Word guess checking
      socket.on(
        SOCKET_EVENTS.CHECK_WORD_GUESS,
        async ({ roomId, guess, username }) => {
          const lobby = await Lobby.findOne({ roomId });
          if (!lobby || lobby.gameState !== GAME_STATE.DRAWING) {
            console.error("Lobby not found or not in drawing state");
            return;
          }
          if (username === lobby.currentDrawer) {
            console.error("Drawer cannot guess the word");
            socket.emit("chatMessage", {
              username: "Server",
              message: "You cannot guess the word while drawing!",
              timestamp: Date.now(),
            });
            return;
          }

          const isCorrect =
            lobby.currentWord.toLowerCase() === guess.toLowerCase();

          if (!isCorrect) {
            // Emit failed guess message
            io.to(roomId).emit("chatMessage", {
              username: username,
              message: `Guessed "${guess}" - Incorrect guess!`,
              timestamp: Date.now(),
            });
          }

          if (isCorrect) {
            // Check if player has already guessed correctly
            const playerIndex = lobby.players.findIndex(
              (p) => p.username === username
            );
            if (
              playerIndex !== -1 &&
              !lobby.players[playerIndex].hasGuessedCorrect
            ) {
              // Add points and mark as guessed
              lobby.players[playerIndex].score += 100;
              lobby.players[playerIndex].hasGuessedCorrect = true;
              await lobby.save();

              // Emit success message
              io.to(roomId).emit("chatMessage", {
                username: "Server",
                message: `${username} guessed the word correctly! (+100 points)`,
                timestamp: Date.now(),
              });

              // Calculate remaining players who haven't guessed
              const remainingPlayers = lobby.players.filter(
                (player) =>
                  !player.hasGuessedCorrect &&
                  player.username !== lobby.currentDrawer
              );

              // If no players left to guess, end the round
              if (remainingPlayers.length === 0) {
                io.to(roomId).emit("chatMessage", {
                  username: "Server",
                  message: "Everyone has guessed the word! Round ending...",
                  timestamp: Date.now(),
                });

                // Short delay before ending round
                setTimeout(async () => {
                  await this.endRound(io, roomId, lobby, true);
                }, 3000);
              }
            }
          }
        }
      );

      // Disconnect handling
      socket.on("disconnect", async () => {
        console.log("Player disconnected:", socket.username || socket.id);
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
            console.log("Removing empty lobby:", roomId);
            await Lobby.deleteOne({ roomId });
          } else if (lobby) {
            io.to(roomId).emit("playerUpdate", lobby.players);
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
          playerToKick.emit("kicked");
          // Remove player from activeConnections
          this.activeConnections.delete(playerToKick.id);

          // Remove player from the lobby
          let lobby = await Lobby.findOne({ roomId });
          if (lobby) {
            lobby.players = lobby.players.filter(
              (player) => player.username !== username
            );
            await lobby.save();

            // Notify all players in the room about the update
            io.to(roomId).emit(SOCKET_EVENTS.GAME_STATE_UPDATE, { lobby });
          }

          // ✅ Forcefully disconnect the socket
          playerToKick.disconnect(true);
        } else {
          console.log(`Player ${username} not found`);
        }
      });
    });
  }

  startRoundTimer(io, roomId, lobby) {
    const timer = setInterval(async () => {
      const currentTime = Date.now();
      const endTime = lobby.startTime + lobby.roundTime * 1000;

      if (currentTime >= endTime) {
        clearInterval(timer);
        await this.endRound(io, roomId, lobby, false);
      }
    }, 1000);
  }

  async endRound(io, roomId, lobby, allGuessedCorrectly) {
    // Set game state to DRAW_END first
    lobby.gameState = GAME_STATE.DRAW_END;
    lobby.canvasState = null;
    lobby.timeLeft = 60;

    // Reset player guess states and add points to drawer if everyone guessed
    if (allGuessedCorrectly) {
      const drawerIndex = lobby.players.findIndex(
        (p) => p.username === lobby.currentDrawer
      );
      if (drawerIndex !== -1) {
        lobby.players[drawerIndex].score += 50; // Bonus points for drawer if everyone guesses
      }
    }

    // Reset player guess states
    lobby.players.forEach((player) => {
      player.hasGuessedCorrect = false;
    });

    // Check if round is over by checking if all players have drawn
    const availablePlayers = lobby.players.filter(
      (p) => p.username !== lobby.currentDrawer && !p.hasDrawn
    );

    if (availablePlayers.length > 0) {
      const nextDrawerIndex = Math.floor(
        Math.random() * availablePlayers.length
      );
      lobby.currentDrawer = availablePlayers[nextDrawerIndex].username;
      const playerIndex = lobby.players.findIndex(
        (p) => p.username === lobby.currentDrawer
      );
      if (playerIndex !== -1) {
        lobby.players[playerIndex].hasDrawn = true;
      }
    } else {
      // If all players have drawn, reset and pick randomly
      lobby.round += 1;
      if (lobby.round >= lobby.maxRounds) {
        lobby.gameState = GAME_STATE.FINISHED;
        lobby.players.sort((a, b) => b.score - a.score);
      } else {
        // Reset player drawing state for next round
        lobby.players.forEach((player) => {
          player.hasDrawn = false;
        });
      }
    }
    // Send round end message
    io.to(roomId).emit("chatMessage", {
      username: "Server",
      message: allGuessedCorrectly
        ? "Round ended - Everyone guessed correctly! Drawer got +50 points!"
        : `Round ended - The word was "${lobby.currentWord}"`,
      timestamp: Date.now(),
    });

    await lobby.save();
    io.to(roomId).emit(SOCKET_EVENTS.GAME_STATE_UPDATE, { lobby });

    // After 10 seconds, proceed with next round setup
    setTimeout(async () => {
      const currentLobby = await Lobby.findOne({ roomId });
      if (!currentLobby) return;

      // Your existing next round logic
      const availablePlayers = currentLobby.players.filter(
        (p) => p.username !== currentLobby.currentDrawer && !p.hasDrawn
      );

      if (availablePlayers.length > 0) {
        const nextDrawerIndex = Math.floor(
          Math.random() * availablePlayers.length
        );
        lobby.currentDrawer = availablePlayers[nextDrawerIndex].username;
        const playerIndex = lobby.players.findIndex(
          (p) => p.username === lobby.currentDrawer
        );
        if (playerIndex !== -1) {
          lobby.players[playerIndex].hasDrawn = true;
        }
      } else {
        // If all players have drawn, reset and pick randomly
        lobby.round += 1;
        if (lobby.round >= lobby.maxRounds) {
          lobby.gameState = GAME_STATE.FINISHED;
          lobby.players.sort((a, b) => b.score - a.score);
        } else {
          // Reset player drawing state for next round
          lobby.players.forEach((player) => {
            player.hasDrawn = false;
          });
        }
      }

      await currentLobby.save();
      io.to(roomId).emit(SOCKET_EVENTS.GAME_STATE_UPDATE, {
        lobby: currentLobby,
      });
    }, 10000); // 10 second delay
  }
}

// Export factory function to create GameManager instance
export const initializeSocketEvents = (io) => {
  return new GameManager(io);
};
