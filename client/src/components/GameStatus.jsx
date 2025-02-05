const GameStatus = ({
  gameState,
  players,
  countdown,
  isDrawer,
  currentWord,
  currentDrawer,
  timer,
}) => {
  if (gameState === "waiting") {
    const readyCount = players.filter((p) => p.status === "ready").length;
    return (
      <div className="text-center bg-white/80 backdrop-blur-sm p-4 rounded-lg shadow-xl">
        <h2 className="text-xl mb-2">Waiting for players to ready up</h2>
        <p className="text-indigo-600">
          {readyCount} of {players.length} players ready
        </p>
      </div>
    );
  }

  if (countdown && countdown > 0) {
    return (
      <div className="text-center bg-white/80 backdrop-blur-sm p-4 rounded-lg shadow-xl">
        <h2 className="text-2xl font-bold text-indigo-600">
          Game starting in {countdown}...
        </h2>
      </div>
    );
  }

  if (gameState === "playing") {
    return (
      <div className="text-center bg-white/80 backdrop-blur-sm p-4 rounded-lg shadow-xl">
        <h2 className="text-xl mb-2">
          {isDrawer
            ? `Your word is: ${currentWord}`
            : `${currentDrawer?.username || "Someone"} is drawing...`}
        </h2>
        <div className="text-xl font-mono bg-white dark:bg-gray-800 px-4 py-2 rounded-lg text-indigo-600 dark:text-indigo-400">
          {timer > 0 ? `${Math.floor(timer / 60)}:${(timer % 60).toString().padStart(2, "0")}` : "Time's up!"}
        </div>
      </div>
    );
  }

  if (gameState === "roundEnd") {
    return (
      <div className="text-center bg-white/80 backdrop-blur-sm p-4 rounded-lg shadow-xl">
        <h2 className="text-xl mb-2">Round Finished!</h2>
        <p className="text-indigo-600">The word was: {currentWord}</p>
        <p className="mt-2">Get ready for the next round...</p>
      </div>
    );
  }

  if (gameState === "end") {
    return (
      <div className="text-center bg-white/80 backdrop-blur-sm p-4 rounded-lg shadow-xl">
        Round finished! Ready up for the next round.
      </div>
    );
  }

  return (
    <div className="text-center bg-white/80 backdrop-blur-sm p-4 rounded-lg shadow-xl">
      <h2 className="text-xl">Waiting for players...</h2>
    </div>
  );
};

export default GameStatus;
