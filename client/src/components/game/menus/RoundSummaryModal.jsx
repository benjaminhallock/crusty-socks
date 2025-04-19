import { useEffect, useState } from "react";
import Modal from "../../common/ui/Modal";
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
  const [timeLeft, setTimeLeft] = useState(5);
  const SUMMARY_DURATION = 5;

  // Add logging for modal lifecycle and props
  useEffect(() => {
    console.log("[RoundSummaryModal] Rendering with state:", {
      lobbyGameState: lobby.gameState,
      isOpen: propIsOpen,
      roundNumber,
      maxRounds,
      timeLeft,
      isCorrectState: lobby.gameState === GAME_STATE.ROUND_END,
      playerCount: players.length,
    });
  }, [
    lobby.gameState,
    propIsOpen,
    roundNumber,
    maxRounds,
    timeLeft,
    players.length,
  ]);

  // Effect to handle countdown
  useEffect(() => {
    if (lobby.gameState !== GAME_STATE.ROUND_END) return;

    setTimeLeft(SUMMARY_DURATION);
    const timer = setInterval(() => {
      setTimeLeft((prev) => Math.max(0, prev - 1));
    }, 1000);

    return () => clearInterval(timer);
  }, [lobby.gameState]);

  // Auto-close when time runs out or game state changes
  useEffect(() => {
    if (timeLeft === 0 || lobby.gameState !== GAME_STATE.ROUND_END) {
      onClose?.();
    }
  }, [timeLeft, lobby.gameState, onClose]);

  // Sort players by their total score (score + roundScore)
  const sortedPlayers = [...players].sort(
    (a, b) => b.score + (b.roundScore || 0) - (a.score + (a.roundScore || 0))
  );

  const timerPercentage = (timeLeft / SUMMARY_DURATION) * 100;

  return (
    <Modal
      isOpen={lobby.gameState === GAME_STATE.ROUND_END}
      onClose={onClose}
      title={`Round ${roundNumber} Complete!`}
      size="md"
      position="center"
      showCloseButton={true}
    >
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
                <span className="text-sm text-gray-500 dark:text-gray-400">
                  Total: {player.score + (player.roundScore || 0)}
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="text-center">
        <div className="p-4 bg-gradient-to-r from-indigo-500 via-purple-500 to-purple-800 rounded-lg text-white">
          <h3 className="text-xl font-bold mb-2">Round Over!</h3>
          <p>
            Leader:{" "}
            <span className="font-bold">{sortedPlayers[0]?.username}</span> with{" "}
            <span className="font-bold">
              {sortedPlayers[0]?.score + (sortedPlayers[0]?.roundScore || 0)}
            </span>{" "}
            points!
          </p>
        </div>
      </div>
    </Modal>
  );
};

export default RoundSummaryModal;
