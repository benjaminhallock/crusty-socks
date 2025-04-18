import { useState } from "react";

// GameSettings component displays the current game settings in a collapsible UI
const GameSettings = ({ lobby }) => {
  // State to manage whether the settings panel is expanded or collapsed
  const [expanded, setExpanded] = useState(false);

  // Map category values to readable labels with emojis
  const categoryMap = {
    random: "Random 🎲",
    animals: "Animals 🐘",
    food: "Food 🍕",
    objects: "Objects 📱",
    vehicles: "Vehicles 🚗",
    sports: "Sports ⚽",
    "video games": "Video Games 🎮",
  };

  return (
    <div className="w-full">
      {/* Button to toggle the expanded state of the settings panel */}
      <button
        onClick={() => setExpanded(!expanded)}
        className="w-full flex items-center justify-between px-2 py-1 text-left bg-gray-200 dark:bg-gray-700 rounded-md hover:bg-purple-800/50 dark:hover:bg-gray-600 hover:text-white"
      >
        <span className="text-xs font-medium">Game Settings</span>
        <span className="text-xs">{expanded ? "▼" : "▶"}</span>
      </button>

      {/* Display the settings details if expanded */}
      {expanded && (
        <div className="p-2 text-xs bg-white/90 dark:bg-gray-800/90 animate-fade-in">
          <ul className="space-y-1">
            <li className="flex justify-between">
              <span className="text-gray-600 dark:text-gray-300">Rounds:</span>
              <span className="font-medium">{lobby.maxRounds}</span>
            </li>
            <li className="flex justify-between bg-gray-100 dark:bg-gray-700">
              <span className="text-gray-600 dark:text-gray-300">
                Hint Letters:
              </span>
              <span className="font-medium">{lobby.revealCharacters}%</span>
            </li>
            <li className="flex justify-between">
              <span className="text-gray-600 dark:text-gray-300">
                Grid Size:
              </span>
              <span className="font-medium">{lobby.gridSize}</span>
            </li>
            <li className="flex justify-between bg-gray-100 dark:bg-gray-700">
              <span className="text-gray-600 dark:text-gray-300">
                Word Choices:
              </span>
              <span className="font-medium">{lobby.selectWord}</span>
            </li>
            <li className="flex justify-between">
              <span className="text-gray-600 dark:text-gray-300">
                Category:
              </span>
              <span className="font-medium">
                {categoryMap[lobby.selectCategory] || lobby.selectCategory}
              </span>
            </li>
            <li className="flex justify-between bg-gray-100 dark:bg-gray-700">
              <span className="text-gray-600 dark:text-gray-300">
                Player Limit:
              </span>
              <span className="font-medium">{lobby.playerLimit}</span>
            </li>
          </ul>
        </div>
      )}
    </div>
  );
};

export default GameSettings;
