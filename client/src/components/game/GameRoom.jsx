import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";

import ChatBox from "./ChatBox";
import HiddenWord from "./HiddenWord";
import PlayerList from "./PlayerList";
import PixelCanvas from "./PixelCanvas";
import { fetchLobby } from "../../services/auth";
import { socketManager } from "../../services/socket";
import { GAME_STATE } from "../../../../shared/constants";

const GameRoom = ({ user }) => {
  const { roomId } = useParams();
  const [lobbyId, setLobbyId] = useState();
  const navigate = useNavigate();
  const [gameData, setGameData] = useState({
    players: [],
    playerLimit: 0,
    revealCharacters: false,
    currentRound: 0,
    maxRounds: 3,
    selectWord: false,
    selectCategory: false,
    gameState: GAME_STATE.WAITING, // Ensure this is explicitly set
    messages: [],
    currentWord: "",
    currentDrawer: "",
  });

  useEffect(() => {
    let isMounted = true;

    const fetchData = async () => {
      try {
        const response = await fetchLobby(roomId);
        if (isMounted) {
          if (!response.success) {
            navigate("/");
          } else {
            const updatedGameData = {
              ...response.lobby,
              gameState: response.lobby.gameState || GAME_STATE.WAITING, // Ensure gameState is set
            };
            setGameData(updatedGameData);
            setLobbyId(response.lobby.roomId);
            socketManager.joinLobby(response.lobby.roomId, user.username);
            socketManager.onGameStateUpdate((data) => {
              if (data.lobby.gameState) {
                gameData.gameState = data.lobby.gameState;
                gameData.currentDrawer = data.lobby.currentDrawer;
                gameData.currentWord = data.lobby.currentWord;
                gameData.maxRounds = data.lobby.maxRounds;
                gameData.revealCharacters = data.lobby.revealCharacters;
                gameData.selectWord = data.lobby.selectWord;
                gameData.selectCategory = data.lobby.selectCategory;
                gameData.playerLimit = data.lobby.playerLimit;
                gameData.players = data.lobby.players;
                gameData.messages = data.lobby.messages;
                setGameData({ ...gameData });
              }
            });
          }
        }
      } catch (error) {
        console.error("Failed to fetch lobby data:", error);
        navigate("/");
      }
    };

    fetchData();

    return () => {
      isMounted = false;
    };
  }, [roomId, navigate, user.username]);

  return (
    <div className="min-h-[calc(100vh-4rem)] mx-4 md:mx-8 lg:mx-16">
      <div className="h-full flex flex-col gap-1 py-1">
        <HiddenWord
          word={gameData.currentWord}
          isDrawing={gameData.currentDrawer === user.username}
          isRevealing={gameData.revealCharacters}
          gameState={gameData.gameState}
        />
        <div className="flex-1 flex flex-col lg:flex-row gap-1">
          <div className="lg:w-72 flex flex-col">
            <PlayerList
              players={gameData.players}
              drawerUsername={gameData.currentDrawer}
              roomId={lobbyId}
            />
          </div>

          {console.log("gameData.gameState", gameData.gameState)}

          {gameData.gameState === GAME_STATE.WAITING && (
            <div className="flex-1 text-center">
              <p>Waiting for players to join...</p>
            </div>
          )}

          {gameData.gameState === GAME_STATE.PICKING_WORD &&
            (gameData.currentDrawer === user.username ? (
              <div className="flex-1 text-center">
                <p>It's your turn to draw! Please pick a word.</p>
                { gameData.currentWord.split(",").map((word, index) => (
                  <button
                    key={index}
                    className="m-2 px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 height:100px"
                    onClick={() =>
                      socketManager.selectWord(roomId, word.trim())
                    }
                  >
                    {word.trim()}
                  </button>
                ))}
              </div>
            ) : (
              <div className="flex-1 text-center">
                <p>Waiting for the drawer to pick a word...</p>
                <button className="m-2 px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600">
                </button>
                <button className="m-2 px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600">
                </button>
                <button className="m-2 px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600">
                </button>
              </div>
            ))}

          {gameData.gameState === GAME_STATE.DRAWING && (
            <div className="flex-1 backdrop-blur-sm rounded-lg shadow flex items-center justify-center">
              <PixelCanvas
                drawerUsername={gameData.currentDrawer}
                isDrawer={gameData.currentDrawer === user.username}
              />
            </div>
          )}

          {gameData.gameState === GAME_STATE.FINISHED && (
            <div className="flex-1 text-center">
              <p>Game Over! Thanks for playing!</p>
            </div>
          )}

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
