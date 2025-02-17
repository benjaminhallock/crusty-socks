import React from 'react';

const PlayerList = ({ players }) => {
  const handleInviteLink = () => {
    navigator.clipboard.writeText(window.location.href);
  };

  // Deduplicate players by username
  const uniquePlayers = Array.from(new Map(players.map(player => [player.username, player])).values());

  return (
    <div  id="playerList" className="bg-gray-100 rounded-lg p-2 shadow-lg">
      <div className="flex justify-between items-center mb-2">
        <h3 className="text-lg font-bold text-gray-800">Players</h3>
        <button 
          onClick={handleInviteLink} 
          className="bg-indigo-600 text-white px-2 py-1 rounded-lg"
        >
          Invite Link
        </button>
      </div>
      <ul className="space-y-1 overflow-y-auto">
        {uniquePlayers.map((player, index) => (
          <li
            key={`player-${player.username}-${index}`}
            className="flex items-center gap-2 bg-gray-200 p-2 rounded-md hover:bg-gray-300 transition-colors duration-200"
          >
            <span 
              className={`w-2 h-2 rounded-full ${
                player.isOnline ? 'bg-green-500 animate-pulse' : 'bg-gray-400'
              }`}
            />
            <span className="text-gray-800 font-medium text-sm">{player.username}</span>
          </li>
        ))}
      </ul>
    </div>
  );
};

export default PlayerList;