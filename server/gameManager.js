//NOT USED YET
export class GameManager {
  constructor(io) {
    this.io = io;
    this.ROUND_TIME = 60;
    this.COUNTDOWN_TIME = 5;
    this.WORDS = [
      "cat", "dog", "house", "tree", "car", "sun", "moon", "fish", "bird",
      "star", "flower", "robot", "pizza", "boat", "cloud", "beach", "chair",
      "plane", "train", "snake", "apple", "heart", "smile", "hat", "ball",
      "clock", "drum", "shoe", "bread", "book"
    ];
    // this.CATEGORIES = {
    //   nature: ["grass", "flower", "tree", "jungle", "beach", "ocean", "breeze", "cat", "dog", "ladybug",
    //     "beetle", "worm", "twig", "mountain", "deer", "vines", "apple", "plum", "walnut", "squirrel", "dolphin", "elephant", "panda",
    //     "iguana", "monkey", "rose", "lilly", "sunflower", "rock", "cactus"],
    //   fantasy: ["ogre", "wizard", "king", "queen", "magic", "witchcraft", "crystal ball", "talking donkey", "dragon", "castle", "knight", "dimension",
    //     "wand", "evil", "angel", "demon", "monster", "vampire", "werewolf", "mermaid", "gauntlet", "ruby", "emerald", "miner", "quest", "pyramid", "sphinx", "dungeon",
    //     "darkness", "plasma", "genie"],
    //   sports: ["basketball", "hockey", "baseball", "sweeping", "volleyball", "billiards", "shoes", "gloves", "shorts", "jersey", "ball", "puck", "frisbee"
    //     , "golf", "coach", "bench", "hoop", "goalie", "soccer", "penalty", "quarterback", "champions", "winner", "loser", "celebration", "field", "rink", "court",
    //     "announcer", "points", "dribble", "outdoors", "indoors", "angry", "happy", "sad", "athlete", "celebrity"],
    //   theater:
    //       ["theater", "movie", "actor", "director", "script", "scene", "shrek", "oz", "costume", "prop", "stage", "musical",
    //         "broadway", "hollywood", "oscar", "reel", "clapperboard", "pixar", "disney", "marvel", "hobbit", "titanic",
    //         "villain", "hero", "trailer", "popcorn", "spotlight", "comedy", "drama", "horror", "improv",
    //         "monologue", "dialogue", "stunt", "audition", "choreography", "makeup", "backstage", "playbill",
    //         "sequel", "remake", "animation", "blockbuster", "cameo", "cinematography", "effects", "vader", "potter",
    //         "gollum", "batman", "joker", "forrest", "elsa", "woody", "indiana", "thanos", "thor", "stones", "donkey"],
    //   silly: ["goofy", "wacky", "zany", "banana", "slapstick", "quirky", "absurd", "wiggle", "bloop", "boing", "peculiar",
    //     "flubber", "offbeat", "loopy", "bonkers", "guffaw", "snort", "chuckle", "squiggle", "unusual", "quack", "blunder",
    //     "splat", "boop", "scoot", "wonky", "goober", "dizzy", "puddle", "plop", "awkward", "burp", "sneeze", "hiccup",
    //     "oddball", "snoot", "snicker", "bubble", "jittery", "gloop", "wobble", "squishy", "lumpy", "dork", "prank",
    //     "whomp", "kazoo", "fumble", "giddy", "eccentric", "yeet", "bruh", "shrek", "sus", "derp", "oof", "pog", "vibe",
    //     "chonk", "cringe", "based", "boi", "nope", "zoomer", "rekt"],
    //   space:
    //       ["galaxy", "orbit", "nebula", "cosmos", "meteor", "comet", "asteroid", "supernova", "blackhole", "wormhole",
    //         "gravity", "telescope", "spaceship", "rocket", "astronaut", "satellite", "lunar", "solar", "eclipse",
    //         "starlight", "constellation", "planet", "exoplanet", "moon", "sun", "venus", "mars", "jupiter", "saturn",
    //         "uranus", "neptune", "pluto", "milkyway", "andromeda", "aliens", "extraterrestrial", "stars", "spacewalk",
    //         "floating", "spacesuit", "astronomy", "bigbang", "quasar", "pulsar", "eventhorizon", "spaceshuttle",
    //         "stardust", "terraform", "cryovolcano", "rover", "ufo", "moonbase", "shuttle"]
    // };
    // potential categories, needs to be integrated into the UI as a dropdown select
    // **AI generated words based on category selection is still in question, yet to be developed**
    
    this.players = [];
    this.currentDrawer = null;
    this.currentWord = null;
    this.timer = null;
    
    this.gameState = {
      currentDrawing: Array(100 * 80).fill("#FFFFFF"),
      currentDrawer: null,
      messages: [],
      word: "",
      status: "waiting",
      countdownTime: this.COUNTDOWN_TIME,
      readyPlayers: new Set(),
      roundInProgress: false,
    };
  }

