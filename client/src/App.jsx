import { useState, useEffect } from "react";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";

import "./styles/main.css";
import { checkAuth } from "./services/auth";
import { socketManager } from "./services/socket";

// Component imports
import Admin from "./components/admin/Admin";
import Navbar from "./components/common/Navbar";
import GameRoom from "./components/game/GameRoom";
import LoginForm from "./components/auth/LoginForm";
import CreateLobby from "./components/lobby/CreateLobby";
import LobbySettings from "./components/lobby/LobbySettings";
import MusicPlayer from "./components/common/MusicPlayer";

function App() {
  const [user, setUser] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isPlaying, setIsPlaying] = useState(() => {
    return localStorage.getItem('isPlaying') === 'true';
  });
  const [isMuted, setIsMuted] = useState(() => {
    return localStorage.getItem('isMuted') === 'true';
  });

  useEffect(() => {
    let mounted = true;
    const checkUserAuth = async () => {
      const token = localStorage.getItem("token");
      if (!token) {
        if (mounted) setIsLoading(false);
        return;
      }

      try {
        const response = await checkAuth();
        if (mounted && response.success) {
          console.log("User authenticated:", response.user);
          const userData = { ...response.user, id: response.user._id };
          setUser(userData);
          socketManager.connect(userData);
        }
      } catch (error) {
        console.error("Authentication error:", error);
        if (mounted) {
          localStorage.clear();
          setIsLoading(false);
        }
      } finally {
        if (mounted) setIsLoading(false);
      }
    };

    checkUserAuth();

    return () => {
      mounted = false;
    };
  }, []); 

  const handleLogin = ({ user: userData, token }) => {
    const userInfo = { ...userData, id: userData._id };
    localStorage.setItem("token", token);
    setUser(userInfo);
    socketManager.connect(userInfo);  // Connect socket right after successful login
  };

  const handleLogout = () => {
    localStorage.clear();
    socketManager.disconnect();
    setUser(null);
  };

  const handlePlayPause = () => {
    setIsPlaying(prevState => !prevState);
  };

  const handleMuteUnmute = () => {
    setIsMuted(prevState => !prevState);
  };

  useEffect(() => {
    localStorage.setItem('isPlaying', isPlaying);
  }, [isPlaying]);

  useEffect(() => {
    localStorage.setItem('isMuted', isMuted);
  }, [isMuted]);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="animate-spin h-8 w-8 border-4 border-blue-500 rounded-full border-t-transparent"></div>
      </div>
    );
  }

  return (
    <BrowserRouter>
      <div className="min-h-screen">
        <Navbar isLoggedIn={!!user} onLogout={handleLogout} onPlayPause={handlePlayPause} isPlaying={isPlaying} onMuteUnmute={handleMuteUnmute} isMuted={isMuted} />
        <main className="h-[calc(100vh-4rem)]">
          <MusicPlayer isPlaying={isPlaying} isMuted={isMuted} />
          <Routes>
            <Route
              path="/"
              element={
                user ? (
                  <CreateLobby user={user} />
                ) : (
                  <LoginForm onLoginSuccess={handleLogin} />
                )
              }
            />
            <Route
              path="/lobby/new"
              element={
                user ? <LobbySettings user={user} /> : <Navigate to="/" />
              }
            />
            <Route
              path="/lobby/:roomId"
              element={user ? <GameRoom user={user} /> : <Navigate to="/" />}
            />
            <Route
              path="/admin"
              element={user ? <Admin /> : <Navigate to="/" />}
            />
            <Route path="*" element={<Navigate to="/" />} />
          </Routes>
        </main>
      </div>
    </BrowserRouter>
  );
}

export default App;
