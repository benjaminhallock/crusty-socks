import { useEffect, useState, useRef } from "react";
import { useNavigate, useParams } from "react-router-dom";

import ChatBox from "./ChatBox";
import HiddenWord from "./HiddenWord";
import PlayerList from "./PlayerList";
import PixelCanvas from "./PixelCanvas";
import GameSettings from "./GameSettings";
import RoundEndModal from "./RoundEndModal";
import { GAME_STATE } from "../../constants";
import { fetchLobby } from "../../services/api";
import RoundSummaryModal from "./RoundSummaryModal";
import LoadingSpinner from "../common/ui/LoadingSpinner.jsx";
import { socketManager } from "../../services/socketManager.js";
import SocketStatusIcon from "../common/ui/SocketStatusIcon.jsx";

const GameRoom = ({ user }) => {
  const { roomId } = useParams(); // Get the room ID from the URL
  const navigate = useNavigate(); // Navigation hook for redirecting users
  const [isLoading, setIsLoading] = useState(true); // State to manage loading state
  const [lobbyId, setLobbyId] = useState();
  const [error, setError] = useState("");
  const isMountedRef = useRef(false);
  const didLeaveRef = useRef(false);
  const [lobby, setGameData] = useState({
    players: [],
    playerLimit: 0,
    revealCharacters: false,
    currentRound: 1,
    maxRounds: 3,
    selectWord: 3,
    selectCategory: "random",
    gameState: GAME_STATE.WAITING,
    messages: [],
    currentWord: "",
    currentDrawer: "",
    canvasState: null,
    startTime: null,
    words: [],
    roundTime: 60,
    timeLeft: 0,
  });

  // Refs to track various states and prevent redundant actions
  const hasConnectedRef = useRef(false); // Track if the socket has connected
  const hasJoinedRef = useRef(false); // Track if the user has joined the lobby via socket
  const prevPlayerScoresRef = useRef({}); // Store previous player scores
  const lastSummaryRoundRef = useRef(0); // Track the last round summary shown
  const [socketStatus, setSocketStatus] = useState("disconnected"); // Track socket connection status

  // State to manage modals
  const [showRoundEnd, setShowRoundEnd] = useState(false);
  const [showRoundSummary, setShowRoundSummary] = useState(false);

  useEffect(() => {
    isMountedRef.current = true;
    let mounted = true;
    let cleanupFns = [];

    const setupSocket = async () => {
      try {
        if (!user?.username || !roomId) {
          throw new Error("Missing user or room information");
        }

        // First fetch lobby data
        const lobbyData = await fetchLobby(roomId);
        if (!lobbyData || lobbyData.roomId !== roomId) {
          throw new Error("Lobby not found");
        }

        if (mounted) {
          setLobbyId(lobbyData._id);
          setGameData((prev) => ({ ...prev, ...lobbyData }));

          // Clean setup of socket subscriptions
          const unsubscribeStatus = socketManager.onStatusChange((status) => {
            if (!mounted) return;
            setSocketStatus(status);
            if (status === "disconnected") {
              socketManager.reconnect();
            }
          });

          const unsubscribeGameState = socketManager.onGameStateUpdate(
            (data) => {
              if (!mounted || !data.lobby) return;
              
              // Update game data with new state
              setGameData((prev) => ({ ...prev, ...data.lobby }));

              // Handle round end and showing modals
              if (data.lobby.gameState === GAME_STATE.DRAW_END) {
                setShowRoundEnd(true);
                setShowRoundSummary(false);
              } else if (data.lobby.gameState !== GAME_STATE.DRAW_END) {
                setShowRoundEnd(false);
              }

              // Handle round summary modal
              if (data.lobby.gameState === GAME_STATE.ROUND_END) {
                // Check if we've already shown this round
                if (lastSummaryRoundRef.current !== data.lobby.currentRound) {
                  lastSummaryRoundRef.current = data.lobby.currentRound;
                  setShowRoundSummary(true);
                  
                  // Store previous scores for comparison
                  const newPlayerScores = {};
                  data.lobby.players.forEach((player) => {
                    newPlayerScores[player.username] = player.score;
                  });
                  prevPlayerScoresRef.current = newPlayerScores;
                }
              }
              
              // Hide summary modal when next round starts
              if (data.lobby.gameState === GAME_STATE.WAITING || 
                  data.lobby.gameState === GAME_STATE.PICKING_WORD ||
                  data.lobby.gameState === GAME_STATE.DRAWING) {
                setShowRoundSummary(false);
              }
            }
          );

          cleanupFns.push(unsubscribeStatus, unsubscribeGameState);

          // Connect socket after setting up listeners
          if (socketStatus === "disconnected") {
            await socketManager.connect(user, roomId);
          }

          setIsLoading(false);
        }
      } catch (error) {
        console.error("Game room error:", error);
        if (mounted) {
          setError(error.message);
          setIsLoading(false);
          navigate("/");
        }
      }
    };

    setupSocket();

    return () => {
      mounted = false;
      cleanupFns.forEach((fn) => fn?.());
      if (!didLeaveRef.current) {
        didLeaveRef.current = true;
        socketManager.leaveLobby(roomId);
      }
    };
  }, [roomId, navigate, user, socketStatus]);

  const handleRoundEndComplete = () => {
    setShowRoundEnd(false);
  };

  // Function to check if socket is ready for an action
  const isSocketReady = () => {
    if (!socketManager.isConnected()) {
      console.warn("Socket not connected, attempting reconnection...");
      try {
        socketManager.reconnect();
      } catch (e) {
        console.error("Failed to reconnect socket:", e);
      }
      return false;
    }
    return true;
  };

  // Function to handle game starting with socket check
  const handleStartGame = () => {
    if (isSocketReady()) {
      socketManager.startGame(roomId);
    } else {
      setError(
        "Cannot start game - Socket not connected. Please refresh the page."
      );
    }
  };

  const calculateRoundPoints = (player) => {
    // Calculate points earned this round
    return (player.drawPoints || 0);
  };

  const handleRoundSummaryClose = () => {
    setShowRoundSummary(false);
  };

  return (
    <div className="min-h-[calc(100vh-4rem)] w-full bg-gradient-to-br from-blue-300 via-pink-300 to-yellow-300 dark:from-gray-800 dark:via-purple-800 dark:to-indigo-800 p-4 rounded-lg shadow-2xl">
      {error && (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded relative mb-2">
          <strong className="font-bold">Error: </strong>
          <span className="block sm:inline">{error}</span>
        </div>
      )}
      {isLoading && (
        <div className="flex items-center justify-center min-h-screen">
          <LoadingSpinner />
        </div>
      )}
      <div className="h-full w-full flex flex-col gap-4 rounded-lg bg-white/90 dark:bg-gray-700/90 p-4 shadow-lg">
        <div className="flex items-center w-full">
          <SocketStatusIcon status={socketStatus} />
        </div>
        <div className="">
          <HiddenWord
            lobby={lobby}
            user={user}
            onWordPick={(word) => {
              socketManager.selectWord(roomId, word);
            }}
          />
        </div>
        <div className="flex-1 flex flex-col lg:flex-row gap-4 w-full">
          <div className="lg:w-72 flex flex-col gap-4">
            <PlayerList
              players={lobby.players}
              drawerUsername={lobby.currentDrawer}
              roomId={roomId}
              gameState={lobby.gameState}
              currentUsername={user.username}
              isAdmin={user.isAdmin}
              onStartGame={handleStartGame}
            />
            <GameSettings
              revealCharacters={lobby.revealCharacters}
              maxRounds={lobby.maxRounds}
              selectWord={lobby.selectWord}
              selectCategory={lobby.selectCategory}
              playerLimit={lobby.playerLimit}
            />
          </div>

          <div className="flex-1 flex flex-col gap-4">
            {lobby.gameState !== GAME_STATE.FINISHED && (
              <PixelCanvas
                isDrawer={lobby.currentDrawer === user.username}
                drawerUsername={lobby.currentDrawer}
                canvasState={lobby.canvasState}
                gameState={lobby.gameState}
                roundTime={lobby.roundTime}
                startTime={lobby.startTime}
                lobbyId={lobby._id}
              />
            )}

            {lobby.gameState === GAME_STATE.FINISHED && (
              <div className="flex-1 flex items-center justify-center">
                <p className="text-4xl font-bold bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500 text-white px-8 py-4 rounded-lg shadow-lg text-center">
                  Game Over! Thanks for playing!
                </p>
              </div>
            )}

            {lobby.gameState === GAME_STATE.PICKING_WORD &&
              lobby.currentDrawer !== user.username && (
                <div className="flex-1 flex flex-col items-center justify-center">
                  <p className="text-3xl font-bold mb-6 bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500 text-white px-8 py-4 rounded-lg shadow-lg text-center">
                    Waiting for {lobby.currentDrawer} to start drawing...
                  </p>
                </div>
              )}
          </div>

          <div className="lg:w-72 flex flex-col gap-4">
            <ChatBox
              user={user}
              roomId={roomId}
              lobbyObjectId={lobbyId}
              gameState={lobby.gameState}
              currentWord={lobby.currentWord}
              currentDrawer={lobby.currentDrawer}
            />
          </div>
        </div>
      </div>
      {showRoundEnd && (
        <RoundEndModal
          word={lobby.currentWord}
          drawer={lobby.currentDrawer}
          players={lobby.players}
          cooldownTime={10}
          onCooldownComplete={handleRoundEndComplete}
        />
      )}

      {showRoundSummary && lobby.players.every((p) => p.hasDrawn) && (
        <RoundSummaryModal
          isOpen={true}
          players={lobby.players.map((player) => ({
            ...player,
            roundPoints: calculateRoundPoints(player),
          }))}
          onClose={handleRoundSummaryClose}
          roundNumber={lobby.currentRound}
          maxRounds={lobby.maxRounds}
        />
      )}
    </div>
  );
};

export default GameRoom;
