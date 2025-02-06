import { useState, useEffect } from "react";
import { Routes, Route, Navigate } from "react-router-dom";
import { checkAuth } from "./services/auth";
import { disconnectSocket, connectSocket, socket } from "./services/socket";
import GameRoom from "./components/GameRoom";
import LoginForm from "./components/LoginForm";
import Navbar from "./components/helpers/Navbar";
import CreateLobby from "./components/CreateLobby";

function App() {
  const [authState, setAuthState] = useState({
    isAuthenticated: false,
    userId: null,
  });

  useEffect(() => {
    const validateAuth = async () => {
      const token = localStorage.getItem("token");
      if (token) {
        try {
          const res = await checkAuth(token);
          if (res.success) {
            handleLogin(res);
          } else {
            console.log("Failed to validate token:", res.message);
            handleLogout();
          }
        } catch (error) {
          console.error("Failed to validate token:", error);
        }
      }
    };
    validateAuth();
    return () => handleLogout();
  }, []);

  const handleLogin = (res) => {
    localStorage.setItem("token", res.token);
    localStorage.setItem("_id", res._id);
    localStorage.setItem("user", JSON.stringify(res.user)); // Changed to store user object as string
    setAuthState({ isAuthenticated: true, user: res.user });
    console.log("User is authenticated on login: ", res.user); // Fixed: using res.user instead of user
    connectSocket();
  };

  const handleLogout = () => {
    disconnectSocket();
    localStorage.removeItem("token");
    localStorage.removeItem("username");
    setAuthState({ isAuthenticated: false, user: null });
  };

  return (
    <div className="flex flex-col min-h-screen">
      <Navbar isLoggedIn={authState.isAuthenticated} onLogout={handleLogout} />
      <Routes>
        <Route
          path="/"
          element={
            authState.isAuthenticated ? (
              <CreateLobby username={authState.user} />
            ) : (
              <LoginForm onLoginSuccess={handleLogin} />
            )
          }
        />
        <Route
          path="/logout"
          element={<Navigate to="/" replace />}
          loader={() => {
            handleLogout();
            return null;
          }}
        />
        <Route
          path="/lobby/:roomId"
          element={
            authState.isAuthenticated ? (
              <GameRoom username={authState.user} />
            ) : (
              <Navigate to="/" replace />
            )
          }
        />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>

      <br />
    </div>
  );
}

export default App;
