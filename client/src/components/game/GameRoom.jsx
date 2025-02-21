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
    canvasState: null,
    timeLeft: 60,
  });

  useEffect(() => {
    let isMounted = true;
    socketManager.connect(user);

    const fetchData = async () => {
      try {
        const response = await fetchLobby(roomId);
        if (isMounted) {
          if (!response.success) {
            navigate("/");
          } else {
            console.log("Fetched lobby data:", response.lobby);
            setLobbyId(response.lobby.roomId);
            socketManager.joinLobby(response.lobby.roomId, user.username);
            
            // Immediately update game state with fetched data
            setGameData(prevData => ({
              ...prevData,
              gameState: response.lobby.gameState,
              currentDrawer: response.lobby.currentDrawer,
              currentWord: response.lobby.currentWord,
              maxRounds: response.lobby.maxRounds,
              revealCharacters: response.lobby.revealCharacters,
              selectWord: response.lobby.selectWord,
              selectCategory: response.lobby.selectCategory,
              playerLimit: response.lobby.playerLimit,
              players: response.lobby.players,
              messages: response.lobby.messages,
              canvasState: response.lobby.canvasState,
              timeLeft: response.lobby.timeLeft || 60,
              currentRound: response.lobby.currentRound
            }));

            // Set up socket listeners for updates
            socketManager.onGameStateUpdate((data) => {
              if (data.lobby) {
                setGameData(prevData => ({
                  ...prevData,
                  ...data.lobby
                }));
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

  // Timer effect
  useEffect(() => {
    let timer;
    if (gameData.gameState === GAME_STATE.DRAWING && gameData.timeLeft > 0) {
      timer = setInterval(() => {
        setGameData(prev => {
          const newTimeLeft = prev.timeLeft - 1;
          if (newTimeLeft <= 0) {
            socketManager.timeUp(roomId);
          }
          return {
            ...prev,
            timeLeft: newTimeLeft
          };
        });
      }, 1000);
    }

    return () => clearInterval(timer);
  }, [gameData.gameState, gameData.timeLeft, roomId]);

  return (
    <div className="min-h-[calc(100vh-4rem)] mx-4 md:mx-8 lg:mx-16">
      <div className="h-full flex flex-col gap-1 py-1">
        <HiddenWord
          word={gameData.currentWord}
          isDrawing={gameData.currentDrawer === user.username}
          isRevealing={gameData.revealCharacters}
          gameState={gameData.gameState}
          timeLeft={gameData.timeLeft}
        />
        <div className="flex-1 flex flex-col lg:flex-row gap-1">
          <div className="lg:w-72 flex flex-col">
            <PlayerList
              players={gameData.players}
              drawerUsername={gameData.currentDrawer}
              roomId={lobbyId}
            />
          </div>

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
                canvasState={gameData.canvasState}
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
              gameState={gameData.gameState}
            />
          </div>
        </div>
      </div>
    </div>
  );
};

export default GameRoom;
