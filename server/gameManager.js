
//NOT USED YET
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
    
    this.players = [];
    this.currentDrawer = null;
    this.currentWord = null;
    this.timer = null;
    
    this.gameState = {
      currentDrawing: Array(100 * 80).fill("#FFFFFF"),
      currentDrawer: null,
      messages: [],
      word: "",
      status: "waiting",
      countdownTime: this.COUNTDOWN_TIME,
      readyPlayers: new Set(),
      roundInProgress: false,
    };
  }

  addPlayer(socket, username) {
    console.log('\n[GAME] 🎮 Add Player Attempt:', { username, socketId: socket.id });
    
    const existingPlayer = this.players.find(
      (p) => p.username === username || p.id === socket.id
    );

    if (existingPlayer) {
      console.log('[GAME] ❌ Player already exists:', existingPlayer);
      return false;
    }

    const newPlayer = {
      id: socket.id,
      username,
      score: 0,
      status: "not-ready",
    };

    this.players.push(newPlayer);
    console.log('[GAME] ✅ Player added successfully:', newPlayer);
    console.log('[GAME] 👥 Current players:', this.players);
    
    this.io.emit("playersList", this.players);
    return true;
  }

  removePlayer(socketId) {
    const disconnectedPlayer = this.players.find((p) => p.id === socketId);
    if (disconnectedPlayer) {
      this.players = this.players.filter((p) => p.id !== socketId);
      if (this.currentDrawer?.id === socketId) {
        this.endRound();
      }
      this.io.emit("playersList", this.players);
      this.gameState.readyPlayers.delete(socketId);
      this.players.forEach((p) => (p.status = "not-ready"));
      this.io.emit("playersList", this.players);
    }
  }

  handlePlayerReady(socketId) {
    if (this.gameState.roundInProgress) return;
    console.log('[GAME] 🔄 Player ready:', socketId);

    const player = this.players.find((p) => p.id === socketId);
    if (player) {
      player.status = "ready";
      this.io.emit("playersList", this.players);

      const allReady = this.players.every((p) => p.status === "ready");
      const minPlayers = this.players.length >= 2;

      if (allReady && minPlayers && this.gameState.status === "waiting") {
        console.log('[GAME] 🎲 Starting new round - all players ready');
        this.startNewRound();
      }
    }
  }

  handlePlayerNotReady(socketId) {
    if (this.gameState.roundInProgress) return;

    const player = this.players.find((p) => p.id === socketId);
    if (player) {
      player.status = "not-ready";
      this.io.emit("playersList", this.players);
    }
  }

  handleDraw(socket, data) {
    if (this.gameState.status !== "playing" || socket.id === this.currentDrawer?.id) {
      socket.broadcast.emit("drawUpdate", data);
      this.gameState.currentDrawing[data.index] = data.color;
    }
  }

  handleGuess(user, message) {
    if (this.currentWord && message.toLowerCase() === this.currentWord.toLowerCase()) {
      const guesser = this.players.find((p) => p.username === user);
      if (guesser && guesser.id !== this.currentDrawer.id) {
        guesser.score += 10;
        this.currentDrawer.score += 5;
        this.io.emit("correctGuess", { winner: user, word: this.currentWord });
        this.io.emit("playersList", this.players);
        this.endRound();
      }
    } else {
      this.io.emit("chatMessage", { user, message });
    }
  }

  startNewRound() {
    console.log('[GAME] 🔄 Starting countdown');
    this.gameState.status = "countdown";
    this.gameState.countdownTime = this.COUNTDOWN_TIME;
    this.io.emit("countdown", { time: this.COUNTDOWN_TIME });

    const countdownTimer = setInterval(() => {
      this.gameState.countdownTime--;
      this.io.emit("countdown", { time: this.gameState.countdownTime });

      if (this.gameState.countdownTime <= 0) {
        clearInterval(countdownTimer);
        this.startGame();
      }
    }, 1000);
  }

  startGame() {
    console.log('[GAME] 🎮 Starting game');
    this.gameState.status = "playing";
    this.currentDrawer = this.players[Math.floor(Math.random() * this.players.length)];
    this.gameState.currentDrawer = this.currentDrawer;
    this.currentWord = this.WORDS[Math.floor(Math.random() * this.WORDS.length)];
    this.gameState.word = this.currentWord;
    
    console.log('[GAME] 🎨 Selected drawer:', this.currentDrawer.username);
    console.log('[GAME] 📝 Selected word:', this.currentWord);

    this.io.emit("gameStarting", {
      drawer: this.currentDrawer,
      word: this.currentWord,
    });

    let timeLeft = this.ROUND_TIME;
    this.timer = setInterval(() => {
      timeLeft--;
      this.io.emit("timeUpdate", timeLeft);
      if (timeLeft <= 0) {
        console.log('[GAME] ⏰ Round time up');
        this.endRound();
      }
    }, 1000);
  }

  endRound() {
    clearInterval(this.timer);
    this.gameState.roundInProgress = false;
    this.io.emit("roundEnd", { word: this.currentWord, drawer: this.currentDrawer });
    this.currentDrawer = null;
    this.gameState.currentDrawer = null;
    this.currentWord = null;
    this.gameState.word = "";
    this.gameState.status = "waiting";

    this.players.forEach((p) => (p.status = "not-ready"));
    this.io.emit("playersList", this.players);
  }

  getCurrentDrawing() {
    return this.gameState.currentDrawing;
  }
}
