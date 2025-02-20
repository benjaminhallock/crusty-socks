// API Endpoints
export const API_ENDPOINTS = {
  // User routes
  LOGIN: "/api/users/login",
  REGISTER: "/api/users/register",
  VALIDATE: "/api/users/validate",
  GET_ALL_USERS: "/api/users/all",

  // Lobby routes
  CREATE_LOBBY: "/api/lobbys/create",
  GET_LOBBY: (roomId) => `/api/lobbys/${roomId}`,
  GET_ALL_LOBBIES: "/api/lobbys/all",
};

// Socket Events
export const SOCKET_EVENTS = {
  JOIN_LOBBY: "joinLobby",
  START_GAME: "startGame",
  GAME_STATE_UPDATE: "gameStateUpdate",
  UPDATE_CANVAS: "updateCanvas",
  CHAT_MESSAGE: "chatMessage",
  WORD_SELECTED: "wordSelected",
  PLAYER_UPDATE: "playerUpdate",
};

export const WORD_LIST = [
  "dog",
  "cat",
  "house",
  "tree",
  "car",
  "computer",
  "phone",
  "book",
  "table",
  "chair",
  "beach",
  "mountain",
  "lake",
  "river",
  "ocean",
  "city",
  "country",
  "planet",
  "star",
  "moon",
  "sun",
  "cloud",
  "rain",
  "snow",
  "wind",
  "fire",
  "earth",
  "air",
  "water",
  "ice",
  "rock",
  "sand",
  "dirt",
  "grass",
  "flower",
  "tree",
  "bush",
  "leaf",
  "branch",
  "root",
  "seed",
  "fruit",
  "vegetable",
  "meat",
  "fish",
  "bird",
  "insect",
  "animal",
  "mammal",
  "reptile",
  "amphibian",
  "bird",
  "fish",
  "invertebrate",
  "plant",
  "fungus",
  "bacteria",
  "virus",
  "cell",
  "organism",
  "human",
  "person",
];
// Game Constants
export const GAME_CONSTANTS = {
  CANVAS: {
    WIDTH: 800,
    HEIGHT: 600,
    GRID_SIZE: 20,
  },
  PLAYER_LIMITS: {
    MIN: 2,
    MAX: 16,
  },
};

export const GAME_STATE = {
  WAITING: 'waiting',
  STARTING: 'starting',
  PICKING_WORD: 'picking_word',
  DRAWING: 'drawing',
  ROUND_END: 'round_end',
  GAME_END: 'game_end',
  FINISHED: 'finished'
};

// Environment-specific settings
export const ENV_CONFIG = {
  SOCKET_URL: process.env.VITE_SOCKET_URL || "http://localhost:3001",
  API_URL: process.env.VITE_API_URL || "http://localhost:3001",
  CLIENT_URL: process.env.CLIENT_URL || "http://localhost:5174",
};
