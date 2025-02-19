import React, { useState } from 'react';
import { socketManager } from '../../services/socket';

const PlayerList = ({ players, drawerUsername, roomId }) => {
  const [showPopup, setShowPopup] = useState(false);

  const handleInviteLink = () => {
    navigator.clipboard.writeText(window.location.href);
    setShowPopup(true);
    setTimeout(() => setShowPopup(false), 2000); // Hide popup after 2 seconds
  };

  // Deduplicate players by username
  const uniquePlayers = Array.from(
    new Map(players.map((player) => [player.username, player])).values()
  );

  return (
    <div id="playerList" className="bg-gray-100 rounded-lg p-2 shadow-lg relative flex-1 flex flex-col">
      <div className="flex justify-between items-center mb-2">
        <h3 className="text-lg font-bold text-gray-800">Players</h3>
        <div className="relative">
          <button 
            onClick={handleInviteLink} 
            className="bg-indigo-600 text-white px-2 py-1 rounded-lg"
          >
            Invite
          </button>
          <button className="bg-green-600 text-white px-2 py-1 rounded-lg"
          onClick={() => {
            socketManager.startGame(roomId);
          }}>
            Start Game 
          </button>
          {showPopup && (
            <div className="absolute top-0 left-full ml-4 bg-indigo-500 text-white text-sm px-4 py-2 rounded-lg shadow-lg z-50">
              Link copied to clipboard!
            </div>
          )}
        </div>
      </div>
      <ul className="space-y-1 overflow-y-auto">
        {uniquePlayers.map((player, index) => (
          <li
            key={`player-${player.username}-${index}`}
            className="flex items-center gap-2 bg-gray-200 p-2 rounded-md hover:bg-gray-300 transition-colors duration-200"
          >
            <span
              className={`w-2 h-2 rounded-full ${
                drawerUsername === player.username ? "bg-green-500" : "bg-blue-500"
              }`}
            />
            <span className="flex justify-between w-full text-gray-800 font-medium text-sm">
              <span>{player.username}</span>
              <span className="score">{player.score}</span>
            </span>
          </li>
        ))}
      </ul>
    </div>
  );
};

export default PlayerList;
