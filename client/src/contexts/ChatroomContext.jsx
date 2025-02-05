import { createContext, useContext, useEffect, useState } from "react";
import { socket } from "../socket";
import { useParams, useNavigate } from "react-router-dom";

const ChatroomContext = createContext(null);

export const ChatroomProvider = ({ children }) => {
  const [room, setRoom] = useState(null);
  const [users, setUsers] = useState([]);
  const [isHost, setIsHost] = useState(false);
  const [error, setError] = useState(null);
  const [lobbyState, setLobbyState] = useState(null);
  const navigate = useNavigate();
  const { roomId } = useParams();

  useEffect(() => {
    const username = localStorage.getItem("username");
    const storedRoomId = localStorage.getItem("roomId");

    if (!roomId || !username) {
      navigate("/");
      return;
    }

    // Initial fetch of lobby state
    const fetchLobbyState = async () => {
      try {
        const response = await fetch(`/lobby/${roomId}`);
        const data = await response.json();
        if (data.success) {
          setLobbyState(data.lobby);
          setUsers(data.lobby.users);
          setIsHost(data.lobby.roomLeader === socket.id);
        }
      } catch (error) {
        console.error("Failed to fetch lobby state:", error);
      }
    };

    fetchLobbyState();
    socket.emit("joinRoom", { roomId, username });

    socket.on("roomJoined", (roomData) => {
      setRoom(roomData);
      setUsers(roomData.users);
      setIsHost(roomData.hostId === socket.id);
      setError(null);
    });

    socket.on("roomNotFound", () => {
      setError("Room not found");
      navigate("/");
    });

    socket.on("userJoined", (userData) => {
      setUsers((prev) => [
        ...prev.filter((u) => u.id !== userData.id),
        userData,
      ]);
    });

    socket.on("userLeft", (userId) => {
      setUsers((prev) => prev.filter((user) => user.id !== userId));
    });

    socket.on("hostChanged", (newHostId) => {
      setIsHost(newHostId === socket.id);
    });

    socket.on("lobbyState", (state) => {
      setLobbyState(state);
      setRoom(state.room);
      setUsers(state.users);
      setIsHost(state.hostId === socket.id);
    });

    socket.on("lobbyUpdate", (update) => {
      setLobbyState((prev) => ({ ...prev, ...update }));
      if (update.users) setUsers(update.users);
    });

    return () => {
      socket.emit("leaveLobby", { roomId });
      socket.off("roomJoined");
      socket.off("roomNotFound");
      socket.off("userJoined");
      socket.off("userLeft");
      socket.off("hostChanged");
      socket.off("lobbyState");
      socket.off("lobbyUpdate");
    };
  }, [roomId, navigate]);

  const value = {
    room,
    users,
    isHost,
    error,
    lobbyState,
    roomUrl: roomId ? `${window.location.origin}/lobby/${roomId}` : null,
    updateLobbySettings: (settings) => {
      socket.emit("updateLobbySettings", { roomId, settings });
    },
  };

  return (
    <ChatroomContext.Provider value={value}>
      {children}
    </ChatroomContext.Provider>
  );
};

export const useChatroom = () => {
  const context = useContext(ChatroomContext);
  if (!context) {
    throw new Error("useChatroom must be used within a ChatroomProvider");
  }
  return context;
};
