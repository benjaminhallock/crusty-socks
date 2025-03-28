import { useState } from "react";
import { useEffect } from "react";
import { useNavigate } from "react-router-dom";

import { createLobby } from "../../services/auth";

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

  const setMaxRounds = (value) =>
    setGameState((prev) => ({ ...prev, maxRounds: value }));
  const setRevealCharacters = (value) =>
    setGameState((prev) => ({ ...prev, revealCharacters: value }));
  const setSelectWord = (value) =>
    setGameState((prev) => ({ ...prev, selectWord: value }));
  const setSelectCategory = (value) =>
    setGameState((prev) => ({ ...prev, selectCategory: value }));
  const setPlayerLimit = (value) =>
    setGameState((prev) => ({ ...prev, playerLimit: value }));
  const setRoundTime = (value) =>
    setGameState((prev) => ({ ...prev, roundTime: value }));

  useEffect(() => {
    if (!user) {
      navigate("/");
      return;
    }
  }, [navigate, user]);

  const handleCreateLobby = async () => {
    try {
      setLoading(true);
      setError("");

      const res = await createLobby({
        maxRounds: gameState.maxRounds,
        revealCharacters: gameState.revealCharacters,
        selectWord: gameState.selectWord,
        selectCategory: gameState.selectCategory,
        playerLimit: gameState.playerLimit,
        roundTime: gameState.roundTime,
      });
      if (res.ok && res.roomId) {
        navigate(`/lobby/${res.roomId}`);
      } else {
        setError("Failed to create lobby. Please try again.");
      }
    } catch (err) {
      setError(err.message || "An error occurred creating the lobby");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex items-center justify-center p-1 sm:p-2 min-h-screen">
      <div className="backdrop-blur-lg bg-white/70 rounded-lg sm:rounded-xl p-2 sm:p-3 shadow-lg w-full max-w-2xl sm:w-[90%] md:w-[80%] lg:w-[70%] border border-indigo-300 overflow-y-auto max-h-[85vh] sm:max-h-[80vh]">
        <h3 className="text-xl sm:text-2xl font-bold text-center mb-2 sm:mb-4 text-indigo-600 tracking-wide">
          Game Settings 🎮
        </h3>
        <div className="flex flex-col space-y-2">
          <div className="flex flex-col md:flex-row md:items-center justify-between bg-yellow-50/80 backdrop-blur-sm p-1.5 sm:p-2 rounded-lg">
            <label
              htmlFor="maxRounds"
              className="text-base sm:text-lg font-medium text-indigo-800 mb-1 md:mb-0"
            >
              Number of Rounds:{" "}
              <span className="text-lg sm:text-xl font-bold">{gameState.maxRounds}</span>
            </label>
            <div className="flex items-center gap-2">
              <input
                id="maxRounds"
                type="range"
                min="1"
                max="10"
                value={gameState.maxRounds}
                onChange={(e) => setMaxRounds(parseInt(e.target.value))}
                className="w-full sm:w-36 md:w-48 h-5 accent-indigo-600"
              />
              <div className="relative inline-block group">
                <button className="w-5 h-5 sm:w-6 sm:h-6 rounded-full bg-indigo-400 text-white text-xs sm:text-sm flex items-center justify-center hover:bg-indigo-500">
                  <span>?</span>
                </button>
                <div className="absolute hidden group-hover:block bg-indigo-700/90 backdrop-blur-md text-white text-xs sm:text-sm rounded-lg p-1.5 sm:p-2 mt-1 right-0 w-40 sm:w-48 z-50">
                  A round is everyone drawing one word from your selected category!
                </div>
              </div>
            </div>
          </div>

          <div className="flex flex-col md:flex-row md:items-center justify-between bg-green-50/80 backdrop-blur-sm p-1.5 sm:p-2 rounded-lg">
            <label
              htmlFor="revealCharacters"
              className="text-base sm:text-lg font-medium text-indigo-800 mb-1 md:mb-0"
            >
              Letter Reveal Rate:{" "}
              <span className="text-lg sm:text-xl font-bold">
                {gameState.revealCharacters}%
              </span>
            </label>
            <div className="flex items-center gap-2">
              <input
                id="revealCharacters"
                type="range"
                min="0"
                max="100"
                value={gameState.revealCharacters}
                onChange={(e) => setRevealCharacters(parseInt(e.target.value))}
                className="w-full sm:w-36 md:w-48 h-5 accent-indigo-600"
              />
              <div className="relative inline-block group">
                <button className="w-5 h-5 sm:w-6 sm:h-6 rounded-full bg-indigo-400 text-white text-xs sm:text-sm flex items-center justify-center hover:bg-indigo-500">
                  <span>?</span>
                </button>
                <div className="absolute hidden group-hover:block bg-indigo-700/90 backdrop-blur-md text-white text-xs sm:text-sm rounded-lg p-1.5 sm:p-2 mt-1 right-0 w-40 sm:w-48 z-50">
                  How many letters will be shown as hints during the game
                </div>
              </div>
            </div>
          </div>

          <div className="flex flex-col md:flex-row md:items-center justify-between bg-pink-50/80 backdrop-blur-sm p-1.5 sm:p-2 rounded-lg">
            <label
              htmlFor="selectWord"
              className="text-base sm:text-lg font-medium text-indigo-800 mb-1 md:mb-0"
            >
              Number of Words:{" "}
              <span className="text-lg sm:text-xl font-bold">{gameState.selectWord}</span>
            </label>
            <div className="flex items-center gap-2">
              <input
                id="selectWord"
                type="range"
                min="1"
                max="5"
                value={gameState.selectWord}
                onChange={(e) => setSelectWord(parseInt(e.target.value))}
                className="w-full sm:w-36 md:w-48 h-5 accent-indigo-600"
              />
              <div className="relative inline-block group">
                <button className="w-5 h-5 sm:w-6 sm:h-6 rounded-full bg-indigo-400 text-white text-xs sm:text-sm flex items-center justify-center hover:bg-indigo-500">
                  <span>?</span>
                </button>
                <div className="absolute hidden group-hover:block bg-indigo-700/90 backdrop-blur-md text-white text-xs sm:text-sm rounded-lg p-1.5 sm:p-2 mt-1 right-0 w-40 sm:w-48 z-50">
                  The drawer will select one word from the list
                </div>
              </div>
            </div>
          </div>

          <div className="flex flex-col md:flex-row md:items-center justify-between bg-orange-50/80 backdrop-blur-sm p-1.5 sm:p-2 rounded-lg">
            <label
              htmlFor="roundTime"
              className="text-base sm:text-lg font-medium text-indigo-800 mb-1 md:mb-0"
            >
              Round Time:{" "}
              <span className="text-lg sm:text-xl font-bold">{gameState.roundTime}s</span>
            </label>
            <div className="flex items-center gap-2">
              <input
                id="roundTime"
                type="range"
                min="30"
                max="180"
                value={gameState.roundTime}
                onChange={(e) => setRoundTime(parseInt(e.target.value))}
                className="w-full sm:w-36 md:w-48 h-5 accent-indigo-600"
              />
              <div className="relative inline-block group">
                <button className="w-5 h-5 sm:w-6 sm:h-6 rounded-full bg-indigo-400 text-white text-xs sm:text-sm flex items-center justify-center hover:bg-indigo-500">
                  <span>?</span>
                </button>
                <div className="absolute hidden group-hover:block bg-indigo-700/90 backdrop-blur-md text-white text-xs sm:text-sm rounded-lg p-1.5 sm:p-2 mt-1 right-0 w-40 sm:w-48 z-50">
                  Time limit for drawing each word
                </div>
              </div>
            </div>
          </div>

          <div className="flex flex-col md:flex-row md:items-center justify-between bg-blue-50/80 backdrop-blur-sm p-1.5 sm:p-2 rounded-lg">
            <label
              htmlFor="category"
              className="text-base sm:text-lg font-medium text-indigo-800 mb-1 md:mb-0"
            >
              Word Category:
            </label>
            <div className="relative w-full md:w-auto">
              <select
                id="category"
                value={gameState.selectCategory}
                onChange={(e) => setSelectCategory(e.target.value)}
                className="appearance-none w-full md:w-48 lg:w-56 px-2 py-1.5 text-sm sm:text-base text-indigo-800 bg-white/90 rounded-md
                  focus:outline-none focus:ring-1 focus:ring-indigo-300 border border-indigo-200
                  cursor-pointer shadow-sm transition-all hover:border-indigo-400 pl-3"
              >
                <option value="random">Random 🎲</option>
                <option value="animals">Animals 🐘</option>
                <option value="food">Food 🍕</option>
                <option value="objects">Objects 📱</option>
                <option value="vehicles">Vehicles 🚗</option>
                <option value="sports">Sports ⚽</option>
                <option value="video games">Video Games 👾</option>
              </select>
              <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-2 text-indigo-600">
                <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" />
                </svg>
              </div>
            </div>
          </div>

          <div className="flex flex-col md:flex-row md:items-center justify-between bg-purple-50/80 backdrop-blur-sm p-1.5 sm:p-2 rounded-lg">
            <label
              htmlFor="playerLimit"
              className="text-base sm:text-lg font-medium text-indigo-800 mb-1 md:mb-0"
            >
              Maximum Players:
            </label>
            <div className="relative w-full md:w-auto">
              <select
                id="playerLimit"
                value={gameState.playerLimit}
                onChange={(e) => setPlayerLimit(parseInt(e.target.value))}
                className="appearance-none w-20 sm:w-24 px-2 py-1.5 text-sm sm:text-base text-indigo-800 bg-white/90 rounded-md
                  focus:outline-none focus:ring-1 focus:ring-indigo-300 border border-indigo-200
                  cursor-pointer shadow-sm transition-all hover:border-indigo-400 text-center"
              >
                {[...Array(11)].map((_, i) => (
                  <option key={i + 2} value={i + 2}>
                    {i + 2}
                  </option>
                ))}
              </select>
              <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-1 text-indigo-600">
                <svg className="h-3 w-3 sm:h-4 sm:w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" />
                </svg>
              </div>
            </div>
          </div>
        </div>

        {error && (
          <div className="mt-3 bg-red-50 border border-red-300 text-red-700 px-2 py-1.5 rounded text-xs sm:text-sm">
            {error}
          </div>
        )}

        <div className="flex justify-center mt-4 sm:mt-6">
          <button
            className={`bg-gradient-to-r from-indigo-600 to-purple-600 text-white text-base sm:text-lg font-bold px-4 sm:px-6 py-1.5 sm:py-2 rounded-lg
              hover:from-indigo-700 hover:to-purple-700 transition-all transform hover:scale-[1.02] shadow-md
              ${loading ? "opacity-70 cursor-not-allowed" : ""}`}
            onClick={handleCreateLobby}
            disabled={loading}
          >
            {loading ? "Creating..." : "✨ START GAME! ✨"}
          </button>
        </div>
      </div>
    </div>
  );
};

export default LobbySettings;
