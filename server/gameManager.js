import { Filter } from "bad-words";

import { log, trim } from "./constants.js";
import {
  GAME_STATE as gs,
  SOCKET_EVENTS as se,
  WORD_LIST,
} from "./constants.js";
import Chat from "./models/chat.js";
import Lobby from "./models/lobby.js";
import User from "./models/user.js"; // Add missing import

async function withRetry(operation, maxRetries = 3) {
  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      return await operation();
    } catch (error) {
      if (
        attempt === maxRetries ||
        (!error.message.includes("MongoServerSelectionError") &&
          !error.message.includes("ECONNRESET"))
      ) {
        throw error;
      }
      console.log(`Retrying operation attempt ${attempt}/${maxRetries}`);
      await new Promise((resolve) => setTimeout(resolve, 1000 * attempt));
    }
  }
}

class GameManager {
  constructor(io) {
    console.log("[GameManager] Initialized.");
    this.io = io;
    this.activeConnections = new Map();
    this.lobbyTimers = new Map();
    this.saveLocks = new Map();
    this._canvasSaveTimers = new Map();
    this.wordSelectionTimers = new Map();
    this.setupSocketListeners(io);
  }

  // Socket Events Setup
  setupSocketListeners(io) {
    io.on("connection", (socket) => {
      socket.on(se.CONNECT_ACK, (userData, roomId) => {
        this.handleConnectAck(socket, userData, roomId);
      });

      socket.on(se.CANVAS_UPDATE, ({ roomId, canvasState }) => {
        if (!canvasState?.data) return console.warn("No canvas data provided");
        this.handleCanvasUpdate(socket, { roomId, canvasState });
      });
      socket.on(se.CHAT_MESSAGE, (data) =>
        this.handleChatMessage(socket, data)
      );
      socket.on(se.START_GAME, (roomId) => {
        this.startNextDraw(this.io, roomId);
      });
      socket.on(se.SELECT_WORD, (data) => this.handleSelectWord(data));
      socket.on(se.CHECK_WORD_GUESS, (data) =>
        this.handleCheckWordGuess({
          socket,
          ...data,
        })
      );
      socket.on(se.LEAVE_LOBBY, ({ roomId, username }) => {
        this.handleDisconnect(socket, roomId, username);
      });

      socket.on(se.KICK_PLAYER, ({ roomId, username }) => {
        this.handleKickPlayer(socket, { roomId, username });
      });

      socket.on(se.CANVAS_UPDATE, (data) => {
        if (!data?.canvasState?.data) return;

        const connection = this.activeConnections.get(socket.id);
        if (!connection) return;

        const { roomId } = connection;
        if (!roomId) return;

        // Emit to room immediately
        socket.to(roomId).volatile.emit(se.CANVAS_UPDATE, {
          canvasState: data.canvasState,
        });

        // Debounced save
        if (this._canvasSaveTimer?.[roomId]) {
          clearTimeout(this._canvasSaveTimer[roomId]);
        }
        if (!this._canvasSaveTimer) this._canvasSaveTimer = {};

        this._canvasSaveTimer[roomId] = setTimeout(() => {
          Lobby.findOneAndUpdate(
            { roomId },
            { canvasState: data.canvasState },
            { new: true }
          )
            .exec()
            .catch(console.error);
        }, 1000);
      });
      socket.on(se.REQUEST_CHAT_HISTORY, (data) =>
        this.handleRequestChatHistory(socket, data)
      );
    });
  }

