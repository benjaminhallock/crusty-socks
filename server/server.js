import cors from 'cors';
import dotenv from 'dotenv';
import express from 'express';
import { createServer } from 'http';
import { Server } from 'socket.io';

import { ENV_CONFIG } from '../shared/constants.js';
import connectDB from './db/connection.js';
import { initializeSocketEvents } from './gameManager.js';
import lobbyRoutes from './routes/lobbys.js';
import userRoutes from './routes/users.js';

dotenv.config({ path: './config.env' });

if (!process.env.JWT_SECRET) {
    console.error('JWT_SECRET environment variable is not set');
    process.exit(1);
}

const app = express();
const httpServer = createServer(app);

// CORS configuration
const corsOptions = {
    origin: process.env.NODE_ENV === 'development' 
        ? ['http://localhost:5174', 'http://127.0.0.1:5174'] 
        : ENV_CONFIG.CLIENT_URL,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    credentials: true,
    allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With']
};

const io = new Server(httpServer, {
    cors: {
        ...corsOptions,
        transports: ['websocket', 'polling'],
        credentials: true
    }
});

// Middleware
app.use(cors(corsOptions));
app.use(express.json());

// Routes
app.use('/api/users', userRoutes);
app.use('/api/lobbys', lobbyRoutes);

// Socket.io setup
initializeSocketEvents(io);

const PORT = process.env.PORT || 5000;

// Start server
const startServer = async () => {
    try {
        await connectDB();
        httpServer.listen(PORT, () => {
            console.error(`Server running on port ${PORT}`);
            console.error(`Environment: ${process.env.NODE_ENV}`);
        });
    } catch (error) {
        console.error('Failed to start server:', error);
        process.exit(1);
    }
};

startServer();
