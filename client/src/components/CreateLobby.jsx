import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { socket } from "../services/socket";
import { createLobby } from "../services/auth";

const CreateLobby = () => {
  const navigate = useNavigate();
  const [error, setError] = useState("");

  const buttonStyle = "px-6 py-3 text-white rounded-lg transition-colors";

  useEffect(() => {
    if (!localStorage.getItem("username")) {
      navigate("/");
    }
  }, [navigate]);

  const handleCreateLobby = async () => {
    try {
      const username = localStorage.getItem("username");
      const data = await createLobby();
      if (data.success) {
        const roomId = data.roomId;
        localStorage.setItem("roomId", roomId);
        console.log("Created lobby with ID:", roomId);
        navigate(`/lobby/${roomId}`);
      } else {
        setError(data.message);
      }
    } catch (error) {
      setError("Failed to create lobby");
    }
  };

  const handleJoinLobby = (e) => {
    e.preventDefault();
    const roomId = e.target.roomId.value.split("/").pop();
    if (roomId) {
      socket.emit("join_room", { roomId });
      navigate(`/lobby/${roomId}`);
    }
  };

  return (
    <div className="flex items-center justify-center h-[calc(100vh-5rem)]">
      <div className="text-center bg-white/80 backdrop-blur-[4px] p-8 rounded-lg shadow-lg">
        <div className="flex flex-col gap-4">
          {error && <div className="text-red-500">{error}</div>}

          <button
            onClick={handleCreateLobby}
            className={`${buttonStyle} bg-indigo-600 hover:bg-indigo-700`}
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
              className={`${buttonStyle} bg-gray-600 hover:bg-gray-700`}
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
