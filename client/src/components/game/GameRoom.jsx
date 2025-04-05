import { useEffect, useState, useRef } from "react";
import { useNavigate, useParams } from "react-router-dom";

import ChatBox from "./ChatBox";
import HiddenWord from "./HiddenWord";
import PlayerList from "./PlayerList";
import PixelCanvas from "./PixelCanvas";
import GameSettings from "./GameSettings";
import RoundEndModal from "./RoundEndModal";
import { GAME_STATE } from "../../constants";
import { fetchLobby } from "../../services/auth";
import RoundSummaryModal from "./RoundSummaryModal";
import { socketManager } from "../../services/socket.js";
import LoadingSpinner from "../common/ui/LoadingSpinner.jsx";

// GameRoom component manages the game room's state, interactions, and UI
const GameRoom = ({ user }) => {
  const { roomId } = useParams(); // Get the room ID from the URL
  const navigate = useNavigate(); // Navigation hook for redirecting users

  const [isLoading, setIsLoading] = useState(true); // State to manage loading state

  // State to store the lobby ID
  const [lobbyId, setLobbyId] = useState();
  // State to store error messages
  const [error, setError] = useState("");
  // Ref to track connection attempts
  const connectionAttempts = useRef(0);
  const maxAttempts = 5; // Maximum connection attempts

  // State to store game data
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

  // Refs to track various states and prevent redundant actions
  const hasConnectedRef = useRef(false);
  const hasJoinedRef = useRef(false);
  const allPlayersDrawnRef = useRef(false);
  const prevPlayerScoresRef = useRef({}); // Store previous player scores
  const lastSummaryRoundRef = useRef(0); // Track the last round summary shown

  // State to manage modals
  const [showRoundEnd, setShowRoundEnd] = useState(false);
  const [showRoundSummary, setShowRoundSummary] = useState(false);

  useEffect(() => {
    let isMounted = true;

    const initializeGameRoom = async () => {
      if (!user) {
        console.log("User not found, redirecting to login");
        navigate("/");
        return;
      }

      try {
        if (!socketManager.isConnected()) {
          console.log("Connecting socket...");
          socketManager.connect(user);
        }

        const response = await fetchLobby(roomId);
        if (!isMounted) return;

        if (!response.success) {
          console.error("Failed to fetch lobby:", response.error);
          setError(response.error || "Failed to join game room");
          navigate("/");
          return;
        }

        setLobbyId(response.lobby.roomId);
        setGameData((prevData) => ({
          ...prevData,
          ...response.lobby,
        }));

        if (!hasJoinedRef.current) {
          hasJoinedRef.current = true;
          socketManager.joinLobby(response.lobby.roomId, user.username);
        }

        socketManager.offGameStateUpdate();
        socketManager.onGameStateUpdate((data) => {
          console.log("[GameRoom] Received game state update:", data);
          if (data.lobby) {
            setGameData((prevData) => ({
              ...prevData,
              ...data.lobby,
            }));
          }
        });

        setError(""); // Clear any previous errors
      } catch (error) {
        console.error("Error initializing game room:", error);
        setError(error.message || "Failed to join game room");
        navigate("/");
      } finally {
        if (isMounted) setIsLoading(false);
      }
    };

    initializeGameRoom();

    return () => {
      isMounted = false;
      socketManager.cleanup();
      hasConnectedRef.current = false;
      hasJoinedRef.current = false;
    };
  }, [roomId, navigate, user]);

  // Handle browser window/tab close events to clean up sockets
  useEffect(() => {
    const handleBeforeUnload = () => {
      console.log(
        "Browser window/tab closing - cleaning up socket connections"
      );
      if (socketManager.isConnected() && socketManager.currentRoom) {
        const { roomId } = socketManager.currentRoom;
        if (roomId) {
          socketManager.leaveRoom(roomId);
        }
      }
      socketManager.cleanup();
    };

    window.addEventListener("beforeunload", handleBeforeUnload);

    return () => {
      window.removeEventListener("beforeunload", handleBeforeUnload);
    };
  }, []);

  // Update previous scores when game state changes
  useEffect(() => {
    if (gameData.players && gameData.players.length > 0) {
      const scoreMap = {};
      gameData.players.forEach((player) => {
        scoreMap[player.username] = player.score;
      });
      prevPlayerScoresRef.current = scoreMap;
    }
  }, [gameData.gameState, gameData.players]);

  // Show round summary when conditions are met
  useEffect(() => {
    if (
      gameData.gameState === GAME_STATE.DRAW_END &&
      gameData.players.every((player) => player.hasDrawn) &&
      gameData.currentRound > lastSummaryRoundRef.current
    ) {
      lastSummaryRoundRef.current = gameData.currentRound;
      setShowRoundEnd(true);
    }
  }, [gameData.gameState, gameData.players, gameData.currentRound]);

  // Calculate points earned in the current round
  const calculateRoundPoints = (player) => {
    const prevScore = prevPlayerScoresRef.current[player.username] || 0;
    return player.score - prevScore;
  };

  // Handle completion of the RoundEndModal
  const handleRoundEndComplete = () => {
    setShowRoundEnd(false);
    if (gameData.players.every((player) => player.hasDrawn)) {
      setTimeout(() => {
        setShowRoundSummary(true);
      }, 300);
    }
  };

  if (error) {
    return (
      <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded relative mb-2">
        <strong className="font-bold">Error: </strong>
        <span className="block sm:inline">{error}</span>
      </div>
    );
  }
  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <LoadingSpinner />
      </div>
    );
  }

  return (
    <div className="min-h-[calc(100vh-4rem)] dark:bg-gray-600 transition-colors">
      <div className="h-full flex flex-col">
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
        <div className="flex-1 flex flex-col lg:flex-row">
          <div className="lg:w-72">
            <PlayerList
              players={gameData.players}
              drawerUsername={gameData.currentDrawer}
              roomId={lobbyId}
              gameState={gameData.gameState}
              currentUsername={user.username}
              isAdmin={user.isAdmin} // Add this line
            />

            {/* /* Game Settings */}
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
            gameData.currentWord.includes(",") && (
              <div className="p-5 m-1 flex-1 flex flex-col items-center justify-center">
                <p className="text-3xl font-bold mb-6 text-white px-8 py-4 rounded-lg shadow-lg text-center bg-gradient-to-r from-purple-800 via-purple-500 to-purple-100/50">
                  Select a word:
                </p>
                <div className="flex flex-wrap gap-4 justify-center">
                  {gameData.currentWord.split(",").map((word, index) => (
                    <button
                      key={index}
                      className="px-10 py-6 bg-gradient-to-r from-indigo-400 via-purple-500 to-purple-100/50 text-white text-2xl font-bold rounded-xl hover:bg-purple-600 transform hover:scale-105 transition-all duration-200 shadow-lg hover:shadow-xl active:scale-95"
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
            !gameData.currentWord.includes(",") && (
              <div className="flex-1 flex items-center justify-center">
                <p className="text-3xl font-bold bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500 text-white px-8 py-4 rounded-lg shadow-lg text-center">
                  Starting your turn...
                </p>
              </div>
            )}

          {gameData.gameState === GAME_STATE.PICKING_WORD &&
            gameData.currentDrawer !== user.username && (
              <div className="flex-1 flex flex-col items-center justify-center">
                <p className="text-3xl font-bold mb-6 bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500 text-white px-8 py-4 rounded-lg shadow-lg text-center">
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
              <p className="text-4xl font-bold bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500 text-white px-8 py-4 rounded-lg shadow-lg text-center">
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
          onCooldownComplete={handleRoundEndComplete}
        />
      )}

      {showRoundSummary && gameData.players.every((p) => p.hasDrawn) && (
        <RoundSummaryModal
          isOpen={true}
          players={gameData.players.map((player) => ({
            ...player,
            roundPoints: calculateRoundPoints(player), // Add calculated round points for each player
          }))}
          onClose={() => setShowRoundSummary(false)}
          roundNumber={gameData.currentRound}
          maxRounds={gameData.maxRounds}
        />
      )}
    </div>
  );
};

export default GameRoom;
