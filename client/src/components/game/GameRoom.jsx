import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";

import ChatBox from "./ChatBox";
import HiddenWord from "./HiddenWord";
import PixelCanvas from "../game/PixelCanvas";
import { socketManager } from "../../services/socket";
import PlayerList from "./PlayerList";

const GameRoom = ({ user }) => {
  const { roomId } = useParams();
  const navigate = useNavigate();
  const [gameData, setGameData] = useState({
    players: [],
    playerLimit: 0,
    revealCharacters: false,
    currentRound: 0,
    maxRounds: 3,
    selectWord: false,
    selectCategory: false,
    gameState: "waiting",
    messages: [],
    word: "",
    roomLeader: "",
    currentDrawer: "",
  });

  useEffect(() => {
    if (!user?.username) {
      navigate("/");
      return;
    }

    socketManager.connect();
    socketManager.joinLobby(roomId, user.username);

    socketManager.socket.on("gameStateUpdate", (gameState) => {
      setGameData((prev) => ({ ...prev, gameState }));
    });

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
      <div className="h-full flex flex-col gap-1 py-1">
        <HiddenWord word={gameData.word} />
        <div className="flex-1 flex flex-col lg:flex-row gap-1">
          <div className="lg:w-72">
            <PlayerList players={gameData.players} />
          </div>
          <div className="flex-1 backdrop-blur-sm rounded-lg shadow flex items-center justify-center">
            <PixelCanvas isDrawer={true} gameState={gameData.gameState} />
          </div>
          <div className="lg:w-72">
            <ChatBox
              user={user} 
              roomId={roomId} 
              messages={gameData.messages} 
              players={gameData.players} 
            />
          </div>
        </div>
      </div>
    </div>
  );
};

export default GameRoom;
