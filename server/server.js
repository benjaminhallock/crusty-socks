import express from "express";
import { createServer } from "http";
import { Server } from "socket.io";
import cors from "cors";
import dotenv from "dotenv";
import users from "./routes/users.js";
import lobbys from "./routes/lobbys.js";
import { GameManager } from "./gameManager.js";
import { SocketHandler } from "./socketHandler.js";
import mongoose from "mongoose";

dotenv.config({ path: "./config.env" });

if (!process.env.JWT_SECRET) {
  console.error("JWT_SECRET is not defined in environment variables");
  process.exit(1);
}

const port = process.env.PORT || 3001;
const app = express();
const httpServer = createServer(app);

// Cors helps us to allow requests from different origins but not all.
// We can specify the methods and headers that are allowed.
const io = new Server(httpServer, {
  cors: {
    origin: ["http://localhost:5173", process.env.CORS_ORIGIN].filter(Boolean),
    methods: ["GET", "POST", "PUT", "DELETE"],
    credentials: true,
  },
  transports: ["websocket", "polling"],
});

app.use(
  cors({
    origin: ["http://localhost:5173", process.env.CLIENT_URL].filter(Boolean),
    credentials: true,
    methods: ["GET", "POST", "PUT", "DELETE"],
    authorizedHeaders: ["Content-Type", "Authorization"],
  })
);

// Does our app need to parse JSON requests?
app.use(express.json());

// Connect to MongoDB in the cloud, if you want a local connection, use the local URI
mongoose
  .connect(process.env.ATLAS_URI)
  .then(() => console.log("MongoDB connected successfully"))
  .catch((err) => console.error("MongoDB connection error:", err));

// Initialize game manager and socket handler
const gameManager = new GameManager(io);
const socketHandler = new SocketHandler(io, gameManager);

app.get("/health", (_req, res) => res.status(200).json({ status: "ok" }));
app.get("/", (_req, res) => res.json({ status: "Server is running" }));
app.use("/users", users);
app.use("/lobby", lobbys);

httpServer.listen(port, () => {
  console.log("\n[SERVER] 🚀 Server running on:");
  console.log(`[SERVER] 📡 Local: http://localhost:${port}`);
  console.log(
    `[SERVER] 🌍 Production: ${process.env.CORS_ORIGIN || "Not set"}\n`
  );
});
