import { use } from "react";

export const log = (message) => {
  if (import.meta.env.MODE === "development") {
    console.log(message);
  }
};
export const logError = (message) => {
  if (import.meta.env.MODE === "development") {
    console.error(message);
  }
};
export const logWarning = (message) => {
  if (import.meta.env.MODE === "development") {
    console.warn(message);
  }
};

export const SOCKET_EVENTS = {
  START_GAME: "startGame",
  SELECT_WORD: "selectWord",
  GAME_STATE_UPDATE: "gameStateUpdate",
  KICK_PLAYER: "kickPlayer",
  REPORT_PLAYER: "reportPlayer",
  LEAVE_LOBBY: "leaveLobby",
  CANVAS_UPDATE: "canvasUpdate",
  CHAT_MESSAGE: "chatMessage",
  CHAT_HISTORY: "chatHistory",
  REQUEST_CHAT_HISTORY: "requestChatHistory",
  CHECK_WORD_GUESS: "checkWordGuess",
  PLAYER_UPDATE: "playerUpdate",
  END_DRAWING: "endDrawing",
  CONNECT_ACK: "connectAck",
  JOIN_LOBBY: "joinLobby",
  SOUND: "sound",
  DISCONNECT: "disconnect",
  RECONNECT: "reconnect",
};

export const API_ENDPOINTS = {
  // User routes
  LOGIN: "/api/user/login",
  REGISTER: "/api/user/register",
  VALIDATE: "/api/user/auth",
  GET_ALL_USERS: "/api/user/all",
  GET_USER_PROFILE: (username) => `/api/user/${username}`,
  UPDATE_USER_PROFILE: (username) => `/api/user/update/${username}`,
  UPDATE_USER: (userId) => `/api/user/${userId}`,
  LEADERBOARD: "/api/user/top",

  // Lobby routes
  CREATE_LOBBY: "/api/lobby/create",
  GET_LOBBY: (roomId) => `/api/lobby/${roomId}`,
  GET_ALL_LOBBIES: "/api/lobby/all",

  // Report routes
  CREATE_REPORT: "/api/report/create",
  GET_ALL_REPORTS: "/api/report/all",
  UPDATE_REPORT_STATUS: (reportId) => `/api/report/update/${reportId}`,
};
// Game-related constants
export const GAME_CONSTANTS = {
  CANVAS_GRID_SIZE: 16,
  CANVAS_WIDTH: 800,
  CANVAS_HEIGHT: 600,
};

// Game states used to track the current phase of the game
export const GAME_STATE = {
  WAITING: "waiting",
  PICKING_WORD: "picking_word",
  DRAWING: "drawing",
  DRAW_END: "draw_end",
  ROUND_END: "round_end",
  FINISHED: "finished",
};

// Environment-specific settings for the client
// These functions dynamically determine API and socket URLs based on the environment
export const ENV_CONFIG = {
  // Get the API URL for the client
  getClientApiUrl: () => {
    if (typeof window !== "undefined") {
      return import.meta?.env?.VITE_API_URL || "http://localhost:3001";
    }
    return "http://localhost:3001";
  },
  getServerApiUrl: () => {
    if (typeof window !== "undefined") {
      return import.meta?.env?.VITE_SERVER_API_URL || "http://localhost:3001";
    }
    return "http://localhost:3001"; // Added return statement for non-browser environments
  },
  // Get the socket URL for the client
  getClientSocketUrl: () => {
    if (typeof window !== "undefined") {
      return import.meta?.env?.VITE_SOCKET_URL || "http://localhost:3001";
    }
    return "http://localhost:3001"; // Socket.io handles the protocol upgrade internally
  },

  // Check if the environment is production
  isProduction: () => {
    return import.meta?.env?.PROD === true;
  },

  // Check if the environment is development
  isDevelopment: () => {
    return import.meta?.env?.DEV === true;
  },
};

export const WORD_LIST = {
  animals: [
    "Bear",
    "Cat",
    "Dog",
    "Eagle",
    "John Pork",
    "Fox",
    "Goat",
    "Horse",
    "Ibis",
    "Jaguar",
    "Lion",
    "Monkey",
    "Newt",
    "Owl",
    "Panda",
    "Quail",
    "Rabbit",
    "Snake",
    "Tiger",
    "Wolf",
    "Yak",
    "Zebra",
    "Deer",
    "Frog",
    "Shark",
    "Dolphin",
    "Cheetah",
    "Turtle",
    "Giraffe",
    "Bat",
  ],
  food: [
    "Pizza",
    "Burger",
    "Apple",
    "Banana",
    "Carrot",
    "Rice",
    "Bread",
    "Cheese",
    "Egg",
    "Fish",
    "Grape",
    "Honey",
    "Jam",
    "Kiwi",
    "Lemon",
    "Mango",
    "Noodles",
    "Orange",
    "Pasta",
    "Quiche",
    "Rice",
    "Soup",
    "Tomato",
    "Udon",
    "Vanilla",
    "Walnut",
    "Yogurt",
    "Zucchini",
    "Steak",
    "Corn",
  ],
  objects: [
    "Chair",
    "Table",
    "Bed",
    "Desk",
    "Lamp",
    "Sofa",
    "Mirror",
    "Clock",
    "Book",
    "Pen",
    "Pencil",
    "Eraser",
    "Backpack",
    "Wallet",
    "Keys",
    "Phone",
    "Laptop",
    "Mouse",
    "Monitor",
    "Fan",
    "Plate",
    "Bowl",
    "Cup",
    "Fork",
    "Knife",
    "Spoon",
    "Bottle",
    "Box",
    "Ruler",
    "Hammer",
  ],
  vehicles: [
    "Car",
    "Truck",
    "Bike",
    "Bus",
    "Van",
    "Jeep",
    "Taxi",
    "Train",
    "Boat",
    "Ship",
    "Subway",
    "Tram",
    "Scooter",
    "Motorcycle",
    "Plane",
    "Helicopter",
    "Skateboard",
    "Bicycle",
    "Yacht",
    "Ferry",
    "Rocket",
    "Balloon",
    "Submarine",
    "Canoe",
    "Kayak",
    "Hovercraft",
    "Segway",
    "Ambulance",
    "Fire Truck",
    "Tractor",
  ],
  sports: [
    "Soccer",
    "Tennis",
    "Golf",
    "Rugby",
    "Hockey",
    "Basketball",
    "Baseball",
    "Cricket",
    "Volleyball",
    "Badminton",
    "Table Tennis",
    "Cycling",
    "Swimming",
    "Running",
    "Skiing",
    "Snowboarding",
    "Skating",
    "Wrestling",
    "Boxing",
    "Judo",
    "Karate",
    "Archery",
    "Diving",
    "Rowing",
    "Sailing",
    "Surfing",
    "Bowling",
    "Darts",
    "Fencing",
    "Chess",
  ],
  "video games": [
    "Minecraft",
    "Fortnite",
    "Zelda",
    "Mario",
    "Tetris",
    "Pac-Man",
    "Halo",
    "Roblox",
    "Pokemon",
    "Doom",
    "Sonic",
    "Kirby",
    "Fallout",
    "GTA",
    "Street Fighter",
    "Tekken",
    "Tomb Raider",
    "Overwatch",
    "Valorant",
    "League",
    "Dota",
    "FIFA",
    "Among Us",
    "Skyrim",
    "Terraria",
    "Stardew",
    "Elden Ring",
    "Bioshock",
    "Dark Souls",
    "Diablo",
  ],
};
