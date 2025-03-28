import React, { useState, useEffect } from 'react';
import { GAME_STATE } from '../../../../shared/constants';

const RoundSummaryModal = ({ isOpen, gameState, onClose, summaryData }) => {
  const [timeLeft, setTimeLeft] = useState(100);
  const SUMMARY_DURATION = 10000; // 10 seconds

  useEffect(() => {
    if (isOpen) {
      setTimeLeft(100);
      const startTime = Date.now();
      
      const intervalId = setInterval(() => {
        const elapsed = Date.now() - startTime;
        const remaining = Math.max(0, 100 - (elapsed / SUMMARY_DURATION) * 100);
        setTimeLeft(remaining);
        
        if (remaining <= 0) {
          clearInterval(intervalId);
          onClose();
        }
      }, 50);

      return () => clearInterval(intervalId);
    }
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-xl max-w-md w-full">
        <h2 className="text-2xl font-bold mb-4 text-gray-800 dark:text-white">
          {gameState === GAME_STATE.FINISHED ? 'Game Over!' : 'Round Complete!'}
        </h2>
        
        {summaryData && (
          <div className="space-y-4">
            <p className="text-gray-600 dark:text-gray-300">
              The word was: <span className="font-bold">{summaryData.word}</span>
            </p>
            <div className="space-y-2">
              {summaryData.players?.map((player) => (
                <div key={player.username} className="flex justify-between">
                  <span className="text-gray-700 dark:text-gray-300">{player.username}</span>
                  <span className="font-bold text-green-600 dark:text-green-400">
                    +{player.roundPoints || 0}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}

        <div className="mt-4 w-full h-2 bg-gray-200 rounded-full overflow-hidden">
          <div
            className="h-full bg-blue-500 transition-all duration-50 ease-linear"
            style={{ width: `${timeLeft}%` }}
          />
        </div>
      </div>
    </div>
  );
};

export default RoundSummaryModal;
