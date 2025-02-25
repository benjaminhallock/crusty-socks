import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

import { fetchLobby } from '../../services/auth';

const CreateLobby = ({ user }) => {
  const navigate = useNavigate();
  const [error, setError] = useState("");

  useEffect(() => {
    if (!user) {
      navigate('/');
      return;
    }
  }, [navigate, user]);

  const handleCreateGame = () => {
    navigate('/lobby/new');
  };

  const handleJoinGame = async (e) => {
    e.preventDefault();
    // Extract roomId from the input value (which may be a full URL)
    const roomId = e.target.roomId.value.trim().split("/").pop();

    if (!roomId) return;

    try {
      const response = await fetchLobby(roomId);
      if (response.success) {
        navigate(`/lobby/${roomId}`);
      } else {
        setError("Invalid Room ID.")
      }
    } catch (error) {
      setError(""+error)
    }
  };

  return (
    <div className="flex items-center justify-center h-[calc(100vh-5rem)]">
      <div className="text-center bg-white/80 backdrop-blur-[4px] p-8 rounded-lg shadow-lg w-full max-w-md">
        <h1 className="text-2xl font-bold mb-6 dark:text-black">Create or Join a Game</h1>
        
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
            className="w-full text-white px-4 py-2 rounded-lg border mb-4 focus:outline-none focus:ring-2 focus:ring-indigo-500 dark:text-white"
            required
          />
          <button
            type="submit"
            className="w-full px-6 py-3 text-white rounded-lg bg-gray-600 hover:bg-gray-700"
          >
            Join Game
          </button>
        </form>
        {error && (
            <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded">
              {error}
            </div>
        )}
      </div>
    </div>
  );
};

export default CreateLobby;
