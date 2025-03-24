import { useState, useEffect } from "react";
import {
  BrowserRouter,
  Routes,
  Route,
  Navigate,
  useLocation,
  
} from "react-router-dom";
import { useRef } from "react";
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

const ProtectedRoute = ({ user, children }) => {
  const location = useLocation();
  if (!user)
    return <Navigate to="/" replace state={{ from: location.pathname }} />;
  return children;
};

function App() {
  const [user, setUser] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [bgLoaded, setBgLoaded] = useState(false);
  const initialCheckRef = useRef(false);
  useEffect(() => {
    const bgImage = new Image();
    bgImage.src = "/wallpaper.svg";
    bgImage.onload = () => {
      setBgLoaded(true);
    };
    bgImage.onerror = (err) => {
      console.error("Failed to load background:", err);
      // Set as loaded anyway so the app continues to work
      setBgLoaded(true);
    };
  }, []);

  useEffect(() => {
    if (!localStorage.getItem("token")) {
      setIsLoading(false);
      return;
    }
    if (initialCheckRef.current) return;
    initialCheckRef.current = true;

    const checkUserAuth = async () => {
      try {
        console.log("Checking user authentication...");
        const response = await checkAuth();
        if (response?.user) {
          const userData = { ...response.user, id: response.user._id };
          console.log("User authenticated, saving user data:", userData);
          setUser(userData);
          localStorage.setItem("user", JSON.stringify(userData));
        } else {
          throw new Error("Invalid user data");
        }
      } catch (error) {
        console.error("Authentication check failed:", error);
        localStorage.clear();
      } finally {
        setIsLoading(false);
      }
    };

    checkUserAuth();
  }, []);

  const handleLogin = ({ user, token }) => {
    if (!user || !token) {
      console.error("Invalid login data");
      return;
    }
    const userInfo = { ...user, id: user._id };
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
        <div className="animate-spin h-8 w-8 border-4 border-blue-500 rounded-full border-t-transparent" />
      </div>
    );
  }

  return (
    <BrowserRouter>
      <div className="min-h-screen">
        <div
          id="app-background"
          style={{
            opacity: bgLoaded ? 0.9 : 0,
            transition: "opacity 0.5s ease-in-out",
          }}
        />
        <Navbar isLoggedIn={!!user} onLogout={handleLogout} />
        <main className="h-[calc(100vh-4rem)]">
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
                <ProtectedRoute user={user}>
                  <LobbySettings user={user} />
                </ProtectedRoute>
              }
            />
            <Route
              path="/lobby/:roomId"
              element={
                <ProtectedRoute user={user}>
                  <GameRoom user={user} />
                </ProtectedRoute>
              }
            />
            <Route
              path="/admin"
              element={
                <ProtectedRoute user={user}>
                  <Admin />
                </ProtectedRoute>
              }
            />
            <Route path="*" element={<Navigate to="/" />} />
          </Routes>
        </main>
      </div>
    </BrowserRouter>
  );
}

export default App;
