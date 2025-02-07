import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import PixelCanvas from "./PixelCanvas";
import ChatBox from "./ChatBox";
import GameStatus from "./helpers/GameStatus";
import { socketManager } from "../services/socket";

const GameRoom = ({ user }) => {
  const { roomId } = useParams();
  const navigate = useNavigate();
  const [gameData, setGameData] = useState({
    players: [],
    gameState: "waiting",
    messages: []
  });

  useEffect(() => {
    if (!user?.username || !user?.id) {
      navigate('/');
      return;
    }

    socketManager.joinLobby(roomId, user.username, user.id);
    localStorage.setItem('currentRoom', roomId);

    const cleanup = socketManager.subscribe(setGameData);

    return () => {
      localStorage.removeItem('currentRoom');
      if (user?.id) {
        socketManager.leaveLobby(roomId, user.id);
      }
      cleanup();
    };
  }, [roomId, user, navigate]);

  const isRoomLeader = user?.id === gameData.players[0]?.userId;

  return (
    <div className="container mx-auto min-h-screen pt-20 px-4">
      <div className="flex flex-col h-[calc(100vh-5rem)] max-w-7xl mx-auto gap-4">
        <GameStatus 
          gameState={gameData.gameState}
          isRoomLeader={isRoomLeader}
        />
        
        <div className="flex flex-1 gap-4 min-h-0">
          <div className="flex-1 bg-white/90 backdrop-blur-sm rounded-lg shadow-lg overflow-hidden">
            <PixelCanvas 
              isDrawer={user?.isAdmin}
              gameState={gameData.gameState}
            />
          </div>
          <div className="w-96 flex-shrink-0">
            <ChatBox 
              players={gameData.players}
              messages={gameData.messages}
              roomId={roomId}
            />
          </div>
        </div>
      </div>
    </div>
  );
};

export default GameRoom;
