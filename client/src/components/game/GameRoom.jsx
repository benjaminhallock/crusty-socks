import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";

import ChatBox from "./ChatBox";
import PixelCanvas from "../game/PixelCanvas";
import { socketManager } from "../../services/socket";
import HiddenWord from "./HiddenWord";

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

  return (
    <div className="min-h-[calc(100vh-4rem)] mx-4 md:mx-8 lg:mx-16">
      <div className="h-full flex flex-col gap-4 py-4">
        <HiddenWord />
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
              showInviteButton={true}
            />
          </div>
        </div>
      </div>
    </div>
  );
};

export default GameRoom;
