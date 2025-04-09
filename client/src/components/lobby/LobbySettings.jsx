import { useNavigate } from "react-router-dom";
import { useState, useEffect, useRef } from "react";

import { createLobby } from "../../services/api";

const LobbySettings = ({ user }) => {
  const navigate = useNavigate();
  const [gameState, setGameState] = useState({
    maxRounds: 3,
    revealCharacters: 35,
    selectWord: 3,
    selectCategory: "random",
    playerLimit: 8,
    roundTime: 60,
  });
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!user || localStorage.getItem("token") === null) {
      localStorage.removeItem("user");
      navigate("/");
    }
  }, [navigate, user]);

  const handleCreateLobby = async () => {
    setLoading(true);
    setError("");
    try {
      const res = await createLobby(gameState);
      if (res.success && res.roomId) {
        navigate(`/lobby/${res.roomId}`);
      } else {
        setError("Failed to create lobby.");
      }
    } catch (err) {
      setError("An error occurred creating the lobby");
    } finally {
      setLoading(false);
    }
  };

  const settings = [
    {
      id: "maxRounds",
      label: "Rounds",
      min: 1,
      max: 10,
      value: gameState.maxRounds,
    },
    {
      id: "revealCharacters",
      label: "Reveal Rate",
      min: 0,
      max: 75,
      value: gameState.revealCharacters,
    },
    {
      id: "selectWord",
      label: "Words",
      min: 1,
      max: 5,
      value: gameState.selectWord,
    },
    {
      id: "roundTime",
      label: "Time (s)",
      min: 30,
      max: 180,
      value: gameState.roundTime,
    },
  ];

  return (
    <div className="flex items-center justify-center min-h-screen p-6 bg-gray-100/0 dark:bg-gray-900/0">
      <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-lg w-full max-w-lg">
        <h3 className="text-2xl font-semibold text-center mb-6 text-gray-800 dark:text-gray-100">
          Game Settings
        </h3>
        <div className="space-y-4">
          {settings.map(({ id, label, min, max, value }) => (
            <div key={id}>
              <label
                htmlFor={id}
                className="block text-sm font-medium text-gray-700 dark:text-gray-300"
              >
                {label}: <span className="font-semibold">{value}</span>
              </label>
              <input
                id={id}
                type="range"
                min={min}
                max={max}
                value={value}
                onChange={(e) =>
                  setGameState((prev) => ({
                    ...prev,
                    [id]: parseInt(e.target.value),
                  }))
                }
                className="w-full mt-1 appearance-none h-2 bg-gray-200 rounded-lg dark:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-opacity-50"
              />
            </div>
          ))}
          <div>
            <label
              htmlFor="category"
              className="block text-sm font-medium text-gray-700 dark:text-gray-300"
            >
              Category:
            </label>
            <div className="relative">
              <select
                id="category"
                value={gameState.selectCategory}
                onChange={(e) =>
                  setGameState((prev) => ({
                    ...prev,
                    selectCategory: e.target.value,
                  }))
                }
                className="w-full mt-1 border rounded-lg p-2 bg-gray-50 dark:bg-gray-700 text-gray-800 dark:text-gray-100 appearance-none focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-opacity-50"
              >
                <option value="random">Random</option>
                <option value="animals">Animals</option>
                <option value="food">Food</option>
                <option value="objects">Objects</option>
                <option value="vehicles">Vehicles</option>
                <option value="sports">Sports</option>
                <option value="video games">Video Games</option>
              </select>
              <div className="absolute inset-y-0 right-0 flex items-center pr-2 pointer-events-none">
                <svg
                  className="w-5 h-5 text-gray-400 dark:text-gray-300"
                  xmlns="http://www.w3.org/2000/svg"
                  viewBox="0 0 20 20"
                  fill="currentColor"
                >
                  <path
                    fillRule="evenodd"
                    d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z"
                    clipRule="evenodd"
                  />
                </svg>
              </div>
            </div>
          </div>
          <div>
            <label
              htmlFor="playerLimit"
              className="block text-sm font-medium text-gray-700 dark:text-gray-300"
            >
              Players:
            </label>
            <div className="relative">
              <select
                id="playerLimit"
                value={gameState.playerLimit}
                onChange={(e) =>
                  setGameState((prev) => ({
                    ...prev,
                    playerLimit: parseInt(e.target.value),
                  }))
                }
                className="w-full mt-1 border rounded-lg p-2 bg-gray-50 dark:bg-gray-700 text-gray-800 dark:text-gray-100 appearance-none focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-opacity-50"
              >
                {[...Array(11).keys()].slice(2).map((num) => (
                  <option key={num} value={num}>
                    {num}
                  </option>
                ))}
              </select>
              <div className="absolute inset-y-0 right-0 flex items-center pr-2 pointer-events-none">
                <svg
                  className="w-5 h-5 text-gray-400 dark:text-gray-300"
                  xmlns="http://www.w3.org/2000/svg"
                  viewBox="0 0 20 20"
                  fill="currentColor"
                >
                  <path
                    fillRule="evenodd"
                    d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z"
                    clipRule="evenodd"
                  />
                </svg>
              </div>
            </div>
          </div>
        </div>
        {error && (
          <div className="text-red-600 text-sm mt-4 dark:text-red-400">
            {error}
          </div>
        )}
        <button
          onClick={handleCreateLobby}
          disabled={loading}
          className={`w-full mt-6 py-2 text-white rounded-lg transition ${
            loading
              ? "bg-gray-400 dark:bg-gray-600 cursor-not-allowed"
              : "bg-blue-500 hover:bg-blue-600 dark:bg-blue-700 dark:hover:bg-blue-800"
          }`}
        >
          {loading ? "Creating..." : "Create Lobby"}
        </button>
      </div>
    </div>
  );
};

export default LobbySettings;
