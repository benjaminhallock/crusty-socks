const PlayersList = ({ 
  players, 
  currentDrawer, 
  username,
  gameState,
  roomLeader,
  className 
}) => {
  return (
    <div className={`mb-4 bg-white dark:bg-gray-800 p-4 rounded-lg shadow-lg ${className}`}>
      <h3 className="font-bold mb-4 text-lg text-indigo-600 border-b pb-2">
        Players ({players.length})
      </h3>
      <div className="space-y-2">
        {players.map((player) => (
          <div
            key={player.userId}
            className={`flex items-center justify-between p-2 rounded ${
              player.username === username ? "bg-indigo-50" : ""
            }`}
          >
            <div className="flex items-center gap-2">
              <span className={`font-medium ${player.isOnline ? 'text-gray-900' : 'text-gray-400'}`}>
                {player.username}
              </span>
              {player.userId === roomLeader && (
                <span className="text-xs bg-yellow-200 px-2 py-0.5 rounded-full font-medium text-yellow-800">
                  Host
                </span>
              )}
              {player.isReady && (
                <span className="text-green-500">✓</span>
              )}
            </div>
            <span className="text-sm bg-indigo-500 text-white px-2 py-1 rounded-full">
              {player.score || 0} pts
            </span>
          </div>
        ))}
      </div>
    </div>
  );
};

export default PlayersList;
