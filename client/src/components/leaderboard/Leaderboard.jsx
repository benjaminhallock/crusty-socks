import { Link } from "react-router-dom";
import { useState, useEffect } from "react";

import { fetchLeaderboard } from "../../services/api";
import LoadingSpinner from "../common/ui/LoadingSpinner";

// Leaderboard component displays the leaderboard of players
const Leaderboard = () => {
  const [leaderboard, setLeaderboard] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const loadLeaderboard = async () => {
      try {
        setIsLoading(true);
        const response = await fetchLeaderboard();

        if (!response.success) {
          throw new Error(response.error);
        }

        setLeaderboard(response.leaderboard);
      } catch (error) {
        console.error("Error loading leaderboard:", error);
        setError(error.message);
      } finally {
        setIsLoading(false);
      }
    };

    loadLeaderboard();
  }, []);

  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-screen">
        <LoadingSpinner />
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center py-10">
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded">
          <p>Error loading leaderboard: {error}</p>
          <button
            onClick={() => window.location.reload()}
            className="mt-4 bg-indigo-500 hover:bg-indigo-600 text-white py-2 px-4 rounded"
          >
            Try Again
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto py-8 px-4">
      <h1 className="text-2xl text-bold text-gray-200 font-extrabold bg-gradient-to-r from-indigo-500 via-purple-500 to-grey-800 text-center px-8 py-4 rounded-lg shadow-lg">
        PixelParty Leaderboard
      </h1>

      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl overflow-hidden mt-6">
        <div className="border-b border-gray-200 dark:border-gray-700">
          <div className="grid grid-cols-12 py-4 px-6 bg-gray-50 dark:bg-gray-700 text-sm font-medium text-gray-500 dark:text-gray-300">
            <div className="col-span-1 text-center">#</div>
            <div className="col-span-4">Player</div>
            <div className="col-span-2 text-center">Score</div>
            <div className="col-span-2 text-center">Games</div>
            <div className="col-span-2 text-center">Wins</div>
            <div className="col-span-1 text-center">Win%</div>
          </div>
        </div>

        <div className="divide-y divide-gray-200 dark:divide-gray-700">
          {leaderboard.length > 0 ? (
            leaderboard.map((player, index) => (
              <div
                key={player.username || player.id || index}
                className={`grid grid-cols-12 py-4 px-6 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors ${
                  index === 0
                    ? "bg-yellow-50 dark:bg-yellow-900/20"
                    : index === 1
                    ? "bg-gray-50 dark:bg-gray-700/30"
                    : index === 2
                    ? "bg-amber-50 dark:bg-amber-900/20"
                    : ""
                }`}
              >
                <div className="col-span-1 flex justify-center items-center">
                  {index === 0 ? (
                    <span className="text-yellow-500 text-xl">🏆</span>
                  ) : index === 1 ? (
                    <span className="text-gray-400 text-xl">🥈</span>
                  ) : index === 2 ? (
                    <span className="text-amber-700 text-xl">🥉</span>
                  ) : (
                    <span className="text-gray-500 dark:text-gray-400 font-semibold">
                      {index + 1}
                    </span>
                  )}
                </div>

                <div className="col-span-4 flex items-center">
                  <Link
                    to={`/user/${player.username || player.id}`}
                    className="group flex items-center"
                  >
                    <div className="w-10 h-10 rounded-full bg-indigo-100 dark:bg-indigo-900 flex items-center justify-center mr-3 overflow-hidden">
                      {player.avatarUrl ? (
                        <img
                          src={player.avatarUrl}
                          alt={player.displayName || player.username}
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <span className="text-indigo-500 dark:text-indigo-300 text-lg font-bold">
                          {(player.displayName || player.username || "?")
                            .charAt(0)
                            .toUpperCase()}
                        </span>
                      )}
                    </div>
                    <span className="font-medium text-gray-800 dark:text-gray-200 group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors">
                      {player.displayName ||
                        player.username ||
                        `Player #${index + 1}`}
                    </span>
                  </Link>
                </div>

                <div className="col-span-2 flex justify-center items-center font-semibold text-gray-700 dark:text-gray-300">
                  {(player.totalScore || player.score || 0).toLocaleString()}
                </div>

                <div className="col-span-2 flex justify-center items-center text-gray-600 dark:text-gray-400">
                  {player.gamesPlayed || player.games || 0}
                </div>

                <div className="col-span-2 flex justify-center items-center text-gray-600 dark:text-gray-400">
                  {player.gamesWon || player.wins || 0}
                </div>

                <div className="col-span-1 flex justify-center items-center">
                  <span
                    className={`
                    px-2 py-1 rounded-full text-xs font-medium
                    ${
                      (player.winRate || calculateWinRate(player)) >= 50
                        ? "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400"
                        : (player.winRate || calculateWinRate(player)) >= 25
                        ? "bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400"
                        : "bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-400"
                    }
                  `}
                  >
                    {player.winRate || calculateWinRate(player)}%
                  </span>
                </div>
              </div>
            ))
          ) : (
            <div className="py-8 text-center text-gray-500 dark:text-gray-400">
              No players found. Be the first to play and earn points!
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

// Helper function to calculate win rate if not provided
const calculateWinRate = (player) => {
  const gamesPlayed = player.gamesPlayed || player.games || 0;
  const gamesWon = player.gamesWon || player.wins || 0;

  if (gamesPlayed === 0) return 0;
  return Math.round((gamesWon / gamesPlayed) * 100);
};

export default Leaderboard;
