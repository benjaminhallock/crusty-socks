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
    .then((response) => {
      if (!response.data.lobby) {
        throw new Error("Lobby not found");
      }
      return {
        success: true,
        lobby: response.data.lobby
      };
    })
    .catch((error) => {
      console.error(
        "Failed to fetch lobby data:",
        error.response?.data || error
      );
      return {
        success: false,
        error: error.response?.data?.message || error.message || "Failed to fetch lobby data"
      };
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
      console.log("Login successful, saving token:", response.data.token);
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
        ok: false,
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
        ok: true,
        user: response.data.user,
        token: response.data.token.replace("Bearer ", ""),
      };
    })
    .catch((error) => {
      return {
        ok: false,
        message: error.response?.data?.message || "Registration failed",
      };
    });
};

/**
 * Validates current authentication token
 * Cleans up invalid tokens and user data
 */
export const checkAuth = () => {
  console.log("Retrieving token from localStorage:", localStorage.getItem("token"));
  return makeApiCall(API_ENDPOINTS.VALIDATE)
    .then((response) => {
      if (!response.data.user) {
        console.log("Invalid user data, clearing credentials");
        localStorage.removeItem("token");
        localStorage.removeItem("user");
        return { ok: false };
      }
      return response.data;
    })
    .catch((error) => {
      console.log("Auth check failed, clearing credentials");
      localStorage.removeItem("token");
      localStorage.removeItem("user");
      return { ok: false, message: error.message };
    });
};

/**
 * Admin function to fetch all registered users
 * Requires admin authentication
 */
export const getAllUsers = async () => {
  console.log("Fetching all users list");
  try {
    const response = await makeApiCall(API_ENDPOINTS.GET_ALL_USERS);
    return { success: true, users: response.data.users };
  } catch (error) {
    console.error("Failed to fetch users:", error);
    return { success: false, users: [] };
  }
};

/**
 * Fetches list of all active game lobbies
 * Used for the lobby browser feature
 */
export const getAllLobbies = async () => {
  console.log("Fetching all active lobbies");
  try {
    const response = await makeApiCall(API_ENDPOINTS.GET_ALL_LOBBIES);
    return { success: true, lobbies: response.data.lobbies };
  } catch (error) {
    console.error("Failed to fetch lobbies:", error);
    return { success: false, lobbies: [] };
  }
};

export const getAllReports = async () => {
  try {
    const response = await makeApiCall('/api/reports');
    return { success: true, reports: response.data.reports };
  } catch (error) {
    console.error("Failed to fetch reports:", error);
    return { success: false, reports: [] };
  }
};
