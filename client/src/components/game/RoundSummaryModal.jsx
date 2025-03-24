import React from 'react';

const RoundSummaryModal = ({ isOpen, word, players, onClose }) => {
  if (!isOpen) return null;

  // Filter and sort players by score change
  const roundResults = players
    .filter(player => player.hasGuessedCorrect || player.isDrawer)
    .sort((a, b) => (b.scoreChange || 0) - (a.scoreChange || 0));

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white dark:bg-gray-800 rounded-lg p-6 max-w-md w-full mx-4 shadow-xl">
        <h2 className="text-2xl font-bold mb-4 text-gray-800 dark:text-gray-200">
          Round Summary
        </h2>
        <p className="text-lg mb-4 text-gray-600 dark:text-gray-400">
          The word was: <span className="font-bold">{word}</span>
        </p>
        <div className="space-y-2">
          {roundResults.map((player, index) => (
            <div key={index} className="flex justify-between items-center">
              <span className="text-gray-700 dark:text-gray-300">
                {player.username} {player.isDrawer ? '(Drawer)' : ''}
              </span>
              <span className="font-bold text-green-600">
                +{player.scoreChange || 0}
              </span>
            </div>
          ))}
        </div>
        <button
          onClick={onClose}
          className="mt-6 w-full bg-blue-500 hover:bg-blue-600 text-white font-bold py-2 px-4 rounded transition-colors"
        >
          Continue
        </button>
      </div>
    </div>
  );
};

export default RoundSummaryModal;
