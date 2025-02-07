const PlayersList = ({ players }) => {
  return (
    <div className="bg-gray-100 rounded-lg p-4 shadow-lg">
      <h3 className="text-xl font-bold mb-4 text-gray-800">Players</h3>
      <ul className="space-y-3">
        {players.map((player, index) => (
          <li
            key={`player-${player.userId}-${index}`}
            className="flex items-center gap-3 bg-gray-200 p-3 rounded-md hover:bg-gray-300 transition-colors duration-200"
          >
            <span 
              className={`w-3 h-3 rounded-full ${
                player.isOnline ? 'bg-green-500 animate-pulse' : 'bg-gray-400'
              }`}
            />
            <span className="text-gray-800 font-medium">{player.username}</span>
          </li>
        ))}
      </ul>
    </div>
  );
};

export default PlayersList;
