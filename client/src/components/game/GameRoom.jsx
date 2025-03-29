import { useEffect, useState, useRef } from "react";
import { useNavigate, useParams } from "react-router-dom";

import ChatBox from "./ChatBox";
import HiddenWord from "./HiddenWord";
import PlayerList from "./PlayerList";
import PixelCanvas from "./PixelCanvas";
import GameSettings from "./GameSettings";
import RoundEndModal from "./RoundEndModal";
import RoundSummaryModal from "./RoundSummaryModal";
import { fetchLobby } from "../../services/auth";
import { socketManager } from "../../services/socket.js";
import { GAME_STATE } from "../../../../shared/constants";

const GameRoom = ({ user }) => {
  const { roomId } = useParams();
  const [lobbyId, setLobbyId] = useState();
  const navigate = useNavigate();
  const [isConnecting, setIsConnecting] = useState(true);
  const [error, setError] = useState("");
  const connectionAttempts = useRef(0);
  const maxAttempts = 5;
  const [gameData, setGameData] = useState({
    players: [],
    playerLimit: 0,
    revealCharacters: false,
    currentRound: 0,
    maxRounds: 3,
    selectWord: false,
    selectCategory: false,
    gameState: GAME_STATE.WAITING,
    messages: [],
    currentWord: "",
    currentDrawer: "",
    canvasState: null,
    startTime: null,
    roundTime: 60,
    timeLeft: 0,
    isTimerRunning: false,
  });

  const isTimerCompleted = useRef(false);
  const hasConnectedRef = useRef(false);
  const hasJoinedRef = useRef(false);
  const [showRoundEnd, setShowRoundEnd] = useState(false);
  const [showRoundSummary, setShowRoundSummary] = useState(false);

  useEffect(() => {
    let isMounted = true;

    if (!user) {
      console.log("User not found, redirecting to login");
      navigate("/");
      return;
    }

    const setupSocket = async () => {
      try {
        // Prevent multiple connection attempts
        if (hasConnectedRef.current) {
          console.log("Socket already set up, skipping connection");
          return;
        }

        if (!socketManager.isConnected()) {
          console.log("Socket not connected, connecting...");
          socketManager.connect(user);
        }

        hasConnectedRef.current = true;

        // Wait for socket to be ready with timeout
        const maxWaitTime = 5000;
        const startTime = Date.now();

        while (
          !socketManager.isConnected() &&
          Date.now() - startTime < maxWaitTime
        ) {
          await new Promise((resolve) => setTimeout(resolve, 100));
        }

        if (!socketManager.isConnected()) {
          connectionAttempts.current++;
          if (connectionAttempts.current >= maxAttempts) {
            setError(
              "Failed to connect to game server after multiple attempts"
            );
            console.error("Failed to connect after maximum attempts");
            if (isMounted) navigate("/");
            return;
          }
          throw new Error("Socket connection timeout");
        }

        // Fetch lobby data
        const response = await fetchLobby(roomId);
        if (!isMounted) return;

        if (!response.success) {
          console.error("Failed to fetch lobby:", response.error);
          setError(response.error || "Failed to join game room");
          if (isMounted) navigate("/");
          return;
        }

        console.log("Fetched lobby data:", response.lobby);
        setLobbyId(response.lobby.roomId);
        setError(""); // Clear any previous errors

        // Only join if not already joined
        if (!hasJoinedRef.current) {
          hasJoinedRef.current = true;
          socketManager.joinLobby(response.lobby.roomId, user.username);
        }

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

        setIsConnecting(false);

        // Clean up previous listeners before setting new ones
        socketManager.offGameStateUpdate();
        socketManager.onGameStateUpdate((data) => {
          console.log("[GameRoom] Received game state update:", {
            newState: data.lobby.gameState,
            currentState: gameData.gameState,
            word: data.lobby.currentWord,
            drawer: data.lobby.currentDrawer,
          });

          if (data.lobby) {
            setGameData((prevData) => {
              // Check if all players have drawn
              const allPlayersDrawn = data.lobby.players.every(p => p.hasDrawn);
              const isEndOfRound = allPlayersDrawn && data.lobby.gameState === GAME_STATE.DRAW_END;

              // Calculate round scores if it's end of round
              if (isEndOfRound) {
                data.lobby.players.forEach(player => {
                  player.roundScore = player.score - (prevData.players.find(p => p.username === player.username)?.score || 0);
                });
              }

              // Show appropriate modal
              if (data.lobby.gameState === GAME_STATE.DRAW_END) {
                const allPlayersDrawn = data.lobby.players.every(p => p.hasDrawn);
                // Only show round summary when all players have drawn AND it's the end of the current round
                setShowRoundSummary(allPlayersDrawn && data.lobby.currentRound > 0);
                // Show round end modal when not all players have drawn yet
                setShowRoundEnd(!allPlayersDrawn);
              } else {
                setShowRoundEnd(false);
                setShowRoundSummary(false);
              }

              return {
                ...prevData,
                ...data.lobby,
              };
            });
          }
        });
      } catch (error) {
        console.error("Error in setup:", error);
        setError(error.message || "Failed to join game room");
        if (connectionAttempts.current < maxAttempts) {
          console.log(
            `Retrying connection (${
              connectionAttempts.current + 1
            }/${maxAttempts})...`
          );
          setTimeout(setupSocket, 1000);
        } else {
          console.error("Failed to connect after maximum attempts");
          if (isMounted) navigate("/");
        }
      }
    };

    setupSocket();

    return () => {
      isMounted = false;
      socketManager.cleanup();
      hasConnectedRef.current = false;
      hasJoinedRef.current = false;
    };
  }, [roomId, navigate, user]);

  return (
    <div className="min-h-[calc(100vh-4rem)] mx-4 md:mx-8 lg:mx-16 dark:bg-gray-900 transition-colors">
      {error && (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded relative mb-4">
          <strong className="font-bold">Error: </strong>
          <span className="block sm:inline">{error}</span>
        </div>
      )}
      <div className="h-full flex flex-col gap-1 py-1">
        <HiddenWord
          word={gameData.currentWord}
          isDrawing={gameData.currentDrawer === user.username}
          isRevealing={gameData.revealCharacters}
          gameState={gameData.gameState}
          startTime={gameData.startTime}
          roundTime={gameData.roundTime}
          rounds={gameData.currentRound}
          maxRounds={gameData.maxRounds}
          roomId={lobbyId}
        />
        <div className="flex-1 flex flex-col lg:flex-row gap-1">
          <div className="lg:w-72 flex flex-col">
            <PlayerList
              players={gameData.players}
              drawerUsername={gameData.currentDrawer}
              roomId={lobbyId}
              gameState={gameData.gameState}
              currentUsername={user.username}
              isAdmin={user.isAdmin} // Add this line
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
            gameData.currentDrawer === user.username && 
            gameData.currentWord.includes(',') && (
            <div className="flex-1 flex flex-col items-center justify-center">
              <p className="text-2xl font-bold mb-6 bg-white/95 dark:bg-gray-800/95 px-6 py-3 rounded-lg shadow-sm">
                Select a word:
              </p>
              <div className="flex flex-wrap gap-4 justify-center">
                {gameData.currentWord
                  .split(",")
                  .map((word, index) => (
                    <button
                      key={index}
                      className="px-10 py-6 bg-blue-500 text-white text-2xl font-bold rounded-xl hover:bg-blue-600 transform hover:scale-105 transition-all duration-200 shadow-lg hover:shadow-xl active:scale-95"
                      onClick={() =>
                        socketManager.selectWord(roomId, word.trim())
                      }
                    >
                      {word.trim()}
                    </button>
                  ))}
              </div>
            </div>
          )}

          {gameData.gameState === GAME_STATE.PICKING_WORD && 
           gameData.currentDrawer === user.username && 
           !gameData.currentWord.includes(',') && (
            <div className="flex-1 flex items-center justify-center">
              <p className="text-2xl font-bold bg-white/95 dark:bg-gray-800/95 px-6 py-3 rounded-lg shadow-sm">
                Starting your turn...
              </p>
            </div>
          )}

          {gameData.gameState === GAME_STATE.PICKING_WORD && 
           gameData.currentDrawer !== user.username && (
            <div className="flex-1 flex flex-col items-center justify-center">
              <p className="text-2xl font-bold mb-6 bg-white/95 dark:bg-gray-800/95 px-6 py-3 rounded-lg shadow-sm">
                Waiting for {gameData.currentDrawer} to start drawing...
              </p>
            </div>
          )}

          {(gameData.gameState === GAME_STATE.DRAWING ||
            gameData.gameState === GAME_STATE.DRAW_END) && (
            <div className="flex-1 backdrop-blur-sm rounded-lg shadow flex items-center justify-center">
              <PixelCanvas
                drawerUsername={gameData.currentDrawer}
                isDrawer={gameData.currentDrawer === user.username}
                canvasState={gameData.canvasState}
                gameState={gameData.gameState}
                roundTime={gameData.roundTime}
                startTime={gameData.startTime}
                roomId={roomId}
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
      {showRoundEnd && (
        <RoundEndModal
          word={gameData.currentWord}
          drawer={gameData.currentDrawer}
          players={gameData.players}
          cooldownTime={10}
          onCooldownComplete={() => setShowRoundEnd(false)}
        />
      )}

      {showRoundSummary && gameData.players.every(p => p.hasDrawn) && (
        <RoundSummaryModal
          isOpen={true}
          players={gameData.players}
          onClose={() => setShowRoundSummary(false)}
          roundNumber={gameData.currentRound}
          maxRounds={gameData.maxRounds}
        />
      )}
    </div>
  );
};

export default GameRoom;
