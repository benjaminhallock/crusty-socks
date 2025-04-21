import { useEffect, useState, useRef, useCallback, Fragment } from "react";
import { useNavigate, useParams, useBeforeUnload } from "react-router-dom";
import { Transition } from "@headlessui/react";

import ChatBox from "./ChatBox";
import HiddenWord from "./HiddenWord";
import PlayerList from "./PlayerList";
import PixelCanvas from "./PixelCanvas";
import DrawEndModal from "./menus/DrawEndModal.jsx";
import RoundSummaryModal from "./menus/RoundSummaryModal.jsx";
import Modal from "../common/ui/Modal";
import { GAME_STATE } from "../../constants";
import { fetchLobby } from "../../services/api";
import { socketManager } from "../../services/socketManager.js";
import LoadingSpinner from "../common/ui/LoadingSpinner.jsx";
import SocketStatusIcon from "../common/ui/SocketStatusIcon.jsx";

const GameRoom = ({ user }) => {
  const { roomId } = useParams();
  const navigate = useNavigate();
  const [isLoading, setIsLoading] = useState(true);
  const [lobbyId, setLobbyId] = useState(null);
  const [error, setError] = useState("");
  const [socketStatus, setSocketStatus] = useState("disconnected");
  const [leftSidebarWidth, setLeftSidebarWidth] = useState(256); // 16rem default
  const [rightSidebarWidth, setRightSidebarWidth] = useState(384); // 24rem default
  const isDraggingRef = useRef(false);
  const activeHandleRef = useRef(null);
  const [isMobile, setIsMobile] = useState(window.innerWidth < 1024);
  const [isShowing, setIsShowing] = useState(false);
  const correctSound = useRef(new Audio("/audio/sfx/correct.mp3"));
  const incorrectSound = useRef(new Audio("/audio/sfx/incorrect.mp3"));

  const playSound = useCallback((soundType) => {
    if (soundType === "correct") {
      correctSound.current.currentTime = 0;
      correctSound.current.play().catch(console.error);
    } else if (soundType === "incorrect") {
      incorrectSound.current.currentTime = 0;
      incorrectSound.current.play().catch(console.error);
    }
  }, []);

  // Handle window resize
  useEffect(() => {
    const handleResize = () => {
      setIsMobile(window.innerWidth < 1024);
    };
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  // Handle resize dragging
  useEffect(() => {
    const handleMouseMove = (e) => {
      if (!isDraggingRef.current) return;

      if (activeHandleRef.current === "left") {
        const newWidth = Math.max(200, Math.min(400, e.clientX));
        setLeftSidebarWidth(newWidth);
      } else if (activeHandleRef.current === "right") {
        const containerRight = document
          .querySelector(".flex-1.flex.flex-col.lg\\:flex-row")
          .getBoundingClientRect().right;
        const newWidth = Math.max(
          250,
          Math.min(500, containerRight - e.clientX)
        );
        setRightSidebarWidth(newWidth);
      }
    };

    const handleMouseUp = () => {
      isDraggingRef.current = false;
      activeHandleRef.current = null;
      document.body.style.cursor = "";
    };

    document.addEventListener("mousemove", handleMouseMove);
    document.addEventListener("mouseup", handleMouseUp);

    return () => {
      document.removeEventListener("mousemove", handleMouseMove);
      document.removeEventListener("mouseup", handleMouseUp);
    };
  }, []);

  // Refs for managing component lifecycle and connection state
  const isMounted = useRef(false);
  const isConnected = useRef(false);
  const initializationComplete = useRef(false);

  // Initial lobby state
  const [lobby, setLobby] = useState({
    gridSize: 16,
    players: [
      {
        userId: user._id,
        username: user.username,
        score: 0,
        hasGuessedCorrect: false,
        hasDrawn: false,
        guessTime: 0,
        drawScore: 0,
        roundScore: 0,
      },
    ],
    usedWords: [],
    playerLimit: 8,
    revealCharacters: 0,
    currentRound: 1,
    maxRounds: 5,
    selectWord: 3,
    selectCategory: "random",
    gameState: GAME_STATE.WAITING,
    currentWord: "",
    currentDrawer: "",
    canvasState: {
      data: "",
      lastUpdate: null,
    },
    startTime: null,
    words: [],
    roundTime: 60,
    kickedUsers: [],
    roomId: roomId,
    finished: false,
  });

  // Primary initialization effect
  useEffect(() => {
    isMounted.current = true;
    setIsShowing(true);

    const initialize = async () => {
      if (initializationComplete.current) return;

      setIsLoading(true);
      setError("");

      // Validate required data
      if (!user || !roomId || !localStorage.getItem("token")) {
        setError("Invalid session. Please log in again.");
        return navigate("/");
      }

      if (user.isBanned) {
        setError("You have been banned from this game.");
        return navigate("/");
      }

      try {
        // Set up navigation for socket manager
        socketManager.setNavigate(navigate);

        // First set up socket connection
        await setupSocketConnection();

        // Then fetch lobby data
        const lobbyData = await fetchLobbyData();
        if (lobbyData) {
          setLobbyId(lobbyData._id);
          setLobby((prev) => ({ ...prev, ...lobbyData }));
          console.log("[GameRoom] Lobby data:", lobbyData);
          initializationComplete.current = true;
        }
      } catch (error) {
        console.error("Initialization error:", error);
        setError("Failed to initialize game room.");
      } finally {
        if (isMounted.current) {
          setIsLoading(false);
        }
      }
    };

    initialize();

    // Cleanup on unmount
    return () => {
      isMounted.current = false;
      isConnected.current = false;
      initializationComplete.current = false;
      setIsShowing(false);

      if (socketManager.isConnected()) {
        socketManager.leaveLobby(roomId, user?.username);
      }
    };
  }, [roomId, navigate, user]);

  const fetchLobbyData = async () => {
    try {
      const data = await fetchLobby(roomId);
      if (!data.success || !data.lobby) {
        throw new Error(data.error || "Failed to fetch lobby data");
      }

      const lobby = data.lobby;

      if (lobby.kickedUsers?.includes(user._id)) {
        setError("You have been kicked from this lobby.");
        navigate("/");
        return null;
      }

      return lobby;
    } catch (error) {
      console.error("Error fetching lobby data:", error);
      setError("Failed to fetch lobby data");
      navigate("/");
      return null;
    }
  };

  const setupSocketConnection = async () => {
    try {
      await socketManager.connect(user, roomId);
      isConnected.current = true;

      const unsubscribeStatus = socketManager.onStatusChange((status) => {
        if (isMounted.current) {
          setSocketStatus(status);
          isConnected.current = status === "connected";
        }
      });

      const unsubscribeGameState = socketManager.onGameStateUpdate((data) => {
        if (isMounted.current && data?.lobby) {
          // Deep compare relevant fields before updating
          setLobby((prevLobby) => {
            if (!prevLobby) return data.lobby;

            // Check if players array has changed
            const playersChanged =
              JSON.stringify(prevLobby.players) !==
              JSON.stringify(data.lobby.players);

            // If players haven't changed and no other important fields changed, keep current state
            if (
              !playersChanged &&
              prevLobby.gameState === data.lobby.gameState &&
              prevLobby.currentDrawer === data.lobby.currentDrawer &&
              prevLobby.currentWord === data.lobby.currentWord
            ) {
              return prevLobby;
            }

            return { ...prevLobby, ...data.lobby };
          });
        }
      });

      const unsubscribeSound = socketManager.onSoundNotification((data) => {
        if (isMounted.current && data.sound) {
          playSound(data.sound);
        }
      });

      return () => {
        unsubscribeStatus();
        unsubscribeGameState();
        unsubscribeSound();
      };
    } catch (error) {
      console.error("Socket connection error:", error);
      throw new Error("Failed to connect to game server");
    }
  };

  // Enhanced reconnection effect with presence verification
  useEffect(() => {
    if (!isMounted.current || !lobbyId) return;

    const verifyPresence = async () => {
      const lobbyData = await fetchLobbyData();
      if (!lobbyData) return;

      const playerExists = lobbyData.players.some(
        (p) => p.username === user.username
      );
      if (!playerExists || !socketManager.isConnected()) {
        console.log("[GameRoom] Restoring player connection...");
        await setupSocketConnection();
      }
    };

    verifyPresence();
    const presenceInterval = setInterval(verifyPresence, 5000);

    return () => clearInterval(presenceInterval);
  }, [socketStatus, lobbyId, user.username]);

  // Navigation warning
  useBeforeUnload(
    useCallback(
      (event) => {
        if (
          lobby?.gameState === GAME_STATE.DRAWING ||
          lobby?.gameState === GAME_STATE.PICKING_WORD
        ) {
          event.preventDefault();
          return (event.returnValue =
            "Are you sure you want to leave? The game is still in progress!");
        }
      },
      [lobby?.gameState]
    )
  );

  // Don't render anything until we have a lobby ID
  if (!lobbyId && !isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="bg-red-100 border border-red-400 text-red-700 px-6 py-4 rounded-lg">
          <p className="font-medium">Unable to join game room</p>
        </div>
      </div>
    );
  }

  return (
    <Transition
      as={Fragment}
      show={isShowing}
      enter="transition-all duration-500"
      enterFrom="opacity-0 translate-y-8"
      enterTo="opacity-100 translate-y-0"
      leave="transition-all duration-300"
      leaveFrom="opacity-100"
      leaveTo="opacity-0"
    >
      <div className="min-h-[calc(90vh-4rem)] w-full bg-gradient-to-r from-purple-600/80 to-indigo-600/80 dark:from-purple-800/80 dark:to-indigo-900/80 p-4 rounded shadow-2xl">
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
        <div className="h-full w-full flex flex-col gap-4 rounded-lg bg-white/80 dark:bg-gray-800/80 backdrop-blur-md p-4 shadow-lg">
          {/* Status and HiddenWord sections */}
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
          <div className="flex-1 flex flex-col lg:flex-row w-full relative gap-4">
            {/* Left sidebar - PlayerList and GameSettings */}
            <div className="w-full lg:w-[250px]">
              <div className="flex flex-col gap-4">
                <PlayerList
                  lobby={lobby}
                  user={user}
                  onStartGame={() => socketManager.startGame(roomId)}
                />
              </div>
            </div>

            {/* Center - Canvas */}
            <div className="flex-1 flex flex-col gap-4 min-w-0 relative">
              {lobby.gameState && (
                <div className="w-full h-full min-h-[400px]">
                  <PixelCanvas
                    lobby={lobby}
                    isDrawer={lobby.currentDrawer === user.username}
                  />
                </div>
              )}
            </div>

            {/* Right sidebar - ChatBox */}
            <div className="w-full lg:w-[300px]">
              {lobbyId && (
                <ChatBox
                  user={user}
                  roomId={roomId}
                  lobbyId={lobbyId}
                  lobbyObjectId={lobbyId}
                  gameState={lobby.gameState}
                  currentDrawer={lobby.currentDrawer}
                  currentWord={lobby.currentWord}
                />
              )}
            </div>
          </div>
        </div>

        {/* Game state modals */}
        {lobby.gameState === GAME_STATE.DRAW_END && (
          <DrawEndModal
            lobby={lobby}
            word={lobby.currentWord}
            drawer={lobby.currentDrawer}
            players={lobby.players}
            onClose={() => {}} // Server controls state
          />
        )}

        {lobby.gameState === GAME_STATE.ROUND_END && (
          <RoundSummaryModal
            lobby={lobby}
            isOpen={true}
            players={lobby.players}
            onClose={() => {}} // Server controls state
            roundNumber={lobby.currentRound}
            maxRounds={lobby.maxRounds}
            gameState={lobby.gameState}
          />
        )}

        {lobby.gameState === GAME_STATE.FINISHED && (
          <Modal
            isOpen={true}
            title="Game Complete!"
            size="md"
            position="center"
            onClose={() => {}}
          >
            <div className="text-center">
              <div className="mb-6">
                <h3 className="text-xl font-bold text-gray-800 dark:text-gray-200 mb-2">
                  Final Scores
                </h3>
                <div className="space-y-2">
                  {lobby.players
                    .sort((a, b) => b.score - a.score)
                    .map((player, index) => (
                      <div
                        key={player.username}
                        className={`flex justify-between items-center px-4 py-2 rounded transform transition-all duration-200 hover:scale-[1.02] ${
                          index === 0
                            ? "bg-yellow-100 dark:bg-yellow-900"
                            : "bg-gray-50 dark:bg-gray-800"
                        }`}
                      >
                        <span className="font-medium">
                          {index === 0 ? "👑 " : `#${index + 1} `}
                          {player.username}
                        </span>
                        <span className="font-bold">{player.score} pts</span>
                      </div>
                    ))}
                </div>
              </div>
              <p className="text-green-600 dark:text-green-400 font-medium mb-4 transform transition-all duration-500 hover:scale-[1.05]">
                Game Complete! All scores have been saved to your profile!
              </p>
              <div className="flex justify-center gap-4">
                {user && (
                  <button
                    onClick={() => socketManager.startGame(roomId)}
                    className="bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-2 px-6 rounded-lg transition-all duration-200 transform hover:scale-105 hover:shadow-lg"
                  >
                    Play Again
                  </button>
                )}
                <button
                  onClick={() => navigate("/")}
                  className="bg-gray-600 hover:bg-gray-700 text-white font-bold py-2 px-6 rounded-lg transition-all duration-200 transform hover:scale-105 hover:shadow-lg"
                >
                  Return to Create Lobby
                </button>
              </div>
            </div>
          </Modal>
        )}
      </div>
    </Transition>
  );
};

export default GameRoom;
