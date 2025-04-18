import { useEffect, useState, Fragment } from "react";
import { Dialog, Transition } from "@headlessui/react";
import { GAME_STATE } from "../../../constants";

const RoundSummaryModal = ({
  lobby,
  isOpen: propIsOpen,
  onClose,
  players,
  roundNumber,
  maxRounds,
  gameState,
}) => {
  const [timeLeft, setTimeLeft] = useState(2);
  const [isOpen, setIsOpen] = useState(propIsOpen);
  const SUMMARY_DURATION = 2;

  function closeModal() {
    setIsOpen(false);
    onClose?.();
  }

  // Simplified effect to just handle countdown
  useEffect(() => {
    if (!propIsOpen) return;
    setIsOpen(true);
    setTimeLeft(SUMMARY_DURATION);
    const timer = setInterval(() => {
      setTimeLeft((prev) => Math.max(0, prev - 1));
    }, 1000);

    return () => clearInterval(timer);
  }, [propIsOpen]);

  // Auto-close when time runs out or game state changes
  useEffect(() => {
    if (timeLeft === 0 || lobby.gameState !== "ROUND_END") {
      closeModal();
    }
  }, [timeLeft, lobby.gameState]);

  // Check if all players have drawn
  const allPlayersHaveDrawn = players.every((player) => player.hasDrawn);
  if (!allPlayersHaveDrawn && gameState === GAME_STATE.DRAW_END) {
    return null;
  }

  // Sort players by their score for this round
  const sortedPlayers = [...players].sort((a, b) => b.score - a.score);
  const timerPercentage = (timeLeft / SUMMARY_DURATION) * 100;
  const isGameOver = roundNumber >= maxRounds;

  return (
    <Transition appear show={isOpen} as={Fragment}>
      <Dialog as="div" className="relative z-50" onClose={closeModal}>
        <Transition.Child
          as={Fragment}
          enter="ease-out duration-300"
          enterFrom="opacity-0"
          enterTo="opacity-100"
          leave="ease-in duration-200"
          leaveFrom="opacity-100"
          leaveTo="opacity-0"
        >
          <div className="fixed inset-0 bg-black bg-opacity-50 backdrop-blur-sm" />
        </Transition.Child>

        <div className="fixed inset-0 overflow-y-auto">
          <div className="flex min-h-full items-center justify-center p-4">
            <Transition.Child
              as={Fragment}
              enter="ease-out duration-300"
              enterFrom="opacity-0 scale-95"
              enterTo="opacity-100 scale-100"
              leave="ease-in duration-200"
              leaveFrom="opacity-100 scale-100"
              leaveTo="opacity-0 scale-95"
            >
              <Dialog.Panel className="bg-white dark:bg-gray-800 rounded-lg p-6 max-w-md w-full mx-4 shadow-xl relative">
                {/* Close button */}
                <button
                  onClick={closeModal}
                  className="absolute -top-2 -right-2 bg-gray-200 dark:bg-gray-700 rounded-full w-8 h-8 flex items-center justify-center text-gray-600 dark:text-gray-300 hover:bg-gray-300 dark:hover:bg-gray-600 transition-colors"
                >
                  ×
                </button>

                <Dialog.Title className="text-2xl font-bold mb-4 text-gray-800 dark:text-gray-200">
                  {isGameOver ? "Game Over!" : `Round ${roundNumber} Complete!`}
                </Dialog.Title>

                <div className="mb-6">
                  <div className="space-y-3">
                    {sortedPlayers.map((player, index) => (
                      <div
                        key={player.username}
                        className="flex justify-between items-center bg-indigo-50 dark:bg-indigo-900/30 p-3 rounded-lg"
                      >
                        <div className="flex items-center gap-3">
                          <span className="text-indigo-600 dark:text-indigo-400 font-medium">
                            #{index + 1}
                          </span>
                          <span className="text-gray-700 dark:text-gray-300">
                            {player.username}
                          </span>
                        </div>
                        <div className="flex flex-col items-end">
                          {player.roundScore > 0 && (
                            <span className="font-bold text-green-600 dark:text-green-400 text-lg animate-bounce">
                              +{player.roundScore} pts
                            </span>
                          )}
                          {player.roundScore === 0 && (
                            <span className="text-gray-500 dark:text-gray-400">
                              +0 pts
                            </span>
                          )}
                          <span className="text-xs text-gray-500 dark:text-gray-400">
                            Total: {player.score}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {!isGameOver ? (
                  <div className="text-center">
                    <div className="mb-4">
                      <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2.5">
                        <div
                          className="bg-indigo-600 h-2.5 rounded-full transition-all duration-1000 ease-linear"
                          style={{ width: `${timerPercentage}%` }}
                        />
                      </div>
                      <p className="mt-1 text-sm text-gray-600 dark:text-gray-400">
                        Next round in {timeLeft} seconds
                      </p>
                    </div>

                    <button
                      onClick={closeModal}
                      className="bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-2 px-6 rounded-lg transition-colors"
                    >
                      Next Round
                    </button>
                    <p className="mt-2 text-gray-600 dark:text-gray-400">
                      Round {roundNumber + 1} of {maxRounds} starting soon...
                    </p>
                  </div>
                ) : (
                  <div className="text-center">
                    <div className="mb-4">
                      <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2.5">
                        <div
                          className="bg-indigo-600 h-2.5 rounded-full transition-all duration-1000 ease-linear"
                          style={{ width: `${timerPercentage}%` }}
                        />
                      </div>
                      <p className="mt-1 text-sm text-gray-600 dark:text-gray-400">
                        Returning to lobby in {timeLeft} seconds
                      </p>
                    </div>

                    <div className="p-4 bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500 rounded-lg text-white">
                      <h3 className="text-xl font-bold mb-2">
                        🎉 Game Over! Final Results 🎉
                      </h3>
                      <p>
                        Winner:{" "}
                        <span className="font-bold">
                          {sortedPlayers[0]?.username}
                        </span>{" "}
                        with{" "}
                        <span className="font-bold">
                          {sortedPlayers[0]?.score}
                        </span>{" "}
                        points!
                      </p>
                    </div>
                  </div>
                )}
              </Dialog.Panel>
            </Transition.Child>
          </div>
        </div>
      </Dialog>
    </Transition>
  );
};

export default RoundSummaryModal;
