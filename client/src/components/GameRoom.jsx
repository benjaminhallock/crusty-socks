import { useState } from "react";
import PixelCanvas from "./PixelCanvas";
import ChatBox from "./ChatBox";
import UsernameModal from "./UsernameModal";
import PlayersList from "./PlayersList";
import GameStatus from "./GameStatus";
import { useGameSocket } from "../hooks/useGameSocket";
import { getWordColor } from '../utils/wordColors';

const GameRoom = ({ onError, onDebug = console.log }) => {
  const [username, setUsername] = useState(null);
  const [isDrawer, setIsDrawer] = useState(false);
  const [players, setPlayers] = useState([]);
  const [gameState, setGameState] = useState("waiting");
  const [timer, setTimer] = useState(60);
  const [currentWord, setCurrentWord] = useState(null);
  const [countdown, setCountdown] = useState(null);
  const [loading, setLoading] = useState(true);
  const [currentDrawer, setCurrentDrawer] = useState(null);
  const [connected, setConnected] = useState(false);
  const [isReady, setIsReady] = useState(false);
  const [currentColor, setCurrentColor] = useState('#000000');

  const socket = useGameSocket({
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
    onDebug
  });

  const handleReadyToggle = () => {
    const newReadyState = !isReady;
    socket.emit(newReadyState ? "playerReady" : "playerNotReady");
    setIsReady(newReadyState);
  };

  if (loading) {
    return <div className="text-center text-indigo-600 p-4">
      <div className="animate-pulse">Connecting to server...</div>
    </div>;
  }

  if (!connected) {
    return <div className="text-center text-red-600 p-4">
      <div>Not connected to server. Attempting to reconnect...</div>
    </div>;
  }

  if (!username) {
    return <UsernameModal onSubmit={setUsername} />;
  }

  return (
    <div className="flex gap-8 justify-center min-h-[600px] bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6">
      <div className="text-center flex-1">
        <div className="flex justify-between items-center mb-4 bg-indigo-100 dark:bg-gray-700 p-4 rounded-lg">
          <GameStatus
            gameState={gameState}
            players={players}
            countdown={countdown}
            isDrawer={isDrawer}
            currentWord={currentWord}
            currentDrawer={currentDrawer}
            timer={timer}
          />
        </div>
        <PixelCanvas 
          isDrawer={isDrawer} 
          gameState={gameState} 
          defaultColor={currentColor} 
        />
      </div>
      <div className="flex-1 max-w-md flex flex-col">
        <PlayersList
          players={players}
          currentDrawer={currentDrawer}
          username={username}
          gameState={gameState}
          isReady={isReady}
          onReadyToggle={handleReadyToggle}
        />
        <div className="flex-1">
          <ChatBox username={username} />
        </div>
      </div>
    </div>
  );
};

export default GameRoom;
