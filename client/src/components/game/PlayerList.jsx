import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";

import ContextMenu from "./menus/ContextMenu";
import ReportModal from "./menus/ReportModal";
import { GAME_STATE } from "../../constants";
import { socketManager } from "../../services/socketManager";
import { FaUser } from "react-icons/fa";
const PlayerList = ({
  players,
  drawerUsername,
  roomId,
  gameState,
  currentUsername,
  isAdmin,
  onStartGame,
}) => {
  const navigate = useNavigate();
  const [showPopup, setShowPopup] = useState(false);
  const [contextMenu, setContextMenu] = useState(null);
  const [reportModal, setReportModal] = useState(null);
  const [chatLogs, setChatLogs] = useState([]);
  const [canvasState, setCanvasState] = useState(null);

  // Set up chat history and canvas state for reports
  useEffect(() => {
    if (socketManager.isConnected()) {
      const unsubscribeChatHistory = socketManager.onChatHistory((messages) => {
        if (Array.isArray(messages)) {
          setChatLogs(messages);
        }
      });

      const unsubscribeCanvas = socketManager.onCanvasUpdate((data) => {
        if (data?.canvasState?.data) {
          setCanvasState(data.canvasState);
        }
      });

      // Request chat history when component mounts
      socketManager.requestChatHistory(roomId, currentUsername);

      return () => {
        unsubscribeChatHistory();
        unsubscribeCanvas();
      };
    }
  }, [roomId, currentUsername]);

  const handleInviteLink = () => {
    navigator.clipboard.writeText(window.location.href);
    setShowPopup(true);
    setTimeout(() => setShowPopup(false), 2000);
  };

  const handlePlayerClick = (e, player) => {
    e.preventDefault();
    const rect = e.currentTarget.getBoundingClientRect();
    const x = e.clientX;
    const y = rect.top; // Position menu at the top of the clicked element

    if (player.username === currentUsername) {
      return setContextMenu({
        x,
        y,
        options: [
          {
            label: "Leave Game",
            onClick: () => {
              socketManager.leaveLobby(roomId, currentUsername);
              navigate("/");
            },
            isDestructive: true,
          },
        ],
      });
    }

    setContextMenu({
      x,
      y,
      options: [
        {
          label: "View Profile",
          onClick: () => window.open(`/user/${player.username}`, "_blank"),
        },
        {
          label: "Report Player",
          onClick: () => setReportModal(player.username),
        },
        {
          label: "Kick Player",
          onClick: () => socketManager.kickPlayer(roomId, player.username),
          isDestructive: true,
          hidden: !isAdmin,
        },
      ],
    });
  };

  const closeContextMenu = () => {
    setContextMenu(null);
  };

  const closeReportModal = () => {
    setReportModal(null);
  };

  const getPlayerBackgroundClass = (player) => {
    const baseClass = "border-2 ";

    if (gameState === GAME_STATE.DRAWING) {
      if (player.username === drawerUsername) {
        return (
          baseClass +
          "bg-emerald-100 dark:bg-emerald-900/40 border-emerald-300 dark:border-emerald-700"
        );
      }
      if (player.hasGuessedCorrect) {
        return (
          baseClass +
          "bg-green-50 dark:bg-green-900/40 border-green-300 dark:border-green-700"
        );
      }
    }
    if (player.username === currentUsername) {
      return (
        baseClass +
        "bg-white/80 dark:bg-gray-800/80 border-indigo-300 dark:border-indigo-600"
      );
    }
    return (
      baseClass +
      "bg-gray-50/80 dark:bg-gray-800/60 border-gray-200 dark:border-gray-600"
    );
  };

  const getPlayerStateIndicator = (player) => {
    if (gameState === GAME_STATE.DRAWING) {
      if (player.username === drawerUsername) {
        return (
          <div className="flex items-center gap-1 text-xs font-medium text-emerald-600 dark:text-emerald-400">
            <span className="animate-pulse">●</span> Drawing
          </div>
        );
      }
      if (player.hasGuessedCorrect) {
        return (
          <div className="flex items-center gap-1 text-xs font-medium text-green-600 dark:text-green-400">
            <span>✓</span> Guessed
          </div>
        );
      }
      return (
        <div className="flex items-center gap-1 text-xs font-medium text-gray-500 dark:text-gray-400">
          <span>○</span> Guessing
        </div>
      );
    }
    return null;
  };

  const getPlayerIcon = (player) => {
    if (
      drawerUsername === player.username &&
      gameState !== GAME_STATE.WAITING
    ) {
      return (
        <img src="/pencil.gif" alt="drawing" className="w-8 h-8 rounded-full" />
      );
    }

    if (player.hasDrawn) {
      return (
        <div className="w-8 h-8 rounded-full bg-gray-200 dark:bg-gray-600 flex items-center justify-center">
          <svg
            className="h-4 w-4 text-gray-600 dark:text-gray-300"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M5 13l4 4L19 7"
            />
          </svg>
        </div>
      );
    }

    return (
      <div className="w-8 h-8 rounded-full bg-gray-200 dark:bg-gray-600 flex items-center justify-center">
        <svg
          className="h-5 w-5 text-gray-600 dark:text-gray-300"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"
          />
        </svg>
      </div>
    );
  };

  // Sort players: drawer first, then by score
  const sortedPlayers = [...players].sort((a, b) => {
    if (a.username === drawerUsername) return -1;
    if (b.username === drawerUsername) return 1;
    return b.score - a.score;
  });

  return (
    <div className="bg-gray-100 dark:bg-gray-700 p-2 shadow-lg relative flex-1 flex flex-col transition-colors">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-2 gap-2 sm:gap-0">
        <h3 className="text-lg font-bold text-gray-800 dark:text-gray-200">
          <span className="hidden sm:inline">Players</span>
          <FaUser className="sm:hidden" />
        </h3>
        <div className="relative flex w-full sm:w-auto gap-2">
          <button
            className="flex-1 sm:flex-none bg-indigo-600 text-white px-4 py-2 rounded-md hover:bg-indigo-700 text-sm sm:text-base min-h-[40px]"
            onClick={handleInviteLink}
          >
            Invite
          </button>
          <button
            className="flex-1 sm:flex-none bg-green-600 text-white px-4 py-2 rounded-md hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed text-sm sm:text-base min-h-[40px]"
            onClick={onStartGame}
            disabled={gameState !== GAME_STATE.WAITING}
          >
            Start Game
          </button>
          {showPopup && (
            <div className="absolute top-full sm:top-0 left-0 sm:left-full mt-2 sm:mt-0 sm:ml-4 bg-indigo-500 text-white text-sm px-4 py-2 rounded-lg shadow-lg z-50">
              Link copied to clipboard!
            </div>
          )}
        </div>
      </div>
      <ul className="space-y-1 overflow-y-auto">
        {sortedPlayers.map((player, index) => (
          <li
            key={`player-${player.username}-${index}`}
            onClick={(e) => handlePlayerClick(e, player)}
            onContextMenu={(e) => {
              e.preventDefault();
              handlePlayerClick(e, player);
            }}
            className={`flex items-center gap-2 p-2 rounded-md transition-all duration-200 cursor-pointer relative
          ${getPlayerBackgroundClass(player)}
          ${player.hasDrawn ? "opacity-90" : "hover:opacity-95"}`}
          >
            {getPlayerIcon(player)}

            <div className="flex flex-col w-full">
              <div className="flex justify-between items-center">
                <span className="text-gray-800 dark:text-gray-200 font-medium text-sm">
                  {player.username}
                </span>
                <span className="text-indigo-500 dark:text-indigo-400 font-bold text-sm drop-shadow-[0_0_3px_rgba(99,102,241,0.5)] transition-all">
                  {player.score || player.roundScore || player.drawScore || 0}
                </span>
              </div>
              {getPlayerStateIndicator(player)}
            </div>
          </li>
        ))}
      </ul>
      {contextMenu && (
        <ContextMenu
          x={contextMenu.x}
          y={contextMenu.y}
          onClose={closeContextMenu}
          options={contextMenu.options}
        />
      )}
      {reportModal && (
        <ReportModal
          reportedUser={reportModal}
          onClose={closeReportModal}
          chatLogs={chatLogs}
          currentUsername={currentUsername}
          roomId={roomId}
          canvasState={canvasState}
        />
      )}
    </div>
  );
};

export default PlayerList;
