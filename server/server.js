import express from "express";
import { createServer } from "http";
import { Server } from "socket.io";
import cors from "cors";
import dotenv from "dotenv";
import users from "./routes/users.js";
import { GameManager } from "./gameManager.js";
import mongoose from 'mongoose';

dotenv.config({ path: "./config.env" });

const port = process.env.PORT || 3001;
const app = express();
const httpServer = createServer(app);
const io = new Server(httpServer, {
  cors: {
    origin: ["http://localhost:5173", process.env.CORS_ORIGIN].filter(Boolean),
    methods: ["GET", "POST"],
    credentials: true,
  },
  transports: ["websocket", "polling"],
});

app.use(
  cors({
    origin: ["http://localhost:5173", process.env.CLIENT_URL].filter(Boolean),
    credentials: true,
  })
);

app.use(express.json());

mongoose.connect(process.env.ATLAS_URI)
  .then(() => console.log('MongoDB connected successfully'))
  .catch(err => console.error('MongoDB connection error:', err));

// Initialize game manager
const gameManager = new GameManager(io);

io.on("connection", (socket) => {
  console.log("\n[SERVER] 🔌 New connection:", socket.id);

  socket.on("joinGame", ({ username }) => {
    try {
      console.log("[SERVER] 👋 Join game request:", {
        username,
        socketId: socket.id,
      });
      const success = gameManager.addPlayer(socket, username);
      if (!success) {
        socket.emit("error", "Username already taken or already connected");
      }
    } catch (error) {
      console.error("Error in joinGame:", error);
      socket.emit("error", "Failed to join game");
    }
  });

  socket.on("playerReady", () => gameManager.handlePlayerReady(socket.id));
  socket.on("playerNotReady", () =>
    gameManager.handlePlayerNotReady(socket.id)
  );
  socket.on("draw", (data) => gameManager.handleDraw(socket, data));
  socket.on("guess", ({ user, message }) =>
    gameManager.handleGuess(user, message)
  );

  // Send current drawing to new players
  socket.emit("drawUpdate", gameManager.getCurrentDrawing());

  socket.on("disconnect", () => {
    console.log("[SERVER] 🔌 Client disconnected:", socket.id);
    gameManager.removePlayer(socket.id);
  });
});

// Routes
app.get("/health", (req, res) => res.status(200).json({ status: "ok" }));
app.get("/", (req, res) => res.json({ status: "Server is running" }));
app.use("/users", users);

httpServer.listen(port, () => {
  console.log("\n[SERVER] 🚀 Server running on:");
  console.log(`[SERVER] 📡 Local: http://localhost:${port}`);
  console.log(
    `[SERVER] 🌍 Production: ${process.env.CORS_ORIGIN || "Not set"}\n`
  );
});
