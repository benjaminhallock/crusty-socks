import { useState, useEffect } from "react";
import PixelCanvas from "./PixelCanvas";
import ChatBox from "./ChatBox";
import UsernameModal from "./UsernameModal";
import { socket } from "../socket";
import { getWordColor } from '../utils/wordColors';

const ROUND_TIME = 60; // seconds

const GameRoom = ({ onError, onDebug = console.log }) => {
  const [username, setUsername] = useState(null);
  const [isDrawer, setIsDrawer] = useState(false);
  const [players, setPlayers] = useState([]);
  const [gameState, setGameState] = useState("waiting"); // waiting, starting, playing, end
  const [timer, setTimer] = useState(ROUND_TIME);
  const [currentWord, setCurrentWord] = useState(null);
  const [countdown, setCountdown] = useState(null);
  const [loading, setLoading] = useState(true);
  const [currentDrawer, setCurrentDrawer] = useState(null); // Add this state
  const [connected, setConnected] = useState(false);
  const [isReady, setIsReady] = useState(false);
  const [playerListStable, setPlayerListStable] = useState([]);
  const [lastDrawer, setLastDrawer] = useState(null);
  const [currentColor, setCurrentColor] = useState('#000000');

  useEffect(() => {
    if (!socket.connected) {
      socket.connect(); // Explicitly connect when component mounts
    }

    const handleConnect = () => {
      onDebug("Socket connected");
      setConnected(true);
      setLoading(false);
    };

    const handleDisconnect = (reason) => {
      onDebug(`Socket disconnected: ${reason}`);
      setConnected(false);
      if (reason === "io server disconnect") {
        socket.connect(); // Reconnect if server disconnected
      }
    };

    const handleConnectError = (error) => {
      onError(`Connection error: ${error.message}`);
      setConnected(false);
    };

    socket.on("connect", handleConnect);
    socket.on("disconnect", handleDisconnect);
    socket.on("connect_error", handleConnectError);

    return () => {
      socket.off("connect", handleConnect);
      socket.off("disconnect", handleDisconnect);
      socket.off("connect_error", handleConnectError);
      socket.disconnect();
    };
  }, []);

  useEffect(() => {
    if (!username || !connected) return;

    try {
      onDebug(`Joining game with username: ${username}`);
      socket.emit("joinGame", { username });

      // Move socket listeners outside of the effect's body
      const handlePlayersList = (playersList) => {
        onDebug("Players list received:", playersList);
        // Only update the player list if we're waiting or it's a score update
        if (gameState === "waiting" || playersList.some((p) => p.score !== 0)) {
          setPlayers(playersList || []);
          setPlayerListStable(playersList || []);
        }
        // Update local ready state based on player status
        const currentPlayer = playersList.find((p) => p.username === username);
        if (currentPlayer && gameState === "waiting") {
          setIsReady(currentPlayer.status === "ready");
        }
      };

      socket.on("playersList", handlePlayersList);
      socket.on("connect_error", (error) =>
        onError(`Connection error: ${error.message}`)
      );
      socket.on("error", (error) => onError(error));

      return () => {
        console.log("Cleaning up socket listeners");
        socket.off("playersList", handlePlayersList);
        socket.off("connect_error");
        socket.off("error");
      };
    } catch (err) {
      onError(`Game room error: ${err.message}`);
    }
  }, [username, connected]); // Remove gameState from dependencies

  // Separate effect for game state changes
  useEffect(() => {
    const handleGameStart = ({ drawer, word }) => {
      setGameState("playing");
      setIsDrawer(drawer.username === username);
      setCurrentDrawer(drawer);
      setTimer(ROUND_TIME);
      setCurrentWord(word);
      setLastDrawer(drawer.username); // Store the current drawer
      setCurrentColor(getWordColor(word)); // Set the color based on the word
    };

    const handleRoundEnd = () => {
      setGameState("end");
      setCurrentWord(null);
      setIsDrawer(false);
      // Don't reset lastDrawer here - it needs to persist between rounds
      setCurrentDrawer(null);
    };

    socket.on("gameStarting", handleGameStart);
    socket.on("timeUpdate", setTimer);
    socket.on("countdown", ({ time }) => {
      setCountdown(time);
      setGameState("countdown");
    });
    socket.on("clearCanvas", () => {
      // Add reference to PixelCanvas to clear it
      if (canvasRef.current) {
        canvasRef.current.clearCanvas();
      }
    });
    socket.on("roundEnd", handleRoundEnd);

    return () => {
      socket.off("gameStarting", handleGameStart);
      socket.off("timeUpdate");
      socket.off("countdown");
      socket.off("clearCanvas");
      socket.off("roundEnd", handleRoundEnd);
    };
  }, [username, lastDrawer]);

  const getPlayerStatus = (player) => {
    if (
      gameState === "playing" &&
      currentDrawer &&
      player.id === currentDrawer.id
    ) {
      return "(Drawing)";
    }
    return "";
  };

  const getGameStatus = () => {
    if (gameState === "waiting") {
      const readyCount = players.filter((p) => p.status === "ready").length;
      return (
        <div className="text-center">
          <h2 className="text-xl mb-2">Waiting for players to ready up</h2>
          <p className="text-indigo-600">
            {readyCount} of {players.length} players ready
          </p>
        </div>
      );
    }

    if (countdown && countdown > 0) {
      return (
        <h2 className="text-2xl font-bold text-indigo-600">
          Game starting in {countdown}...
        </h2>
      );
    }

    if (gameState === "playing") {
      if (isDrawer) {
        return (
          <div className="flex flex-col items-center w-full">
            <h2 className="text-xl mb-2">Draw: {currentWord}</h2>
          </div>
        );
      }
      return (
        <div className="flex flex-col items-center w-full">
          <h2 className="text-xl mb-2">
            {currentDrawer
              ? `${currentDrawer.username} is drawing...`
              : "Waiting for drawer..."}
          </h2>
        </div>
      );
    }

    if (gameState === "end") {
      return (
        <div className="text-center p-4 bg-blue-100 dark:bg-blue-900 rounded text-blue-800 dark:text-blue-200">
          Round finished! Ready up for the next round.
        </div>
      );
    }

    return <h2 className="text-xl">Waiting for players...</h2>;
  };

  const handleReadyToggle = () => {
    const newReadyState = !isReady;
    socket.emit(newReadyState ? "playerReady" : "playerNotReady", { lastDrawer });
    setIsReady(newReadyState);
  };

  console.log("Current game state:", {
    username,
    players,
    gameState,
    isDrawer,
  });

  if (loading) {
    return (
      <div className="text-center text-indigo-600 p-4">
        <div className="animate-pulse">Connecting to server...</div>
      </div>
    );
  }

  if (!connected) {
    return (
      <div className="text-center text-red-600 p-4">
        <div>Not connected to server. Attempting to reconnect...</div>
      </div>
    );
  }

  if (!username) {
    return (
      <UsernameModal
        onSubmit={(name) => {
          try {
            setUsername(name);
          } catch (err) {
            onError(`Failed to set username: ${err.message}`);
          }
        }}
      />
    );
  }

  return (
    <div className="flex gap-8 justify-center min-h-[600px] bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6">
      <div className="text-center flex-1">
        <div className="flex justify-between items-center mb-4 bg-indigo-100 dark:bg-gray-700 p-4 rounded-lg">
          {getGameStatus()}
          {gameState === "playing" && (
            <div className="text-xl font-mono bg-white dark:bg-gray-800 px-4 py-2 rounded-lg text-indigo-600 dark:text-indigo-400">
              {Math.floor(timer / 60)}:
              {(timer % 60).toString().padStart(2, "0")}
            </div>
          )}
        </div>
        <PixelCanvas isDrawer={isDrawer} gameState={gameState} defaultColor={currentColor} />
      </div>
      <div className="flex-1 max-w-md flex flex-col">
        <div className="mb-4 bg-white dark:bg-gray-800 p-4 rounded-lg shadow-lg border-4 border-indigo-300 dark:border-indigo-600">
          <h3 className="font-bold mb-4 text-lg text-indigo-600 dark:text-indigo-400 border-b dark:border-gray-700 pb-2">
            Players
          </h3>
          <div className="space-y-2">
            {playerListStable.map((player) => (
              <div
                key={player.username}
                className={`flex items-center justify-between p-2 rounded ${
                  currentDrawer && player.id === currentDrawer.id
                    ? "bg-indigo-100 dark:bg-gray-700"
                    : ""
                }`}
              >
                <div className="flex items-center gap-2">
                  <span className="font-medium dark:text-gray-200">{player.username}</span>
                  {player.status === "ready" && (
                    <span className="text-green-500 dark:text-green-400">✓</span>
                  )}
                  {currentDrawer && player.id === currentDrawer.id && (
                    <span className="text-sm text-indigo-600 dark:text-indigo-400 font-semibold">
                      (Drawing)
                    </span>
                  )}
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-sm bg-indigo-500 text-white px-2 py-1 rounded-full">
                    {player.score || 0} pts
                  </span>
                  {player.username === username &&
                    (gameState === "waiting" || gameState === "end") && (
                      <button
                        onClick={handleReadyToggle}
                        className={`px-3 py-1 rounded-full text-sm font-medium transition-colors ${
                          isReady
                            ? "bg-green-500 text-white hover:bg-green-600"
                            : "bg-gray-200 text-gray-700 hover:bg-gray-300"
                        }`}
                      >
                        {isReady ? "Ready!" : "Ready?"}
                      </button>
                    )}
                </div>
              </div>
            ))}
          </div>
          {players.length === 1 && (
            <p className="text-sm text-indigo-500 dark:text-indigo-400 mt-4 text-center">
              Waiting for more players to join...
            </p>
          )}
        </div>
        <div className="flex-1">
          <ChatBox username={username} />
        </div>
      </div>
    </div>
  );
};

export default GameRoom;