  // Socket Event Handlers
  async handleConnectAck(socket, userData, roomId) {
    if (!userData || !roomId) {
      console.error("Invalid user data or room ID");
      socket.emit("error", { message: "Invalid connection data" });
      return;
    }

    await this.acquireSaveLock(roomId);

    try {
      let lobby = await Lobby.findOne({ roomId });
      if (!lobby) {
        socket.emit("error", { message: "Lobby not found" });
        return;
      }

      // Check if player already exists and remove any stale entries
      let existingPlayer = lobby.players.find(
        (p) => p.username === userData.username
      );

      if (existingPlayer) {
        // Update existing player connection
        existingPlayer.connected = true;
        existingPlayer.socketId = socket.id;
      } else {
        // Add new player if lobby isn't full
        if (lobby.players.length >= lobby.playerLimit) {
          socket.emit("error", { message: "Lobby is full" });
          return;
        }

        lobby.players.push({
          username: userData.username,
          userId: userData._id,
          socketId: socket.id,
          connected: true,
          score: 0,
          hasDrawn: false,
          hasGuessedCorrect: false,
          drawScore: 0,
          roundScore: 0,
        });
      }

      // Save changes
      await lobby.save();

      // Set up socket data and join room
      socket.join(roomId);

      // Store connection info
      this.activeConnections.set(socket.id, {
        userId: userData._id,
        username: userData.username,
        roomId: roomId,
        _id: lobby._id,
      });

      // First send the update to the joining player
      socket.emit(se.GAME_STATE_UPDATE, { lobby });

      // Then broadcast to everyone including the new player
      this.io.to(roomId).emit(se.GAME_STATE_UPDATE, { lobby });

      // Notify room of new player only if they weren't already in the lobby
      if (!existingPlayer) {
        this.io.to(roomId).emit(se.CHAT_MESSAGE, {
          _id: lobby._id,
          username: "Server",
          message: `${userData.username} has joined the lobby.`,
          timestamp: Date.now(),
          isSystemMessage: true,
        });
      }

      // Request chat history
      socket.emit(se.REQUEST_CHAT_HISTORY, { lobbyObjectId: lobby._id });
    } catch (error) {
      console.error("Error in handleConnectAck:", error);
      socket.emit("error", { message: "Failed to join lobby" });
    } finally {
      this.releaseSaveLock(roomId);
    }
  }

  async handleSelectWord({ roomId, word }) {
    if (!word || !roomId) {
      console.error("Invalid word or room ID");
      return;
    }
    await this.acquireSaveLock(roomId);
    try {
      const lobby = await Lobby.findOneAndUpdate(
        { roomId },
        {
          $set: {
            currentWord: word,
            gameState: gs.DRAWING,
            startTime: Date.now(),
          },
        },
        { new: true } // Returns the updated document
      );

      if (!lobby) {
        console.error("Lobby not found");
        this.releaseSaveLock(roomId);
        return;
      }

      this.io.to(roomId).emit(se.GAME_STATE_UPDATE, { lobby });
      await this.startDrawTimer(this.io, roomId, lobby);
    } catch (error) {
      console.error("Error selecting word:", error);
      this.releaseSaveLock(roomId);
    } finally {
      this.releaseSaveLock(roomId);
    }
  }
  async handleChatMessage(
    socket,
    { roomId, lobbyObjectId, message, username }
  ) {
    if (!message || !lobbyObjectId) {
      console.error("Invalid message or lobby ID");
      return;
    }

    message = message.trim();
    const filter = new Filter();
    if (filter.isProfane(message))
      return socket.emit("error", {
        message: "Profanity is not allowed",
      });
    if (message.length > 200) {
      return socket.emit("error", {
        message: "Message cannot exceed 200 characters",
      });
    }
    try {
      const lobby = await Lobby.findById(lobbyObjectId);
      if (!lobby) {
        console.error("Lobby not found");
        return;
      }

      // You can delete this it should've be triggering anyway.
      if (lobby.gameState === gs.DRAWING && lobby.currentDrawer === username) {
        console.warn("delete this if it runs");
        socket.emit(se.CHAT_MESSAGE, {
          username: "Server",
          message: "You cannot chat while drawing!",
          timestamp: Date.now(),
          isSystemMessage: true,
        });
        return;
      }

      // Check if message contains the correct word
      if (
        lobby.gameState === gs.DRAWING &&
        trim(message) === trim(lobby.currentWord)
      ) {
        console.warn("delete this if it runs");
        await this.handleCheckWordGuess({
          socket,
          roomId,
          guess: message,
          username,
        });
        return;
      }

      // Save chat message
      const savedChat = await Chat.create({
        lobbyObjectId,
        username,
        userId: socket.userData?._id,
        message: message.trim(),
        timestamp: Date.now(),
        isSystemMessage: false,
      });

      savedChat.save().catch((err) => {
        console.error("Error saving chat message:", err);
      });

      // Emit message to room immediately for better responsiveness
      this.io.to(roomId).emit(se.CHAT_MESSAGE, {
        _id: savedChat._id,
        username,
        message: message.trim(),
        timestamp: Date.now(),
        isSystemMessage: false,
      });

      // Update chat history
      const chatHistory = await Chat.find({ lobbyObjectId })
        .sort({ timestamp: -1 })
        .limit(100)
        .select("_id username message timestamp isSystemMessage isGuessMessage")
        .lean();

      if (chatHistory?.length > 0) {
        this.io.to(roomId).emit(se.CHAT_HISTORY, chatHistory.reverse());
      }
    } catch (error) {
      console.error("Error handling chat message:", error);
      socket.emit(se.CHAT_MESSAGE, {
        username: "Server",
        message: "Failed to send message.",
        timestamp: Date.now(),
        isSystemMessage: true,
      });
    }
  }

