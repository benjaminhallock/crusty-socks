import { useState } from "react";
import GameRoom from "./components/GameRoom";
import LoginForm from "./components/LoginForm";
import Navbar from "./components/Navbar";
import { AuthProvider, useAuth } from "./contexts/AuthContext";
import { Routes, Route, Navigate } from "react-router-dom";
import AdminPanel from "./components/AdminPanel";

// Wrap the entire application with the AuthProvider
// This will allow us to share the state between multiple components
function App() {
  return (
    <AuthProvider>
      <AppContent /> //
    </AuthProvider>
  );
}

// The AppContent component is now a child of the AuthProvider
function AppContent() {
  const [error, setError] = useState(null);
  const {
    isAuthenticated,
    login: handleLogin,
    logout: handleLogout,
  } = useAuth();

  return (
    <>
      <Navbar isLoggedIn={isAuthenticated} onLogout={handleLogout} />
      {error && (
        <div className="absolute top-0 right-0 bg-red-500 text-white p-2 rounded-tl-lg">
          {error}
        </div>
      )}
      <Routes>
        <Route
          path="/"
          element={
            isAuthenticated ? (
              <Navigate to="/game" replace />
            ) : (
              <LoginForm onLoginSuccess={handleLogin} />
            )
          }
        />
        <Route
          path="/login"
          element={
            isAuthenticated ? (
              <Navigate to="/game" replace />
            ) : (
              <LoginForm onLoginSuccess={handleLogin} />
            )
          }
        />
        <Route path="/logout" element={<Navigate to="/" replace />} />
        <Route
          path="/admin"
          element={
            isAuthenticated ? <AdminPanel /> : <Navigate to="/login" replace />
          }
        />
        <Route
          path="/game"
          element={
            isAuthenticated ? (
              <GameRoom onError={setError} onLogout={handleLogout} />
            ) : (
              <Navigate to="/login" replace />
            )
          }
        />
      </Routes>
    </>
  );
}

export default App;
