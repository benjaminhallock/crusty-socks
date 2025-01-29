import { createContext, useState, useEffect } from "react";
import { validateToken } from "../services/auth";
// Context creation becuase we need to share the state between multiple components
const AuthContext = createContext();
// Provider Component because we need to wrap the entire application with the context provider
const AuthProvider = ({ children }) => {
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  // Check if the user is authenticated when the component mounts 
  useEffect(() => {
    const checkAuthentication = async () => {
      const token = localStorage.getItem("token");
      if (token) {
        // Validate the token by sending a request to the server
        const isValid = await validateToken();
        setIsAuthenticated(isValid);
      } else {
        setIsAuthenticated(false);
      }
    };

    checkAuthentication();
  }, []);

  return (
    <AuthContext.Provider value={{ isAuthenticated, setIsAuthenticated }}>
      {children}
    </AuthContext.Provider>
  );
};

export { AuthContext, AuthProvider };
