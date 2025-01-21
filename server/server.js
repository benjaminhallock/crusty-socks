import express from "express";
import { createServer } from "http";
import { Server } from "socket.io";
import cors from "cors";
import dotenv from "dotenv";
import records from "./routes/records.js";

dotenv.config();

const port = process.env.PORT || 3001;
const app = express();
const httpServer = createServer(app);
const io = new Server(httpServer, {
  cors: {
    origin: [
      "http://localhost:5173",
      "https://crustysocks.vercel.app",
      process.env.CORS_ORIGIN, // Add flexible client URL
    ].filter(Boolean),
    methods: ["GET", "POST"],
    credentials: true,
  },
  transports: ["websocket", "polling"], // Add polling as fallback
});

app.use(
  cors({
    origin: [
      "http://localhost:5173",
      "https://crustysocks.vercel.app",
      process.env.CLIENT_URL,
    ].filter(Boolean),
    credentials: true,
  })
);

app.use(express.json());

const ROUND_TIME = 60;
const WORDS = [
  "cat",
  "dog",
  "house",
  "tree",
  "car",
  "sun",
  "moon",
  "fish",
  "bird",
  "star",
  "flower",
  "robot",
  "pizza",
  "boat",
  "cloud",
  "beach",
  "chair",
  "plane",
  "train",
  "snake",
  "apple",
  "heart",
  "smile",
  "hat",
  "ball",
  "clock",
  "drum",
  "shoe",
  "bread",
  "book",
];
const COUNTDOWN_TIME = 5; // 5 second countdown before round starts
let players = [];
let currentDrawer = null;
let currentWord = null;
let timer = null;

const gameState = {
  currentDrawing: Array(100 * 80).fill("#FFFFFF"), // Match new canvas size
  currentDrawer: null,
  messages: [],
  word: "",
  status: "waiting", // waiting, countdown, playing
  countdownTime: COUNTDOWN_TIME,
  readyPlayers: new Set(),
  roundInProgress: false,
};

io.on("connection", (socket) => {
  console.log("New client connected:", socket.id);

  socket.on("joinGame", ({ username }) => {
    try {
      // Check if player already exists
      const existingPlayer = players.find(
        (p) => p.username === username || p.id === socket.id
      );

      if (existingPlayer) {
        socket.emit("error", "Username already taken or already connected");
        return;
      }

      const newPlayer = {
        id: socket.id,
        username,
        score: 0,
        status: "not-ready", // Add default ready status
      };

      players.push(newPlayer);
      console.log("Current players:", players);
      io.emit("playersList", players);
      // Remove automatic game start
    } catch (error) {
      console.error("Error in joinGame:", error);
      socket.emit("error", "Failed to join game");
    }
  });

  socket.on("startGame", () => {
    if (players.length > 1 && !currentDrawer) {
      startNewRound();
    }
  });

  socket.on("playerReady", () => {
    if (gameState.roundInProgress) return;

    const player = players.find((p) => p.id === socket.id);
    if (player) {
      player.status = "ready";
      io.emit("playersList", players);

      // Check if ALL players are ready and there are enough players
      const allReady = players.every((p) => p.status === "ready");
      const minPlayers = players.length >= 2; // Changed to 2 for testing

      if (allReady && minPlayers && gameState.status === "waiting") {
        startNewRound();
      }
    }
  });

  socket.on("playerNotReady", () => {
    if (gameState.roundInProgress) return; // Don't allow ready changes during round

    const player = players.find((p) => p.id === socket.id);
    if (player) {
      player.status = "not-ready";
      io.emit("playersList", players);
    }
  });

  socket.on("draw", (data) => {
    // Allow drawing if player is drawer or game hasn't started
    if (gameState.status !== "playing" || socket.id === currentDrawer?.id) {
      socket.broadcast.emit("drawUpdate", data);
      // Update server's game state
      gameState.currentDrawing[data.index] = data.color;
    }
  });

  // When a new player joins, send them the current drawing
  socket.emit("drawUpdate", gameState.currentDrawing);

  socket.on("guess", ({ user, message }) => {
    if (currentWord && message.toLowerCase() === currentWord.toLowerCase()) {
      const guesser = players.find((p) => p.username === user);
      if (guesser && guesser.id !== currentDrawer.id) {
        guesser.score += 10;
        currentDrawer.score += 5;
        io.emit("correctGuess", { winner: user, word: currentWord });
        io.emit("playersList", players);
        endRound();
      }
    } else {
      io.emit("chatMessage", { user, message });
    }
  });

  socket.on("disconnect", () => {
    console.log("Client disconnected:", socket.id);
    const disconnectedPlayer = players.find((p) => p.id === socket.id);

    if (disconnectedPlayer) {
      players = players.filter((p) => p.id !== socket.id);
      console.log(`${disconnectedPlayer.username} disconnected`);

      if (currentDrawer?.id === socket.id) {
        endRound();
      }

      io.emit("playersList", players);
    }
    gameState.readyPlayers.delete(socket.id);

    // Reset all players to not ready when someone disconnects
    players.forEach((p) => (p.status = "not-ready"));
    io.emit("playersList", players);
  });
});

function startNewRound() {
  gameState.status = "countdown";
  gameState.countdownTime = COUNTDOWN_TIME;

  io.emit("countdown", { time: COUNTDOWN_TIME });

  const countdownTimer = setInterval(() => {
    gameState.countdownTime--;
    io.emit("countdown", { time: gameState.countdownTime });

    if (gameState.countdownTime <= 0) {
      clearInterval(countdownTimer);
      startGame();
    }
  }, 1000);
}

function startGame() {
  gameState.status = "playing";
  currentDrawer = players[Math.floor(Math.random() * players.length)];
  gameState.currentDrawer = currentDrawer;
  currentWord = WORDS[Math.floor(Math.random() * WORDS.length)];
  gameState.word = currentWord;
  let timeLeft = ROUND_TIME;

  io.emit("gameStarting", {
    drawer: currentDrawer,
    word: currentWord,
  });

  timer = setInterval(() => {
    timeLeft--;
    io.emit("timeUpdate", timeLeft);
    if (timeLeft <= 0) {
      endRound();
    }
  }, 1000);
}

function endRound() {
  clearInterval(timer);
  gameState.roundInProgress = false;
  io.emit("roundEnd", { word: currentWord, drawer: currentDrawer });
  currentDrawer = null;
  gameState.currentDrawer = null;
  currentWord = null;
  gameState.word = "";
  gameState.status = "waiting";

  // Reset all players to not ready between rounds
  players.forEach((p) => (p.status = "not-ready"));
  io.emit("playersList", players);
}

// Add health check route
app.get("/health", (req, res) => {
  res.status(200).json({ status: "ok" });
});

// Add this near the top of your routes
app.get("/", (req, res) => {
  res.json({ status: "Server is running" });
});

httpServer.listen(port, () => {
  console.log(
    `Server is running on https://crustysocks-server-production.up.railway.app or http://localhost:${port}`
  );
});
