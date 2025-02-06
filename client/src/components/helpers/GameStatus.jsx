const GameStatus = ({ gameState, onStartGame }) => {
  return (
    <div className="flex gap-3 bg-white/90 backdrop-blur-sm rounded-lg p-4">
      <div className="flex items-center gap-1">
        <span className="text-lg font-bold">Status:</span>
        <span className="text-lg font-semibold text-indigo-600">
          {gameState}
        </span>
      </div>

      <div className="flex gap-3">
        <button className="px-4 py-2 rounded-lg text-white bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 transition">
          Start Game
        </button>
        <button className="px-4 py-2 rounded-lg text-white bg-gray-700 hover:bg-gray-800 transition">
          Copy Invite Link
        </button>
      </div>
    </div>
  );
};

export default GameStatus;
