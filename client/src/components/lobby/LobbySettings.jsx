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
    <div className="flex items-center justify-center h-full p-10">
      <div className="backdrop-blur-lg bg-white/70 rounded-3xl p-8 shadow-xl max-w-3xl w-full border-4 border-indigo-300">
        <h3 className="text-4xl font-bold text-center mb-8 text-indigo-600 tracking-wide">
          Game Settings 🎮
        </h3>
        <div className="flex flex-col space-y-7">
          <div className="flex flex-col md:flex-row md:items-center justify-between bg-yellow-50/80 backdrop-blur-sm p-4 rounded-2xl">
            <label
              htmlFor="maxRounds"
              className="text-xl font-medium text-indigo-800 mb-2 md:mb-0"
            >
              Number of Rounds:{" "}
              <span className="text-2xl font-bold">{gameState.maxRounds}</span>
            </label>
            <div className="flex items-center gap-3">
              <input
                id="maxRounds"
                type="range"
                min="1"
                max="10"
                value={gameState.maxRounds}
                onChange={(e) => setMaxRounds(parseInt(e.target.value))}
                className="w-72 h-8 accent-indigo-600"
              />
              <div className="relative inline-block group">
                <button className="w-8 h-8 rounded-full bg-indigo-400 text-white text-lg flex items-center justify-center hover:bg-indigo-500">
                  <span>?</span>
                </button>
                <div className="absolute hidden group-hover:block bg-indigo-700/90 backdrop-blur-md text-white text-lg rounded-xl p-3 mt-2 right-0 w-64 z-50">
                  A round is everyone drawing one word from your selected
                  category!
                </div>
              </div>
            </div>
          </div>

          <div className="flex flex-col md:flex-row md:items-center justify-between bg-green-50/80 backdrop-blur-sm p-4 rounded-2xl">
            <label
              htmlFor="revealCharacters"
              className="text-xl font-medium text-indigo-800 mb-2 md:mb-0"
            >
              Letter Reveal Rate:{" "}
              <span className="text-2xl font-bold">
                {gameState.revealCharacters}%
              </span>
            </label>
            <div className="flex items-center gap-3">
              <input
                id="revealCharacters"
                type="range"
                min="0"
                max="100"
                value={gameState.revealCharacters}
                onChange={(e) => setRevealCharacters(parseInt(e.target.value))}
                className="w-72 h-8 accent-indigo-600"
              />
              <div className="relative inline-block group">
                <button className="w-8 h-8 rounded-full bg-indigo-400 text-white text-lg flex items-center justify-center hover:bg-indigo-500">
                  <span>?</span>
                </button>
                <div className="absolute hidden group-hover:block bg-indigo-700/90 backdrop-blur-md text-white text-lg rounded-xl p-3 mt-2 right-0 w-64 z-50">
                  How many letters will be shown as hints during the game
                </div>
              </div>
            </div>
          </div>

          <div className="flex flex-col md:flex-row md:items-center justify-between bg-pink-50/80 backdrop-blur-sm p-4 rounded-2xl">
            <label
              htmlFor="selectWord"
              className="text-xl font-medium text-indigo-800 mb-2 md:mb-0"
            >
              Number of Words to Select:{" "}
              <span className="text-2xl font-bold">{gameState.selectWord}</span>
            </label>
            <div className="flex items-center gap-3">
              <input
                id="selectWord"
                type="range"
                min="1"
                max="5"
                value={gameState.selectWord}
                onChange={(e) => setSelectWord(parseInt(e.target.value))}
                className="w-72 h-8 accent-indigo-600"
              />
              <div className="relative inline-block group">
                <button className="w-8 h-8 rounded-full bg-indigo-400 text-white text-lg flex items-center justify-center hover:bg-indigo-500">
                  <span>?</span>
                </button>
                <div className="absolute hidden group-hover:block bg-indigo-700/90 backdrop-blur-md text-white text-lg rounded-xl p-3 mt-2 right-0 w-64 z-50">
                  The drawer will select one word from the list of words, zero
                  meaning no word to draw.
                </div>
              </div>
            </div>
          </div>

          {/* Round Time: The amount of time the drawer has to draw the word */}
          <div className="flex flex-col md:flex-row md:items-center justify-between bg-orange-50/80 backdrop-blur-sm p-4 rounded-2xl">
            <label
              htmlFor="roundTime"
              className="text-xl font-medium text-indigo-800 mb-2 md:mb-0"
            >
              Round Time:{" "}
              <span className="text-2xl font-bold">{gameState.roundTime}s</span>
            </label>
            <div className="flex items-center gap-3">
              <input
                id="roundTime"
                type="range"
                min="30"
                max="180"
                value={gameState.roundTime}
                onChange={(e) => setRoundTime(parseInt(e.target.value))}
                className="w-72 h-8 accent-indigo-600"
              />
              <div className="relative inline-block group">
                <button className="w-8 h-8 rounded-full bg-indigo-400 text-white text-lg flex items-center justify-center hover:bg-indigo-500">
                  <span>?</span>
                </button>
                <div className="absolute hidden group-hover:block bg-indigo-700/90 backdrop-blur-md text-white text-lg rounded-xl p-3 mt-2 right-0 w-64 z-50">
                  The amount of time the drawer has to draw the word
                </div>
              </div>
            </div>
          </div>

          {/* The category of words to draw */}
          <div className="flex flex-col md:flex-row md:items-center justify-between bg-blue-50/80 backdrop-blur-sm p-4 rounded-2xl relative">
            <label
              htmlFor="category"
              className="text-xl font-medium text-indigo-800 mb-2 md:mb-0"
            >
              Word Category:
            </label>
            <div className="relative w-full md:w-auto">
              <select
                id="category"
                value={gameState.selectCategory}
                onChange={(e) => setSelectCategory(e.target.value)}
                className="appearance-none w-full md:w-80 px-5 py-4 text-xl text-indigo-800 bg-white/90 rounded-xl
                  focus:outline-none focus:ring-4 focus:ring-indigo-300 border-2 border-indigo-200 
                  cursor-pointer shadow-md transition-all hover:border-indigo-400 pl-6"
              >
                <option value="random">Random 🎲</option>
                <option value="animals">Animals 🐘</option>
                <option value="food">Food 🍕</option>
                <option value="objects">Objects 📱</option>
                <option value="vehicles">Vehicles 🚗</option>
                <option value="sports">Sports ⚽</option>
                <option value="video games">Video Games 👾</option>
              </select>
              <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-4 text-indigo-600">
                <svg
                  className="h-6 w-6"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth="2"
                    d="M19 9l-7 7-7-7"
                  />
                </svg>
              </div>
            </div>
          </div>

          <div className="flex flex-col md:flex-row md:items-center justify-between bg-purple-50/80 backdrop-blur-sm p-4 rounded-2xl relative">
            <label
              htmlFor="playerLimit"
              className="text-xl font-medium text-indigo-800 mb-2 md:mb-0"
            >
              Maximum Players:
            </label>
            <div className="relative w-full md:w-auto">
              <select
                id="playerLimit"
                value={gameState.playerLimit}
                onChange={(e) => setPlayerLimit(parseInt(e.target.value))}
                className="appearance-none w-28 px-4 py-3 text-xl text-indigo-800 bg-white/90 rounded-xl 
                  focus:outline-none focus:ring-4 focus:ring-indigo-300 border-2 border-indigo-200 
                  cursor-pointer shadow-md transition-all hover:border-indigo-400 text-center"
              >
                {[...Array(11)].map((_, i) => (
                  <option key={i + 2} value={i + 2}>
                    {i + 2}
                  </option>
                ))}
              </select>
              <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-2 text-indigo-600">
                <svg
                  className="h-5 w-5"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth="2"
                    d="M19 9l-7 7-7-7"
                  />
                </svg>
              </div>
            </div>
          </div>
        </div>

        {error && (
          <div className="mt-6 bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded">
            {error}
          </div>
        )}

        <div className="flex justify-center mt-10">
          <button
            className={`bg-gradient-to-r from-indigo-600 to-purple-600 text-white text-2xl font-bold px-10 py-4 rounded-2xl 
              hover:from-indigo-700 hover:to-purple-700 transition-all transform hover:scale-105 shadow-lg
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