  async handleCheckWordGuess({ socket, roomId, guess, username }) {
    try {
      const lobby = await Lobby.findOne({ roomId });
      if (!lobby || lobby.gameState !== gs.DRAWING) return;

      const player = lobby.players.find((p) => p.username === username);
      if (!player) {
        console.error("Player not found in lobby");
        return;
      }
      if (player.hasGuessedCorrect) {
        socket.emit(se.CHAT_MESSAGE, {
          username: "Server",
          message: "You have already guessed correctly!",
          timestamp: Date.now(),
          isSystemMessage: true,
        });
        return; //TODO: emit to winners only chat aka regular chat
      }
      if (lobby.currentDrawer === username) {
        socket.emit(se.CHAT_MESSAGE, {
          username: "Server",
          message: "You are drawing *shhh*!",
          timestamp: Date.now(),
          isSystemMessage: true,
        });
        return;
      }

      const msg = trim(guess);
      const answer = trim(lobby.currentWord);
      const isCorrectGuess =
        msg.toLowerCase().includes(answer.toLowerCase()) ||
        answer.toLowerCase().includes(msg.toLowerCase());

      if (!isCorrectGuess) {
        // Send incorrect guess to all players but only play sound for the guesser
        this.io.to(roomId).emit(se.CHAT_MESSAGE, {
          username,
          message: guess,
          timestamp: Date.now(),
          isSystemMessage: false,
          isGuessMessage: true,
          isCorrect: false,
        });
        socket.emit(se.SOUND, { sound: "incorrect" });
      } else {
        // Play correct sound for everyone on correct guess
        // Calculate guesser points based on order
        const correctGuessers = lobby.players.filter(
          (p) => p.hasGuessedCorrect
        ).length;
        const remainingPlayers = lobby.players.length - correctGuessers - 1;
        const points = Math.max(10, remainingPlayers * 10);

        // Update guesser scores
        player.drawScore += points;
        player.roundScore += points;
        player.hasGuessedCorrect = true;
        player.guessTime = Date.now();

        // Update drawer score (10 points per correct guess)
        const drawer = lobby.players.find(
          (p) => p.username === lobby.currentDrawer
        );
        if (drawer) {
          const drawerPoints = 10;
          drawer.drawScore += drawerPoints;
          drawer.roundScore = drawer.roundScore + drawerPoints;
          // Bonus if everyone guesses
          if (correctGuessers + 1 === lobby.players.length) {
            const bonusPoints = 20;
            drawer.drawScore += bonusPoints;
            drawer.roundScore += bonusPoints;
          }
        }

        await lobby.save();

        // Emit updates
        this.io.to(roomId).emit(se.CHAT_MESSAGE, {
          username: "System",
          message: `${username} guessed correctly! (+${points} points)`,
          timestamp: Date.now(),
          isSystemMessage: true,
          isGuessMessage: true,
          isCorrect: true,
        });
        this.io.to(roomId).emit(se.GAME_STATE_UPDATE, { lobby });
        // Play correct sound for everyone
        this.io.to(roomId).emit(se.SOUND, { sound: "correct" });

        // Check if everyone has guessed
        if (
          lobby.players.every(
            (p) => p.hasGuessedCorrect || p.username === lobby.currentDrawer
          )
        ) {
          await this.endDraw(this.io, roomId, lobby);
        }
      }
    } catch (error) {
      console.error("Error in handleCheckWordGuess:", error);
    }
  }

