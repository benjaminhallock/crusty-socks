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
  // Basic state for user and loading
  const [user, setUser] = useState(null);
  const [isLoading, setIsLoading] = useState(true);

  // Check if user is logged in when app starts
  useEffect(() => {
    const validateUser = async () => {
      setIsLoading(true);
      const token = localStorage.getItem("token");
      const storedUser = localStorage.getItem("user");
      
      if (!token || !storedUser) {
        setIsLoading(false);
        // Clear any partial session data
        localStorage.removeItem("token");
        localStorage.removeItem("user");
        return;
      }

      try {
        const response = await checkAuth();
        if (response.success) {
          // Ensure user object has id property set from _id
          const userData = {
            ...response.user,
            id: response.user._id // Add id property based on _id
          };
          setUser(userData);
          socketManager.connect(userData);
        } else {
          // Clear invalid session
          localStorage.removeItem("token");
          localStorage.removeItem("user");
          setUser(null);
        }
      } catch (error) {
        // Clear invalid session
        localStorage.removeItem("token");
        localStorage.removeItem("user");
        setUser(null);
      }
      
      setIsLoading(false);
    };

    validateUser();
  }, []); // Empty dependency array to run only once on mount

  // Handle user login
  const handleLogin = async (loginData) => {
    // Ensure user object has id property set from _id
    const userData = {
      ...loginData.user,
      id: loginData.user._id // Add id property based on _id
    };
    
    localStorage.setItem("token", loginData.token);
    localStorage.setItem("user", JSON.stringify(userData));
    await setUser(userData); // Ensure this completes first
    socketManager.connect(userData);
    // User will be redirected automatically by the Route logic when user state changes
  };

  // Handle user logout
  const handleLogout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    localStorage.removeItem("currentRoom");
    socketManager.disconnect();
    setUser(null);
  };

  if (isLoading) {
    return <div>Loading...</div>;
  }

  return (
    <BrowserRouter>
      <div className="flex flex-col min-h-screen">
        <Navbar isLoggedIn={!!user} onLogout={handleLogout} />

        <Routes>
          {/* Home page - shows login or create lobby based on auth */}
          <Route
            path="/"
            element={
              user ? <CreateLobby user={user} /> : <LoginForm onLoginSuccess={handleLogin} />
            }
          />

          {/* Game room - requires auth */}
          <Route
            path="/lobby/:roomId"
            element={user ? <GameRoom user={user} /> : <Navigate to="/" />}
          />

          {/* Admin page - requires auth */}
          <Route
            path="/admin"
            element={user ? <Admin /> : <Navigate to="/" />}
          />

          {/* Catch all other routes */}
          <Route path="*" element={<Navigate to="/" />} />
        </Routes>
      </div>
    </BrowserRouter>
  );
}

export default App;
