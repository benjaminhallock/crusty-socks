import { useState } from "react";
import GameRoom from "./components/GameRoom";
import LoginForm from "./components/LoginForm";
import Navbar from "./components/Navbar";
import { AuthProvider, useAuth } from "./contexts/AuthContext";
import { Routes, Route, Navigate, useLocation } from "react-router-dom";
import Logout from "./components/Logout";
import { ChatroomProvider } from "./contexts/ChatroomContext";
import CreateLobby from "./components/CreateLobby";
import { AnimatePresence } from "framer-motion";
import PageTransition from "./components/PageTransition";

// Wrap the entire application with the AuthProvider
// This will allow us to share the state between multiple components
function App() {
  return (
    <AuthProvider>
      <AppContent />
    </AuthProvider>
  );
}

// The AppContent component is now a child of the AuthProvider
function AppContent() {
  const location = useLocation(); // Get the current location for routing
  const { isAuthenticated, login: handleLogin, logout: handleLogout } = useAuth();

  return (
    <div className="flex flex-col min-h-screen">
      <Navbar isLoggedIn={isAuthenticated} onLogout={handleLogout} />
      <AnimatePresence mode="wait">
        <Routes location={location} key={location.pathname}>
          <Route
            path="/"
            element={
              <PageTransition>
                {isAuthenticated ? (
                  <CreateLobby />
                ) : (
                  <LoginForm onLoginSuccess={handleLogin} />
                )}
              </PageTransition>
            }
          />
          <Route path="/logout" element={<Logout />} />
          <Route
            path="/lobby/:roomId"
            element={
              isAuthenticated ? (
                <PageTransition>
                  <ChatroomProvider>
                    <GameRoom />
                  </ChatroomProvider>
                </PageTransition>
              ) : (
                <Navigate to="/" replace />
              )
            }
          />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </AnimatePresence>
    </div>
  );
}

export default App;
