import { useEffect, useState } from "react";
import Modal from "../../common/ui/Modal";
import { GAME_STATE as gs } from "../../../constants";

const DrawEndModal = ({
  lobby,
  word,
  drawer,
  players,
  cooldownTime = 6,
  onClose,
}) => {
  const [timeLeft, setTimeLeft] = useState(cooldownTime);

  // Add logging for modal lifecycle
  useEffect(() => {
    console.log("[DrawEndModal] Rendering with state:", {
      gameState: lobby.gameState,
      word,
      drawer,
      timeLeft,
      isCorrectState: lobby.gameState === gs.DRAW_END,
    });
  }, [lobby.gameState, word, drawer, timeLeft]);

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
    if (timeLeft === 0 || lobby.gameState !== gs.DRAW_END) {
      onClose?.();
    }
  }, [timeLeft, lobby.gameState, onClose]);

  // Get drawer's info and score
  const drawerPlayer = players.find((p) => p.username === drawer);
  const drawerScore = drawerPlayer?.drawScore || 0;

  // Filter and sort players who guessed correctly by their guess time
  const correctGuessers = players
    .filter((p) => p.hasGuessedCorrect && p.username !== drawer)
    .sort((a, b) => (a.guessTime || 0) - (b.guessTime || 0));

  // Calculate total points for this draw
  const totalGuesserPoints = correctGuessers.reduce(
    (sum, player) => sum + (player.drawScore || 0),
    0
  );
  const totalRoundPoints = drawerScore + totalGuesserPoints;
  const allPlayersGuessed = correctGuessers.length === players.length - 1;

  return (
    <Modal
      isOpen={lobby.gameState === gs.DRAW_END}
      onClose={onClose}
      title="Drawing Complete!"
      size="lg"
      position="center"
      showCloseButton={true}
    >
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
              <div className="flex items-center gap-2">
                <span className="font-medium text-green-600 dark:text-green-400">
                  +{drawerScore} pts
                </span>
                {allPlayersGuessed && (
                  <span className="text-xs text-indigo-500 dark:text-indigo-400">
                    (includes bonus!)
                  </span>
                )}
              </div>
            </div>

            <div className="flex justify-between items-center mt-2 pt-2 border-t border-indigo-200 dark:border-indigo-700 font-bold">
              <span className="text-gray-800 dark:text-gray-200">
                Total Points:
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
    </Modal>
  );
};

export default DrawEndModal;
