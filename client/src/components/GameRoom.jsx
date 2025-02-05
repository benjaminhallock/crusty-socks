import { useState, useEffect } from "react";
import { useGameSocket } from "../hooks/useGameSocket";
import { useChatroom } from "../contexts/ChatroomContext";
import PixelCanvas from "./PixelCanvas";
import ChatBox from "./ChatBox";
import PlayersList from "./PlayersList";
import GameStatus from "./GameStatus";

const GameRoom = ({ onError }) => {
  const [username, setUsername] = useState(null);
  const [isDrawer, setIsDrawer] = useState(false);
  const [players, setPlayers] = useState([]);
  const [gameState, setGameState] = useState("waiting");
  const [timer, setTimer] = useState(60);
  const [currentWord, setCurrentWord] = useState(null);
  const [countdown, setCountdown] = useState(null);
  const [currentDrawer, setCurrentDrawer] = useState(null);
  const [connected, setConnected] = useState(false);
  const [loading, setLoading] = useState(true);

  // New lobby-related state
  const { users, isHost, roomUrl, lobbyState, updateLobbySettings } = useChatroom();
  const [settings, setSettings] = useState({
    roundTime: 60,
    rounds: 3,
    customWords: "",
    language: "en",
  });

  const gameSocket = useGameSocket({
    username,
    setPlayers,
    setGameState,
    setIsDrawer,
    setCurrentDrawer,
    setTimer,
    setCurrentWord,
    setCountdown,
    setConnected,
    setLoading,
    onError,
    onDebug: console.log,
  });

  useEffect(() => {
    if (gameState === "waiting") {
      setLoading(false);
    }
  }, [gameState]);

  useEffect(() => {
    setUsername(localStorage.getItem("username"));
  }, []);

  useEffect(() => {
    if (lobbyState) {
      // Sync local state with lobby state
      setPlayers(lobbyState.players || []);
      setGameState(lobbyState.gameState || "waiting");
      setSettings(lobbyState.settings || {
        roundTime: 60,
        rounds: 3,
        customWords: "",
        language: "en",
      });
    }
  }, [lobbyState]);

  const handleSettingChange = (setting, value) => {
    if (!isHost) return;
    updateLobbySettings({ [setting]: value });
  };

  const handleStartGame = () => {
    if (!isHost) return;
    gameSocket.emit("startGame", settings);
  };

  const copyInviteLink = () => {
    if (!roomUrl) return;
    navigator.clipboard.writeText(roomUrl);
  };

  if (loading) {
    return <div className="text-white">Loading...</div>;
  }

  if (!connected) {
    return <div className="text-white">Connecting to server...</div>;
  }

  return (
    <div className="relative min-h-screen">
      <div className="relative grid grid-cols-3 gap-4 p-4 h-[calc(100vh-5rem)] max-h-[800px]">
        <div className="col-span-2 flex flex-col h-full gap-4">
          <GameStatus
            gameState={gameState}
            players={players}
            countdown={countdown}
            isDrawer={isDrawer}
            currentWord={currentWord}
            currentDrawer={currentDrawer}
            timer={timer}
          />

          {gameState === "waiting" && (
            <div className="flex gap-3">
              <button
                onClick={handleStartGame}
                disabled={!isHost || users.length < 2}
                className="px-4 py-2 bg-indigo-600 text-white rounded-lg disabled:opacity-50 hover:bg-indigo-700 transition-colors"
              >
                Start Game
              </button>
              <button
                onClick={copyInviteLink}
                className="px-4 py-2 bg-gray-700 text-white rounded-lg hover:bg-gray-800 transition-colors"
              >
                Copy Invite Link
              </button>
            </div>
          )}

          <div className="flex-grow min-h-0 bg-white rounded-lg shadow-lg overflow-hidden">
            <PixelCanvas
              isDrawer={isDrawer}
              gameState={gameState}
              defaultColor="#000000"
            />
          </div>
        </div>

        <div className="flex flex-col h-full gap-4">
          <PlayersList
            players={players}
            currentDrawer={currentDrawer}
            username={username}
            isHost={isHost}
            className="flex-shrink-0 bg-white rounded-lg shadow-lg"
          />
          <div className="flex-grow min-h-0 bg-white rounded-lg shadow-lg">
            <ChatBox username={username} />
          </div>
        </div>
      </div>
    </div>
  );
};

export default GameRoom;
