import { useState, useEffect } from "react";
import { useParams } from "react-router-dom";
import PixelCanvas from "./PixelCanvas";
import ChatBox from "./ChatBox";
import PlayersList from "./helpers/PlayersList";
import GameStatus from "./helpers/GameStatus";
import { fetchLobby } from "../services/auth";
import { socket } from "../services/socket";

function GameRoom() {
  const { roomId } = useParams(); // grab the roomId from the URL
  const [players, setPlayers] = useState([]);
  const [gameState, setGameState] = useState("waiting");
  const [messages, setMessages] = useState([]);

  useEffect(() => {
    // Fetch initial lobby data
    const getLobbyData = async () => {
      try {
        const res = await fetchLobby(roomId);
        if (res.success) {
          console.log("Fetched lobby data: ", res.lobby);
          setPlayers(res.lobby?.players);
          setGameState(res.lobby?.gameState);
          setMessages(res.lobby?.messages);
        } else {
          console.error("Failed to fetch lobby:", res.message);
        }
      } catch (error) {
        console.error("Error fetching lobby:", error);
      }
    };

    void getLobbyData();
    // Setup socket listeners
    socket.on("playerUpdate", (updatedPlayers) => {
      setPlayers(updatedPlayers);
    });

    socket.on("gameStateUpdate", (updatedState) => {
      setGameState(updatedState);
    });

    // Cleanup function
    return () => {
      socket.emit("leaveRoom", roomId);
      socket.off("playerUpdate");
      socket.off("gameStateUpdate");
    };
  }, [roomId]);

  return (
    <div className="container mx-auto min-h-screen pt-20 px-4">
      <div className="flex flex-col h-[calc(100vh-5rem)] max-w-7xl mx-auto">
        <div className="flex-1 flex flex-col gap-4">
          <GameStatus gameState={gameState} />
          <div className="flex flex-1 gap-4 min-h-0">
            <div className="flex-1 bg-white/90 backdrop-blur-sm rounded-lg shadow-lg overflow-hidden">
              <PixelCanvas />
            </div>
            <div className="w-96 flex-shrink-0 bg-white/90 backdrop-blur-sm rounded-lg shadow-lg">
              <ChatBox players={players} messages={messages} />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default GameRoom;