  async handleDisconnect(socket, roomId, username) {
    if (!socket || !roomId || !username) return;

    await this.acquireSaveLock(roomId);

    try {
      const lobby = await Lobby.findOne({ roomId });
      if (!lobby) return;

      // Mark player as disconnected but don't remove immediately
      const playerIndex = lobby.players.findIndex(
        (p) => p.username === username
      );
      if (playerIndex !== -1) {
        lobby.players[playerIndex].connected = false;
        lobby.players[playerIndex].socketId = null;
        await lobby.save();
      }

      this.io.to(roomId).emit(se.GAME_STATE_UPDATE, { lobby });
      /*
		this.io.to(roomId).emit(se.CHAT_MESSAGE, {
        username: "Server",
        message: `${username} has disconnected.`,
        timestamp: Date.now(),
        isSystemMessage: true,
      });
	  */

      // Clean up connection tracking
      this.activeConnections.delete(socket.id);

      // Remove disconnected players after a delay (optional)
      setTimeout(async () => {
        const currentLobby = await Lobby.findOne({ roomId });
        if (!currentLobby) return;

        const player = currentLobby.players.find(
          (p) => p.username === username
        );
        if (player && !player.connected) {
          currentLobby.players = currentLobby.players.filter(
            (p) => p.username !== username
          );
          await currentLobby.save();
          this.io
            .to(roomId)
            .emit(se.GAME_STATE_UPDATE, { lobby: currentLobby });
        }
      }, 60000); // Remove after 1 minute if still disconnected
    } catch (error) {
      console.error("Error in handleDisconnect:", error);
    } finally {
      this.releaseSaveLock(roomId);
    }
  }

  // Game flow methods
  async startNextDraw(io, roomId) {
    await this.acquireSaveLock(roomId);
    try {
      // Clear any existing timers
      if (this.lobbyTimers.has(roomId)) {
        clearTimeout(this.lobbyTimers.get(roomId));
        this.lobbyTimers.delete(roomId);
      }

      const lobby = await Lobby.findOne({ roomId });
      if (!lobby) {
        console.error("Lobby not found");
        return;
      }

      if (lobby.currentRound > lobby.maxRounds) {
        lobby.currentRound = 1; // Reset round for next game
        lobby.players.forEach((p) => {
          p.score = 0; // Reset scores for next game
          p.roundPoints = 0; // Reset round points for next game
        });
      }

      // Reset player states and clear canvas
      lobby.players.forEach((p) => {
        p.hasGuessedCorrect = false;
        p.drawScore = 0;
        // Don't reset roundScore as it accumulates across all draws in a round
      });

      lobby.canvasState = null;
      lobby.currentDrawer = null;
      lobby.usedWords = lobby.usedWords || [];
      lobby.usedWords.push(lobby.currentWord);
      lobby.currentWord = null;

      const availablePlayers = lobby.players.filter((p) => !p.hasDrawn);
      if (!availablePlayers.length) {
        throw new Error("No available players to draw in room " + roomId);
      }
      const index = Math.floor(Math.random() * availablePlayers.length);
      const drawer = availablePlayers[index];
      const words = this.findWordsForCategory(lobby);

      // Update lobby state in a single operation
      Object.assign(lobby, {
        gameState: lobby.selectWord === 1 ? gs.DRAWING : gs.PICKING_WORD,
        currentWord: lobby.selectWord === 1 ? words[0] : words.join(", "),
        currentDrawer: drawer.username,
        canvasState: null,
        startTime: Date.now(),
      });

      // Mark the drawer as having drawn
      const playerIndex = lobby.players.findIndex(
        (p) => p.username === drawer.username
      );
      if (playerIndex !== -1) {
        lobby.players[playerIndex].hasDrawn = true;
      }
      // Save all changes in one operation
      await lobby.save().catch((err) => {
        console.error("Error saving lobby:", err);
      });
      // Emit state update
      io.to(roomId).emit(se.GAME_STATE_UPDATE, { lobby });
      io.to(roomId).emit(se.CHAT_MESSAGE, {
        username: "Server",
        message: "It's " + drawer.username + "'s turn to draw!",
        timestamp: Date.now(),
        isSystemMessage: true,
      });

      // Start appropriate timer based on game state
      if (lobby.gameState === gs.DRAWING) {
        await this.startDrawTimer(io, roomId, lobby);
      } else {
        await this.setupWordSelectionTimeout(io, roomId, words);
      }
    } catch (error) {
      console.error("Error in startNextDraw:", error);
    } finally {
      this.releaseSaveLock(roomId);
    }
  }

