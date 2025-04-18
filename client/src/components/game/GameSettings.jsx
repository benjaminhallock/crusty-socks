import { useState } from "react";

// GameSettings component displays the current game settings in a collapsible UI
const GameSettings = ({
  revealCharacters,
  maxRounds,
  selectWord,
  selectCategory,
  playerLimit,
}) => {
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
    <div className="w-full rounded-xl overflow-hidden bg-white dark:bg-gray-800 shadow-sm ring-1 ring-black/5 dark:ring-white/5">
      <button
        onClick={() => setExpanded(!expanded)}
        className={`w-full flex items-center justify-between px-4 py-3 text-left transition-all duration-300
          ${
            expanded
              ? "bg-gradient-to-r from-purple-800 to-purple-600 text-white shadow-md"
              : "bg-transparent hover:bg-gray-50 dark:hover:bg-gray-700/50 text-gray-700 dark:text-gray-200"
          }`}
      >
        <span className="text-sm font-medium flex items-center gap-2.5">
          <svg
            className={`w-4 h-4 transition-opacity ${
              expanded ? "text-white" : "text-indigo-500 dark:text-indigo-400"
            }`}
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
          Game Settings
        </span>
        <span
          className="text-sm transition-transform duration-300"
          style={{ transform: expanded ? "rotate(180deg)" : "rotate(0deg)" }}
        >
          ▼
        </span>
      </button>

      {expanded && (
        <div className="animate-fadeIn">
          <ul className="divide-y divide-gray-100 dark:divide-gray-700/30">
            {[
              {
                label: "Rounds",
                value: maxRounds,
                icon: "M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15",
              },
              {
                label: "Hint Letters",
                value: `${revealCharacters}%`,
                icon: "M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z",
              },
              {
                label: "Word Choices",
                value: selectWord,
                icon: "M7 8h10M7 12h4m1 8l-4-4H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-3l-4 4z",
              },
              {
                label: "Category",
                value: categoryMap[selectCategory] || selectCategory,
                icon: "M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z",
              },
              {
                label: "Player Limit",
                value: playerLimit,
                icon: "M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z",
              },
            ].map((setting, index) => (
              <li
                key={setting.label}
                className="p-3 hover:bg-gray-50 dark:hover:bg-gray-700/30 transition-colors duration-200"
              >
                <div className="flex items-center justify-between">
                  <span className="text-gray-600 dark:text-gray-300 flex items-center gap-2.5">
                    <svg
                      className="w-4 h-4 text-indigo-500 dark:text-indigo-400"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d={setting.icon}
                      />
                    </svg>
                    {setting.label}
                  </span>
                  <span className="font-medium text-indigo-600 dark:text-indigo-400">
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
