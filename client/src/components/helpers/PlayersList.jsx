import { useEffect, useState } from "react";

const PlayersList = ({ players = [] }) => {
  // Deduplicate players based on userId
  const uniquePlayers = players.reduce((acc, player) => {
    const userId = typeof player === 'object' ? (player._id || player.userId) : player;
    if (!acc.some(p => (p._id || p.userId) === userId)) {
      acc.push(player);
    }
    return acc;
  }, []);

  return (
    <div className="bg-white rounded-lg shadow-lg border p-4 max-h-[200px] overflow-y-auto">
      {/* Header */}
      <div className="sticky top-0 bg-white py-2">
        <h2 className="text-lg font-semibold">
          Players ({uniquePlayers.length})
        </h2>
      </div>

      {/* Players list */}
      <ul className="flex flex-col gap-2">
        {uniquePlayers.map((player) => {
          const username = typeof player === 'object' ? player.username : player;
          const score = typeof player === 'object' ? player.score || 0 : 0;
          const id = typeof player === 'object' ? (player._id || player.userId) : player;

          return (
            <li key={id} className="flex items-center gap-2">
              <div className="w-4 h-4 rounded-full bg-blue-500" />
              <span>{username}</span>
              <span className="ml-auto">{score}</span>
            </li>
          );
        })}
      </ul>
    </div>
  );
};

export default PlayersList;
