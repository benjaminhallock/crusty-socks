import { GAME_STATE, SOCKET_EVENTS as se, WORD_LIST } from "./constants.js";
import Chat from "./models/chat.js";
import Lobby from "./models/lobby.js";

class GameManager {
  constructor(io) {
    console.log("[GameManager] Initialized.");
    this.io = io;
    this.activeConnections = new Map();
    this.wordSelectionTimers = new Map();
    this.saveLocks = new Map();
    this.setupSocketListeners(io);
  }

  // Socket Events Setup
  setupSocketListeners(io) {
    io.on("connection", (socket) => {
      socket.on(se.CONNECT_ACK, (userData, roomId) =>
        this.handleConnectAck(socket, userData, roomId)
      );
      socket.on(se.CHAT_MESSAGE, (data) =>
        this.handleChatMessage(socket, data)
      );
      socket.on(se.START_GAME, async (roomId) => {
        console.log("START_GAME received for room:", roomId);
        try {
          await this.startNextDraw(this.io, roomId);
        } catch (error) {
          console.error("Error starting game:", error);
          socket.emit("error", { message: "Failed to start game" });
        }
      });
      socket.on(se.SELECT_WORD, (data) => this.handleSelectWord(data));
      socket.on(se.CHECK_WORD_GUESS, (data) =>
        this.handleCheckWordGuess({
          socket,
          ...data,
        })
      );
      socket.on(se.LEAVE_LOBBY, () => this.handleDisconnect(socket));
      socket.on(se.CANVAS_UPDATE, (data) => {
        const { canvasData, timestamp, lobbyId } = data;
        if (!canvasData) {
          console.error("Canvas data is empty");
          return;
        }
        const connection = this.activeConnections.get(socket.id);
        if (!connection) {
          // console.error("Connection not found for socket", socket.id);
          return;
        }
        const { roomId } = connection;
        if (!roomId) {
          console.error("Room ID not found in connection data");
          return;
        }

        // Fast path: emit to room immediately for real-time updates
        // Remove async/await for fastest possible relay to other clients
        socket.to(roomId).volatile.emit(se.CANVAS_UPDATE, {
          canvasState: {
            data: canvasData,
            timestamp: timestamp || Date.now(),
          },
        });

        // Debounced background save - we don't need to save every single update
        if (this._canvasSaveTimer?.[lobbyId]) {
          clearTimeout(this._canvasSaveTimer[lobbyId]);
        }

        // Initialize the timers object if needed
        if (!this._canvasSaveTimer) this._canvasSaveTimer = {};

        // Set a timer to save after a short delay (100ms)
        this._canvasSaveTimer[lobbyId] = setTimeout(() => {
          // Fire and forget - no await to prevent blocking
          Lobby.findByIdAndUpdate(
            lobbyId,
            {
              canvasState: {
                data: canvasData,
                timestamp: timestamp || Date.now(),
              },
            },
            { new: true }
          )
            .exec()
            .catch((err) => {
              console.error("Error saving canvas state:", err);
            });
        }, 100);
      });
      socket.on(se.REQUEST_CHAT_HISTORY, (data) =>
        this.handleRequestChatHistory(socket, data)
      );
    });
  }

