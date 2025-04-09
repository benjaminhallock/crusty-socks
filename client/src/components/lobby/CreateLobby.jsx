import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";

import { fetchLobby } from "../../services/api";

const CreateLobby = ({ user }) => {
  const navigate = useNavigate();
  const [error, setError] = useState("");

  useEffect(() => {
    if (!user || localStorage.getItem("token") === null) {
      localStorage.removeItem("user");
      navigate("/");
    }
  }, [navigate, user]);

  const handleCreateGame = () => navigate("/lobby/new");
  
  const handleJoinGame = async (e) => {
    e.preventDefault();
    const roomId = e.target.roomId.value.trim().split("/").pop();
    if (!roomId) return setError("Invalid Room ID");
    navigate(`/lobby/${roomId}`);
  };

  return (
    <div className="flex items-center justify-center h-[calc(100vh-5rem)]">
      <div className="text-center bg-white dark:bg-gray-800 p-8 rounded-lg shadow-lg w-full max-w-md">
        <h1 className="text-2xl font-bold mb-6 text-gray-800 dark:text-gray-200">
          Create or Join a Game
        </h1>

        <button
          onClick={handleCreateGame}
          className="w-full px-6 py-3 text-white rounded-lg bg-blue-600 hover:bg-blue-700"
        >
          Create New Game
        </button>

        <div className="relative my-4">
          <div className="absolute inset-0 flex items-center">
            <div className="w-full border-t border-gray-300 dark:border-gray-600"></div>
          </div>
          <div className="relative flex justify-center">
            <span className="px-2 bg-white dark:bg-gray-800 text-sm text-gray-500 dark:text-gray-400">
              or join existing
            </span>
          </div>
        </div>

        <form onSubmit={handleJoinGame}>
          <input
            type="text"
            name="roomId"
            placeholder="Enter Room ID or paste invite link"
            className="w-full px-4 py-2 rounded-lg border mb-4 focus:outline-none focus:ring-2 focus:ring-blue-500 bg-gray-100 dark:bg-gray-700 text-gray-800 dark:text-gray-200"
            required
          />
          <button
            type="submit"
            className="w-full px-6 py-3 text-white rounded-lg bg-blue-600 hover:bg-blue-700"
          >
            Join Game
          </button>
        </form>

        {error && (
          <div className="mt-4 bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded">
            {error}
          </div>
        )}
      </div>
    </div>
  );
};

export default CreateLobby;
