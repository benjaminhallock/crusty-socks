// Import necessary libraries and components
import { useRef, useState, useEffect } from "react";
import {
  BrowserRouter,
  Routes,
  Route,
  Navigate,
  useLocation,
} from "react-router-dom";

import "./styles/main.css";
import { checkAuth } from "./services/auth";
import { socketManager } from "./services/socket";

// Component imports
import Admin from "./components/admin/Admin";
import Navbar from "./components/common/Navbar";
import GameRoom from "./components/game/GameRoom";
import LoginForm from "./components/auth/LoginForm";
import CreateLobby from "./components/lobby/CreateLobby";
import UserProfile from "./components/users/UserProfile";
import LobbySettings from "./components/lobby/LobbySettings";
import Leaderboard from "./components/leaderboard/Leaderboard";
import AccountSettings from "./components/auth/AccountSettings";

// ProtectedRoute ensures only authenticated users can access certain routes
// Redirects unauthorized users to the home page
const ProtectedRoute = ({ user, children }) => {
  const location = useLocation();
  if (!user) return <Navigate to="/" replace state={{ from: location.pathname }} />;
  return children;
};

// AdminRoute ensures only admin users can access certain routes
// Redirects unauthorized users to the home page
const AdminRoute = ({ user, children }) => {
  const location = useLocation();
  if (!user || !user.isAdmin) return <Navigate to="/" replace state={{ from: location.pathname }} />;
  return children;
};

function App() {
  // State to manage the logged-in user
  const [user, setUser] = useState(null);
  // State to manage loading status during authentication check
  const [isLoading, setIsLoading] = useState(true);
  // State to manage background image loading status
  const [bgLoaded, setBgLoaded] = useState(false);
  // Ref to ensure authentication check runs only once
  const initialCheckRef = useRef(false);

  // Preload background image for smoother UI transitions
  useEffect(() => {
    const bgImage = new Image();
    bgImage.src = "/wallpaper.svg";
    bgImage.onload = () => setBgLoaded(true);
    bgImage.onerror = () => {
      console.error("Failed to load background image");
      setBgLoaded(true);
    };
  }, []);

  // Check user authentication on initial load
  useEffect(() => {
    if (!localStorage.getItem("token")) {
      setIsLoading(false);
      return;
    }
    if (initialCheckRef.current) return;
    initialCheckRef.current = true;

    const checkUserAuth = async () => {
      try {
        const response = await checkAuth();
        if (response?.user) {
          const userData = { ...response.user, id: response.user._id };
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

  // Handle user login by updating state and localStorage
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

  // Handle user logout by clearing state and localStorage
  const handleLogout = () => {
    localStorage.clear();
    socketManager.disconnect();
    setUser(null);
  };

  // Show loading spinner while checking authentication
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
        <Navbar isLoggedIn={!!user} onLogout={handleLogout} user={user} />
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
              path="/account"
              element={
                <ProtectedRoute user={user}>
                  <AccountSettings user={user} />
                </ProtectedRoute>
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
                <AdminRoute user={user}>
                  <Admin user={user} />
                </AdminRoute>
              }
            />
            <Route path="/leaderboard" element={<Leaderboard />} />
            <Route
              path="/user/:username"
              element={<UserProfile currentUser={user} />}
            />
            <Route path="*" element={<Navigate to="/" />} />
          </Routes>
        </main>
      </div>
    </BrowserRouter>
  );
}

export default App;