  createLobby(socket, username) {
    
  }

  addPlayer(socket, username) {
    const existingPlayer = this.players.find(
      (p) => p.username === username || p.id === socket.id
    );

    if (existingPlayer) {
      return false;
    }

    const newPlayer = {
      id: socket.id,
      username,
      score: 0,
      status: "not-ready",
    };

    this.players.push(newPlayer);
    this.io.emit("playersList", this.players);
    return true;
  }

  removePlayer(socketId) {
    const disconnectedPlayer = this.players.find((p) => p.id === socketId);
    if (disconnectedPlayer) {
      this.players = this.players.filter((p) => p.id !== socketId);
      if (this.currentDrawer?.id === socketId) {
        this.endRound();
      }
      this.io.emit("playersList", this.players);
      this.gameState.readyPlayers.delete(socketId);
      this.players.forEach((p) => (p.status = "not-ready"));
      this.io.emit("playersList", this.players);
    }
  }

  handlePlayerReady(socketId) {
    if (this.gameState.roundInProgress) return;

    const player = this.players.find((p) => p.id === socketId);
    if (player) {
      player.status = "ready";
      this.io.emit("playersList", this.players);

      const allReady = this.players.every((p) => p.status === "ready");
      const minPlayers = this.players.length >= 2;

      if (allReady && minPlayers && this.gameState.status === "waiting") {
        this.startNewRound();
      }
    }
  }

  handlePlayerNotReady(socketId) {
    if (this.gameState.roundInProgress) return;

    const player = this.players.find((p) => p.id === socketId);
    if (player) {
      player.status = "not-ready";
      this.io.emit("playersList", this.players);
    }
  }

  handleDraw(socket, data) {
    if (this.gameState.status !== "playing" || socket.id === this.currentDrawer?.id) {
      socket.broadcast.emit("drawUpdate", data);
      this.gameState.currentDrawing[data.index] = data.color;
    }
  }

  handleGuess(user, message) {
    if (this.currentWord && message.toLowerCase() === this.currentWord.toLowerCase()) {
      const guesser = this.players.find((p) => p.username === user);
      if (guesser && guesser.id !== this.currentDrawer.id) {
        guesser.score += 10;
        this.currentDrawer.score += 5;
        this.io.emit("correctGuess", { winner: user, word: this.currentWord });
        this.io.emit("playersList", this.players);
        this.endRound();
      }
    } else {
      this.io.emit("chatMessage", { user, message });
    }
  }

  startNewRound() {
    this.gameState.status = "countdown";
    this.gameState.countdownTime = this.COUNTDOWN_TIME;
    this.io.emit("countdown", { time: this.COUNTDOWN_TIME });

    const countdownTimer = setInterval(() => {
      this.gameState.countdownTime--;
      this.io.emit("countdown", { time: this.gameState.countdownTime });

      if (this.gameState.countdownTime <= 0) {
        clearInterval(countdownTimer);
        this.startGame();
      }
    }, 1000);
  }

  startGame() {
    this.gameState.status = "playing";
    this.currentDrawer = this.players[Math.floor(Math.random() * this.players.length)];
    this.gameState.currentDrawer = this.currentDrawer;
    this.currentWord = this.WORDS[Math.floor(Math.random() * this.WORDS.length)];
    this.gameState.word = this.currentWord;

    this.io.emit("gameStarting", {
      drawer: this.currentDrawer,
      word: this.currentWord,
    });

    let timeLeft = this.ROUND_TIME;
    this.timer = setInterval(() => {
      timeLeft--;
      this.io.emit("timeUpdate", timeLeft);
      if (timeLeft <= 0) {
        this.endRound();
      }
    }, 1000);
  }

  endRound() {
    clearInterval(this.timer);
    this.gameState.roundInProgress = false;
    this.io.emit("roundEnd", { word: this.currentWord, drawer: this.currentDrawer });
    this.currentDrawer = null;
    this.gameState.currentDrawer = null;
    this.currentWord = null;
    this.gameState.word = "";
    this.gameState.status = "waiting";

    this.players.forEach((p) => (p.status = "not-ready"));
    this.io.emit("playersList", this.players);
  }

  getCurrentDrawing() {
    return this.gameState.currentDrawing;
  }
}
