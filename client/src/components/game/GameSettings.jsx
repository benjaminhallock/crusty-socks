import { useState, useRef, useEffect } from "react";
import Modal from "../common/ui/Modal";

// GameSettings component displays the current game settings in a dropdown modal
const GameSettings = ({ lobby }) => {
  const [expanded, setExpanded] = useState(false);
  const buttonRef = useRef(null);
  const [position, setPosition] = useState({ top: 0, left: 0 });

  const categoryMap = {
    random: "Random 🎲",
    animals: "Animals 🐘",
    food: "Food 🍕",
    objects: "Objects 📱",
    vehicles: "Vehicles 🚗",
    sports: "Sports ⚽",
    "video games": "Video Games 🎮",
  };

  // Update dropdown position when button is clicked
  useEffect(() => {
    if (expanded && buttonRef.current) {
      const rect = buttonRef.current.getBoundingClientRect();
      setPosition({
        top: rect.top,
        left: rect.right + 8, // 8px gap between button and dropdown
      });
    }
  }, [expanded]);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (buttonRef.current && !buttonRef.current.contains(event.target)) {
        setExpanded(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const settings = [
    { label: "Rounds", value: lobby.maxRounds },
    { label: "Hint Letters", value: `${lobby.revealCharacters}%` },
    { label: "Word Choices", value: lobby.selectWord },
    {
      label: "Category",
      value: categoryMap[lobby.selectCategory] || lobby.selectCategory,
    },
    { label: "Player Limit", value: lobby.playerLimit },
  ];

  return (
    <div className="relative">
      <button
        ref={buttonRef}
        onClick={() => setExpanded(!expanded)}
        className="p-2 rounded-full hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
        title="Game Settings"
      >
        <svg
          className="w-5 h-5 text-gray-500 dark:text-indigo-400"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z"
          />
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
          />
        </svg>
      </button>

      {expanded && (
        <div
          className="fixed z-50 w-[300px] bg-white dark:bg-gray-800 rounded-lg shadow-lg border border-gray-200 dark:border-gray-600"
          style={{
            top: position.top + "px",
            left: position.left + "px",
          }}
        >
          <div className="p-3 border-b border-gray-200 dark:border-gray-700">
            <h3 className="text-sm font-medium text-gray-700 dark:text-gray-300">
              Game Settings
            </h3>
          </div>
          <ul className="divide-y divide-gray-200 dark:divide-gray-700">
            {settings.map((setting) => (
              <li
                key={setting.label}
                className="px-3 py-2 text-xs hover:bg-gray-50 dark:hover:bg-gray-700/50"
              >
                <div className="flex items-center justify-between">
                  <span className="text-gray-700 dark:text-gray-300">
                    {setting.label}
                  </span>
                  <span className="text-indigo-600 dark:text-indigo-400">
                    {setting.value}
                  </span>
                </div>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
};

export default GameSettings;
