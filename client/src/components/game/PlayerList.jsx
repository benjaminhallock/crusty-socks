import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Dialog, Transition } from "@headlessui/react";
import { Fragment } from "react";
import { FaUser, FaCopy, FaCog, FaPlay } from "react-icons/fa";

import ContextMenu from "./menus/ContextMenu";
import ReportModal from "./menus/ReportModal";
import { GAME_STATE } from "../../constants";
import { socketManager } from "../../services/socketManager";
import Button from "../common/ui/Button";
import GameSettings from "./GameSettings";
const PlayerList = ({
  players,
  drawerUsername,
  roomId,
  gameState,
  currentUsername,
  isAdmin,
  onStartGame,
  lobby,
}) => {
  const navigate = useNavigate();
  const [showPopup, setShowPopup] = useState(false);
  const [contextMenu, setContextMenu] = useState(null);
  const [reportModal, setReportModal] = useState(null);
  const [chatLogs, setChatLogs] = useState([]);
  const [canvasState, setCanvasState] = useState(null);
  const [showSettings, setShowSettings] = useState(false);

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
    const y = rect.top;

    if (player.username === currentUsername) {
      setContextMenu({
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
      return;
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

  const categoryMap = {
    random: "Random 🎲",
    animals: "Animals 🐘",
    food: "Food 🍕",
    objects: "Objects 📱",
    vehicles: "Vehicles 🚗",
    sports: "Sports ⚽",
    "video games": "Video Games 🎮",
  };

  const sortedPlayers = [...players].sort((a, b) => {
    if (gameState === GAME_STATE.DRAWING) {
      if (a.username === drawerUsername) return -1;
      if (b.username === drawerUsername) return 1;
    }
    if (a.score !== b.score) return b.score - a.score;
    if ((b.roundScore || 0) !== (a.roundScore || 0)) {
      return (b.roundScore || 0) - (a.roundScore || 0);
    }
    return (b.drawScore || 0) - (a.drawScore || 0);
  });

  return (
    <div className="w-full bg-white/95 dark:bg-gray-800/95 p-2 shadow-sm rounded-lg relative flex flex-col transition-colors border border-gray-200/50 dark:border-gray-700/50">
      <div className="flex justify-between items-center mb-2 px-1">
        <h3 className="text-xs font-medium text-gray-700 dark:text-gray-300 flex items-center gap-1.5">
          <GameSettings lobby={lobby} />
          <FaUser className="w-3 h-3 text-gray-500 dark:text-gray-400" />
          <span className="tracking-wide uppercase">
            {players.length === 1 ? "1" : `${players.length}`}
          </span>
        </h3>

        <div className="flex gap-1">
          {gameState === GAME_STATE.WAITING &&
            lobby.userId === currentUsername && (
              <Button
                onClick={() => setShowSettings(true)}
                title="Game Settings"
                variant="secondary"
                size="sm"
                className="flex items-center justify-center w-6 h-6"
              >
                <FaCog className="w-3 h-3" />
              </Button>
            )}
          <Button
            onClick={handleInviteLink}
            title="Invite Players"
            variant="secondary"
            size="md"
            className=""
          >
            <span className="sr-only">Copy Invite Link</span>
            <FaCopy className="w-3 h-3" />
            {showPopup && (
              <div className="absolute -top-8 left-1/2 -translate-x-1/2 bg-black/75 text-white text-[10px] px-2 py-0.5 rounded">
                Copied!
              </div>
            )}
          </Button>
          {gameState === GAME_STATE.WAITING && (
            <Button
              onClick={onStartGame}
              title="Start Game"
              variant="primary"
              size="sm"
              className="flex items-center justify-center gap-1 px-2 py-1 text-sm"
            >
              <span>Start Game</span>
            </Button>
          )}
        </div>
      </div>

      <ul className="space-y-1 overflow-y-auto max-h-[calc(100vh-20rem)]">
        {sortedPlayers.map((player, index) => (
          <li
            key={`player-${player.username}-${index}`}
            onClick={(e) => handlePlayerClick(e, player)}
            onContextMenu={(e) => {
              e.preventDefault();
              handlePlayerClick(e, player);
            }}
            className={`flex items-center gap-2 p-1.5 rounded-md transition-all duration-200 cursor-pointer relative border
              ${
                player.username === currentUsername
                  ? "bg-white/80 dark:bg-gray-800/80 border-indigo-300 dark:border-indigo-600"
                  : player.username === drawerUsername &&
                    gameState === GAME_STATE.DRAWING
                  ? "bg-emerald-50/80 dark:bg-emerald-900/30 border-emerald-300 dark:border-emerald-700"
                  : player.hasGuessedCorrect
                  ? "bg-green-50/80 dark:bg-green-900/30 border-green-300 dark:border-green-700"
                  : "bg-gray-50/80 dark:bg-gray-800/50 border-gray-200 dark:border-gray-600"
              }`}
          >
            <div className="w-7 h-7 rounded-full bg-gray-100 dark:bg-gray-700 flex items-center justify-center flex-shrink-0">
              {drawerUsername === player.username &&
              gameState !== GAME_STATE.WAITING ? (
                <img
                  src="/pencil.gif"
                  alt="drawing"
                  className="w-7 h-7 rounded-full"
                />
              ) : (
                <FaUser className="w-3.5 h-3.5 text-gray-500 dark:text-gray-400" />
              )}
            </div>

            <div className="flex flex-col min-w-0 flex-1">
              <div className="flex justify-between items-center gap-2">
                <span className="text-gray-800 dark:text-gray-200 font-medium text-xs truncate">
                  {player.username}
                </span>
                <span className="text-indigo-500 dark:text-indigo-400 font-bold text-xs">
                  {player.score || player.roundScore || player.drawScore || 0}
                </span>
              </div>
              {getPlayerStateIndicator(player) && (
                <div className="text-[10px] text-gray-500 dark:text-gray-400">
                  {getPlayerStateIndicator(player)}
                </div>
              )}
            </div>
          </li>
        ))}
      </ul>

      <Transition appear show={showSettings} as={Fragment}>
        <Dialog
          as="div"
          className="relative z-50"
          onClose={() => setShowSettings(false)}
        >
          <Transition.Child
            as={Fragment}
            enter="ease-out duration-200"
            enterFrom="opacity-0"
            enterTo="opacity-100"
            leave="ease-in duration-150"
            leaveFrom="opacity-100"
            leaveTo="opacity-0"
          >
            <div className="fixed inset-0 bg-black/25 backdrop-blur-sm" />
          </Transition.Child>

          <div className="fixed inset-0 overflow-y-auto">
            <div className="flex min-h-full items-center justify-center p-4">
              <Transition.Child
                as={Fragment}
                enter="ease-out duration-200"
                enterFrom="opacity-0 scale-95"
                enterTo="opacity-100 scale-100"
                leave="ease-in duration-150"
                leaveFrom="opacity-100 scale-100"
                leaveTo="opacity-0 scale-95"
              >
                <Dialog.Panel className="w-full max-w-md transform overflow-hidden rounded-lg bg-white dark:bg-gray-800 p-6 shadow-xl transition-all">
                  <Dialog.Title className="text-lg font-medium text-gray-900 dark:text-gray-100 mb-4">
                    Game Settings
                  </Dialog.Title>

                  <div className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                      <div className="bg-gray-50 dark:bg-gray-700/50 p-3 rounded-lg">
                        <div className="text-xs text-gray-500 dark:text-gray-400">
                          Rounds
                        </div>
                        <div className="text-sm font-medium text-gray-900 dark:text-gray-100">
                          {lobby?.maxRounds}
                        </div>
                      </div>
                      <div className="bg-gray-50 dark:bg-gray-700/50 p-3 rounded-lg">
                        <div className="text-xs text-gray-500 dark:text-gray-400">
                          Time per Round
                        </div>
                        <div className="text-sm font-medium text-gray-900 dark:text-gray-100">
                          {lobby.roundTime}s
                        </div>
                      </div>
                      <div className="bg-gray-50 dark:bg-gray-700/50 p-3 rounded-lg">
                        <div className="text-xs text-gray-500 dark:text-gray-400">
                          Word Choices
                        </div>
                        <div className="text-sm font-medium text-gray-900 dark:text-gray-100">
                          {lobby.selectWord}
                        </div>
                      </div>
                      <div className="bg-gray-50 dark:bg-gray-700/50 p-3 rounded-lg">
                        <div className="text-xs text-gray-500 dark:text-gray-400">
                          Hint Letters
                        </div>
                        <div className="text-sm font-medium text-gray-900 dark:text-gray-100">
                          {lobby.revealCharacters}%
                        </div>
                      </div>
                    </div>
                    <div className="bg-gray-50 dark:bg-gray-700/50 p-3 rounded-lg">
                      <div className="text-xs text-gray-500 dark:text-gray-400">
                        Category
                      </div>
                      <div className="text-sm font-medium text-gray-900 dark:text-gray-100">
                        {categoryMap[lobby.selectCategory] ||
                          lobby.selectCategory}
                      </div>
                    </div>
                  </div>

                  <div className="mt-6">
                    <Button
                      onClick={() => setShowSettings(false)}
                      variant="secondary"
                      size="sm"
                      fullWidth
                    >
                      Close
                    </Button>
                  </div>
                </Dialog.Panel>
              </Transition.Child>
            </div>
          </div>
        </Dialog>
      </Transition>

      {contextMenu && (
        <ContextMenu
          x={contextMenu.x}
          y={contextMenu.y}
          onClose={() => setContextMenu(null)}
          options={contextMenu.options}
        />
      )}

      {reportModal && (
        <ReportModal
          reportedUser={reportModal}
          onClose={() => setReportModal(null)}
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