  async startDrawTimer(io, roomId, lobby) {
    try {
      lobby = await withRetry(() => Lobby.findOne({ roomId }));
      if (!lobby) {
        console.error("Lobby not found");
        return;
      }

      const elapsed = Date.now() - lobby.startTime;
      const roundDuration = lobby.roundTime * 1000;
      const timeLeft = Math.max(
        0,
        Math.round((roundDuration - elapsed) / 1000)
      );
      console.warn(`[GM] ${roomId} ending draw in: ${timeLeft} seconds`);

      io.to(roomId).emit(se.GAME_STATE_UPDATE, { lobby });

      const lobbyTimer = setTimeout(async () => {
        try {
          const currentLobby = await withRetry(() => Lobby.findOne({ roomId }));
          if (currentLobby && currentLobby.gameState === gs.DRAWING) {
            await this.endDraw(io, roomId, currentLobby);
          } else {
            console.error(
              `[GM] ${roomId} - Timer expired but game state is not DRAWING`
            );
          }
        } catch (error) {
          console.error("Error in timer callback:", error);
          // Force state transition on error
          await this.endDraw(io, roomId, lobby);
        }
      }, timeLeft * 1000);
      this.lobbyTimers.set(roomId, lobbyTimer);
    } catch (error) {
      console.error("Error starting round timer:", error);
    }
  }

  async endDraw(io, roomId, lobby) {
    await this.acquireSaveLock(roomId);
    try {
      lobby = await withRetry(async () => {
        const result = await Lobby.findById(lobby._id);
        if (!result || result.gameState !== gs.DRAWING) return null;
        return result;
      });

      if (!lobby) {
        console.error("Could not find valid lobby for endDraw");
        return;
      }

      if (this.lobbyTimers.has(roomId)) {
        clearTimeout(this.lobbyTimers.get(roomId));
        this.lobbyTimers.delete(roomId);
      }

      // Update state to DRAW_END and start timer
      lobby.gameState = gs.DRAW_END;
      lobby.startTime = Date.now();
      await withRetry(() => lobby.save());

      // Emit updates
      io.to(roomId).emit(se.GAME_STATE_UPDATE, { lobby });
      io.to(roomId).emit(se.CHAT_MESSAGE, {
        username: "System",
        message: `Round ended! The word was: ${lobby.currentWord}`,
        timestamp: Date.now(),
        isSystemMessage: true,
      });

      const drawEndTimer = setTimeout(async () => {
        try {
          const currentLobby = await withRetry(() => Lobby.findById(lobby._id));
          if (!currentLobby) {
            console.error("Lobby not found in drawEndTimer");
            return;
          }
          const allPlayersHaveDrawn = currentLobby.players.every(
            (p) => p.hasDrawn
          );
          if (allPlayersHaveDrawn) {
            await this.handleRoundEnd(io, roomId, currentLobby);
          } else {
            await this.startNextDraw(io, roomId);
          }
        } catch (error) {
          console.error("Error in drawEndTimer:", error);
          // Force state transition on error
          await this.startNextDraw(io, roomId);
        }
      }, 6000); // 6 seconds for DrawEndModal

      this.lobbyTimers.set(roomId, drawEndTimer);
    } catch (error) {
      console.error("Error in endDraw:", error);
    } finally {
      this.releaseSaveLock(roomId);
    }
  }