  // Socket Event Handlers
  async handleConnectAck(socket, userData, roomId) {
    if (!userData || !roomId) {
      socket.emit("error", { message: "Invalid connection data" });
      return;
    }

    await this.acquireSaveLock(roomId);
    try {
      const lobby = await Lobby.findOne({ roomId });
      if (!lobby) {
        socket.emit("error", { message: "Lobby not found" });
        return;
      }

      // Remove existing connection for this user if any
      for (const [socketId, conn] of this.activeConnections.entries()) {
        if (conn.username === userData.username && conn.roomId === roomId) {
          console.log(`Removing existing connection for ${userData.username}`);
          this.activeConnections.delete(socketId);
          break;
        }
      }

      // Track this new connection
      this.activeConnections.set(socket.id, {
        userId: userData._id,
        username: userData.username,
        roomId: roomId,
        lobbyObjectId: lobby._id,
      });

      const isAlreadyInLobby = !!lobby.findPlayerByUsername(userData.username);

      // Only add the player if they're not already in the lobby
      if (!isAlreadyInLobby) {
        const isLobbyFull = lobby.players.length >= lobby.playerLimit;
        if (isLobbyFull) {
          socket.emit("error", { message: "Lobby is full" });
          this.releaseSaveLock(roomId);
          return;
        }

        lobby.players.push({
          username: userData.username,
          userId: userData._id,
          score: 0,
          hasDrawn: false,
          hasGuessedCorrect: false,
        });
        await lobby.save();
      }

      // Join the socket to the room
      await socket.join(roomId);
      console.log(`${userData.username} successfully joined room: ${roomId}`);

      // Send game state update to the room
      const updatedLobby = await Lobby.findOne({ roomId });
      this.io.to(roomId).emit(se.GAME_STATE_UPDATE, { lobby: updatedLobby });

      try {
        // Find or initialize chat history for this lobby
        await Chat.findOneOrCreate(lobby._id);

        // Get public messages from chat history
        const messages = await Chat.find({
          lobbyObjectId: lobby._id,
          $or: [
            { visibleTo: null },
            { visibleTo: { $exists: false } },
            { visibleTo: userData.username },
          ],
        })
          .sort({ timestamp: -1 })
          .limit(50)
          .sort({ timestamp: 1 });

        // Format and send messages to client
        const formattedMessages = messages.map((msg) => ({
          _id: msg._id,
          username: msg.username,
          message: msg.message,
          timestamp: msg.timestamp,
          isSystemMessage: msg.isSystemMessage,
          isGuessMessage: msg.isGuessMessage,
        }));

        socket.emit(se.CHAT_HISTORY, formattedMessages);

        // Add system join message
        const joinMessage = await Chat.create({
          lobbyObjectId: lobby._id,
          username: "Server",
          message: `${userData.username} has joined the lobby.`,
          timestamp: Date.now(),
          isSystemMessage: true,
        });

        // Broadcast the join message
        this.io.to(roomId).emit(se.CHAT_MESSAGE, {
          _id: joinMessage._id,
          username: "Server",
          message: `${userData.username} has joined the lobby.`,
          timestamp: joinMessage.timestamp,
          isSystemMessage: true,
        });
      } catch (error) {
        console.error("Error handling chat history:", error);
        // Don't fail the whole connection if chat fails
      }
    } catch (error) {
      console.error("Error in handleConnectAck:", error);
      socket.emit("error", { message: error.message || "Failed to connect" });
    } finally {
      this.releaseSaveLock(roomId);
    }
  }

