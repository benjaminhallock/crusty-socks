import { useEffect, useState } from "react";

const PlayersList = ({ roomLeader, players = [] }) => {
  useState(() => {
    for (let i = 0; i < players.length; i++) {
      const player = players[i];
      console.log(player.username);
      console.log(player.score);
      console.log(player.userId);
    }
    return () => {
      console.log("PlayersList unmounted");
    };
  }, []);

  return (
    <div className="bg-white rounded-lg shadow-lg border p-4 max-h-[200px] overflow-y-auto">
      <div className="flex flex-col gap-2">
        <div className="flex justify-between items-center sticky top-0 bg-white py-2">
          <h2 className="text-lg font-semibold">Players ({players.length})</h2>
        </div>
        <ul className="flex flex-col gap-2">
          {Array.isArray(players) &&
            players.map((player) => (
              <li key={player.userId} className="flex items-center gap-2">
                <div className="w-4 h-4 rounded-full bg-blue-500"></div>
                <span>{player.username}</span>
                <span className="ml-auto">{player.score}</span>
              </li>
            ))}
        </ul>
      </div>
    </div>
  );
};

export default PlayersList;
