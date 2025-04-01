import axios from "axios";
import { ENV_CONFIG } from "../../../shared/constants.js";

// Export makeApiCall so it can be used by other services
export const makeApiCall = async (endpoint, options = {}) => {
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
    
    // Log what we're sending to help debug
    console.log("Sending report data:", reportData);
    
    const response = await axios({
      url: `${ENV_CONFIG.API_URL}/api/reports`,
      method: 'POST',
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${localStorage.getItem("token")}`,
      },
      data: reportData
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
    const response = await makeApiCall('/api/reports');
    return { success: true, reports: response.data.reports };
  } catch (error) {
    console.error("Failed to fetch reports:", error);
    return { success: false, reports: [] };
  }
};