  async handleChatMessage(socket, { lobbyObjectId, message, username }) {
    try {
      if (!lobbyObjectId || !message || !username) {
        console.error('Missing required chat message data');
        return;
      }
  
      const connection = this.activeConnections.get(socket.id);
      if (!connection) return;
  
      const lobby = await Lobby.findById(lobbyObjectId);
      if (!lobby) return;
  
      // Validate message
      const trimmedMessage = message.trim();
      if (!trimmedMessage) return;
  
      const isDrawer = lobby.gameState === GAME_STATE.DRAWING && username === lobby.currentDrawer;
  
      // Check for word guess during drawing phase
      if (lobby.gameState === GAME_STATE.DRAWING && !isDrawer) {
        const isCorrectGuess = lobby.currentWord.toLowerCase().trim() === trimmedMessage.toLowerCase().trim();
        if (isCorrectGuess) {
          return this.handleCheckWordGuess({
            socket,
            roomId: lobby.roomId,
            guess: trimmedMessage,
            username
          });
        }
      }
  
      // Block drawer from sharing word variations
      if (isDrawer) {
        const cleanWord = lobby.currentWord.toLowerCase().replace(/\s+/g, '');
        const cleanMessage = trimmedMessage.toLowerCase().replace(/\s+/g, '');
        if (cleanMessage.includes(cleanWord)) {
          const warning = await Chat.create({
            lobbyObjectId,
            username: "Server",
            message: "You cannot share the word while drawing!",
            timestamp: Date.now(),
            isSystemMessage: true,
            visibleTo: username,
          });
  
          socket.emit(se.CHAT_MESSAGE, {
            _id: warning._id,
            username: warning.username,
            message: warning.message,
            timestamp: warning.timestamp,
            isSystemMessage: true,
          });
          return;
        }
      }
  
      // Save chat message (non-blocking)
      const chatPromise = Chat.create({
        lobbyObjectId,
        userId: connection.userId,
        username,
        message: trimmedMessage,
        timestamp: Date.now(),
        isSystemMessage: false
      }).catch(err => console.error('Error saving chat:', err));
  
      // Emit immediately for real-time response
      const messageData = {
        _id: Date.now().toString(), // Temporary ID until save completes
        username,
        message: trimmedMessage,
        timestamp: Date.now(),
        isSystemMessage: false
      };
  
      // Broadcast to room
      this.io.to(lobby.roomId).emit(se.CHAT_MESSAGE, messageData);
  
      // Update the _id after save completes
      chatPromise.then(savedChat => {
        if (savedChat) {
          messageData._id = savedChat._id;
          this.io.to(lobby.roomId).emit(se.CHAT_MESSAGE, messageData);
        }
      });
  
    } catch (error) {
      console.error("Error in handleChatMessage:", error);
    }
  }

  async handleSelectWord({ roomId, word }) {
    try {
      await this.acquireSaveLock(roomId);
      const lobby = await Lobby.findOne({ roomId });
      if (!lobby) return;

      Object.assign(lobby, {
        currentWord: word,
        gameState: GAME_STATE.DRAWING,
        startTime: Date.now(),
      });
      await lobby.save();
      this.io.to(roomId).emit(se.GAME_STATE_UPDATE, { lobby });
      await this.startRoundTimer(this.io, roomId, lobby);
    } catch (error) {
      console.error("Error selecting word:", error);
    } finally {
      this.releaseSaveLock(roomId);
    }
  }

  async handleCheckWordGuess({ socket, roomId, guess, username }) {
    try {
      const lobby = await Lobby.findOne({ roomId });
      if (!lobby || lobby.gameState !== GAME_STATE.DRAWING) return;

      const isCorrect =
        lobby.currentWord.toLowerCase().trim() === guess.toLowerCase().trim();

      if (isCorrect) {
        const player = lobby.players.find((p) => p.username === username);
        if (player && !player.hasGuessedCorrect) {
          // Calculate points based on remaining players
          const correctGuessers = lobby.players.filter(
            (p) => p.hasGuessedCorrect
          ).length;
          const remainingPlayers = lobby.players.length - correctGuessers - 1;
          const points = Math.max(10, remainingPlayers * 10);

          player.score += points;
          player.drawPoints = points;
          player.guessTime = Date.now();
          player.hasGuessedCorrect = true;

          // Award points to drawer for successful guess
          const drawer = lobby.players.find(
            (p) => p.username === lobby.currentDrawer
          );
          if (drawer) {
            const basePoints = 10;
            drawer.drawPoints = (drawer.drawPoints || 0) + basePoints;
            drawer.score += basePoints;
          }

          await lobby.save();

          // Create a "correct guess" message
          const guessChat = await Chat.create({
            lobbyObjectId: lobby._id,
            username: "Server",
            message: `${username} guessed the word correctly!`,
            timestamp: Date.now(),
            isSystemMessage: true,
            isGuessMessage: true,
          });

          // Send the correct guess message to everyone
          this.io.to(roomId).emit(se.CHAT_MESSAGE, {
            _id: guessChat._id,
            username: "Server",
            message: `${username} guessed the word correctly!`,
            timestamp: guessChat.timestamp,
            isSystemMessage: true,
            isGuessMessage: true,
          });

          // Check if all players have guessed
          const allPlayersHaveGuessed = lobby.players.every(
            (p) => p.hasGuessedCorrect || p.username === lobby.currentDrawer
          );

          if (allPlayersHaveGuessed) {
            // End round early if everyone guessed
            await this.endRound(this.io, roomId, lobby);
          }
        }
      } else {
        // Store failed guess in database but make it visible only to the user who made the guess
        const failedGuessChat = await Chat.create({
          lobbyObjectId: lobby._id,
          username,
          message: guess,
          timestamp: Date.now(),
          isGuessMessage: false,
          visibleTo: username,
        });

        // Send the failed guess only to the user who made it
        socket.emit(se.CHAT_MESSAGE, {
          _id: failedGuessChat._id,
          username,
          message: guess,
          timestamp: failedGuessChat.timestamp,
        });
      }
    } catch (error) {
      console.error("Error checking word guess:", error);
    }
  }

