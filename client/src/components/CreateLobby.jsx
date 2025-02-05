import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { socket } from "../socket";
import { createLobby } from "../services/auth";

const CreateLobby = () => {
  const navigate = useNavigate();
  const [error, setError] = useState("");

  useEffect(() => {
    const username = localStorage.getItem("username");
    if (!username) {
      navigate("/");
      return;
    }
  }, [navigate]);

  const handleCreateLobby = async () => {
    try {
      setError("");
      const username = localStorage.getItem("username");
      const roomId = await createLobby(username);
      localStorage.setItem("roomId", roomId);
      //   socket.emit("join_room", { roomId });
      navigate(`/lobby/${roomId}`);
    } catch (error) {
      setError(error.message || "Failed to create lobby");
      console.error("Failed to create lobby:", error);
    }
  };

  const handleJoinLobby = (event) => {
    event.preventDefault();
    const input = event.target.roomId.value;
    const roomId = input.includes("/") ? input.split("/").pop() : input;
    if (roomId) {
      socket.emit("join_room", { roomId });
      navigate(`/lobby/${roomId}`);
    }
  };

  return (
    <div className="flex items-center justify-center h-[calc(100vh-5rem)]">
      <div className="text-center bg-white/80 backdrop-blur-[4px] p-8 rounded-lg shadow-lg transition-all duration-300">
        <div className="flex flex-col gap-4">
          {error && <div className="text-red-500">{error}</div>}
          <button
            onClick={() => handleCreateLobby()}
            className="px-6 py-3 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors"
          >
            Create Lobby
          </button>
          <div className="text-gray-500">or</div>
          <form onSubmit={handleJoinLobby} className="flex flex-col gap-4">
            <input
              type="text"
              name="roomId"
              placeholder="Enter Room ID/url"
              className="px-4 py-2 rounded-lg border"
              required
            />
            <button
              type="submit"
              className="px-6 py-3 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors"
            >
              Join Lobby
            </button>
          </form>
        </div>
      </div>
    </div>
  );
};

export default CreateLobby;
