import { useEffect, useState } from 'react';

import { GAME_STATE } from '../../constants';

// RoundSummaryModal component displays a summary of the round
// Includes player rankings, points earned, and a countdown to the next round or game over
const RoundSummaryModal = ({ 
  isOpen, // Whether the modal is open
  onClose, // Callback to close the modal
  players, // List of players with their scores and round points
  roundNumber, // Current round number
  maxRounds, // Total number of rounds in the game
  gameState // Current game state
}) => {
  const [timeLeft, setTimeLeft] = useState(10); // State to track the remaining time for the summary
  const SUMMARY_DURATION = 10; // Duration of the summary in seconds

  // Effect to manage the countdown timer
  useEffect(() => {
    let timer;
    if (isOpen) {
      setTimeLeft(SUMMARY_DURATION); // Reset timer when modal opens
      
      // Start countdown timer
      timer = setInterval(() => {
        setTimeLeft((prev) => {
          if (prev <= 1) {
            clearInterval(timer);
            onClose(); // Auto-close and start next round when timer reaches 0
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    }
    
    // Cleanup timer on unmount or when modal closes
    return () => {
      if (timer) clearInterval(timer);
    };
  }, [isOpen, onClose]);

  if (!isOpen) return null; // Do not render if the modal is not open

  // Check if all players have drawn
  const allPlayersHaveDrawn = players.every((player) => player.hasDrawn);

  // Only show the full round summary when all players have drawn
  if (!allPlayersHaveDrawn && gameState === GAME_STATE.DRAW_END) {
    return null;
  }

  // Sort players by their roundPoints for this round
  const sortedPlayers = [...players].sort((a, b) => (b.roundPoints || 0) - (a.roundPoints || 0));

  // Calculate timer bar width percentage
  const timerPercentage = (timeLeft / SUMMARY_DURATION) * 100;

  const isGameOver = roundNumber >= maxRounds; // Check if the game is over

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 backdrop-blur-sm flex items-center justify-center z-50">
      <div className="bg-white dark:bg-gray-800 rounded-lg p-6 max-w-md w-full mx-4 shadow-xl">
        <h2 className="text-2xl font-bold mb-4 text-gray-800 dark:text-gray-200">
          {isGameOver ? 'Game Over!' : `Round ${roundNumber} Complete!`}
        </h2>
        
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
                  {/* Points earned this round with animation */}
                  {(player.roundPoints > 0) && (
                    <span className="font-bold text-green-600 dark:text-green-400 text-lg animate-bounce">
                      +{player.roundPoints} pts
                    </span>
                  )}
                  {(player.roundPoints === 0) && (
                    <span className="text-gray-500 dark:text-gray-400">
                      +0 pts
                    </span>
                  )}
                  {/* Total score */}
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
            {/* Timer bar */}
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
              onClick={onClose}
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
            <h3 className="text-xl font-bold text-indigo-600 dark:text-indigo-400 mb-2">
              Game Over!
            </h3>
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
            <p className="text-gray-600 dark:text-gray-400">
              Winner: <span className="font-bold text-indigo-600 dark:text-indigo-400">{sortedPlayers[0]?.username}</span> with <span className="font-bold text-green-600 dark:text-green-400">{sortedPlayers[0]?.score}</span> points!
            </p>
          </div>
        )}
      </div>
    </div>
  );
};

export default RoundSummaryModal;
