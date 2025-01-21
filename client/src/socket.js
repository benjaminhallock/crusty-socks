import { io } from "socket.io-client";

const SOCKET_URL = "http://localhost:5050";

const socket = io(SOCKET_URL, {
  autoConnect: false, // Don't connect automatically
  reconnection: true,
  reconnectionAttempts: Infinity,
  reconnectionDelay: 1000,
  reconnectionDelayMax: 5000,
  timeout: 20000,
  transports: ['websocket'],
});

// Add connection monitoring
socket.on("connect_error", (error) => {
  console.error("Socket connection error:", error);
});

socket.on("connect", () => {
  console.log("Socket connected successfully");
});

socket.on("disconnect", (reason) => {
  console.log("Socket disconnected:", reason);
});

export { socket };
