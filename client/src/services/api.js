import axios from "axios";

import { API_ENDPOINTS as x, ENV_CONFIG } from "../constants.js";

// Create axios instance with defaults
const api = axios.create({
  baseURL: ENV_CONFIG.getClientApiUrl(),
  headers: { "Content-Type": "application/json" },
});

// Add token interceptor
api.interceptors.request.use((config) => {
  const token = localStorage.getItem("token");
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Generic error handler
const handleApiError = (error) => {
  if (error.message === "Network Error") {
    return {
      success: false,
      error: "Network error, please check your internet connection.",
    };
  }
  if (error.response?.status === 404) {
    return { success: false, error: "Resource not found" };
  } else if (error.response?.status === 500) {
    return { success: false, error: "Internal server error" };
  }
  console.error("API Error:", error.response?.data || error.message);
  return {
    success: false,
    error: error.response?.data?.message || error.message,
  };
};

// ----- Auth functions -----
export const fetchLobby = async (roomId) => {
  try {
    const { data } = await api.get(x.GET_LOBBY(roomId));
    if (!data || !data.lobby) {
      throw new Error("Lobby not found");
    }
    return {
      success: true,
      lobby: data.lobby,
    };
  } catch (error) {
    return handleApiError(error);
  }
};

export const createLobby = async (lobbyData) => {
  try {
    const { data } = await api.post(x.CREATE_LOBBY, lobbyData);
    return {
      success: true,
      roomId: data.roomId,
      ...data,
    };
  } catch (error) {
    return handleApiError(error);
  }
};

export const login = async (email, password) => {
  try {
    const { data } = await api.post(x.LOGIN, { email, password });
    const token = data.token.replace("Bearer ", "");

    localStorage.setItem("token", token);
    localStorage.setItem("user", JSON.stringify(data.user));

    return {
      success: true,
      user: data.user,
      token,
    };
  } catch (error) {
    return handleApiError(error);
  }
};

export const register = async (email, username, password) => {
  try {
    const { data } = await api.post(x.REGISTER, {
      email,
      username,
      password,
    });

    const token = data.token.replace("Bearer ", "");
    localStorage.setItem("token", token);
    localStorage.setItem("user", JSON.stringify(data.user));
    return {
      success: true,
      user: data.user,
      token,
    };
  } catch (error) {
    return handleApiError(error);
  }
};

export const checkAuth = async () => {
  try {
    const { data } = await api.get(x.VALIDATE);

    if (!data.user) {
      localStorage.removeItem("token");
      localStorage.removeItem("user");
      return { success: false };
    }

    return {
      success: true,
      ...data,
    };
  } catch (error) {
    // Only clear tokens for auth-related errors
    if (error.response?.status === 401 || error.response?.status === 403) {
      localStorage.removeItem("token");
      localStorage.removeItem("user");
    }
    return {
      success: false,
      error: error.response?.data?.message || error.message,
    };
  }
};

export const getAllUsers = async () => {
  try {
    const { data } = await api.get(x.GET_ALL_USERS);
    if (!data.users || !Array.isArray(data.users)) {
      throw new Error("Failed to fetch users");
    }
    return {
      success: true,
      users: data.users || [],
    };
  } catch (error) {
    return handleApiError(error);
  }
};

export const getAllLobbies = async () => {
  try {
    const { data } = await api.get(x.GET_ALL_LOBBIES);

    const lobbies = data?.lobbies || (Array.isArray(data) ? data : []);

    return {
      success: true,
      lobbies,
    };
  } catch (error) {
    console.error("getAllLobbies error:", error.message);
    return handleApiError(error);
  }
};

export const fetchUserProfile = async (username) => {
  try {
    const { data } = await api.get(x.GET_USER_PROFILE(username));

    if (!data.success || !data.profile) {
      throw new Error("Profile data is missing or invalid");
    }

    return {
      success: true,
      profile: data.profile,
    };
  } catch (error) {
    return handleApiError(error);
  }
};

export const updateUserProfile = async (username, profileData) => {
  try {
    const { data } = await api.put(
      x.UPDATE_USER_PROFILE(username),
      profileData
    );

    if (!data.success) {
      throw new Error(data.message || "Failed to update profile");
    }
    return data;
  } catch (error) {
    return handleApiError(error);
  }
};

export const fetchLeaderboard = async () => {
  try {
    const { data } = await api.get(x.LEADERBOARD);

    if (!data || (!data.leaderboard && !Array.isArray(data))) {
      throw new Error("Invalid response format from server");
    }

    const leaderboardData = data.leaderboard || data;
    return {
      success: true,
      leaderboard: leaderboardData,
    };
  } catch (error) {
    return handleApiError(error);
  }
};

// ----- Report functions -----

export const createReport = async (reportData) => {
  try {
    if (!reportData.roomId) {
      throw new Error("Room ID is required for reporting a player");
    }

    if (!reportData.reportedUser) {
      throw new Error("Reported user is required");
    }

    // Ensure chatLogs is in the correct format
    const chatLogs = Array.isArray(reportData.chatLogs)
      ? reportData.chatLogs.map((log) => ({
          username: log.username || "Unknown",
          message: log.message || "",
          timestamp: log.timestamp || Date.now(),
        }))
      : [];

    // Create a clean request object with only the expected fields
    const requestPayload = {
      reportedUser: reportData.reportedUser,
      reason: reportData.reason || "Inappropriate behavior",
      roomId: reportData.roomId,
      additionalComments: reportData.additionalComments || "",
      chatLogs: chatLogs,
    };

    // Only add canvasData if it exists
    if (reportData.canvasState && reportData.canvasState.data) {
      requestPayload.canvasData = reportData.canvasState.data;
    }

    console.log("Sending report data:", JSON.stringify(requestPayload));

    const { data } = await api.post(x.CREATE_REPORT, requestPayload);

    console.log("Report creation response:", data);

    return { success: true, report: data.report };
  } catch (error) {
    console.error("Report creation error:", error);
    // Log more details about the error
    if (error.response) {
      console.error("Error response data:", error.response.data);
      console.error("Error response status:", error.response.status);
      console.error("Error response headers:", error.response.headers);
    }
    return handleApiError(error);
  }
};

export const updateReportStatus = async (reportId, status) => {
  try {
    const { data } = await api.put(x.UPDATE_REPORT_STATUS(reportId), {
      status,
    });
    return { success: true, report: data };
  } catch (error) {
    return handleApiError(error);
  }
};

export const getAllReports = async () => {
  try {
    const { data } = await api.get(x.GET_ALL_REPORTS);
    return { success: true, reports: data.reports || [] };
  } catch (error) {
    return handleApiError(error);
  }
};

export const updateUser = async (userId, userData) => {
  try {
    const { data } = await api.put(x.UPDATE_USER(userId), userData);
    return { success: true, user: data.user };
  } catch (error) {
    return handleApiError(error);
  }
};

export const updateLobby = async (lobbyId, lobbyData) => {
  try {
    const { data } = await api.put(x.UPDATE_LOBBY(lobbyId), lobbyData);
    return { success: true, lobby: data.lobby };
  } catch (error) {
    return handleApiError(error);
  }
};

export const updateReport = async (reportId, reportData) => {
  try {
    const { data } = await api.put(x.UPDATE_REPORT(reportId), reportData);
    return { success: true, report: data.report };
  } catch (error) {
    return handleApiError(error);
  }
};

export const verifyEmail = async () => {
  try {
    const { data } = await api.post(x.VERIFY_EMAIL);
    return {
      success: true,
      message: data.message || "Verification email sent successfully",
    };
  } catch (error) {
    return handleApiError(error);
  }
};

export const changePassword = async ({ currentPassword, newPassword }) => {
  try {
    const { data } = await api.put(x.CHANGE_PASSWORD, {
      currentPassword,
      newPassword,
    });
    return { success: true, message: data.message };
  } catch (error) {
    return handleApiError(error);
  }
};

export const changeEmail = async ({ newEmail, password }) => {
  try {
    const { data } = await api.put(x.CHANGE_EMAIL, { newEmail, password });
    return { success: true, message: data.message };
  } catch (error) {
    return handleApiError(error);
  }
};

export const updateUserPreferences = async (preferences) => {
  try {
    const { data } = await api.put(x.UPDATE_PREFERENCES, preferences);
    return { success: true, preferences: data.preferences };
  } catch (error) {
    return handleApiError(error);
  }
};

export const deleteAccount = async () => {
  try {
    const { data } = await api.delete(x.DELETE_ACCOUNT);
    return { success: true, message: data.message };
  } catch (error) {
    return handleApiError(error);
  }
};

// Add a function to fetch report details
export const getReportDetails = async (reportId) => {
  try {
    const { data } = await api.get(x.GET_REPORT(reportId));
    return { success: true, report: data.report };
  } catch (error) {
    return handleApiError(error);
  }
};

// Add these new functions for user reports and chat logs
export const getUserReports = async (username) => {
  try {
    const { data } = await api.get(`/api/user/report/${username}`);
    return { success: true, reports: data.reports || [] };
  } catch (error) {
    return handleApiError(error);
  }
};

export const getUserChatHistory = async (username) => {
  try {
    const { data } = await api.get(`/api/user/chat/${username}`);
    return { success: true, chatHistory: data.chatHistory || [] };
  } catch (error) {
    return handleApiError(error);
  }
};
