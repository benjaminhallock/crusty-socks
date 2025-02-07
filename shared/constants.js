// API Endpoints
export const API_ENDPOINTS = {
  // User routes
  LOGIN: '/api/users/login',
  REGISTER: '/api/users/register',
  VALIDATE: '/api/users/validate',
  GET_ALL_USERS: '/api/users/all',
  
  // Lobby routes
  CREATE_LOBBY: '/api/lobbys/create',
  GET_LOBBY: (roomId) => `/api/lobbys/${roomId}`,
  GET_ALL_LOBBIES: '/api/lobbys/all'
};

// Game Constants
export const GAME_CONSTANTS = {
  CANVAS: {
    WIDTH: 800,
    HEIGHT: 600,
    GRID_SIZE: 20
  },
  PLAYER_LIMITS: {
    MIN: 2,
    MAX: 16
  },
  GAME_STATES: {
    WAITING: 'waiting',
    PLAYING: 'playing',
    FINISHED: 'finished'
  }
};

// Default Configuration
export const DEFAULT_CONFIG = {
  ROUNDS: 3,
  MAX_PLAYERS: 8,
  ROUND_TIME: 120, // seconds
};

// Environment-specific settings
export const ENV_CONFIG = {
  SOCKET_URL: process.env.VITE_SOCKET_URL || 'http://localhost:3001',
  API_URL: process.env.VITE_API_URL || 'http://localhost:3001',
  CLIENT_URL: process.env.CLIENT_URL || 'http://localhost:5174'
};