import { useEffect } from 'react';
import { 
  socket, 
  connectSocket, 
  joinGame, 
  setPlayerReady, 
  setPlayerNotReady, 
  sendDrawing, 
  sendGuess 
} from '../socket';

export const useGameSocket = ({
  username,
  setPlayers,
  setGameState,
  setIsDrawer,
  setCurrentDrawer,
  setTimer,
  setCurrentWord,
  setCountdown,
  setConnected,
  setLoading,
  onError,
  onDebug
}) => {
  useEffect(() => {
    // Use the connectSocket utility instead of directly connecting
    connectSocket();

    const handleConnect = () => {
      onDebug("Socket connected");
      setConnected(true);
      setLoading(false);
    };

    const handleDisconnect = (reason) => {
      onDebug(`Socket disconnected: ${reason}`);
      setConnected(false);
      if (reason === "io server disconnect") {
        connectSocket();
      }
    };

    const handleGameStart = ({ drawer, word }) => {
      setGameState("playing");
      setIsDrawer(drawer.username === username);
      setCurrentDrawer(drawer);
      setTimer(60);
      setCurrentWord(word);
    };

    const handlePlayersList = (playersList) => {
      setPlayers(playersList || []);
    };

    const handleRoundEnd = ({ winner, word }) => {
      setGameState("roundEnd");
      setCurrentWord(word);
      // Reset drawer state
      setIsDrawer(false);
      setCurrentDrawer(null);
    };

    const handleGameEnd = () => {
      setGameState("end");
      setCurrentWord(null);
      setIsDrawer(false);
      setCurrentDrawer(null);
      setTimer(0);
    };

    // Socket event listeners
    socket.on("connect", handleConnect);
    socket.on("disconnect", handleDisconnect);
    socket.on("connect_error", (error) => onError(`Connection error: ${error.message}`));
    socket.on("gameStarting", handleGameStart);
    socket.on("playersList", handlePlayersList);
    socket.on("timeUpdate", setTimer);
    socket.on("countdown", ({ time }) => {
      setCountdown(time);
      setGameState("countdown");
    });
    socket.on("error", (error) => onError(error));
    socket.on("roundEnd", handleRoundEnd);
    socket.on("gameEnd", handleGameEnd);
    socket.on("wordReveal", ({ word }) => setCurrentWord(word));
    socket.on("drawerChange", ({ drawer }) => {
      setCurrentDrawer(drawer);
      setIsDrawer(drawer.username === username);
    });

    // Cleanup function
    return () => {
      socket.off("connect", handleConnect);
      socket.off("disconnect", handleDisconnect);
      socket.off("connect_error");
      socket.off("gameStarting", handleGameStart);
      socket.off("playersList", handlePlayersList);
      socket.off("timeUpdate");
      socket.off("countdown");
      socket.off("error");
      socket.off("roundEnd", handleRoundEnd);
      socket.off("gameEnd", handleGameEnd);
      socket.off("wordReveal");
      socket.off("drawerChange");
      socket.disconnect();
    };
  }, [username]);

  // Return socket actions using the exported functions from socket.js
  return {
    socket,
    joinGame: () => joinGame(username),
    setReady: setPlayerReady,
    setNotReady: setPlayerNotReady,
    sendDrawing,
    sendGuess: (message) => sendGuess({ user: username, message }),
    disconnect: () => socket.disconnect(),
    connect: connectSocket
  };
};
