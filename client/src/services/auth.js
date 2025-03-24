import { API_ENDPOINTS, ENV_CONFIG } from "../../../shared/constants.js";
import axios from "axios";

const makeApiCall = async (endpoint, options = {}) => {
  const token = localStorage.getItem("token");
  try {
    const response = await axios({
      url: `${ENV_CONFIG.API_URL}${endpoint}`,
      ...options,
      headers: {
        "Content-Type": "application/json",
        ...(token && { Authorization: `Bearer ${token}` }),
        ...options.headers,
      },
      data: options.body ? JSON.parse(options.body) : undefined,
    });
    return response;
  } catch (error) {
    console.error("API call failed:", error.response?.data || error.message);
    throw error;
  }
};

export const fetchLobby = (roomId) => {
  if (!roomId) throw new Error("Room ID is required");
  return makeApiCall(API_ENDPOINTS.GET_LOBBY(roomId))
    .then((response) => response.data)
    .catch((error) => {
      console.error(
        "Failed to fetch lobby data:",
        error.response?.data || error
      );
      throw new Error("Failed to fetch lobby data");
    });
};

export const createLobby = ({
  maxRounds,
  revealCharacters,
  selectWord,
  selectCategory,
  playerLimit,
}) => {
  return makeApiCall(API_ENDPOINTS.CREATE_LOBBY, {
    method: "POST",
    body: JSON.stringify({
      maxRounds,
      revealCharacters,
      selectWord,
      selectCategory,
      playerLimit,
    }),
  })
    .then((response) => {
      console.log("Lobby created successfully:", response.data);
      return {
        ok: true,
        ...response.data,
        roomId: response.data.roomId,
      };
    })
    .catch((error) => {
      console.error("Failed to create lobby:", error.response?.data || error);
      return {
        ok: false,
        message: error.response?.data?.message || "Failed to create lobby",
      };
    });
};

export const login = (email, password) => {
  return makeApiCall(API_ENDPOINTS.LOGIN, {
    method: "POST",
    body: JSON.stringify({ email, password }),
  })
    .then((response) => {
      console.log("Login successful:", response.data);
      localStorage.setItem("token", response.data.token.replace("Bearer ", ""));
      localStorage.setItem("user", JSON.stringify(response.data.user));
      return {
        user: response.data.user,
        token: response.data.token.replace("Bearer ", ""),
      };
    })
    .catch((error) => {
      console.error("Login failed:", error.response?.data || error);
      return {
        success: false,
        message: error.response?.data?.message || "Login failed",
      };
    });
};

/**
 * Creates new user account and handles initial authentication
 * Automatically logs user in upon successful registration
 */
export const register = (email, username, password) => {
  console.log("Registering new user:", { email, username });
  return makeApiCall(API_ENDPOINTS.REGISTER, {
    method: "POST",
    body: JSON.stringify({ email, username, password }),
  })
    .then((response) => {
      console.log("Registration successful");
      return {
        success: true,
        user: response.data.user,
        token: response.data.token.replace("Bearer ", ""),
      };
    })
    .catch((error) => {
      return {
        success: false,
        message: error.response?.data?.message || "Registration failed",
      };
    });
};

/**
 * Validates current authentication token
 * Cleans up invalid tokens and user data
 */
export const checkAuth = () => {
  console.log("Validating authentication token");
  return makeApiCall(API_ENDPOINTS.VALIDATE).catch((error) => {
    console.log("Auth check failed, clearing credentials");
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    return { success: false, message: error.message };
  });
};

/**
 * Admin function to fetch all registered users
 * Requires admin authentication
 */
export const getAllUsers = () => {
  console.log("Fetching all users list");
  return makeApiCall(API_ENDPOINTS.GET_ALL_USERS);
};

/**
 * Fetches list of all active game lobbies
 * Used for the lobby browser feature
 */
export const getAllLobbies = () => {
  console.log("Fetching all active lobbies");
  return makeApiCall(API_ENDPOINTS.GET_ALL_LOBBIES);
};
