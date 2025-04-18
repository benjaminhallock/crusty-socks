import { useEffect, useState, useRef, useCallback, Fragment } from "react";
import { useNavigate, useParams, useBeforeUnload } from "react-router-dom";
import { Transition } from "@headlessui/react";

import ChatBox from "./ChatBox";
import HiddenWord from "./HiddenWord";
import PlayerList from "./PlayerList";
import PixelCanvas from "./PixelCanvas";
import GameSettings from "./menus/GameSettings.jsx";
import DrawEndModal from "./menus/DrawEndModal.jsx";
import { GAME_STATE } from "../../constants";
import { fetchLobby } from "../../services/api";
import RoundSummaryModal from "./menus/RoundSummaryModal.jsx";
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
    playerLimit: 0,
    revealCharacters: 75 || 0,
    currentRound: 1,
    maxRounds: 1 || 10,
    selectWord: 1 || 5,
    selectCategory: "random",
    gameState: GAME_STATE.WAITING,
    currentWord: "",
    currentDrawer: "",
    canvasState: null,
    startTime: null,
    words: [],
    roundTime: 60,
    timeLeft: 0,
    kickedUsers: [],
    roomId: roomId,
    canvasData: {
      data: "",
      lastUpdate: null,
    },
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
        // First set up socket connection
        await setupSocketConnection();

        // Then fetch lobby data
        const lobbyData = await fetchLobbyData();
        if (lobbyData) {
          setLobbyId(lobbyData._id);
          setLobby((prev) => ({ ...prev, ...lobbyData }));
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

      console.log("Lobby data fetched successfully:", lobby);
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
        if (isMounted.current && data.lobby) {
          //   console.log("[GameRoom][onGameStateUpdate] Updating lobby state");
          setLobby((prev) => ({ ...prev, ...data.lobby }));
        }
      });

      return () => {
        unsubscribeStatus();
        unsubscribeGameState();
      };
    } catch (error) {
      console.error("Socket connection error:", error);
      throw new Error("Failed to connect to game server");
    }
  };

  // Add reconnection effect
  useEffect(() => {
    if (!isMounted.current || !lobbyId) return;

    const handleReconnection = async () => {
      if (!isConnected.current && socketStatus === "disconnected") {
        try {
          await setupSocketConnection();
          const lobbyData = await fetchLobbyData();
          if (lobbyData) {
            setLobby((prev) => ({ ...prev, ...lobbyData }));
          }
        } catch (error) {
          console.error("Reconnection failed:", error);
        }
      }
    };

    handleReconnection();
  }, [socketStatus, lobbyId]);

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
          <div className="flex-1 flex flex-col lg:flex-row w-full relative">
            {lobby.gameState === GAME_STATE.PICKING_WORD &&
              lobby.currentDrawer !== user.username && (
                <div className="flex-1 flex flex-col items-center justify-center">
                  <p className="text-3xl font-bold mb-6 bg-gradient-to-r from-indigo-500/80 via-purple-500/80 to-blue-500/80 text-white px-8 py-4 rounded-lg shadow-lg text-center">
                    Waiting for {lobby.currentDrawer} to pick a word...
                  </p>
                </div>
              )}
            {/* Left Sidebar */}
            <div
              className="w-full lg:w-auto lg:flex flex-col gap-4 overflow-x-hidden transition-all duration-200 ease-in-out"
              style={{
                width: isMobile ? "100%" : `${leftSidebarWidth}px`,
                minWidth: isMobile ? "auto" : "200px",
                maxWidth: isMobile ? "none" : "400px",
              }}
            >
              <PlayerList
                players={lobby.players}
                drawerUsername={lobby.currentDrawer}
                roomId={roomId}
                lobbyId={lobbyId}
                gameState={lobby.gameState}
                currentUsername={user.username}
                isAdmin={user.isAdmin}
                onStartGame={() => socketManager.startGame(roomId)}
              />
              <GameSettings lobby={lobby} />
            </div>

            {/* Left Resize Handle */}
            <div
              className="hidden lg:flex w-1 hover:w-2 mx-2 cursor-col-resize group transition-all"
              onMouseDown={(e) => {
                isDraggingRef.current = true;
                activeHandleRef.current = "left";
                document.body.style.cursor = "col-resize";
                e.preventDefault();
              }}
            >
              <div className="w-full h-full bg-gray-200 dark:bg-gray-600 group-hover:bg-indigo-400 dark:group-hover:bg-indigo-500 transition-colors" />
            </div>

            <div className="flex-1 flex flex-col gap-4 min-w-0">
              <PixelCanvas
                isDrawer={lobby.currentDrawer === user.username}
                drawerUsername={lobby.currentDrawer}
                gridSize={lobby.gridSize}
                lobbyId={lobby._id}
                roomId={roomId}
                gameState={lobby.gameState}
                canvasState={lobby.canvasState}
              />

              {lobby.gameState === GAME_STATE.FINISHED && (
                <div className="flex-1 flex items-center justify-center">
                  <p className="text-4xl font-bold bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500 text-white px-8 py-4 rounded-lg shadow-lg text-center">
                    Game Over! Thanks for playing!
                  </p>
                </div>
              )}
            </div>

            {/* Right Resize Handle */}
            <div
              className="hidden lg:flex w-1 hover:w-2 mx-2 cursor-col-resize group transition-all"
              onMouseDown={(e) => {
                isDraggingRef.current = true;
                activeHandleRef.current = "right";
                document.body.style.cursor = "col-resize";
                e.preventDefault();
              }}
            >
              <div className="w-full h-full bg-gray-200 dark:bg-gray-600 group-hover:bg-indigo-400 dark:group-hover:bg-indigo-500 transition-colors" />
            </div>

            <div
              className="w-full lg:w-auto lg:flex flex-col gap-4 overflow-x-hidden transition-all duration-200 ease-in-out"
              style={{
                width: isMobile ? "100%" : `${rightSidebarWidth}px`,
                minWidth: isMobile ? "auto" : "250px",
                maxWidth: isMobile ? "none" : "500px",
              }}
            >
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

        {lobby.gameState === GAME_STATE.DRAW_END && (
          <DrawEndModal
            lobby={lobby}
            word={lobby.currentWord}
            drawer={lobby.currentDrawer}
            players={lobby.players}
            cooldownTime={8}
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
          />
        )}
      </div>
    </Transition>
  );
};

export default GameRoom;
