// API Endpoints
export const API_ENDPOINTS = {
  // User routes
  LOGIN: "/api/users/login",
  REGISTER: "/api/users/register",
  VALIDATE: "/api/users/validate",
  GET_ALL_USERS: "/api/users/all",
  GET_USER_PROFILE: (username) => `/api/users/profile/${username}`,
  UPDATE_USER_PROFILE: (username) => `/api/users/profile/${username}`,
  LEADERBOARD: "/api/users/leaderboard",

  // Lobby routes
  CREATE_LOBBY: "/api/lobbys/create",
  GET_LOBBY: (roomId) => `/api/lobbys/${roomId}`,
  GET_ALL_LOBBIES: "/api/lobbys/all",
  
  // Report routes
  CREATE_REPORT: "/api/reports/create",
  GET_ALL_REPORTS: "/api/reports/all",
};

// Socket Events
export const SOCKET_EVENTS = {
  KICK_PLAYER: "kickPlayer",
  REPORT_PLAYER: "reportPlayer",
  JOIN_LOBBY: "joinLobby",
  LEAVE_LOBBY: "leaveLobby",
  LEAVE_ROOM: "leaveRoom",
  START_GAME: "startGame",
  GAME_STATE_UPDATE: "gameStateUpdate",
  CANVAS_UPDATE: "canvasUpdate",
  CHAT_MESSAGE: "chatMessage",
  CHECK_WORD_GUESS: "checkWordGuess",
  SELECT_WORD: "selectWord",
  PLAYER_UPDATE: "playerUpdate",
  END_DRAWING: 'endDrawing',
  DISCONNECT: "disconnect",
};

export const WORD_LIST = {
  animals: [
    "Bear", "Cat", "Dog", "Eagle", "John Pork", "Fox", "Goat", "Horse", "Ibis", "Jaguar",
    "Lion", "Monkey", "Newt", "Owl", "Panda", "Quail", "Rabbit", "Snake", "Tiger", "Wolf",
    "Yak", "Zebra", "Deer", "Frog", "Shark", "Dolphin", "Cheetah", "Turtle", "Giraffe", "Bat"
  ],
  food: [
    "Pizza", "Burger", "Apple", "Banana", "Carrot", "Rice", "Bread", "Cheese", "Egg", "Fish",
    "Grape", "Honey", "Jam", "Kiwi", "Lemon", "Mango", "Noodles", "Orange", "Pasta", "Quiche",
    "Rice", "Soup", "Tomato", "Udon", "Vanilla", "Walnut", "Yogurt", "Zucchini", "Steak", "Corn"
  ],
  objects: [
    "Chair", "Table", "Bed", "Desk", "Lamp", "Sofa", "Mirror", "Clock", "Book", "Pen",
    "Pencil", "Eraser", "Backpack", "Wallet", "Keys", "Phone", "Laptop", "Mouse", "Monitor", "Fan",
    "Plate", "Bowl", "Cup", "Fork", "Knife", "Spoon", "Bottle", "Box", "Ruler", "Hammer"
  ],
  vehicles: [
    "Car", "Truck", "Bike", "Bus", "Van", "Jeep", "Taxi", "Train", "Boat", "Ship",
    "Subway", "Tram", "Scooter", "Motorcycle", "Plane", "Helicopter", "Skateboard", "Bicycle", "Yacht", "Ferry",
    "Rocket", "Balloon", "Submarine", "Canoe", "Kayak", "Hovercraft", "Segway", "Ambulance", "Fire Truck", "Tractor"
  ],
  sports: [
    "Soccer", "Tennis", "Golf", "Rugby", "Hockey", "Basketball", "Baseball", "Cricket", "Volleyball", "Badminton",
    "Table Tennis", "Cycling", "Swimming", "Running", "Skiing", "Snowboarding", "Skating", "Wrestling", "Boxing", "Judo",
    "Karate", "Archery", "Diving", "Rowing", "Sailing", "Surfing", "Bowling", "Darts", "Fencing", "Chess"
  ],
  "video games": [
    "Minecraft", "Fortnite", "Zelda", "Mario", "Tetris", "Pac-Man", "Halo", "Roblox", "Pokemon", "Doom",
    "Sonic", "Kirby", "Fallout", "GTA", "Street Fighter", "Tekken", "Tomb Raider", "Overwatch", "Valorant", "League",
    "Dota", "FIFA", "Among Us", "Skyrim", "Terraria", "Stardew", "Elden Ring", "Bioshock", "Dark Souls", "Diablo"
  ]
};

// Game Constants
export const GAME_CONSTANTS = {
  CANVAS_GRID_SIZE: 20,
  CANVAS_WIDTH: 800,
  CANVAS_HEIGHT: 600,
};

export const GAME_STATE = {
  WAITING: "waiting",
  COOLDOWN: "cooldown",
  PICKING_WORD: "picking_word",
  DRAWING: "drawing",
  DRAW_END: "draw_end",
  ROUND_END: "round_end",
  GAME_END: "game_end",
  FINISHED: "finished",
};

// Environment-specific settings
export const ENV_CONFIG = {
  // For server-side usage
  SOCKET_URL: process.env.SOCKET_URL || "http://localhost:3001",
  API_URL: process.env.API_URL || "http://localhost:3001",
  CLIENT_URL: process.env.CLIENT_URL || "http://localhost:5174",
  PORT: process.env.PORT || 3001,
  
  // Environment detection
  isProduction: () => process.env.NODE_ENV === 'production',
  isDevelopment: () => process.env.NODE_ENV === 'development'
};