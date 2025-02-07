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
    }
    else {
      checkAuth()
        .then(response => {
          if (response.success) {
            const userData = { ...response.user, id: response.user._id };
            setUser(userData);
            socketManager.connect(userData);
          }
        })
        .catch(() => {
          localStorage.clear();
          setIsLoading(false);
        })
        .finally(() => setIsLoading(false));
    }
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
    return <div className="flex items-center justify-center h-screen">Loading...</div>;
  }

  return (
    <BrowserRouter>
      <div className="min-h-screen">
        <Navbar isLoggedIn={!!user} onLogout={handleLogout} />
        <main className="h-[calc(100vh-4rem)]">
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
        </main>
      </div>
    </BrowserRouter>
  );
}

export default App;
