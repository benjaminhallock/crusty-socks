import { useNavigate } from "react-router-dom";
import { useState, useEffect, useRef, Fragment } from "react";
import { Transition } from "@headlessui/react";
import Button from "../common/ui/Button";

import { createLobby } from "../../services/api";

const LobbySettings = ({ user }) => {
  const navigate = useNavigate();
  const [isShowing, setIsShowing] = useState(false);
  const [gameState, setGameState] = useState({
    maxRounds: 3,
    revealCharacters: 35,
    selectWord: 3,
    selectCategory: "random",
    playerLimit: 8,
    roundTime: 60,
    gridSize: 16,
    user: user,
    _id: user._id,
  });
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!user || localStorage.getItem("token") === null) {
      localStorage.removeItem("user");
      navigate("/");
    }
    setIsShowing(true);
  }, [navigate, user]);

  const handleCreateLobby = async () => {
    setLoading(true);
    setError("");
    try {
      const res = await createLobby(gameState);
      if (res.success && res.roomId) {
        setIsShowing(false); // Trigger exit animation
        // Add slight delay to allow animation to complete
        setTimeout(() => {
          navigate(`/lobby/${res.roomId}`);
        }, 300);
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
      label: "Word-count",
      min: 1,
      max: 5,
      value: gameState.selectWord,
    },
    {
      id: "roundTime",
      label: "Time-to-draw (seconds)",
      min: 30,
      max: 180,
      value: gameState.roundTime,
    },
    {
      id: "gridSize",
      label: "Grid Size (less is more)",
      min: 1,
      max: 20,
      value: gameState.gridSize,
    },
  ];

  return (
    <div className="flex items-center justify-center min-h-[calc(100vh-5rem)]">
      <Transition
        as={Fragment}
        show={isShowing}
        enter="transition-all duration-500"
        enterFrom="opacity-0 translate-y-8"
        enterTo="opacity-100 translate-y-0"
        leave="transition-all duration-300"
        leaveFrom="opacity-100"
        leaveTo="opacity-0"
      >
        <div className="w-full max-w-lg mx-auto">
          <div className="text-center bg-white/90 dark:bg-gray-800/90 backdrop-blur-lg p-8 rounded-2xl shadow-xl border border-gray-200/50 dark:border-gray-700/50 transform-gpu">
            <h3 className="text-3xl font-bold mb-8 bg-gradient-to-r from-purple-600 to-indigo-600 dark:from-purple-400 dark:to-indigo-400 bg-clip-text text-transparent">
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
                    className="w-full mt-1 appearance-none h-2 bg-gray-200 rounded-lg dark:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-purple-500 dark:focus:ring-purple-400 transition-all duration-200"
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
                    className="w-full mt-1 border rounded-lg p-2 bg-gray-50 dark:bg-gray-700 text-gray-800 dark:text-gray-100 appearance-none focus:outline-none focus:ring-2 focus:ring-purple-500 dark:focus:ring-purple-400 transition-all duration-200"
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
                <div className="relative group">
                  <select
                    id="playerLimit"
                    value={gameState.playerLimit}
                    onChange={(e) =>
                      setGameState((prev) => ({
                        ...prev,
                        playerLimit: parseInt(e.target.value),
                      }))
                    }
                    className="w-full mt-1 border rounded-lg p-2 bg-gray-50 dark:bg-gray-700 text-gray-800 dark:text-gray-100 appearance-none focus:outline-none focus:ring-2 focus:ring-purple-500 dark:focus:ring-purple-400 transition-all duration-200"
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

            <Transition
              show={!!error}
              enter="transition-opacity duration-300"
              enterFrom="opacity-0"
              enterTo="opacity-100"
              leave="transition-opacity duration-200"
              leaveFrom="opacity-100"
              leaveTo="opacity-0"
              className="mt-6"
            >
              <div className="bg-red-100/80 dark:bg-red-900/30 border border-red-200 dark:border-red-800/50 text-red-600 dark:text-red-400 px-4 py-3 rounded-lg backdrop-blur-sm">
                {error}
              </div>
            </Transition>

            <Button
              onClick={handleCreateLobby}
              disabled={loading}
              variant="primary"
              className="mt-8 w-full transform-gpu hover:scale-[1.02] transition-transform duration-200"
              size="lg"
            >
              {loading ? "Creating..." : "Create Lobby"}
            </Button>
          </div>
        </div>
      </Transition>
    </div>
  );
};

export default LobbySettings;
