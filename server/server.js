import express from 'express';
import { createServer } from 'http';
import { Server } from 'socket.io';
import cors from 'cors';
import dotenv from 'dotenv';
import userRoutes from './routes/users.js';
import lobbyRoutes from './routes/lobbys.js';
import { GameManager } from './gameManager.js';
import db from './db/connection.js';

// Load environment variables
dotenv.config({ path: "./config.env" });
if (!process.env.JWT_SECRET) {
  console.error("JWT_SECRET is not defined");
  process.exit(1);
}

// Create Express app and HTTP server
const app = express();
const server = createServer(app);

const corsOptions = {
  origin: [process.env.CORS_ORIGIN, "http://localhost:5174"],
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE'],
  allowedHeaders: ['Content-Type', 'Authorization']
};

// Setup middleware
app.use(express.json());
app.use(cors(corsOptions));

// Setup routes
app.use('/users', userRoutes);
app.use('/lobby', lobbyRoutes);

// Create Socket.IO instance with simplified config
const io = new Server(server, { cors: corsOptions });

// Initialize after database connection
db.once('connected', () => {
  const gameManager = new GameManager(io);
  const PORT = process.env.PORT || 3001;
  
  server.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
    console.log(`CORS enabled for: ${corsOptions.origin.join(', ')}`);
  });
});

// Handle database errors
db.on('error', (error) => {
  console.error('Database connection error:', error);
});

export default server;
