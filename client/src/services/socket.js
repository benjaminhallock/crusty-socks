import { io } from "socket.io-client";

const SOCKET_URL = import.meta.env.VITE_SOCKET_URL || "http://localhost:3001";

export const socket = io(SOCKET_URL, {
  transports: ["websocket", "polling"],
  reconnection: true,
  timeout: 10000,
});

socket.on("connect", () => {
  console.log("Socket connected successfully to:", SOCKET_URL);
});

socket.on("disconnect", (reason) => {
  console.log("Socket disconnected:", reason);
});

socket.on("connect_error", (error) => {
  console.error("Socket connection error:", error);
});

export const onJoinLobby = (cb) => {
  socket.on("joinLobby", (data) => {
    cb(data);
  });
};

export const joinLobby = (roomId, username) => {
  socket.emit("joinLobby", { roomId, username });
};

export const leaveLobby = (roomId, username) => {
  socket.emit("leaveLobby", { roomId, username });
};

export const connectSocket = () => {
  if (!socket.connected) {
    socket.connect();
  }
};

export const disconnectSocket = () => {
  if (socket.connected) {
    socket.disconnect();
  }
};

export default socket;
