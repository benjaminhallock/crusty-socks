import { useEffect, useState, Fragment } from "react";
import { Dialog, Transition } from "@headlessui/react";
import { socketManager } from "../../../services/socketManager";

const DrawEndModal = ({
  lobby,
  word,
  drawer,
  players,
  cooldownTime = 8,
  onClose,
}) => {
  const [timeLeft, setTimeLeft] = useState(cooldownTime);
  const [isOpen, setIsOpen] = useState(true);

  function closeModal() {
    setIsOpen(false);
    onClose?.();
  }

  // Simplified effect to just handle countdown
  useEffect(() => {
    setTimeLeft(cooldownTime);
    const timer = setInterval(() => {
      setTimeLeft((prev) => Math.max(0, prev - 1));
    }, 1000);

    return () => clearInterval(timer);
  }, [cooldownTime]);

  // Auto-close when time runs out or game state changes
  useEffect(() => {
    if (timeLeft === 0 || lobby.gameState !== "DRAW_END") {
      closeModal();
    }
  }, [timeLeft, lobby.gameState]);

  // Filter and sort players who guessed correctly by their guess order
  const correctGuessers = players
    .filter((p) => p.hasGuessedCorrect && p.username !== drawer)
    .sort((a, b) => (a.guessTime || 0) - (b.guessTime || 0));

  const drawerPlayer = players.find((p) => p.username === drawer);

  // Calculate total points for this turn
  const totalDrawerPoints = drawerPlayer?.drawScore || 0;
  const totalGuesserPoints = correctGuessers.reduce(
    (sum, player) => sum + (player.drawScore || 0),
    0
  );
  const totalRoundPoints = totalDrawerPoints + totalGuesserPoints;

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
                  Drawing Complete!
                </Dialog.Title>

                <p className="text-lg mb-4 text-gray-600 dark:text-gray-400">
                  The word was:{" "}
                  <span className="font-bold text-indigo-600 dark:text-indigo-400">
                    {word}
                  </span>
                </p>

                <div className="mb-6 bg-indigo-50 dark:bg-indigo-900/30 rounded-lg p-4">
                  <h3 className="font-semibold mb-2 text-indigo-800 dark:text-indigo-200">
                    {drawer}&apos;s Drawing Results:
                  </h3>
                  {correctGuessers.length > 0 ? (
                    <div className="space-y-2">
                      {correctGuessers.map((player) => (
                        <div
                          key={player.username}
                          className="flex justify-between items-center bg-white/80 dark:bg-gray-700/50 p-2 rounded"
                        >
                          <span className="text-gray-700 dark:text-gray-300">
                            {player.username}
                          </span>
                          <span className="font-medium text-green-600 dark:text-green-400">
                            +{player.drawScore || 0} pts
                          </span>
                        </div>
                      ))}
                      <div className="flex justify-between items-center mt-2 pt-2 border-t border-indigo-200 dark:border-indigo-700">
                        <span className="text-gray-700 dark:text-gray-300">
                          Drawer Points:
                        </span>
                        <span className="font-medium text-green-600 dark:text-green-400">
                          +{totalDrawerPoints} pts
                          {correctGuessers.length === players.length - 1 && (
                            <span className="ml-1 text-xs text-indigo-500">
                              (includes 20pt bonus!)
                            </span>
                          )}
                        </span>
                      </div>

                      <div className="flex justify-between items-center mt-2 pt-2 border-t border-indigo-200 dark:border-indigo-700 font-bold">
                        <span className="text-gray-800 dark:text-gray-200">
                          Total Round Points:
                        </span>
                        <span className="text-green-600 dark:text-green-400">
                          +{totalRoundPoints} pts
                        </span>
                      </div>
                    </div>
                  ) : (
                    <p className="text-gray-500 dark:text-gray-400">
                      No one guessed the word!
                    </p>
                  )}
                </div>

                <div className="w-full bg-gray-200 dark:bg-gray-700 h-2 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-indigo-600 transition-all duration-1000"
                    style={{ width: `${(timeLeft / cooldownTime) * 100}%` }}
                  />
                </div>

                <div className="flex flex-col items-center gap-4 mt-4">
                  <p className="text-center text-gray-600 dark:text-gray-400">
                    Next drawing in {timeLeft}s
                  </p>
                </div>
              </Dialog.Panel>
            </Transition.Child>
          </div>
        </div>
      </Dialog>
    </Transition>
  );
};

export default DrawEndModal;
