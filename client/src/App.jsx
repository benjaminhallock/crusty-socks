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

  useEffect(() => {
    console.log("Auth effect running"); // Debug log
    let mounted = true; // Track if component is mounted

    const checkUserAuth = async () => {
      const token = localStorage.getItem("token");
      if (!token) {
        if (mounted) setIsLoading(false);
        return;
      }

      try {
        const response = await checkAuth();
        if (mounted && response.success) {
          const userData = { ...response.user, id: response.user._id };
          setUser(userData);
          socketManager.connect(userData);
        }
      } catch (error) {
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
      mounted = false; // Cleanup to prevent setting state on unmounted component
      console.log("Auth effect cleanup"); // Debug log
    };
  }, []); // Empty dependency array since this should only run once

  const handleLogin = ({ user: userData, token }) => {
    const userInfo = { ...userData, id: userData._id };
    localStorage.setItem("token", token);
    setUser(userInfo);
    socketManager.connect(userInfo);
  };

  const handleLogout = () => {
    localStorage.clear();
    socketManager.disconnect();
    setUser(null);
  };

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
        <Navbar isLoggedIn={!!user} onLogout={handleLogout} />
        <main className="h-[calc(100vh-4rem)]">
        {/* <MusicPlayer /> */}
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
