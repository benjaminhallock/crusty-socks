import axios from "axios";

import { API_ENDPOINTS, ENV_CONFIG } from "../constants.js";

// Export makeApiCall so it can be used by other services
export const makeApiCall = async (endpoint, options = {}) => {
  const token = localStorage.getItem("token");
  try {
    const apiUrl = ENV_CONFIG.getClientApiUrl();
    console.log(`Making API call to: ${apiUrl}${endpoint}`);
    
    const response = await axios({
      url: `${apiUrl}${endpoint}`,
      ...options,
      headers: {
        "Content-Type": "application/json",
        ...(token && { Authorization: `Bearer ${token}` }),
        ...options.headers,
      },
      data: options.body,
    });
    return response;
  } catch (error) {
    console.error("API call failed:", error.response?.data || error.message);
    throw error;
  }
};

export const createReport = async (reportData) => {
  try {
    // Make sure roomId is included in report data
    if (!reportData.roomId) {
      console.error("Missing roomId in report data");
      return { 
        success: false, 
        error: "Room ID is required for reporting a player" 
      };
    }
    
    // Prepare the data to send to the server
    const dataToSend = {
      reportedUser: reportData.reportedUser,
      reason: reportData.reason || 'Inappropriate behavior',
      roomId: reportData.roomId,
      chatLogs: reportData.chatLogs || []
    };
    
    // Include additional comments if provided
    if (reportData.additionalComments) {
      dataToSend.additionalComments = reportData.additionalComments;
    }
    
    // Log what we're sending to help debug
    console.log("Sending report data:", dataToSend);
    
    const response = await makeApiCall(API_ENDPOINTS.CREATE_REPORT, {
      method: 'POST',
      body: dataToSend
    });
    
    return { success: true, report: response.data.report };
  } catch (error) {
    console.error("Failed to create report:", error.response?.data || error);
    return { 
      success: false, 
      error: error.response?.data?.message || error.message 
    };
  }
};

export const updateReportStatus = async (reportId, status) => {
  try {
    const response = await makeApiCall(`/api/reports/${reportId}/status`, {
      method: 'PUT',
      body: JSON.stringify({ status })
    });
    return { success: true, report: response.data };
  } catch (error) {
    console.error("Failed to update report:", error);
    return { success: false, error: error.message };
  }
};

export const getAllReports = async () => {
  try {
    // Change from API_ENDPOINTS.GET_ALL_REPORTS to "/api/reports" for direct path
    const response = await makeApiCall("/api/reports");
    console.log("Reports API response:", response.data);
    return { success: true, reports: response.data.reports || [] };
  } catch (error) {
    console.error("Failed to fetch reports:", error);
    return { success: false, reports: [] };
  }
};

// Add functions to update users and lobbies

/**
 * Updates a user's information
 * @param {string} userId - The ID of the user to update
 * @param {Object} userData - The updated user data
 * @returns {Promise<Object>} - Success status and updated user data
 */
export const updateUser = async (userId, userData) => {
  try {
    const response = await makeApiCall(`/api/users/${userId}`, {
      method: 'PUT',
      body: JSON.stringify(userData)
    });
    return { success: true, user: response.data.user };
  } catch (error) {
    console.error("Failed to update user:", error);
    return { success: false, error: error.message };
  }
};

/**
 * Updates a lobby's information
 * @param {string} lobbyId - The ID of the lobby to update
 * @param {Object} lobbyData - The updated lobby data
 * @returns {Promise<Object>} - Success status and updated lobby data
 */
export const updateLobby = async (lobbyId, lobbyData) => {
  try {
    const response = await makeApiCall(`/api/lobbys/${lobbyId}`, {
      method: 'PUT',
      body: JSON.stringify(lobbyData)
    });
    return { success: true, lobby: response.data.lobby };
  } catch (error) {
    console.error("Failed to update lobby:", error);
    return { success: false, error: error.message };
  }
};

/**
 * Updates an entire report's information
 * @param {string} reportId - The ID of the report to update
 * @param {Object} reportData - The updated report data
 * @returns {Promise<Object>} - Success status and updated report data
 */
export const updateReport = async (reportId, reportData) => {
  try {
    const response = await makeApiCall(`/api/reports/${reportId}`, {
      method: 'PUT',
      body: JSON.stringify(reportData)
    });
    return { success: true, report: response.data.report };
  } catch (error) {
    console.error("Failed to update report:", error);
    return { success: false, error: error.message };
  }
};