  async handleDisconnect(socket) {
    const connection = this.activeConnections.get(socket.id);
    if (!connection) return;

    const { roomId, username } = connection;
    console.log("disconnecting user:", username, "in room:", roomId);

    try {
      const lobby = await Lobby.findOne({ roomId });
      if (lobby && lobby.findPlayerByUsername(username)) {
        await lobby.removePlayer(username);
        this.io.to(roomId).emit(se.GAME_STATE_UPDATE, { lobby });
      } else {
        console.error("Lobby not found when disconnecting");
      }
    } catch (error) {
      console.error("Error during disconnect:", error);
    } finally {
      this.activeConnections.delete(socket.id);
    }
  }

  // Game flow methods
  async startNextDraw(io, roomId) {
    await this.acquireSaveLock(roomId);
    try {
      const lobby = await Lobby.findOne({ roomId });
      if (!lobby) return console.error("Lobby not found");
      if (!lobby.players.length)
        return console.error("No players in lobby to start game");

      // Reset canvas state when starting new draw
      lobby.canvasState = {
        data: null,
        timestamp: Date.now(),
      };

      const availablePlayers = lobby.players.filter((p) => !p.hasDrawn);
      if (!availablePlayers.length) {
        // Everyone has drawn, so we need to start next round or end game
        return this.handleRoundEnd(io, roomId, lobby);
      } else {
        if (lobby.currentWord) {
          lobby.usedWords.push(lobby.currentWord);
        }
        await lobby.save();
      }
      const index = Math.floor(Math.random() * availablePlayers.length);
      const drawer = availablePlayers[index];
      const words = await this.generateWordChoices(lobby);
      Object.assign(lobby, {
        currentDrawer: drawer.username,
        gameState:
          words.length === 1 ? GAME_STATE.DRAWING : GAME_STATE.PICKING_WORD,
        canvasState: null,
        currentWord: words.length === 1 ? words[0] : words.join(", "),
        startTime: Date.now(),
      });
      lobby.players.find((p) => p.username === drawer.username).hasDrawn = true;

      io.to(roomId).emit(se.GAME_STATE_UPDATE, { lobby });
      await lobby.save();

      console.log(
        "Current drawer:",
        lobby.currentDrawer,
        "selecting word:",
        lobby.currentWord
      );
      if (lobby.gameState === GAME_STATE.DRAWING) {
        await this.startRoundTimer(io, roomId, lobby);
      } else {
        await this.setupWordSelectionTimeout(io, roomId, words);
      }
    } catch (error) {
      console.error("Error starting game:", error);
    } finally {
      this.releaseSaveLock(roomId);
    }
  }

