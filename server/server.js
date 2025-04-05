import cors from "cors";
import dotenv from "dotenv";
import express from "express";
import { createServer } from "http";
import { Server } from "socket.io";

import { ENV_CONFIG } from "./constants.js";
import connectDB from "./db/connection.js";
import { initializeSocketEvents } from "./gameManager.js";
import lobbyRoutes from "./routes/lobbys.js";
import reportRoutes from "./routes/reports.js";
import userRoutes from "./routes/users.js";

dotenv.config({ path: "./config.env" });

if (!process.env.JWT_SECRET) {
  process.exit(1);
}

const app = express();
const httpServer = createServer(app);

// Configure CORS for Express
const corsOptions = {
  origin: ENV_CONFIG.isDevelopment()
    ? ["http://localhost:5174", "http://localhost:3000"]
    : ENV_CONFIG.CLIENT_URL,
  methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS", "PATCH", "HEAD"],
  credentials: true,
  maxAge: 86400,
  allowedHeaders: ["Content-Type", "Authorization"],
};

// Initialize socket server with completely open CORS config
const io = new Server(httpServer, {
  cors: {
    origin: ENV_CONFIG.isDevelopment()
      ? "http://localhost:5174"
      : ENV_CONFIG.CLIENT_URL,
    methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    credentials: true,
    allowedHeaders: ["Content-Type", "Authorization"],
  },
  allowEIO3: true,
  pingTimeout: 60000,
  pingInterval: 25000,
  transports: ["websocket", "polling"],
  path: "/socket.io/",
  connectTimeout: 45000,
});

io.engine.on("connection_error", (err) => {});

// Middleware
// Apply CORS middleware globally with specified options
app.use(cors(corsOptions));
app.use(express.json());

// Routes
app.use("/api/user", userRoutes);
app.use("/api/lobby", lobbyRoutes);
app.use("/api/report", reportRoutes);
// Socket.io setup
initializeSocketEvents(io);

const PORT = ENV_CONFIG.PORT;

// Start server
const startServer = async () => {
  try {
    try {
      await connectDB();
      console.log("Connected to database");
    } catch (dbError) {
      throw new Error(`Failed to connect to database: ${dbError.message}`);
    }
    httpServer.listen(PORT, () => {});
  } catch (error) {
    process.exit(1);
  }
};

startServer();
