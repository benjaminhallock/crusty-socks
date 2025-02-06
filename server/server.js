import express from "express";
import { createServer } from "http";
import { Server } from "socket.io";
import cors from "cors";
import dotenv from "dotenv";
import users from "./routes/users.js";
import lobbys from "./routes/lobbys.js";
import { GameManager } from "./gameManager.js";
import mongoose from "mongoose";

dotenv.config({ path: "./config.env" });
if (!process.env.JWT_SECRET) {
  console.error("auth.js: JWT_SECRET is not defined in environment variables");
  process.exit(1);
}
const port = process.env.PORT || 3001;
const app = express();
const httpServer = createServer(app);

// Cors helps us to allow requests from different origins but not all.
// We can specify the methods and headers that are allowed.
const io = new Server(httpServer, {
  cors: {
    origin: ["http://localhost:5173", process.env.CORS_ORIGIN],
    methods: ["GET", "POST", "PUT", "DELETE"],
    credentials: true,
  },
  transports: ["websocket", "polling"],
});
// Initialize game manager and socket handler
const gameManager = new GameManager(io);

app.use(
  cors({
    origin: ["http://localhost:5173", process.env.CLIENT_URL],
    credentials: true,
    methods: ["GET", "POST", "PUT", "DELETE"],
    authorizedHeaders: ["Content-Type", "Authorization"],
  })
);
app.use(express.json());

// Connect to MongoDB in the cloud, if you want a local connection, use the local URI
mongoose
  .connect(process.env.ATLAS_URI)
  .then(() => console.log("MongoDB connected successfully"))
  .catch((err) => console.error("MongoDB connection error:", err));

// Routes for the server
app.get("/", (_req, res) => res.json({ status: "Server is running" }));
app.use("/users", users);
app.use("/lobby", lobbys);

httpServer.listen(port, () => {
  console.log(`[SERVER] 📡 Local: http://localhost:${port}`);
  console.log("[CLIENT] 📡 Local: http://localhost:5173");
});
