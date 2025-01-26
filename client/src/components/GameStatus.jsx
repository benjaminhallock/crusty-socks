const GameStatus = ({ gameState, players, countdown, isDrawer, currentWord, currentDrawer, timer }) => {
  if (gameState === "waiting") {
    const readyCount = players.filter((p) => p.status === "ready").length;
    return (
      <div className="text-center">
        <h2 className="text-xl mb-2">Waiting for players to ready up</h2>
        <p className="text-indigo-600">
          {readyCount} of {players.length} players ready
        </p>
      </div>
    );
  }

  if (countdown && countdown > 0) {
    return (
      <h2 className="text-2xl font-bold text-indigo-600">
        Game starting in {countdown}...
      </h2>
    );
  }

  if (gameState === "playing") {
    return (
      <div className="flex flex-col items-center w-full">
        <h2 className="text-xl mb-2">
          {isDrawer 
            ? `Draw: ${currentWord}`
            : `${currentDrawer?.username || 'Someone'} is drawing...`}
        </h2>
        {timer && (
          <div className="text-xl font-mono bg-white dark:bg-gray-800 px-4 py-2 rounded-lg text-indigo-600 dark:text-indigo-400">
            {Math.floor(timer / 60)}:{(timer % 60).toString().padStart(2, "0")}
          </div>
        )}
      </div>
    );
  }

  if (gameState === "end") {
    return (
      <div className="text-center p-4 bg-blue-100 dark:bg-blue-900 rounded text-blue-800 dark:text-blue-200">
        Round finished! Ready up for the next round.
      </div>
    );
  }

  return <h2 className="text-xl">Waiting for players...</h2>;
};

export default GameStatus;
