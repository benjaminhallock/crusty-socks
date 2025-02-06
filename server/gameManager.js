import lobby from "./models/lobby.js";

export class GameManager {
  constructor(io) {
    this.games = {};
    this.io = io;
  }
  initialize() {
    this.io.on("connection", (socket) => {
      console.log("[SERVER] 🚀 New connection:", socket.id);
      socket.on("joinLobby", (lobbyId) => {
        socket.join(lobbyId);
        const game = this.getGame(lobbyId);
        if (!game) {
          const newGame = {
            players: [],
            status: "waiting",
            currentRound: 0,
          };
          this.createGame(lobbyId, newGame);
        }
      });

      socket.on("leaveLobby", (lobbyId) => {
        socket.leave(lobbyId);
        const game = this.getGame(lobbyId);
        if (game && game.players.length === 0) {
          this.deleteGame(lobbyId);
        }
      });
    });
  }

  createGame(gameId, game) {
    this.games[gameId] = game;
  }

  getGame(gameId) {
    return this.games[gameId];
  }

  deleteGame(gameId) {
    delete this.games[gameId];
  }
}
