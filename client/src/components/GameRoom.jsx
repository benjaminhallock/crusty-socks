import { useState, useEffect } from "react";
import { useGameSocket } from "../hooks/useGameSocket";
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
    if (gameState === "end") {
      setLoading(true);
    }
  }, [gameState]);

  useEffect(() => {
    if (gameState === "waiting") {
      setLoading(false);
    }
  }, [gameState]);

  useEffect(() => {
    setUsername(localStorage.getItem("username"));
  }, []);

  if (loading) {
    return <div className="text-white">Loading...</div>;
  }

  if (!connected) {
    return <div>Not connected to server. Attempting to reconnect...</div>;
  }

  return (
    <div className="grid grid-cols-3 gap-3 p-3 h-[calc(100vh-5rem)] max-h-[800px]">
      <div className="col-span-2 flex flex-col h-full gap-3">
        <GameStatus
          gameState={gameState}
          players={players}
          countdown={countdown}
          isDrawer={isDrawer}
          currentWord={currentWord}
          currentDrawer={currentDrawer}
          timer={timer}
        />
        <div className="flex-grow min-h-0 -mb-1">
          <PixelCanvas isDrawer={isDrawer} gameState={gameState} defaultColor="#000000" />
        </div>
      </div>
      <div className="flex flex-col h-full gap-3">
        <PlayersList
          players={players}
          currentDrawer={currentDrawer}
          username={username}
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
