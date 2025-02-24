import React, { useState } from 'react';
import { socketManager } from '../../services/socket';

const PlayerList = ({ players, drawerUsername, roomId }) => {
  const [showPopup, setShowPopup] = useState(false);

  const handleInviteLink = () => {
    navigator.clipboard.writeText(window.location.href);
    setShowPopup(true);
    setTimeout(() => setShowPopup(false), 2000); // Hide popup after 2 seconds
  };

  return (
    <div id="playerList" className="bg-gray-100 dark:bg-gray-800 rounded-lg p-2 shadow-lg relative flex-1 flex flex-col transition-colors">
      <div className="flex justify-between items-center mb-2">
        <h3 className="text-lg font-bold text-gray-800 dark:text-gray-200">Players</h3>
        <div className="relative">
          <button 
            onClick={handleInviteLink} 
            className="bg-indigo-600 text-white px-2 py-1 rounded-md mr-2 hover:bg-indigo-700"
          >
            Invite
          </button>
          <button 
            className="bg-green-600 text-white px-2 py-1 rounded-md hover:bg-green-700"
            onClick={() => socketManager.startGame(roomId)}
          >
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
        {players.map((player, index) => (
          <li
            key={`player-${player.username}-${index}`}
            className={`flex items-center gap-2 p-2 rounded-md transition-colors duration-200 
              ${player.hasGuessed ? 'bg-green-200 dark:bg-green-800' : 'bg-gray-200 dark:bg-gray-700'} 
              ${player.hasDrawn ? 'opacity-50' : 'hover:bg-gray-300 dark:hover:bg-gray-600'}`}
          >
            {drawerUsername === player.username ? (
              <img src="/gifpencil.gif" alt="drawing" className="w-8 h-8 rounded-full" />
            ) : (
              <div className="w-4 h-4 bg-blue-500 rounded-full"></div>
            )}
            <span className="flex justify-between w-full text-gray-800 dark:text-gray-200 font-medium text-sm">
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
