import cors from 'cors';
import dotenv from 'dotenv';
import express from 'express';
import { createServer } from 'http';
import { Server } from 'socket.io';

import connectDB from './db/connection.js';
import { initGame } from './gameManager.js';
import chatRoutes from './routes/chats.js';
import lobbyRoutes from './routes/lobbys.js';
import reportRoutes from './routes/reports.js';
import userRoutes from './routes/users.js';

// Load environment variables
dotenv.config({ path: './config.env' });

// Exit if required JWT_SECRET is missing
if (!process.env.JWT_SECRET) {
  console.error('Missing JWT_SECRET environment variable');
  process.exit(1);
}

// Server setup
const app = express();
const httpServer = createServer(app);

// Environment configuration
const DEVELOPMENT_URL = 'http://localhost:5174';
const isProduction = process.env.NODE_ENV !== 'development';
const CLIENT_URL = isProduction
  ? process.env.CLIENT_URL || DEVELOPMENT_URL
  : DEVELOPMENT_URL;

// CORS configuration
app.use(
  cors({
    origin: CLIENT_URL,
    credentials: true,
  })
);

// Initialize Socket.IO with CORS settings
const io = new Server(httpServer, {
  cors: {
    origin: CLIENT_URL,
    credentials: true,
  },
  pingTimeout: 60000,
  pingInterval: 25000,
  transports: ['websocket', 'polling'],
});

// Log server mode
console.info(
  `[SERVER] Running in ${isProduction ? 'production' : 'development'} mode`
);
console.info(`[SERVER] Client URL: ${CLIENT_URL}`);

// Middleware
app.use(express.json());

// Routes
app.use('/api/user', userRoutes);
app.use('/api/lobby', lobbyRoutes);
app.use('/api/report', reportRoutes);
app.use('/api/chat', chatRoutes);

// Initialize Socket.IO event handlers
initGame(io);

// Start server
const PORT = process.env.PORT || 3001;

connectDB()
  .then(() => {
    console.info('[SERVER] Database connected');
    httpServer.listen(PORT, () =>
      console.info(`[SERVER] Server running on port ${PORT}`)
    );
  })
  .catch((error) => {
    console.error('[SERVER] Failed to start:', error.message);
    process.exit(1);
  });
