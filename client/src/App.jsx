import { useState, useEffect } from "react";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { checkAuth } from "./services/auth";
import { socketManager } from "./services/socket";

// Component imports
import GameRoom from "./components/GameRoom";
import LoginForm from "./components/LoginForm";
import Navbar from "./components/helpers/Navbar";
import CreateLobby from "./components/CreateLobby";
import Admin from "./components/Admin";

function App() {
  const [user, setUser] = useState(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const token = localStorage.getItem("token");
    if (!token) {
      setIsLoading(false);
      return;
    }

    checkAuth()
      .then(response => {
        if (response.success) {
          const userData = { ...response.user, id: response.user._id };
          setUser(userData);
          socketManager.connect(userData);
        }
      })
      .catch(() => localStorage.clear())
      .finally(() => setIsLoading(false));
  }, []);

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
    return <div className="flex items-center justify-center min-h-screen">Loading...</div>;
  }

  return (
    <BrowserRouter>
      <div className="flex flex-col min-h-screen">
        <Navbar isLoggedIn={!!user} onLogout={handleLogout} />
        <Routes>
          <Route
            path="/"
            element={user ? <CreateLobby user={user} /> : <LoginForm onLoginSuccess={handleLogin} />}
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
      </div>
    </BrowserRouter>
  );
}

export default App;
