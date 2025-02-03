const PlayersList = ({ 
  players, 
  currentDrawer, 
  username, 
  gameState, 
  isReady, 
  onReadyToggle,
  isHost,
  className 
}) => {
  return (
    <div className={`mb-4 bg-white dark:bg-gray-800 p-4 rounded-lg shadow-lg border-4 border-indigo-300 dark:border-indigo-600 ${className}`}>
      <h3 className="font-bold mb-4 text-lg text-indigo-600 dark:text-indigo-400 border-b dark:border-gray-700 pb-2">
        Players
      </h3>
      <div className="space-y-2">
        {players.map((player) => (
          <div
            key={player.username}
            className={`flex items-center justify-between p-2 rounded ${
              currentDrawer && player.id === currentDrawer.id
                ? "bg-indigo-100 dark:bg-gray-700"
                : ""
            }`}
          >
            <div className="flex items-center gap-2">
              <span className="font-medium dark:text-gray-200">{player.username}</span>
              {player.status === "ready" && (
                <span className="text-green-500 dark:text-green-400">✓</span>
              )}
              {currentDrawer && player.id === currentDrawer.id && (
                <span className="text-sm text-indigo-600 dark:text-indigo-400 font-semibold">
                  (Drawing)
                </span>
              )}
              {player.isHost && (
                <span className="text-xs bg-yellow-200 px-1 rounded">Host</span>
              )}
            </div>
            <div className="flex items-center gap-2">
              <span className="text-sm bg-indigo-500 text-white px-2 py-1 rounded-full">
                {player.score || 0} pts
              </span>
              {player.username === username &&
                (gameState === "waiting" || gameState === "end") && (
                  <button
                    onClick={onReadyToggle}
                    className={`px-3 py-1 rounded-full text-sm font-medium transition-colors ${
                      isReady
                        ? "bg-green-500 text-white hover:bg-green-600"
                        : "bg-gray-200 text-gray-700 hover:bg-gray-300"
                    }`}
                  >
                    {isReady ? "Ready!" : "Ready?"}
                  </button>
                )}
            </div>
          </div>
        ))}
      </div>
      {players.length === 1 && (
        <p className="text-sm text-indigo-500 dark:text-indigo-400 mt-4 text-center">
          Waiting for more players to join...
        </p>
      )}
    </div>
  );
};

export default PlayersList;
