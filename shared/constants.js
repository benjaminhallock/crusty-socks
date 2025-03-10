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
  LEAVE_LOBBY: "leaveLobby",
  START_GAME: "startGame",
  GAME_STATE_UPDATE: "gameStateUpdate",
  CANVAS_UPDATE: "canvasUpdate",
  CHAT_MESSAGE: "chatMessage",
  CHECK_WORD_GUESS: "checkWordGuess",
  SELECT_WORD: "selectWord",
  PLAYER_UPDATE: "playerUpdate",
};

export const WORD_LIST = {
  "animals": [
      "elephant",
      "giraffe",
      "penguin",
      "lion",
      "tiger",
      "kangaroo",
      "octopus",
      "dolphin",
      "zebra",
      "panda",
      "koala",
      "rhinoceros",
      "butterfly",
      "squirrel",
      "rabbit",
      "turtle",
      "flamingo",
      "gorilla",
      "hippopotamus",
      "crocodile",
      "hedgehog",
      "peacock",
      "jellyfish",
      "seahorse",
      "cheetah"
  ],
  "food": [
      "pizza",
      "hamburger",
      "spaghetti",
      "sandwich",
      "hotdog",
      "taco",
      "icecream",
      "cupcake",
      "donut",
      "popcorn",
      "banana",
      "watermelon",
      "pineapple",
      "cookie",
      "pancake",
      "sushi",
      "burrito",
      "pretzel",
      "croissant",
      "cheese",
      "lollipop",
      "chocolate",
      "carrot",
      "broccoli",
      "strawberry"
  ],
  "objects": [
      "chair",
      "telephone",
      "television",
      "computer",
      "umbrella",
      "clock",
      "lamp",
      "camera",
      "glasses",
      "book",
      "pencil",
      "scissors",
      "toothbrush",
      "mirror",
      "backpack",
      "wallet",
      "headphones",
      "keyboard",
      "microphone",
      "calendar",
      "compass",
      "paintbrush",
      "trophy",
      "helmet",
      "magnet"
  ],
  "vehicles": [
      "airplane",
      "helicopter",
      "bicycle",
      "motorcycle",
      "submarine",
      "rocket",
      "sailboat",
      "train",
      "tractor",
      "firetruck",
      "ambulance",
      "skateboard",
      "scooter",
      "bulldozer",
      "taxi",
      "police car",
      "spaceship",
      "hot air balloon",
      "jetski",
      "racecar",
      "tank",
      "limousine",
      "cruise ship",
      "golf cart",
      "wagon"
  ],
  "sports": [
      "baseball",
      "basketball",
      "football",
      "soccer",
      "tennis",
      "volleyball",
      "bowling",
      "swimming",
      "skiing",
      "surfing",
      "boxing",
      "karate",
      "wrestling",
      "gymnastics",
      "hockey",
      "golf",
      "archery",
      "skateboarding",
      "cycling",
      "ping pong",
      "rugby",
      "diving",
      "ice skating",
      "snowboarding",
      "badminton"
  ]
}

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
