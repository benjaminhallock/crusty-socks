import { createContext, useState, useContext, useEffect } from "react";
import { checkAuth } from "../services/auth";
import { connectSocket, socket } from "../socket";

export const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [user, setUser] = useState(null);

  // Add effect to check token on mount
  useEffect(() => {
    const validateAuth = async () => {
      const token = localStorage.getItem("token");
      const username = localStorage.getItem("username");
      if (token && username) {
        try {
          const isValid = await checkAuth();
          if (isValid) {
            setIsAuthenticated(true);
            setUser(username);
            connectSocket(); // Connect socket if token is valid
          }
        } catch (error) {
          console.error(error);
          logout(); // Clean up if validation fails
        }
      }
    };
    validateAuth();

    return () => {
      socket.disconnect(); // Cleanup on unmount
    };
  }, []);

  const login = (userData) => {
    localStorage.setItem("token", userData.token);
    localStorage.setItem("username", userData.username);
    setUser(userData.username);
    setIsAuthenticated(true);
    connectSocket(); // Connect socket after successful login
  };

  const logout = () => {
    socket.disconnect(); // Disconnect socket on logout
    localStorage.removeItem("token");
    localStorage.removeItem("username");
    setUser(null);
    setIsAuthenticated(false);
  };

  return (
    <AuthContext.Provider value={{ isAuthenticated, user, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
};
