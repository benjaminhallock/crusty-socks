import { useState, useEffect } from "react";
import { useGameSocket } from "../hooks/useGameSocket";
import { useChatroom } from "../contexts/ChatroomContext";
import PixelCanvas from "./PixelCanvas";
import ChatBox from "./ChatBox";
import PlayersList from "./PlayersList";
import GameStatus from "./GameStatus";

const GameRoom = ({ onError, onDebug = console.log }) => {
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
  const { users, isHost, roomUrl } = useChatroom();
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
    onDebug,
  });

  useEffect(() => {
    if (gameState === "waiting") {
      setLoading(false);
    }
  }, [gameState]);

  useEffect(() => {
    setUsername(localStorage.getItem("username"));
  }, []);

  const handleSettingChange = (setting, value) => {
    if (!isHost) return;
    setSettings(prev => ({
      ...prev,
      [setting]: value
    }));
    gameSocket.emit("updateSettings", { [setting]: value });
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
    return <div>Not connected to server. Attempting to reconnect...</div>;
  }

  return (
    <div className="grid grid-cols-3 gap-3 p-3 h-[calc(100vh-5rem)] max-h-[800px]">
      <div className="col-span-2 flex flex-col h-full gap-3">
        {/* Show lobby settings only when in waiting state and user is host */}
        {gameState === "waiting" && isHost && (
          <div className="bg-white/90 backdrop-blur-sm p-4 rounded-lg">
            <h2 className="text-xl font-bold mb-4">Game Settings</h2>
            <div className="space-y-4">
              <div className="flex items-center gap-4">
                <label className="min-w-[100px]">Round Time:</label>
                <input
                  type="number"
                  value={settings.roundTime}
                  onChange={(e) => handleSettingChange("roundTime", e.target.value)}
                  className="border p-2 rounded"
                  min="30"
                  max="180"
                />
                <span className="text-sm text-gray-500">seconds</span>
              </div>
              
              <div className="flex items-center gap-4">
                <label className="min-w-[100px]">Rounds:</label>
                <input
                  type="number"
                  value={settings.rounds}
                  onChange={(e) => handleSettingChange("rounds", e.target.value)}
                  className="border p-2 rounded"
                  min="1"
                  max="10"
                />
              </div>

              <div className="flex items-center gap-4">
                <label className="min-w-[100px]">Language:</label>
                <select
                  value={settings.language}
                  onChange={(e) => handleSettingChange("language", e.target.value)}
                  className="border p-2 rounded"
                >
                  <option value="en">English</option>
                  <option value="es">Spanish</option>
                  <option value="fr">French</option>
                </select>
              </div>

              <div className="flex flex-col gap-2">
                <label>Custom Words (one per line):</label>
                <textarea
                  value={settings.customWords}
                  onChange={(e) => handleSettingChange("customWords", e.target.value)}
                  className="border p-2 rounded h-24"
                  placeholder="Enter custom words..."
                />
              </div>
            </div>
          </div>
        )}

        <GameStatus
          gameState={gameState}
          players={players}
          countdown={countdown}
          isDrawer={isDrawer}
          currentWord={currentWord}
          currentDrawer={currentDrawer}
          timer={timer}
        />

        {/* Show start game and invite buttons only in waiting state */}
        {gameState === "waiting" && (
          <div className="flex gap-2">
            <button
              onClick={handleStartGame}
              disabled={!isHost || users.length < 2}
              className="px-4 py-2 bg-indigo-600 text-white rounded-lg disabled:opacity-50"
            >
              Start Game
            </button>
            <button
              onClick={copyInviteLink}
              className="px-4 py-2 bg-gray-600 text-white rounded-lg"
            >
              Copy Invite Link
            </button>
          </div>
        )}

        <div className="flex-grow min-h-0 -mb-1">
          <PixelCanvas
            isDrawer={isDrawer}
            gameState={gameState}
            defaultColor="#000000"
          />
        </div>
      </div>
      <div className="flex flex-col h-full gap-3">
        <PlayersList
          players={players}
          currentDrawer={currentDrawer}
          username={username}
          isHost={isHost}
          className="flex-shrink-0"
        />
        <div className="flex-grow min-h-0">
          <ChatBox username={username} />
        </div>
      </div>
    </div>
  );
};

export default GameRoom;
