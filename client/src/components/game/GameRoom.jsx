import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";

import ChatBox from "./ChatBox";
import PixelCanvas from "../game/PixelCanvas";
import { socketManager } from "../../services/socket";

const GameRoom = ({ user }) => {
  const { roomId } = useParams();
  const navigate = useNavigate();
  const [gameData, setGameData] = useState({
    players: [],
    gameState: "waiting",
    messages: [],
  });

  useEffect(() => {
    if (!user?.username) {
      navigate("/");
      return;
    }

    socketManager.connect();
    socketManager.joinLobby(roomId, user.username);

    const unsubPlayer = socketManager.onPlayerUpdate((players) =>
      setGameData((prev) => ({ ...prev, players }))
    );
    const unsubMessage = socketManager.onMessage((message) =>
      setGameData((prev) => ({
        ...prev,
        messages: [...prev.messages, message],
      }))
    );

    return () => {
      unsubPlayer();
      unsubMessage();
    };
  }, [navigate, roomId, user]);

  const handleInviteLink = () => {
    navigator.clipboard.writeText(window.location.href);
  };

  return (
    <div className="min-h-[calc(100vh-4rem)] mx-4 md:mx-8 lg:mx-16">
      <div className="h-full flex flex-col gap-4 py-4">
        <div className="w-full p-4 bg-white/90 backdrop-blur-sm rounded-lg shadow">
          <div className="flex justify-between items-center">
            <h2 className="text-2xl font-semibold text-gray-800 dark:text-black mx-2">
              {gameData.gameState === "waiting"
                ? "Waiting for players..."
                : gameData.gameState === "playing"
                ? "Game in progress"
                : gameData.gameState === "finished"
                ? "Game Over"
                : "Loading..."}
            </h2>
            <button 
              onClick={handleInviteLink} 
              className="bg-indigo-600 text-white px-4 py-2 rounded-lg"
            >
              Invite Link
            </button>
          </div>
        </div>
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
