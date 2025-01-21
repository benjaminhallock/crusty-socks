import { io } from 'socket.io-client';

export const socket = io(import.meta.env.VITE_SOCKET_URL, {
  transports: ['websocket'],
  reconnection: true,
  reconnectionDelay: 1000,
  reconnectionDelayMax: 5000,
  reconnectionAttempts: 5
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
