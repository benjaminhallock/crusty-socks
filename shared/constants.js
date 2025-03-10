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
      "Bear", "Cat", "Dog", "Eagle", "Fox", "Goat", "Horse", "Ibis", "Jaguar",
      "Kangaroo", "Lion", "Monkey", "Newt", "Owl", "Panda", "Quail", "Rabbit",
      "Snake", "Tiger", "Uakari", "Vulture", "Wolf", "Tetra", "Yak", "Zebra",
      "Alligator", "Badger", "Cheetah", "Dolphin", "Elephant", "Frog", "Giraffe",
      "Hamster", "Iguana", "Jellyfish", "Koala", "Lemur", "Meerkat", "Narwhal",
      "Octopus", "Penguin", "Quokka", "Rhinoceros", "Seal", "Turtle", "Urchin",
      "Sponge", "Walrus", "Angler Fish", "Yapok", "Gorilla", "Armadillo", "Bison",
      "Coyote", "Dugong", "Echidna", "Flamingo", "Gorilla", "Hyena", "Pig",
      "Jackal", "Kiwi", "Lynx", "Numbat", "Pelican", "Orangutan", "Platypus",
      "Quokka", "Raccoon", "Salamander", "Toad", "Swordfish", "Triceratops", "Wombat",
      "Xerus", "Hammerhead Shark", "Spinosaurus", "Albatross", "Barracuda", "Chameleon",
      "Tyrannosaurus", "Emu", "Falcon", "Gecko", "Heron", "Impala", "Bobcat",
      "Kingfisher", "Leopard", "Mongoose", "Narwhal", "Ocelot", "Puffin",
      "Quetzal", "Reindeer", "Stingray", "Tapir", "Chicken", "Vicuna",
      "Wallaby", "Seagull", "Tuna", "Seahorse", "Caracal", "Dingo",
      "Eland", "Fossa", "Gazelle", "Hippopotamus", "Boar", "Jerboa", "Antelope",
      "Llama", "Manatee", "Okapi", "Pangolin", "Quoll", "Serval", "Cow",
      "Crab", "Vaquita", "Wolverine", "Yabby", "Blue Glaucus"
  ],
  "food": [
      "Pizza", "Burger", "Hot Dog", "Sandwich", "Taco", "Burrito", "Sushi", "Ramen", "Pho", "Lasagna",
      "Ravioli", "Spaghetti", "Fettuccine Alfredo", "Mac and Cheese", "Pad Thai", "Fried Rice", "Stir Fry", "Curry", "Chili", "Stew",
      "Gumbo", "Clam Chowder", "Tomato Soup", "Chicken Noodle Soup", "Matzo Ball Soup", "French Onion Soup", "Minestrone", "Gazpacho", "Borscht", "Risotto",
      "Paella", "Jambalaya", "Biryani", "Tagine", "Falafel", "Hummus", "Baba Ganoush", "Shawarma", "Gyro", "Kebab",
      "Tandoori Chicken", "Butter Chicken", "Chicken Tikka Masala", "Samosa", "Dumplings", "Spring Rolls", "Egg Rolls", "Potstickers", "Peking Duck", "Mille Foglie",
      "Kung Pao Chicken", "Beef and Broccoli", "Sweet and Sour Pork", "Mapo Tofu", "Bibimbap", "Kimchi Stew", "Japchae", "Sashimi", "Tempura", "Teriyaki Chicken",
      "Tonkatsu", "Okonomiyaki", "Takoyaki", "Miso Soup", "Udon", "Soba", "Donburi", "Ceviche", "Empanadas", "Arepas",
      "Feijoada", "Poutine", "Shepherd's Pie", "Fish and Chips", "Bangers and Mash", "Corned Beef and Cabbage", "Colcannon", "Haggis", "Pierogi", "Borscht",
      "Pelmeni", "Boeuf Bourguignon", "Coq au Vin", "Ratatouille", "Quiche", "Croque Monsieur", "Cassoulet", "Bouillabaisse", "Fondue", "Raclette",
      "Tagine", "Couscous", "Falafel", "Shakshuka", "Moussaka", "Spanakopita", "Dolma", "Baklava", "Tiramisu", "Cheesecake"
  ],
  "objects": [
      "Chair", "Table", "Bed", "Desk", "Lamp", "Sofa", "Couch", "Mirror", "Clock", "Picture",
      "Book", "Notebook", "Pen", "Pencil", "Eraser", "Ruler", "Backpack", "Bag", "Wallet", "Keys",
      "Phone", "Computer", "Laptop", "Keyboard", "Mouse", "Monitor", "Printer", "Scanner", "Speaker", "Headphones",
      "Television", "Remote", "Fan", "Heater", "Air Conditioner", "Refrigerator", "Oven", "Microwave", "Toaster", "Blender",
      "Dish", "Plate", "Bowl", "Cup", "Glass", "Fork", "Knife", "Spoon", "Pot", "Pan",
      "Bottle", "Jar", "Can", "Box", "Basket", "Trash Can", "Broom", "Mop", "Vacuum", "Duster",
      "Towel", "Blanket", "Pillow", "Sheet", "Curtain", "Rug", "Carpet", "Clothes", "Shirt", "Pants",
      "Shoes", "Socks", "Hat", "Gloves", "Coat", "Umbrella", "Sunglasses", "Watch", "Bracelet", "Necklace",
      "Ring", "Earrings", "Toothbrush", "Toothpaste", "Soap", "Shampoo", "Conditioner", "Towel", "Comb", "Hairbrush",
      "Toys", "Ball", "Doll", "Car", "Bicycle", "Scooter", "Skateboard", "Helmet", "Toolbox", "Hammer"
  ],
  "vehicles": [
      "Car", "Truck", "SUV", "Van", "Minivan", "Bus", "Motorcycle", "Scooter", "Bicycle", "Tricycle",
      "Electric Car", "Hybrid Car", "Sedan", "Coupe", "Convertible", "Hatchback", "Station Wagon", "Pickup Truck", "Jeep", "Limousine",
      "Taxi", "Ambulance", "Fire Truck", "Police Car", "Tow Truck", "Garbage Truck", "Delivery Van", "Camper Van", "RV", "Trailer",
      "Semi-Truck", "Tanker Truck", "Flatbed Truck", "Dump Truck", "Cement Mixer", "Forklift", "Tractor", "Bulldozer", "Excavator", "Crane",
      "Forklift", "Skid Steer", "Backhoe", "Harvester", "Combine", "ATV", "Quad Bike", "Snowmobile", "Golf Cart", "Segway",
      "Electric Scooter", "Hoverboard", "Skateboard", "Rollerblades", "Segway", "Electric Bike", "Moped", "Tuk-Tuk", "Rickshaw", "Cable Car",
      "Tram", "Streetcar", "Subway", "Train", "High-Speed Train", "Monorail", "Bullet Train", "Locomotive", "Freight Train", "Passenger Train",
      "Helicopter", "Airplane", "Jet", "Glider", "Seaplane", "Blimp", "Hot Air Balloon", "Spaceship", "Rocket", "Space Shuttle",
      "Boat", "Sailboat", "Yacht", "Canoe", "Kayak", "Rowboat", "Pontoon", "Ferry", "Cruise Ship", "Cargo Ship",
      "Submarine", "Jet Ski", "Speedboat", "Fishing Boat", "Dinghy", "Catamaran", "Hovercraft", "Hydrofoil", "Gondola", "Dragon Boat"
  ],
  "sports": [
      "Soccer", "Basketball", "Tennis", "Baseball", "Cricket", "Golf", "Rugby", "Hockey", "Volleyball", "Badminton",
      "Table Tennis", "American Football", "Australian Football", "Handball", "Softball", "Lacrosse", "Water Polo", "Field Hockey", "Ice Hockey", "Boxing",
      "MMA", "Wrestling", "Judo", "Karate", "Taekwondo", "Fencing", "Archery", "Shooting", "Cycling", "Mountain Biking",
      "BMX", "Track and Field", "Marathon", "Sprinting", "Hurdles", "Long Jump", "High Jump", "Pole Vault", "Shot Put", "Discus Throw",
      "Javelin Throw", "Triathlon", "Decathlon", "Heptathlon", "Swimming", "Diving", "Synchronized Swimming", "Water Skiing", "Surfing", "Windsurfing",
      "Kitesurfing", "Rowing", "Canoeing", "Kayaking", "Sailing", "Rafting", "Climbing", "Bouldering", "Mountaineering", "Skydiving",
      "Paragliding", "Hang Gliding", "Gymnastics", "Rhythmic Gymnastics", "Trampoline", "Figure Skating", "Speed Skating", "Ice Skating", "Skiing", "Snowboarding",
      "Cross-Country Skiing", "Alpine Skiing", "Freestyle Skiing", "Biathlon", "Curling", "Bobsleigh", "Luge", "Skeleton", "Horse Racing", "Equestrian",
      "Polo", "Bull Riding", "Rodeo", "Sumo Wrestling", "Kabaddi", "Sepak Takraw", "Bandy", "Floorball", "Ultimate Frisbee", "Netball",
      "Bowling", "Darts", "Snooker", "Pool", "Chess Boxing", "Arm Wrestling", "Powerlifting", "Weightlifting", "Strongman", "Parkour"
  ],
    "video games" : [
        "Minecraft", "Fortnite", "The Legend of Zelda", "Super Mario 64", "Red Dead Redemption", "The Witcher", "Grand Theft Auto", "Call of Duty", "Cyberpunk 2077", "Elden Ring",
        "Dark Souls", "Sekiro", "Bloodborne", "Halo", "God of War", "Roblox", "Master Blaster", "Battletoads", "Luigi's Mansion", "Arknights",
        "Bloons Tower Defense", "Senran Kagura", "Dead or Alive", "Assassin's Creed", "Skulls and Bones", "Far Cry", "Gears of War", "Fate: Stay/Night", "ATLYSS", "Action 52",
        "Resident Evil", "Hyperdimension Neptunia", "Lethal Company", "Sim City", "Silent Hill", "Dead Space", "Bioshock", "Elder Scrolls", "Borderlands", "Ark",
        "Destiny", "Apex Legends", "Overwatch", "Deadlock", "Valorant", "League of Legends", "Dota", "World of Warcraft", "Final Fantasy", "Atelier",
        "Brotato", "Persona", "Crash Bandicoot", "Danganronpa", "Fire Emblem", "Animal Crossing", "Stardew Valley", "Terraria", "Among Us", "Fall Guys",
        "Rocket League", "FIFA", "Digimon", "Madden NFL", "Guilty Gear", "Tony Hawk's Pro Skater", "Street Fighter", "Mortal Kombat", "Tekken", "Super Smash Bros",
        "Pokemon", "Kid Icarus", "Command and Conquer", "Hearts of Iron", "Crusader Kings", "Monster Hunter", "Garry's Mod", "Ghost of Tsushima", "Death Stranding", "Metal Gear",
        "Metro", "Doom", "Wolfenstein", "Rainbow Six", "BlazBlue", "Mass Effect", "Spyro", "Ookami", "King's Field", "Happy Wheels",
        "Fallout", "Palworld", "Wii Sports", "Super Mario Galaxy", "Kirby", "Diablo", "World of Tanks", "Warframe", "Genshin Impact", "Castlevania"
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
