import { Link } from "react-router-dom";
import { useState, useEffect } from "react";

import { fetchLeaderboard } from "../../services/api";
import LoadingSpinner from "../common/ui/LoadingSpinner";
import { Transition } from "@headlessui/react";

const Leaderboard = () => {
  const [leaderboard, setLeaderboard] = useState([]);
  const [show, setShow] = useState(false);

  // Show transition after initial load
  useEffect(() => {
    setShow(true);
  }, []);
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

        // Validate and process avatarUrls
        const processedLeaderboard = response.leaderboard.map((player) => {
          if (player.avatarUrl) {
            try {
              const url = new URL(player.avatarUrl);
              // Only allow HTTPS URLs and from trusted domains
              if (!url.protocol.startsWith("https:")) {
                player.avatarUrl = null;
                return player;
              }

              // Validate against allowed domains (you can expand this list)
              const allowedDomains = [
                "localhost",
                "crustysocks.com",
                "amazonaws.com",
                "cloudfront.net",
              ];

              const isAllowedDomain = allowedDomains.some((domain) =>
                url.hostname.includes(domain)
              );

              if (!isAllowedDomain) {
                player.avatarUrl = null;
                return player;
              }

              // Create an image object to verify loading
              const img = new Image();
              img.crossOrigin = "anonymous";

              // Set up error handling
              img.onerror = () => {
                player.avatarUrl = null;
              };

              // Start loading the image
              img.src = url.href;
            } catch (e) {
              console.warn("Invalid avatar URL:", e);
              player.avatarUrl = null;
            }
          }
          return player;
        });

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
      <div className="min-h-screen flex justify-center items-center bg-gray-50 dark:bg-gray-900">
        <LoadingSpinner />
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex justify-center items-center bg-gray-50 dark:bg-gray-900 p-4">
        <div className="max-w-md w-full bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6 text-center">
          <div className="text-red-600 dark:text-red-400 mb-4">
            <svg
              className="w-12 h-12 mx-auto"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
              />
            </svg>
          </div>
          <p className="text-gray-700 dark:text-gray-300 mb-4">
            Error loading leaderboard: {error}
          </p>
          <button
            onClick={() => window.location.reload()}
            className="bg-gradient-to-r from-indigo-500 to-purple-600 text-white px-6 py-2 rounded-lg hover:from-indigo-600 hover:to-purple-700 transition-all duration-200 shadow-md hover:shadow-lg"
          >
            Try Again
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen py-6 px-4 sm:px-6 lg:px-8">
      <div className="max-w-5xl mx-auto">
        {/* Header */}
        <div className="text-center mb-6 bg-gray-50/80 py-4 rounded-lg shadow-lg border border-gray-200 dark:bg-gray-800/80 dark:border-gray-700/70 backdrop-blur-md">
          <h1 className="text-4xl font-extrabold bg-clip-text text-transparent bg-gradient-to-r from-purple-500 to-indigo-500 dark:from-purple-700/80 dark:to-indigo-800/80">
            Pixel Party Leaderboard
          </h1>
          <p className="mt-2 text-gray-600 dark:text-gray-400">
            Top players ranked by score and performance
          </p>
        </div>

        {/* Leaderboard Table */}
        <div className="bg-white/95 dark:bg-gray-800/80 rounded-2xl shadow-xl overflow-hidden border border-gray-200 dark:border-gray-700">
          {/* Table Header */}
          <div className="bg-gradient-to-r from-indigo-500/10 to-purple-500/10 dark:from-indigo-900/50 dark:to-purple-900/50">
            <div className="grid grid-cols-12 py-4 px-6 text-sm font-medium text-gray-700 dark:text-gray-300">
              <div className="col-span-1 text-center">#</div>
              <div className="col-span-4">Player</div>
              <div className="col-span-2 text-center">Score</div>
              <div className="col-span-2 text-center">Games</div>
              <div className="col-span-2 text-center">Wins</div>
              <div className="col-span-1 text-center">Win%</div>
            </div>
          </div>

          {/* Table Body */}
          <div className="divide-y divide-gray-200 dark:divide-gray-700">
            {leaderboard.length > 0 ? (
              leaderboard.map((player, index) => (
                <div
                  key={player.username || player.id || index}
                  className={`grid grid-cols-12 py-4 px-6 hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-all duration-200 ${
                    index === 0
                      ? "bg-blue-200/30 dark:bg-blue-800/40"
                      : index === 1
                      ? "bg-indigo-200/30 dark:bg-indigo-700/40"
                      : index === 2
                      ? "bg-purple-200/30 dark:bg-purple-600/40"
                      : index % 2 === 1
                      ? "bg-purple-100/50 dark:bg-gray-900/80"
                      : ""
                  }`}
                >
                  {/* Rank Column */}
                  <div className="col-span-1 flex justify-center items-center">
                    {index === 0 ? (
                      <span className="text-2xl" title="1st Place">
                        👑
                      </span>
                    ) : index === 1 ? (
                      <span className="text-xl" title="2nd Place">
                        🥈
                      </span>
                    ) : index === 2 ? (
                      <span className="text-xl" title="3rd Place">
                        🥉
                      </span>
                    ) : (
                      <span className="text-gray-500 dark:text-gray-400 font-medium">
                        {index + 1}
                      </span>
                    )}
                  </div>

                  {/* Player Info Column */}
                  <div className="col-span-4">
                    <Link
                      to={`/user/${player.username || player.id}`}
                      className="group flex items-center hover:transform hover:translate-x-1 transition-transform duration-200"
                    >
                      <div className="w-10 h-10 rounded-full overflow-hidden bg-gradient-to-br from-indigo-500/10 to-purple-500/10 dark:from-indigo-500/20 dark:to-purple-500/20 flex items-center justify-center mr-3 border-2 border-transparent group-hover:border-indigo-500/50 transition-all duration-200">
                        {player.avatarUrl ? (
                          <img
                            src={player.avatarUrl}
                            alt={player.displayName || player.username}
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          <span className="text-indigo-600 dark:text-indigo-400 text-lg font-bold">
                            {(player.displayName || player.username || "?")
                              .charAt(0)
                              .toUpperCase()}
                          </span>
                        )}
                      </div>
                      <div className="flex flex-col">
                        <span className="font-medium text-gray-900 dark:text-gray-100 group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors">
                          {player.displayName ||
                            player.username ||
                            `Player #${index + 1}`}
                        </span>
                        <span className="text-xs text-gray-500 dark:text-gray-400">
                          @{player.username}
                        </span>
                      </div>
                    </Link>
                  </div>

                  {/* Stats Columns */}
                  <div className="col-span-2 flex justify-center items-center">
                    <span className="font-semibold text-gray-900 dark:text-gray-100 bg-indigo-100 dark:bg-indigo-900/30 px-3 py-1 rounded-full">
                      {(
                        player.totalScore ||
                        player.score ||
                        0
                      ).toLocaleString()}
                    </span>
                  </div>

                  <div className="col-span-2 flex justify-center items-center">
                    <span className="text-gray-700 dark:text-gray-300">
                      {player.gamesPlayed || player.games || 0}
                    </span>
                  </div>

                  <div className="col-span-2 flex justify-center items-center">
                    <span className="text-gray-700 dark:text-gray-300">
                      {player.gamesWon || player.wins || 0}
                    </span>
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
              <div className="py-12 text-center">
                <div className="max-w-sm mx-auto">
                  <p className="text-gray-500 dark:text-gray-400 mb-4">
                    No players found. Be the first to play and earn points!
                  </p>
                  <Link
                    to="/"
                    className="inline-flex items-center justify-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 transition-colors"
                  >
                    Start Playing
                  </Link>
                </div>
              </div>
            )}
          </div>
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
