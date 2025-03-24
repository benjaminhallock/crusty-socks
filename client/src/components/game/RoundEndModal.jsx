import React, { useEffect, useState } from 'react';

const RoundEndModal = ({ word, drawer, players, cooldownTime, onCooldownComplete }) => {
  const [timeLeft, setTimeLeft] = useState(cooldownTime);

  useEffect(() => {
    const timer = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 0) {
          clearInterval(timer);
          onCooldownComplete?.();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [cooldownTime, onCooldownComplete]);

  // Filter players who guessed correctly
  const correctGuessers = players.filter(p => p.hasGuessedCorrect && p.username !== drawer);

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div className="bg-white dark:bg-gray-800 rounded-lg p-6 max-w-md w-full mx-4">
        <h2 className="text-2xl font-bold text-gray-800 dark:text-gray-200 mb-4">
          Round Complete!
        </h2>
        <p className="text-lg mb-4 text-gray-600 dark:text-gray-400">
          The word was: <span className="font-bold text-indigo-600 dark:text-indigo-400">{word}</span>
        </p>
        
        <div className="mb-4">
          <h3 className="font-semibold mb-2">Correct Guesses:</h3>
          {correctGuessers.length > 0 ? (
            <ul className="space-y-1">
              {correctGuessers.map(player => (
                <li key={player.username} className="flex justify-between">
                  <span>{player.username}</span>
                  <span className="text-green-600">+100 points</span>
                </li>
              ))}
            </ul>
          ) : (
            <p className="text-gray-500">No one guessed correctly!</p>
          )}
        </div>

        <div className="mt-4">
          <div className="w-full h-2 bg-gray-200 rounded-full">
            <div
              className="h-full bg-indigo-600 rounded-full transition-all duration-1000"
              style={{ width: `${(timeLeft / cooldownTime) * 100}%` }}
            />
          </div>
          <p className="text-center mt-2">Next round starting in {timeLeft}s</p>
        </div>
      </div>
    </div>
  );
};

export default RoundEndModal;
