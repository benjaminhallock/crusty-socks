import { GAME_STATE, SOCKET_EVENTS } from "../shared/constants.js";
import { WORD_LIST } from "../shared/constants.js";
import Lobby from "./models/lobby.js";
import User from "./models/user.js";

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
    console.log("Setting up socket event listeners");

    io.on("connection", (socket) => {
      console.log("player connected to server:", socket.id);

      // Send immediate acknowledgment of connection
      socket.emit("connect_ack", { id: socket.id });

      // Handle initial connection error
      socket.on("error", (error) => {
        console.error("Socket error:", error);
        socket.emit("error", "Connection error occurred");
      });

      // Game initialization event
      socket.on("startGame", async (roomId) => {
        console.log("Starting new game in room:", roomId);
        //When the user connects, make their socket join the "room" group.
        socket.join(roomId);

        //Find a lobby assuming it was created with POST request
        const lobby = await Lobby.findOne({ roomId });
        if (!lobby) {
          console.error("Cannot start game - Lobby not found:", roomId);
          return;
        }

        // Initialize game state with random drawer and words
        const drawerIndex = Math.floor(Math.random() * lobby.players.length);
        const drawer = lobby.players[drawerIndex];

        // Determine the category to use for word selection
        const availableCategories = Object.keys(WORD_LIST);
        let selectedCategory;

        // Handle random category selection or validate user-selected category
        if (!lobby.selectCategory || lobby.selectCategory === "random") {
          // Pick a random category if none specified or random requested
          selectedCategory = availableCategories[Math.floor(Math.random() * availableCategories.length)];
        } else {
          // Try to use the requested category (case insensitive)
          const normalizedCategory = lobby.selectCategory.toLowerCase();
          if (WORD_LIST[normalizedCategory]) {
            selectedCategory = normalizedCategory;
          } else {
            console.error(`Invalid category: "${lobby.selectCategory}", falling back to random`);
            selectedCategory = availableCategories[Math.floor(Math.random() * availableCategories.length)];
          }
        }

        // Update lobby with the selected category
        lobby.selectCategory = selectedCategory;
        console.log(`Using category: ${selectedCategory}`);

        // Select random words from the category
        const words = [];
        const categoryWords = WORD_LIST[selectedCategory];
        const numWords = Math.min(lobby.selectWord || 3, 5); // Default 3, max 5 words

        for (let i = 0; i < numWords; i++) {
          const randomIndex = Math.floor(Math.random() * categoryWords.length);
          words.push(categoryWords[randomIndex]);
        }
        console.log("Selected words:", words);
        // Update lobby state for random word/user
        lobby.currentDrawer = drawer.username;
        lobby.gameState = GAME_STATE.PICKING_WORD;
        lobby.currentWord = words.join(", ");
        

        console.log("Updated lobby state:", lobby);

        await lobby.save();

        // Broadcast new game state to all players in room
        io.to(roomId).emit(SOCKET_EVENTS.GAME_STATE_UPDATE, { lobby });
      });

      // Chat message handling
      socket.on(SOCKET_EVENTS.CHAT_MESSAGE, async ({ roomId, message, username }) => {
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
      });

      // Word selection handling
      socket.on(SOCKET_EVENTS.SELECT_WORD, async ({ roomId, word }) => {
        console.log("Word selected for room:", { roomId, word });

        const lobby = await Lobby.findOne({ roomId });
        if (!lobby) {
          console.error("Cannot select word - Lobby not found");
          return;
        }

        // Update game state and broadcast
        lobby.currentWord = word;
        lobby.gameState = GAME_STATE.DRAWING;
        await lobby.save();

        io.to(roomId).emit(SOCKET_EVENTS.GAME_STATE_UPDATE, { lobby });
      });

      // Lobby join handling
      socket.on(SOCKET_EVENTS.JOIN_LOBBY, async ({ roomId, username }) => {
        console.log("Player joining lobby:", { roomId, username });

        if (!roomId || !username) {
          console.error("Invalid lobby join data");
          return;
        }

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

          // Set up socket room and track connection
          socket.join(roomId);
          socket.roomId = roomId;
          this.activeConnections.set(socket.id, { roomId, username });

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

          // Don't allow the drawer to guess
          if (username === lobby.currentDrawer) {
            console.error("Drawer cannot guess the word");
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

      // Handle timer completion
      socket.on("timeUp", async (roomId) => {
        const lobby = await Lobby.findOne({ roomId });
        if (!lobby || lobby.gameState !== GAME_STATE.DRAWING) return; // Ensure we're in the correct state

        await this.endRound(io, roomId, lobby, false);
      });

      // Disconnect handling
      socket.on("disconnect", async () => {
        console.log("Player disconnected:", socket.id);

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
    });
  }

  async endRound(io, roomId, lobby, allGuessedCorrectly) {
    lobby.gameState = GAME_STATE.WAITING;
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
  }
}

// Export factory function to create GameManager instance
export const initializeSocketEvents = (io) => {
  return new GameManager(io);
};
