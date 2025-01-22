import { io } from 'socket.io-client';

const SOCKET_URL = import.meta.env.VITE_SOCKET_URL;
console.log('Attempting to connect to:', SOCKET_URL);

export const socket = io(SOCKET_URL, {
  transports: ['websocket', 'polling'],
  reconnection: true,
  reconnectionDelay: 1000,
  reconnectionDelayMax: 5000,
  reconnectionAttempts: 5,
  timeout: 10000
});

export const socketStatus = {
  connected: false,
  error: null,
  details: '',
  joinedGame: false
};

socket.on("connect_error", (error) => {
  console.error("Socket connection error:", error);
  socketStatus.connected = false;
  socketStatus.error = error;
  socketStatus.details = `Failed to connect to ${SOCKET_URL}. Error: ${error.message}`;
});

socket.on("connect", () => {
  console.log("Socket connected successfully to:", SOCKET_URL);
  socketStatus.connected = true;
  socketStatus.error = null;
  socketStatus.details = '';
});

socket.on("disconnect", (reason) => {
  console.log("Socket disconnected:", reason);
  socketStatus.connected = false;
  socketStatus.details = `Disconnected: ${reason}`;
});

socket.on("playersList", (players) => {
  console.log("Received players list:", players);
  socketStatus.joinedGame = true;
});

socket.on("error", (error) => {
  console.error("Game error:", error);
  socketStatus.error = error;
  socketStatus.details = error;
});