  async handleRoundEnd(io, roomId, lobby) {
    try {
      // First check if we've completed all rounds
      const currentRound = lobby.currentRound || 1;

      if (currentRound >= lobby.maxRounds) {
        // Game has ended after all rounds are complete
        lobby.gameState = GAME_STATE.FINISHED;
        lobby.players.sort((a, b) => b.score - a.score);
        await lobby.save();

        io.to(roomId).emit(se.GAME_STATE_UPDATE, { lobby });

        // Emit a game complete message
        io.to(roomId).emit(se.CHAT_MESSAGE, {
          username: "Server",
          message: "Game has ended! Thanks for playing!",
          timestamp: Date.now(),
          isSystemMessage: true,
        });

        return;
      }

      // If we still have more rounds, go to ROUND_END state
      lobby.gameState = GAME_STATE.ROUND_END;
      lobby.currentRound = currentRound + 1;

      await lobby.save();
      io.to(roomId).emit(se.GAME_STATE_UPDATE, { lobby });

      // Show round summary for a few seconds
      await new Promise((resolve) => setTimeout(resolve, 8000));

      // Reset for the next round
      lobby.players.forEach((p) => {
        p.hasDrawn = false;
        p.hasGuessedCorrect = false;
        p.drawPoints = 0;
        p.roundPoints = 0;
      });

      // Return to waiting state before starting next player's turn
      lobby.gameState = GAME_STATE.WAITING;
      await lobby.save();
      io.to(roomId).emit(se.GAME_STATE_UPDATE, { lobby });

      // Start the next draw after a short delay
      setTimeout(() => this.startNextDraw(io, roomId), 2000);
    } catch (error) {
      console.error("Error handling round end:", error);
    }
  }

  async startRoundTimer(io, roomId, lobby) {
    if (!lobby) return;

    const startTime = Date.now();
    const roundDuration = lobby.roundTime * 1000; // convert seconds to milliseconds

    lobby.startTime = startTime;
    await lobby.save();

    // Emit initial time update
    io.to(roomId).emit(se.GAME_STATE_UPDATE, {
      lobby: {
        ...lobby.toObject(),
        timeLeft: lobby.roundTime,
      },
    });

    // Set up timer interval
    const timer = setInterval(async () => {
      try {
        const currentLobby = await Lobby.findOne({ roomId });
        if (
          !currentLobby ||
          ![GAME_STATE.DRAWING, GAME_STATE.PICKING_WORD].includes(
            currentLobby.gameState
          )
        ) {
          clearInterval(timer);
          return;
        }

        const elapsed = Date.now() - startTime;
        const timeLeft = Math.max(
          0,
          Math.round((roundDuration - elapsed) / 1000)
        );

        // Send time updates every second
        io.to(roomId).emit(se.GAME_STATE_UPDATE, {
          lobby: {
            ...currentLobby.toObject(),
            timeLeft,
          },
        });

        if (timeLeft <= 0) {
          clearInterval(timer);
          await this.endRound(io, roomId, currentLobby);
        }
      } catch (error) {
        console.error("Error in round timer:", error);
        clearInterval(timer);
      }
    }, 1000);

    return timer;
  }

