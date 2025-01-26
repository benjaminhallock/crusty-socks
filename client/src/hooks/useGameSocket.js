import { useEffect } from 'react';
import { socket } from '../socket';

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
    if (!socket.connected) {
      socket.connect();
    }

    const handleConnect = () => {
      onDebug("Socket connected");
      setConnected(true);
      setLoading(false);
    };

    const handleDisconnect = (reason) => {
      onDebug(`Socket disconnected: ${reason}`);
      setConnected(false);
      if (reason === "io server disconnect") {
        socket.connect();
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

    return () => {
      socket.off("connect", handleConnect);
      socket.off("disconnect", handleDisconnect);
      socket.off("connect_error");
      socket.off("gameStarting", handleGameStart);
      socket.off("playersList", handlePlayersList);
      socket.off("timeUpdate");
      socket.off("countdown");
      socket.disconnect();
    };
  }, [username]);

  return socket;
};