  async handleRoundEnd(io, roomId, lobby) {
    await this.acquireSaveLock(roomId);
    try {
      lobby = await withRetry(async () => {
        const updatedLobby = await Lobby.findById(lobby._id);
        if (!updatedLobby) return null;
        return updatedLobby;
      });

      if (!lobby) {
        console.error("Could not find valid lobby for handleRoundEnd");
        return;
      }

      if (this.lobbyTimers.has(roomId)) {
        clearTimeout(this.lobbyTimers.get(roomId));
        this.lobbyTimers.delete(roomId);
      }

      // Update scores and reset states
      lobby.players.forEach((p) => {
        if (p.hasDrawn) {
          p.hasDrawn = false; // Reset hasDrawn for next round
          p.hasGuessedCorrect = false;
          p.roundPoints += p.drawScore; // Add draw score to round points

          // Only add the scores to total after showing the round summary
          p.score += p.roundScore; // Add current draw score first
          p.drawScore = 0; // Reset draw score only
        }
      });
      lobby.gameState = gs.ROUND_END;
      lobby.currentRound = (lobby.currentRound || 0) + 1;
      lobby.startTime = Date.now(); // Add start time for round end state
      await withRetry(() => lobby.save());
      io.to(roomId).emit(se.GAME_STATE_UPDATE, { lobby });

      const roundEndTimer = setTimeout(async () => {
        try {
          const currentLobby = await withRetry(() => Lobby.findById(lobby._id));
          if (!currentLobby) {
            console.error("Lobby not found in roundEndTimer");
            return;
          }

          // Check if we should end the game before updating the round
          if ((lobby.currentRound || 0) > lobby.maxRounds) {
            await this.handleGameOver(io, roomId, lobby);
          } else {
            await this.startNextDraw(io, roomId);
          }
        } catch (error) {
          console.error("Error in round end timer:", error);
          // Force state transition on error
          await this.startNextDraw(io, roomId);
        }
      }, 6000); // 6 seconds for RoundSummaryModal (5s display + 1s transition)

      this.lobbyTimers.set(roomId, roundEndTimer);
    } catch (error) {
      console.error("Error in handleRoundEnd:", error);
    } finally {
      this.releaseSaveLock(roomId);
    }
  }

  async handleGameOver(io, roomId, lobby) {
    try {
      // Get fresh lobby data and sort players by score
      lobby = await withRetry(() => Lobby.findById(lobby._id));
      const sortedPlayers = [...lobby.players].sort(
        (a, b) => b.score - a.score
      );

      // Determine winners (handles ties)
      const topScore = sortedPlayers[0].score;
      const winners = sortedPlayers.filter((p) => p.score === topScore);
      const isTie = winners.length > 1;

      // Set game state to finished immediately so UI updates
      Object.assign(lobby, {
        gameState: gs.FINISHED,
        players: sortedPlayers, // Already sorted by score
        finished: true,
        canChat: true,
      });
      await lobby.save();

      // Emit game state update immediately for responsive UI
      io.to(roomId).emit(se.GAME_STATE_UPDATE, { lobby });

      // Create end game message
      const endMessage = isTie
        ? `Game Over! It's a tie between ${winners
            .map((w) => w.username)
            .join(" and ")} with ${topScore} points!`
        : `Game Over! ${winners[0].username} wins with ${winners[0].score} points!`;

      io.to(roomId).emit(se.CHAT_MESSAGE, {
        username: "System",
        message: endMessage,
        timestamp: Date.now(),
        isSystemMessage: true,
      });

      // Update all players' stats asynchronously in the background
      Promise.all(
        lobby.players.map(async (player) => {
          try {
            const updateQuery = {
              $inc: {
                "gameStats.gamesPlayed": 1,
                "gameStats.totalScore": player.score || 0,
              },
              $set: {
                "profile.lastActive": Date.now(),
              },
            };

            // In case of a tie, no one gets the win. If there's a clear winner, they get the win.
            if (!isTie && winners[0].username === player.username) {
              updateQuery.$inc["gameStats.gamesWon"] = 1;
            }

            await User.findOneAndUpdate(
              { username: player.username },
              updateQuery,
              { new: true }
            );
          } catch (error) {
            console.error(
              `Failed to update stats for player ${player.username}:`,
              error
            );
          }
        })
      ).catch((error) => {
        console.error("Error updating player stats:", error);
      });
    } catch (error) {
      console.error("Error in handleGameOver:", error);
      // Still try to set game to finished state even if there's an error
      io.to(roomId).emit(se.GAME_STATE_UPDATE, {
        ...lobby,
        gameState: gs.FINISHED,
        finished: true,
        canChat: true,
      });
    }
  }

