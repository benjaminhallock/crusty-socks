const GameStatus = ({ gameState, isRoomLeader }) => {
  const copyInviteLink = () => {
    navigator.clipboard.writeText(window.location.href)
      .then(() => alert("Invite link copied!"))
      .catch(() => alert("Failed to copy link"));
  };

  return (
    <div className="flex justify-between items-center bg-white/90 backdrop-blur-sm rounded-lg p-4">
      <div className="flex items-center gap-2">
        <span className="text-lg font-semibold">Game Status:</span>
        <span className="text-lg text-indigo-600 capitalize">{gameState}</span>
      </div>

      <div className="flex gap-2">
        {isRoomLeader && gameState === "waiting" && (
          <button 
            className="px-4 py-2 rounded-lg text-white bg-indigo-600 hover:bg-indigo-700 transition"
          >
            Start
          </button>
        )}
        <button 
          onClick={copyInviteLink}
          className="px-4 py-2 rounded-lg text-white bg-gray-700 hover:bg-gray-800 transition"
        >
          Invite Players
        </button>
      </div>
    </div>
  );
};

export default GameStatus;
