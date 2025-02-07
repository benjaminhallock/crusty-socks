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
    if (!user?.username) {
      navigate('/');
      return;
    }

    socketManager.connect();
    socketManager.joinLobby(roomId, user.username);
    
    const unsubInit = socketManager.onInitRoom(setGameData);
    const unsubPlayer = socketManager.onPlayerUpdate(players => 
      setGameData(prev => ({ ...prev, players }))
    );
    const unsubMessage = socketManager.onMessage(message =>
      setGameData(prev => ({ ...prev, messages: [...prev.messages, message] }))
    );

    return () => {
      unsubInit();
      unsubPlayer();
      unsubMessage();
    };
  }, []);

  return (
    <div className="min-h-[calc(100vh-4rem)] mx-4 md:mx-8 lg:mx-16">
      <div className="h-full flex flex-col gap-4 py-4">
        <GameStatus 
          gameState={gameData.gameState}
          isRoomLeader={user?.id === gameData.players[0]?.userId}
        />
        <div className="flex-1 flex flex-col lg:flex-row gap-4">
          <div className="flex-1 backdrop-blur-sm rounded-lg shadow flex items-center justify-center">
            <PixelCanvas isDrawer={true} gameState={gameData.gameState} />
          </div>
          <div className="h-[300px] lg:h-auto lg:w-80">
            <ChatBox 
              players={gameData.players}
              messages={gameData.messages}
              roomId={roomId}
              username={user?.username}
            />
          </div>
        </div>
      </div>
    </div>
  );
};

export default GameRoom;
