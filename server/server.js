import { createServer } from "http";

import cors from "cors";
import dotenv from "dotenv";
import express from "express";
import { Server } from "socket.io";

import connectDB from "./db/connection.js";
import { initializeSocketEvents } from "./gameManager.js";
import lobbyRoutes from "./routes/lobbys.js";
import reportRoutes from "./routes/reports.js";
import userRoutes from "./routes/users.js";
import chatRoutes from "./routes/chats.js";

dotenv.config({ path: "./config.env" });
if (!process.env.JWT_SECRET) process.exit(1);

const app = express();
const httpServer = createServer(app);

const isProd = process.env.NODE_ENV === "development" ? false : true;
const CLIENT_URL = isProd
  ? process.env.CLIENT_URL || "http://localhost:5174"
  : "http://localhost:5174";

const io = new Server(httpServer, {
  cors: {
    origin: CLIENT_URL,
    methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS", "PATCH", "HEAD"],
    credentials: true,
    maxAge: 86400,
    allowedHeaders: ["Content-Type", "Authorization"],
  },
  allowEIO3: true,
  pingTimeout: 60000,
  pingInterval: 25000,
  transports: ["websocket", "polling"],
  connectTimeout: 45000,
});

console.info(
  `[SERVER] Socket.IO is on ${
    isProd ? "production" : "development"
  } mode with client URL ${CLIENT_URL}`
);

app.use(
  cors({
    origin: [CLIENT_URL, "http://localhost:5174", "http://localhost:3001"],
    methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS", "PATCH", "HEAD"],
    credentials: true,
    maxAge: 86400,
    allowedHeaders: ["Content-Type", "Authorization", "Origin", "Accept"],
    exposedHeaders: ["Content-Length", "Content-Type"],
  })
);

app.use(express.json());
app.use("/api/user", userRoutes);
app.use("/api/lobby", lobbyRoutes);
app.use("/api/report", reportRoutes);
app.use("/api/chat", chatRoutes);

initializeSocketEvents(io);

const PORT = process.env.PORT || 3001;

connectDB()
  .then(() => {
    console.info("[SERVER] Database connected");
    httpServer.listen(PORT, () =>
      console.info(`[SERVER] Server running on port ${PORT}`)
    );
  })
  .catch((error) => {
    console.error(`Startup error: ${error.message}`);
    process.exit(1);
  });
