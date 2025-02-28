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

// Completely disable CORS for local development
const corsOptions = {
    origin: true, // Reflects the request origin
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS', 'PATCH', 'HEAD'],
    credentials: true,
    maxAge: 86400,
    preflightContinue: true,
    optionsSuccessStatus: 200,
    allowedHeaders: '*'
};

// Initialize socket server with completely open CORS config
const io = new Server(httpServer, {
    cors: {
        origin: true,
        methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
        credentials: true,
        allowedHeaders: '*'
    },
    allowEIO3: true,
    pingTimeout: 60000,
    pingInterval: 25000,
    transports: ['websocket', 'polling'],
    path: '/socket.io/',
    connectTimeout: 45000,
});

io.engine.on('connection_error', (err) => {
    console.error('Socket.io engine connection error:', err);
});

// Attach connection listeners
io.on('connect', (socket) => {
    console.log('Client connected:', socket.id);
});

io.on('connect_error', (err) => {
    console.error('Socket.io connection error:', err);
});

// Middleware
app.use(cors(corsOptions));

app.use(express.json());

// Routes
app.use('/api/users', userRoutes);
app.use('/api/lobbys', lobbyRoutes);

// Socket.io setup
initializeSocketEvents(io);

const PORT = process.env.PORT || 3001;

// Start server
const startServer = async () => {
    try {
        await connectDB();
        httpServer.listen(PORT, () => {
            console.log(`Server running on port ${PORT}`);
            console.log(`Environment: ${process.env.NODE_ENV}`);
            console.log('Socket.IO path: /socket.io/');
        });
    } catch (error) {
        console.error('Failed to start server:', error);
        process.exit(1);
    }
};

startServer();
