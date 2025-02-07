import { useEffect, useState, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { createLobby } from "../services/auth";
import { socketManager } from "../services/socket";

const CreateLobby = ({ user }) => {
  const navigate = useNavigate();
  const [error, setError] = useState("");
  const initialized = useRef(false);

  // Check if user is logged in and has active game
  useEffect(() => {
    if (!user?.id || !user?.username) {
      navigate("/");
      return;
    }

    if (initialized.current) return;
    initialized.current = true;

    const currentRoom = localStorage.getItem('currentRoom');
    if (currentRoom) {
      const shouldReturn = window.confirm('You have an active game. Would you like to return to it?');
      if (shouldReturn) {
        socketManager.joinLobby(currentRoom, user.username, user.id);
        navigate(`/lobby/${currentRoom}`);
        return;
      }
      localStorage.removeItem('currentRoom');
    }

    const userData = localStorage.getItem("user");
    if (!userData) {
      navigate("/");
    }
  }, [user, navigate]); // Added user and navigate to dependency array

  // Handle creating a new game lobby
  const handleCreateGame = async () => {
    if (!user?.id || !user?.username) {
      setError("User session invalid");
      return;
    }

    try {
      const response = await createLobby();
      if (response.success) {

        setError("");
        socketManager.joinLobby(response.roomId, user.username, user.id);
        navigate(`/lobby/${response.roomId}`);
      } else {
        setError(response.message || "Could not create game");
      }
    } catch (error) {
      setError("Could not connect to server");
    }
  };

  // Handle joining an existing game
  const handleJoinGame = (e) => {
    e.preventDefault();

    if (!user?.id || !user?.username) {
      setError("User session invalid");
      return;
    }

    const roomInput = e.target.roomId.value.trim();
    
    // Extract room ID from full URL or use direct input
    const roomId = roomInput.includes("/") 
      ? roomInput.split("/").pop() 
      : roomInput;

    if (roomId) {
      socketManager.joinLobby(roomId, user.username, user.id);
      navigate(`/lobby/${roomId}`);
    } else {
      setError("Please enter a room ID or URL");
    }
  };

  return (
    <div className="flex items-center justify-center h-[calc(100vh-5rem)]">
      <div className="text-center bg-white/80 backdrop-blur-[4px] p-8 rounded-lg shadow-lg w-full max-w-md">
        <h1 className="text-2xl font-bold mb-6">Join a Game</h1>
        
        {/* Error message */}
        {error && (
          <div className="text-red-500 bg-red-50 p-3 rounded-lg text-sm mb-4">
            {error}
          </div>
        )}

        {/* Create game button */}
        <button
          onClick={handleCreateGame}
          className="w-full px-6 py-3 text-white rounded-lg bg-indigo-600 hover:bg-indigo-700"
        >
          Create New Game
        </button>

        {/* Divider */}
        <div className="relative my-4">
          <div className="absolute inset-0 flex items-center">
            <div className="w-full border-t border-gray-300"></div>
          </div>
          <div className="relative flex justify-center">
            <span className="px-2 bg-white/80 text-sm text-gray-500">
              or join existing
            </span>
          </div>
        </div>

        {/* Join game form */}
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
