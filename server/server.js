// Import required modules
import express from 'express';
import { createServer } from 'http';
import { Server } from 'socket.io';
import cors from 'cors';
import dotenv from 'dotenv';
import userRoutes from './routes/users.js';
import lobbyRoutes from './routes/lobbys.js';
import { GameManager } from './gameManager.js';
import db from './db/connection.js';

dotenv.config({ path: "./config.env" });
if (!process.env.JWT_SECRET) {
  console.error("JWT_SECRET is not defined in environment variables");
  process.exit(1);
}

// Create Express app
const app = express();

// Define client configuration
const CLIENT_PORT = 5174;
const local = `http://localhost:${CLIENT_PORT}`;

// Setup basic middleware
app.use(express.json());
app.use(cors({
  origin: [local, process.env.CORS_ORIGIN],
  credentials: true,
  methods: ["GET", "POST", "PUT", "DELETE"],
  authorizedHeaders: ["Content-Type", "Authorization"],
}));

// Setup routes
app.use('/users', userRoutes);
app.use('/lobby', lobbyRoutes);

// Create HTTP server and Socket.IO instance
const server = createServer(app);
const io = new Server(server, {
  cors: {
    origin: [local, process.env.CORS_ORIGIN],
    methods: ["GET", "POST", "PUT", "DELETE"],
    credentials: true,
  },
  transports: ["websocket", "polling"],
});

// Wait for database connection before starting server
db.once('connected', () => {
  // Initialize game manager after database connection
  const gameManager = new GameManager(io);
  
  // Start server
  const PORT = process.env.PORT || 3001;
  server.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
    console.log(`Client is running on port ${CLIENT_PORT}`);
  });
});

// Handle database connection errors
db.on('error', (error) => {
  console.error('Database connection error:', error);
  if (error.name === 'MongoNetworkError') {
    console.log('Please check if MongoDB is running and the connection string is correct');
  }
});

export default server;
