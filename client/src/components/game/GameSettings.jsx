import React, { useState } from 'react';

const GameSettings = ({ revealCharacters, maxRounds, selectWord, selectCategory, playerLimit }) => {
  const [expanded, setExpanded] = useState(false);

  // Map category values to readable labels with emojis
  const categoryMap = {
    random: "Random 🎲",
    animals: "Animals 🐘",
    food: "Food 🍕",
    objects: "Objects 📱",
    vehicles: "Vehicles 🚗",
    sports: "Sports ⚽",
  };

  return (
    <div className="mt-4 mb-2">
      <button 
        onClick={() => setExpanded(!expanded)}
        className="w-full py-2 px-4 bg-indigo-100 dark:bg-gray-700 hover:bg-indigo-200 dark:hover:bg-gray-600 rounded-lg text-left flex justify-between items-center transition-colors"
      >
        <span className="font-medium">Game Settings</span>
        <span className="text-xs">{expanded ? '▼' : '▶'}</span>
      </button>
      
      {expanded && (
        <div className="mt-2 p-3 bg-white/90 dark:bg-gray-800/90 rounded-lg shadow text-sm animate-fade-in">
          <ul className="space-y-2">
            <li className="flex justify-between">
              <span className="text-gray-600 dark:text-gray-300">Rounds:</span>
              <span className="font-medium">{maxRounds}</span>
            </li>
            <li className="flex justify-between">
              <span className="text-gray-600 dark:text-gray-300">Hint Letters:</span>
              <span className="font-medium">{revealCharacters}%</span>
            </li>
            <li className="flex justify-between">
              <span className="text-gray-600 dark:text-gray-300">Word Choices:</span>
              <span className="font-medium">{selectWord}</span>
            </li>
            <li className="flex justify-between">
              <span className="text-gray-600 dark:text-gray-300">Category:</span>
              <span className="font-medium">{categoryMap[selectCategory] || selectCategory}</span>
            </li>
            <li className="flex justify-between">
              <span className="text-gray-600 dark:text-gray-300">Player Limit:</span>
              <span className="font-medium">{playerLimit}</span>
            </li>
          </ul>
        </div>
      )}
    </div>
  );
};

export default GameSettings;
