import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import PixelCanvas from "./PixelCanvas";
import ChatBox from "./ChatBox";
import GameStatus from "./helpers/GameStatus";
import { fetchLobby } from "../services/auth";
import { socketManager } from "../services/socket";

function GameRoom({ user }) {
  const { roomId } = useParams();
  const navigate = useNavigate();
  const [gameData, setGameData] = useState({
    players: [],
    gameState: "waiting",
    messages: [],
    isLoading: true,
    error: null
  });

  useEffect(() => {
    // Validate user has required fields
    if (!user?.username || !user?.id) {
      navigate('/');
      return;
    }

    socketManager.joinLobby(roomId, user.username, user.id);
    localStorage.setItem('currentRoom', roomId);

    const unsubscribe = socketManager.subscribe((data) => {
      setGameData(prev => ({
        ...prev,
        ...data,
        isLoading: false
      }));
    });

    return () => {
      localStorage.removeItem('currentRoom');
      if (user?.id) {
        socketManager.leaveLobby(roomId, user.id);
      }
      unsubscribe();
    };
  }, [roomId, navigate, user]);

  // Show loading state
  if (gameData.isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        Loading game...
      </div>
    );
  }

  // Show error state
  if (gameData.error) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="bg-red-50 p-4 rounded-lg text-red-600">
          {gameData.error}
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto min-h-screen pt-20 px-4">
      <div className="flex flex-col h-[calc(100vh-5rem)] max-w-7xl mx-auto">
        <div className="flex-1 flex flex-col gap-4">
          {/* Game status bar */}
          <GameStatus 
            gameState={gameData.gameState} 
            onStartGame={() => {}} // TODO: Implement through socketManager
            isRoomLeader={user?.isAdmin} 
          />

          <div className="flex flex-1 gap-4 min-h-0">
            {/* Drawing canvas */}
            <div className="flex-1 bg-white/90 backdrop-blur-sm rounded-lg shadow-lg overflow-hidden">
              <PixelCanvas 
                isDrawer={user?.isAdmin} 
                gameState={gameData.gameState} 
              />
            </div>
            
            {/* Chat and players list */}
            <div className="w-96 flex-shrink-0 bg-white/90 backdrop-blur-sm rounded-lg shadow-lg">
              <ChatBox 
                players={gameData.players} 
                messages={gameData.messages} 
                roomId={roomId} 
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default GameRoom;
