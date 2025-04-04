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
    'video games': "Video Games 🎮",
  };

  return (
    <div className="max-w-xs mx-auto mt-2 mb-1.5 sm:max-w-sm md:max-w-md lg:max-w-lg">
      <button 
        onClick={() => setExpanded(!expanded)}
        className="w-full flex items-center justify-between px-2 py-1 text-left rounded-lg bg-indigo-100 dark:bg-gray-700 hover:bg-indigo-200 dark:hover:bg-gray-600"
      >
        <span className="text-xs font-medium">Game Settings</span>
        <span className="text-xs">{expanded ? '▼' : '▶'}</span>
      </button>
      
      {expanded && (
        <div className="p-2 mt-1 text-xs rounded-lg shadow bg-white/90 dark:bg-gray-800/90 animate-fade-in">
          <ul className="space-y-1">
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
