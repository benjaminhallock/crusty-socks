import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { createLobby } from "../services/auth";
import { socketManager } from "../services/socket";

const CreateLobby = ({ user }) => {
  const navigate = useNavigate();

  const joinRoom = (roomId, username, userId) => {
    socketManager.joinLobby(roomId, username, userId);
    navigate(`/lobby/${roomId}`);
  };

  useEffect(() => {
    if (!user?.id || !user?.username) {
      navigate("/");
      return;
    }

    const currentRoom = localStorage.getItem('currentRoom');
    if (currentRoom && window.confirm('Return to your active game?')) {
      joinRoom(currentRoom, user.username, user.id);
    } else {
      localStorage.removeItem('currentRoom');
    }
  }, [user, navigate]);

  const handleCreateGame = async () => {
    try {
      const response = await createLobby();
      if (response.success) {
        joinRoom(response.roomId, user.username, user.id);
      }
    } catch (error) {
      console.error("Failed to create game:", error);
    }
  };

  const handleJoinGame = (e) => {
    e.preventDefault();
    const roomId = e.target.roomId.value.trim().split("/").pop();
    if (roomId) {
      joinRoom(roomId, user.username, user.id);
    }
  };

  return (
    <div className="flex items-center justify-center h-[calc(100vh-5rem)]">
      <div className="text-center bg-white/80 backdrop-blur-[4px] p-8 rounded-lg shadow-lg w-full max-w-md">
        <h1 className="text-2xl font-bold mb-6">Join a Game</h1>
        
        <button
          onClick={handleCreateGame}
          className="w-full px-6 py-3 text-white rounded-lg bg-indigo-600 hover:bg-indigo-700"
        >
          Create New Game
        </button>

        <div className="relative my-4">
          <div className="absolute inset-0 flex items-center">
            <div className="w-full border-t border-gray-300"></div>
          </div>
          <div className="relative flex justify-center">
            <span className="px-2 bg-white/80 text-sm text-gray-500">or join existing</span>
          </div>
        </div>

        <form onSubmit={handleJoinGame}>
          <input
            type="text"
            name="roomId"
            placeholder="Enter Room ID or paste invite link"
            className="w-full px-4 py-2 rounded-lg border mb-4 focus:outline-none focus:ring-2 focus:ring-indigo-500"
            required
          />
          <button
            type="submit"
            className="w-full px-6 py-3 text-white rounded-lg bg-gray-600 hover:bg-gray-700"
          >
            Join Game
          </button>
        </form>
      </div>
    </div>
  );
};

export default CreateLobby;
