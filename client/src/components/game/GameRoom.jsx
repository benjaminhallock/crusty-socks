import { useEffect, useState, useRef } from "react";
import { useNavigate, useParams } from "react-router-dom";

import ChatBox from "./ChatBox";
import HiddenWord from "./HiddenWord";
import PlayerList from "./PlayerList";
import PixelCanvas from "./PixelCanvas";
import GameSettings from "./GameSettings";
import { fetchLobby } from "../../services/auth";
import { socketManager } from "../../services/socket.js";
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
    startTime: null,
    roundTime: 60,
    timeLeft: 0,
    isTimerRunning: false,
  });

  // Flag to track if the timer has already been completed, hopefully this solves the timer ending twice
  const isTimerCompleted = useRef(false);

  //Runs on component mount
  // Fetch lobby data and set up socket listeners
  useEffect(() => {
    let isMounted = true;

    // Ensure socket is connected
    if (!socketManager.isConnected()) {
      socketManager.connect(user);
    }

    // Fetch lobby data with api call, grabs lobbyId from url
    const fetchData = async () => {
      try {
        const response = await fetchLobby(roomId);
        if (isMounted) {
          if (!response.success) {
            navigate("/");
          } else {
            console.log("Fetched lobby data:", response.lobby);
            setLobbyId(response.lobby.roomId);
            // Join the lobby via socket
            socketManager.joinLobby(response.lobby.roomId, user.username);
            // Immediately update game state with fetched data
            setGameData((prevData) => ({
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
              startTime: response.lobby.startTime,
              roundTime: response.lobby.roundTime,
              currentRound: response.lobby.currentRound,
            }));

            // Set up socket listeners for updates
            socketManager.onGameStateUpdate((data) => {
              if (data.lobby) {
                setGameData((prevData) => ({
                  ...prevData,
                  ...data.lobby,
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

      socketManager.offGameStateUpdate();
    };
  }, [roomId, navigate, user]);

  useEffect(() => {
    if (gameData.gameState === GAME_STATE.DRAWING) {
      const totalTime = gameData.roundTime * 1000; // Convert to milliseconds
      const startTime = gameData.startTime ? new Date(gameData.startTime).getTime() : Date.now();
      const endTime = startTime + totalTime;

      const timer = setInterval(() => {
        const now = Date.now();
        const timeLeft = Math.max(0, endTime - now); 
        const timeLeftInSeconds = Math.ceil(timeLeft / 1000); // Convert to seconds

        console.log("Time left:", timeLeftInSeconds);

        // Check if the timer has completed
        if (timeLeft <= 0 && !isTimerCompleted.current) {
          isTimerCompleted.current = true;
          socketManager.endRound(lobbyId);
          clearInterval(timer);
        }

        setGameData((prevData) => ({
          ...prevData,
          timeLeft: timeLeftInSeconds || 0,
          isTimerRunning: timeLeft > 0,
        }));
      }, 1000); // Add interval time (1 second)
      
      return () => clearInterval(timer);
    }
  }, [gameData.gameState, gameData.startTime, gameData.roundTime, lobbyId]);

  return (
    <div className="min-h-[calc(100vh-4rem)] mx-4 md:mx-8 lg:mx-16 dark:bg-gray-900 transition-colors">
      <div className="h-full flex flex-col gap-1 py-1">
        <HiddenWord
          word={gameData.currentWord}
          isDrawing={gameData.currentDrawer === user.username}
          isRevealing={gameData.revealCharacters}
          gameState={gameData.gameState}
          timeLeft={gameData.timeLeft}
          rounds={gameData.currentRound}
          maxRounds={gameData.maxRounds}
        />
        <div className="flex-1 flex flex-col lg:flex-row gap-1">
          <div className="lg:w-72 flex flex-col">
            <PlayerList
              players={gameData.players}
              drawerUsername={gameData.currentDrawer}
              roomId={lobbyId}
              gameState={gameData.gameState}
            />
            {/* Add game settings display */}
            <GameSettings
              revealCharacters={gameData.revealCharacters}
              maxRounds={gameData.maxRounds}
              selectWord={gameData.selectWord}
              selectCategory={gameData.selectCategory}
              playerLimit={gameData.playerLimit}
            />
          </div>

          {gameData.gameState === GAME_STATE.WAITING && (
            <div className="flex-1 flex items-center justify-center dark:text-white"></div>
          )}

          {gameData.gameState === GAME_STATE.PICKING_WORD &&
            (gameData.currentDrawer === user.username ? (
              <div className="flex-1 flex flex-col items-center justify-center">
                <p className="text-2xl font-bold mb-6 text-white">
                  It's your turn to draw! Please pick a word.
                </p>
                <div className="flex flex-wrap gap-4 justify-center">
                  {gameData.currentWord
                    .split(",")
                    .slice(0, gameData.selectWord)
                    .map((word, index) => (
                      <button
                        key={index}
                        className="px-8 py-4 bg-blue-500 text-white text-xl rounded-xl hover:bg-blue-600 transform hover:scale-105 transition-all duration-200 shadow-lg hover:shadow-xl active:scale-95"
                        onClick={() =>
                          socketManager.selectWord(roomId, word.trim())
                        }
                      >
                        {word.trim()}
                      </button>
                    ))}
                </div>
              </div>
            ) : (
              <div className="flex-1 flex flex-col items-center justify-center">
                <p className="text-2xl font-bold mb-6">
                  Waiting for the drawer to pick a word...
                </p>
                <div className="flex gap-4">
                  {[...Array(3)].map((_, i) => (
                    <div
                      key={i}
                      className="w-32 h-16 bg-blue-500 rounded-xl animate-pulse"
                    ></div>
                  ))}
                </div>
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
            <div className="flex-1 flex items-center justify-center">
              <p className="text-3xl font-bold">
                Game Over! Thanks for playing!
              </p>
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
