const PlayersList = ({ 
  players, 
  currentDrawer, 
  username,
  gameState,
  isHost,
  className 
}) => {
  return (
    <div className={`mb-4 bg-white dark:bg-gray-800 p-4 rounded-lg shadow-lg border-4 border-indigo-300 dark:border-indigo-600 ${className}`}>
      <h3 className="font-bold mb-4 text-lg text-indigo-600 dark:text-indigo-400 border-b dark:border-gray-700 pb-2">
        Players ({players.length})
      </h3>
      <div className="space-y-2">
        {players.map((player) => (
          <div
            key={player.userId}
            className={`flex items-center justify-between p-2 rounded ${
              currentDrawer && player.userId === currentDrawer.userId
                ? "bg-indigo-100 dark:bg-gray-700"
                : ""
            }`}
          >
            <div className="flex items-center gap-2">
              <span className={`font-medium ${player.isOnline ? 'text-gray-900 dark:text-gray-200' : 'text-gray-400'}`}>
                {player.username}
              </span>
              {player.isReady && (
                <span className="text-green-500 dark:text-green-400">✓</span>
              )}
              {player.userId === roomLeader && (
                <span className="text-xs bg-yellow-200 dark:bg-yellow-600 px-1 rounded">Host</span>
              )}
            </div>
            <div className="flex items-center gap-2">
              <span className="text-sm bg-indigo-500 text-white px-2 py-1 rounded-full">
                {player.score || 0} pts
              </span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default PlayersList;
