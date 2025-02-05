export class GameManager {
  constructor(io) {
    this.io = io;
    this.ROUND_TIME = 60;
    this.COUNTDOWN_TIME = 5;
    this.WORDS = [
      "cat", "dog", "house", "tree", "car", "sun", "moon", "fish", "bird",
      "star", "flower", "robot", "pizza", "boat", "cloud", "beach", "chair",
      "plane", "train", "snake", "apple", "heart", "smile", "hat", "ball",
      "clock", "drum", "shoe", "bread", "book"
    ];

    // Track games by room ID
    this.games = new Map();
  }

  initializeGame(roomId) {
    if (this.games.has(roomId)) return;

    this.games.set(roomId, {
      players: [],
      currentDrawer: null,
      currentWord: null,
      timer: null,
      settings: {
        roundTime: this.ROUND_TIME,
        rounds: 3,
        customWords: [],
        language: "en"
      },
      gameState: {
        currentDrawing: Array(100 * 80).fill("#FFFFFF"),
        status: "waiting",
        countdownTime: this.COUNTDOWN_TIME,
        roundNumber: 0,
        messages: []
      }
    });
  }

  addPlayer(socket, username, roomId) {
    const game = this.games.get(roomId);
    if (!game) return false;

    const existingPlayer = game.players.find(
      p => p.username === username || p.id === socket.id
    );

    if (existingPlayer) return false;

    const newPlayer = {
      id: socket.id,
      username,
      score: 0,
      status: "not-ready"
    };

    game.players.push(newPlayer);
    socket.join(roomId);
    this.io.to(roomId).emit("playersList", game.players);
    return true;
  }

  removePlayer(socketId, roomId) {
    const game = this.games.get(roomId);
    if (!game) return;

    game.players = game.players.filter(p => p.id !== socketId);

    if (game.currentDrawer?.id === socketId) {
      this.endRound(roomId);
    }

    if (game.players.length === 0) {
      this.games.delete(roomId);
    } else {
      this.io.to(roomId).emit("playersList", game.players);
    }
  }

  updateSettings(roomId, newSettings) {
    const game = this.games.get(roomId);
    if (!game) return;

    game.settings = { ...game.settings, ...newSettings };
    this.io.to(roomId).emit("settingsUpdated", game.settings);
  }

  handlePlayerReady(socketId, roomId) {
    const game = this.games.get(roomId);
    if (!game || game.gameState.status !== "waiting") return;

    const player = game.players.find(p => p.id === socketId);
    if (player) {
      player.status = "ready";
      this.io.to(roomId).emit("playersList", game.players);

      const allReady = game.players.every(p => p.status === "ready");
      if (allReady && game.players.length >= 2) {
        this.startNewRound(roomId);
      }
    }
  }

  handleDraw(socket, data, roomId) {
    const game = this.games.get(roomId);
    if (!game || game.gameState.status !== "playing") return;

    if (socket.id === game.currentDrawer?.id) {
      socket.to(roomId).emit("drawUpdate", data);
      game.gameState.currentDrawing[data.index] = data.color;
    }
  }

  handleGuess(username, message, roomId) {
    const game = this.games.get(roomId);
    if (!game || !game.currentWord) return;

    if (message.toLowerCase() === game.currentWord.toLowerCase()) {
      const guesser = game.players.find(p => p.username === username);
      if (guesser && guesser.id !== game.currentDrawer.id) {
        guesser.score += 10;
        game.currentDrawer.score += 5;
        this.io.to(roomId).emit("correctGuess", { 
          winner: username, 
          word: game.currentWord 
        });
        this.io.to(roomId).emit("playersList", game.players);
        this.endRound(roomId);
      }
    } else {
      this.io.to(roomId).emit("chatMessage", { user: username, message });
    }
  }

  startNewRound(roomId) {
    const game = this.games.get(roomId);
    if (!game) return;

    game.gameState.status = "countdown";
    game.gameState.countdownTime = this.COUNTDOWN_TIME;
    this.io.to(roomId).emit("countdown", { time: this.COUNTDOWN_TIME });

    const countdownInterval = setInterval(() => {
      game.gameState.countdownTime--;
      this.io.to(roomId).emit("countdown", { time: game.gameState.countdownTime });

      if (game.gameState.countdownTime <= 0) {
        clearInterval(countdownInterval);
        this.startRound(roomId);
      }
    }, 1000);
  }

  startRound(roomId) {
    const game = this.games.get(roomId);
    if (!game) return;

    game.gameState.status = "playing";
    game.gameState.roundNumber++;
    game.currentDrawer = game.players[
      Math.floor(Math.random() * game.players.length)
    ];
    game.currentWord = this.WORDS[Math.floor(Math.random() * this.WORDS.length)];

    this.io.to(roomId).emit("gameStarting", {
      drawer: game.currentDrawer,
      word: game.currentWord,
      roundNumber: game.gameState.roundNumber
    });

    let timeLeft = game.settings.roundTime;
    game.timer = setInterval(() => {
      timeLeft--;
      this.io.to(roomId).emit("timeUpdate", timeLeft);
      if (timeLeft <= 0) {
        this.endRound(roomId);
      }
    }, 1000);
  }

  endRound(roomId) {
    const game = this.games.get(roomId);
    if (!game) return;

    clearInterval(game.timer);
    this.io.to(roomId).emit("roundEnd", {
      word: game.currentWord,
      drawer: game.currentDrawer
    });

    game.currentDrawer = null;
    game.currentWord = null;
    game.gameState.status = "waiting";
    game.gameState.currentDrawing.fill("#FFFFFF");

    // Check if game should end
    if (game.gameState.roundNumber >= game.settings.rounds) {
      this.endGame(roomId);
    } else {
      game.players.forEach(p => p.status = "not-ready");
      this.io.to(roomId).emit("playersList", game.players);
    }
  }

  endGame(roomId) {
    const game = this.games.get(roomId);
    if (!game) return;

    const winner = [...game.players].sort((a, b) => b.score - a.score)[0];
    this.io.to(roomId).emit("gameEnd", { 
      winner,
      finalScores: game.players.map(p => ({ 
        username: p.username, 
        score: p.score 
      }))
    });

    // Reset game state
    game.gameState.roundNumber = 0;
    game.players.forEach(p => {
      p.score = 0;
      p.status = "not-ready";
    });
    this.io.to(roomId).emit("playersList", game.players);
  }
}