  async endRound(io, roomId, lobby) {
    try {
      if (
        ![GAME_STATE.DRAWING, GAME_STATE.DRAW_END].includes(lobby.gameState)
      ) {
        return;
      }

      // Set to DRAW_END to show round end modal
      lobby.gameState = GAME_STATE.DRAW_END;
      lobby.canvasState = null;

      // Calculate and save round points
      lobby.players.forEach((p) => {
        p.roundPoints = (p.roundPoints || 0) + (p.drawPoints || 0);
      });

      await lobby.save();
      io.to(roomId).emit(se.GAME_STATE_UPDATE, { lobby });

      // Announce the end of the round
      io.to(roomId).emit(se.CHAT_MESSAGE, {
        username: "Server",
        message: `Round ended! The word was: ${lobby.currentWord}`,
        timestamp: Date.now(),
        isSystemMessage: true,
      });

      // Wait for round end modal to display
      await new Promise((resolve) => setTimeout(resolve, 5000));

      // Check if all players have drawn
      const updatedLobby = await Lobby.findOne({ roomId });
      if (!updatedLobby || updatedLobby.gameState === GAME_STATE.FINISHED) {
        return;
      }

      // Reset player state for next drawer
      updatedLobby.players.forEach((p) => {
        p.drawPoints = 0;
        p.hasGuessedCorrect = false;
      });

      // Check if everyone has drawn in this round
      const allPlayersHaveDrawn = updatedLobby.players.every((p) => p.hasDrawn);

      if (allPlayersHaveDrawn) {
        // If all players have drawn, move to round summary
        await this.handleRoundEnd(io, roomId, updatedLobby);
      } else {
        // If there are still players who need to draw, move to next drawer
        await this.startNextDraw(io, roomId);
      }
    } catch (error) {
      console.error("Error ending round:", error);
    }
  }

  async setupWordSelectionTimeout(io, roomId, words) {
    if (this.wordSelectionTimers.has(roomId)) {
      clearTimeout(this.wordSelectionTimers.get(roomId));
    }
    const timer = setTimeout(async () => {
      try {
        const lobby = await Lobby.findOne({ roomId });
        if (!lobby) return console.error("Lobby not found");
        if (lobby?.gameState === GAME_STATE.PICKING_WORD) {
          // If the game is still in the word selection phase, grab a random word
          const randomWord = words[Math.floor(Math.random() * words.length)];
          Object.assign(lobby, {
            currentWord: randomWord,
            gameState: GAME_STATE.DRAWING,
            startTime: Date.now(),
          });
          await lobby.save();
          io.to(roomId).emit(se.GAME_STATE_UPDATE, { lobby });
          io.to(roomId).emit(se.CHAT_MESSAGE, {
            username: "Server",
            message: "Word selection timed out... randomly selecting a word.",
            timestamp: Date.now(),
          });
          await this.startRoundTimer(io, roomId, lobby);
        }
      } catch (error) {
        console.error("Error in word selection timeout:", error);
      } finally {
        this.wordSelectionTimers.delete(roomId);
      }
    }, 15000);
    this.wordSelectionTimers.set(roomId, timer);
  }
  // Utility methods
  async generateWordChoices(lobby) {
    // Initialize usedWords array if it doesn't exist
    if (!lobby.usedWords) {
      lobby.usedWords = [];
    }

    let availableWords = [];

    // If category is 'random' or 'all', use words from all categories
    if (lobby.selectCategory === "random" || lobby.selectCategory === "all") {
      // Combine all categories
      for (const category in WORD_LIST) {
        availableWords = [...availableWords, ...WORD_LIST[category]];
      }
    } else {
      // Use the specified category if it exists, otherwise use all words
      availableWords =
        WORD_LIST[lobby.selectCategory] || Object.values(WORD_LIST).flat();
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
    if (lobby.selectWord === 1) {
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

  async releaseSaveLock(roomId) {
    this.saveLocks.delete(roomId);
  }

  async handleRequestChatHistory(socket, { lobbyObjectId }) {
    try {
      if (!lobbyObjectId) return;

      const connection = this.activeConnections.get(socket.id);
      if (!connection) return;

      const messages = await Chat.find({
        lobbyObjectId,
        $or: [
          { visibleTo: null },
          { visibleTo: { $exists: false } },
          { visibleTo: connection.username }
        ]
      })
        .sort({ timestamp: -1 })
        .limit(100)
        .select('_id username message timestamp isSystemMessage isGuessMessage')
        .lean();
  
      socket.emit(se.CHAT_HISTORY, messages.reverse());
    } catch (error) {
      console.error("Error fetching chat history:", error);
    }
  }
}
export const initializeSocketEvents = (io) => {
  return new GameManager(io);
};