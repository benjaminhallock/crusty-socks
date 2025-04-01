import React, { useState } from "react";
import { socketManager } from "../../services/socket";
import { GAME_STATE } from "../../../../shared/constants";
import ContextMenu from "./ContextMenu";
import { createReport } from "../../services/reports";

const PlayerList = ({
  players,
  drawerUsername,
  roomId,
  gameState,
  currentUsername,
  isAdmin,
  chatLogs = [], // Add this prop
}) => {
  const [showPopup, setShowPopup] = useState(false);
  const [contextMenu, setContextMenu] = useState(null);

  const handleInviteLink = () => {
    navigator.clipboard.writeText(window.location.href);
    setShowPopup(true);
    setTimeout(() => setShowPopup(false), 2000); // Hide popup after 2 seconds
  };

  const handleKickPlayer = (username) => {
    socketManager.kickPlayer(roomId, username);
  };

  const handlePlayerClick = (e, player) => {
    e.preventDefault();
    if (player.username === currentUsername) {
      return setContextMenu({
        x: e.pageX,
        y: e.pageY,
        options: [
          {
            label: "View Profile",
            onClick: () => window.open(`/profile/${currentUsername}`, '_blank'),
          },
          {
            label: "Edit Name",
            onClick: () => socketManager.updateUsername(roomId),
          },
          {
            label: "Leave Game",
            onClick: () => socketManager.leaveRoom(roomId),
            isDestructive: true,
          }
        ],
      });
    }
    setContextMenu({
      x: e.pageX,
      y: e.pageY,
      options: [
        {
          label: "Report Player",
          onClick: () => handleReportPlayer(player.username),
        },
        {
          label: "Kick Player",
          onClick: () => handleKickPlayer(player.username),
          isDestructive: true,
          disabled: !isAdmin,
        },
      ],
    });
  };

  const handleReportPlayer = async (username) => {
    const reportData = {
      reportedUser: username,
      reportedBy: currentUsername,
      roomId: roomId,
      reason: "Inappropriate behavior",
      chatLogs: chatLogs.slice(-10),
    };

    const result = await createReport(reportData);

    // Show toast notification
    const toast = document.createElement("div");
    toast.className =
      `fixed bottom-4 right-4 ${result.success ? 'bg-green-500' : 'bg-red-500'} 
       text-white px-4 py-2 rounded-lg flex items-center gap-2 shadow-lg z-50`;
    toast.innerHTML = `
      <span>${result.success ? 'Report submitted' : 'Failed to submit report'}</span>
      <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
        <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
      </svg>
    `;
    document.body.appendChild(toast);
    setTimeout(() => toast.remove(), 2000);

    setContextMenu(null);
  };

  const getPlayerBackgroundClass = (player) => {
    if (player.hasGuessedCorrect) return "bg-white dark:bg-gray-800";
    if (
      player.username === drawerUsername &&
      gameState === GAME_STATE.DRAWING
    ) {
      return "bg-emerald-200 dark:bg-emerald-800";
    }
    if (player.username === currentUsername)
      return "bg-white-100 dark:bg-grey-900";
    return "bg-gray-200 dark:bg-gray-700";
  };

  return (
    <div
      id="playerList"
      className="bg-gray-100 dark:bg-gray-800 rounded-lg p-2 shadow-lg relative flex-1 flex flex-col transition-colors"
    >
      <div className="flex justify-between items-center mb-2">
        <h3 className="text-lg font-bold text-gray-800 dark:text-gray-200">
          Players
        </h3>
        <div className="relative">
          <button
            onClick={handleInviteLink}
            className="bg-indigo-600 text-white px-2 py-1 rounded-md mr-2 hover:bg-indigo-700"
          >
            Invite
          </button>
          <button
            className="bg-green-600 text-white px-2 py-1 rounded-md hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed"
            onClick={() => socketManager.startGame(roomId)}
            disabled={gameState !== GAME_STATE.WAITING}
          >
            Start Game
          </button>
          {showPopup && (
            <div className="absolute top-0 left-full ml-4 bg-indigo-500 text-white text-sm px-4 py-2 rounded-lg shadow-lg z-50">
              Link copied to clipboard!
            </div>
          )}
        </div>
      </div>
      <ul className="space-y-1 overflow-y-auto">
        {players.map((player, index) => (
          <li
            key={`player-${player.username}-${index}`}
            onClick={(e) => handlePlayerClick(e, player)}
            onContextMenu={(e) => handlePlayerContext(e, player)}
            className={`flex items-center gap-2 p-2 rounded-md transition-colors duration-200 cursor-pointer
              ${getPlayerBackgroundClass(player)}
              ${player.hasDrawn ? "opacity-75" : "hover:opacity-90"}`}
          >
            {drawerUsername === player.username &&
            gameState !== GAME_STATE.WAITING ? (
              <img
                src="/pencil.gif"
                alt="drawing"
                className="w-8 h-8 rounded-full"
              />
            ) : !player.hasDrawn ? (
              // hamburger icon
              <div className="w-8 h-8 rounded-full bg-gray-000 dark:bg-grey-250 flex items-center justify-center">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  className="h-5 w-5 text-gray-800 dark:text-gray-100"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M4 6h16M4 12h16M4 18h16"
                  />
                </svg>
                {player.hasGuessedCorrect && (
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    className="h-3 w-3 text-white"
                    viewBox="0 0 20 20"
                    fill="currentColor"
                  >
                    <path
                      fillRule="evenodd"
                      d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                      clipRule="evenodd"
                    />
                  </svg>
                )}
              </div>
            ) : null}
            <span className="flex justify-between w-full text-gray-800 dark:text-gray-200 font-medium text-sm">
              <span className="flex items-center gap-2">
                {player.username}
                {player.hasGuessedCorrect && (
                  <span className="text-xs text-green-600 dark:text-green-400">
                    Finished!
                  </span>
                )}
              </span>
              <span className="score">{player.score}</span>
            </span>
          </li>
        ))}
      </ul>
      {contextMenu && (
        <ContextMenu {...contextMenu} onClose={() => setContextMenu(null)} />
      )}
    </div>
  );
};

export default PlayerList;