  async setupWordSelectionTimeout(io, roomId, words) {
    if (!words.length || !roomId) {
      console.error("No words available or invalid room ID");
      return;
    }
    const timer = setTimeout(async () => {
      try {
        const lobby = await withRetry(() => Lobby.findOne({ roomId }));
        if (!lobby) {
          console.error("Lobby not found");
          return;
        }
        if (lobby?.gameState === gs.PICKING_WORD) {
          // If the game is still in the word selection phase, grab a random word
          const randomWord = words[Math.floor(Math.random() * words.length)];
          Object.assign(lobby, {
            currentWord: randomWord,
            gameState: gs.DRAWING,
            startTime: Date.now(),
          });
          await withRetry(() => lobby.save());
          io.to(roomId).emit(se.GAME_STATE_UPDATE, { lobby });
          io.to(roomId).emit(se.CHAT_MESSAGE, {
            username: "Server",
            message: "Word selection timed out... randomly selecting a word.",
            timestamp: Date.now(),
          });
          await this.startDrawTimer(io, roomId, lobby);
        }
      } catch (error) {
        console.error("Error in word selection timeout:", error);
      } finally {
        console.log("Word selection timer cleared");
        this.wordSelectionTimers.delete(roomId);
      }
    }, 15000); // 15 seconds for word selection

    this.wordSelectionTimers.set(roomId, timer);
  }
  // Utility methods - filters out already used words
  findWordsForCategory(lobby) {
    let availableWords = [];
    if (lobby.selectCategory === "random") {
      for (const category in WORD_LIST) {
        availableWords = [...availableWords, ...WORD_LIST[category]];
      }
    } else {
      const categoryExists = Object.keys(WORD_LIST).includes(
        lobby.selectCategory
      );
      if (!categoryExists) {
        console.warn(
          `Category "${lobby.selectCategory}" not found. Using all words instead.`
        );
        availableWords = Object.values(WORD_LIST).flat();
      }

      availableWords = WORD_LIST[lobby.selectCategory];
    }
    // Filter out already used words
    const unusedWords = availableWords.filter(
      (word) => !lobby.usedWords.includes(word)
    );

    // If we've used too many words, reset the graveyard
    if (unusedWords.length < lobby.selectWord) {
      console.log("Word pool depleted, resetting used words list");
      lobby.usedWords = [];
      availableWords = unusedWords.concat(lobby.usedWords);
    } else {
      availableWords = unusedWords;
    }

    const selectedWords = [];
    if (lobby.selectWord < 1) {
      // there is no word selection
      const randomIndex = Math.floor(Math.random() * availableWords.length);
      const randomWord = availableWords[randomIndex];
      selectedWords.push(randomWord);
      lobby.usedWords.push(randomWord);
    } else {
      // Make sure we get the requested number of unique words
      while (
        selectedWords.length < lobby.selectWord &&
        availableWords.length > 0
      ) {
        const randomIndex = Math.floor(Math.random() * availableWords.length);
        const randomWord = availableWords[randomIndex];

        if (!selectedWords.includes(randomWord)) {
          selectedWords.push(randomWord);
          lobby.usedWords.push(randomWord);

          // Remove the word from the available pool to prevent duplicates
          availableWords.splice(randomIndex, 1);
        }
      }
    }
    return selectedWords;
  }

  async acquireSaveLock(roomId) {
    while (this.saveLocks.get(roomId)) {
      await new Promise((resolve) => setTimeout(resolve, 50));
    }
    this.saveLocks.set(roomId, true);
  }

  releaseSaveLock(roomId) {
    this.saveLocks.delete(roomId);
  }

  async handleRequestChatHistory(socket, { lobbyObjectId }) {
    try {
      if (!lobbyObjectId || !this.activeConnections.get(socket.id)) return;
      const connection = this.activeConnections.get(socket.id);
      const messages = await Chat.find({
        lobbyObjectId,
        $or: [
          { visibleTo: null },
          { visibleTo: { $exists: false } },
          { visibleTo: connection.username },
        ],
      })
        .sort({ timestamp: -1 })
        .limit(100)
        .select("_id username message timestamp isSystemMessage isGuessMessage")
        .lean();

      if (!messages.length) socket.emit(se.CHAT_HISTORY, []);
      else socket.emit(se.CHAT_HISTORY, messages.reverse());
    } catch (error) {
      console.error("Error fetching chat history:", error);
    }
  }
  async handleKickPlayer(socket, { roomId, username }) {
    if (!roomId || !username) {
      console.error("Invalid kick request - missing roomId or username");
      socket.emit("error", { message: "Invalid kick request" });
      return;
    }

    await this.acquireSaveLock(roomId);

    try {
      const lobby = await withRetry(async () => {
        return await Lobby.findOne({ roomId });
      });

      if (!lobby) {
        socket.emit("error", { message: "Lobby not found" });
        return;
      }

      // Check if the kicker is an admin
      const kicker = lobby.players.find((p) => p.socketId === socket.id);
      if (!kicker?.isAdmin) {
        socket.emit("error", {
          message: "You don't have permission to kick players",
        });
        return;
      }

      // Find the player to kick
      const playerToKick = lobby.players.find((p) => p.username === username);
      if (!playerToKick) {
        socket.emit("error", { message: "Player not found" });
        return;
      }

      // Remove the player from the players array
      lobby.players = lobby.players.filter((p) => p.username !== username);

      // Add to kicked users array to prevent rejoin
      if (!lobby.kickedUsers) {
        lobby.kickedUsers = [];
      }
      lobby.kickedUsers.push(username);

      // Save the lobby changes
      await withRetry(async () => {
        await lobby.save();
      });

      // Notify the room of the kick
      this.io.to(roomId).emit(se.CHAT_MESSAGE, {
        username: "Server",
        message: `${username} has been kicked from the game.`,
        timestamp: Date.now(),
        isSystemMessage: true,
      });

      // Emit updated game state to all clients
      this.io.to(roomId).emit(se.GAME_STATE_UPDATE, { lobby });

      // Force disconnect the kicked player's socket
      const kickedSocket = [...this.io.sockets.sockets.values()].find(
        (s) => s.id === playerToKick.socketId
      );

      if (kickedSocket) {
        kickedSocket.emit("error", {
          message: "You have been kicked from the game",
        });
        kickedSocket.disconnect(true);
      }

      // Clean up the connection tracking
      this.activeConnections.delete(playerToKick.socketId);
    } catch (error) {
      console.error("Error kicking player:", error);
      socket.emit("error", { message: "Failed to kick player" });
    } finally {
      this.releaseSaveLock(roomId);
    }
  }

  async handleCanvasUpdate(socket, { roomId, canvasState }) {
    if (!canvasState?.data) return console.warn("No canvas data provided");

    const connection = this.activeConnections.get(socket.id);
    if (!connection) return console.warn("No active connection for socket");

    // Don't send the update back to the sender
    socket.to(roomId).volatile.emit(se.CANVAS_UPDATE, {
      canvasState: {
        data: canvasState.data,
        timestamp: canvasState.timestamp,
      },
    });

    // Debounced save with cleanup
    if (!this._canvasSaveTimers) this._canvasSaveTimers = new Map();

    const existingTimer = this._canvasSaveTimers.get(roomId);
    if (existingTimer) {
      clearTimeout(existingTimer);
    }

    const saveTimer = setTimeout(async () => {
      try {
        await Lobby.findOneAndUpdate(
          { roomId },
          {
            canvasState: {
              data: canvasState.data,
              timestamp: Date.now(),
            },
          },
          { new: true }
        );
        this._canvasSaveTimers.delete(roomId);
      } catch (err) {
        console.error("Error saving canvas state:", err);
      }
    }, 2000); // Increased debounce to 2 seconds

    this._canvasSaveTimers.set(roomId, saveTimer);
  }

  _cleanupCanvasTimers(roomId) {
    if (this._canvasSaveTimers?.has(roomId)) {
      clearTimeout(this._canvasSaveTimers.get(roomId));
      this._canvasSaveTimers.delete(roomId);
    }
  }
}

let instance = null;
export const initializeSocketEvents = (io) => {
  if (!instance) {
    instance = new GameManager(io);
  }
  return instance;
};
