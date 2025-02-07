// API configuration
const API_URL = import.meta.env.VITE_SOCKET_URL || "http://localhost:3001";

// Simple function to make API calls
async function makeApiCall(endpoint, options = {}) {
  try {
    const token = localStorage.getItem("token");
    
    const response = await fetch(`${API_URL}${endpoint}`, {
      ...options,
      headers: {
        "Content-Type": "application/json",
        ...(token && { Authorization: `Bearer ${token}` }), // Always send with Bearer prefix
      },
    });

    if (!response.ok) {
      const data = await response.json();
      throw new Error(data.message || "Request failed");
    }

    const data = await response.json();
    return data;
  } catch (error) {
    throw new Error(error.message || "Network error");
  }
}

// Game Lobby Functions
export async function fetchLobby(roomId) {
  if (!roomId) {
    throw new Error("Room ID is required");
  }
  return makeApiCall(`/lobby/${roomId}`);
}

export async function createLobby() {
  return makeApiCall('/lobby/create', { method: "POST" });
}

// Auth Functions
export async function login(email, password) {
  const response = await makeApiCall('/users/login', {
    method: "POST",
    body: JSON.stringify({ email, password }),
  });
  
  if (response.token) {
    // Store token without Bearer prefix - it's added in makeApiCall
    localStorage.setItem('token', response.token.replace('Bearer ', ''));
    return { ...response, success: true }; // Ensure success is set
  }
  
  return { ...response, success: false };
}

export async function register(email, username, password) {
  const response = await makeApiCall('/users/register', {
    method: "POST",
    body: JSON.stringify({ email, username, password }),
  });

  if (response.token) {
    // Store token without Bearer prefix - it's added in makeApiCall
    localStorage.setItem('token', response.token.replace('Bearer ', ''));
  }
  
  return response;
}

export async function checkAuth() {
  const token = localStorage.getItem("token");
  if (!token) return { success: false };
  
  try {
    const response = await makeApiCall('/users/validate');
    // If validation fails, clean up the token
    if (!response.success) {
      localStorage.removeItem("token");
      localStorage.removeItem("user");
    }
    return response;
  } catch (error) {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    return { success: false, message: error.message };
  }
}

// Admin Functions
export async function getAllUsers() {
  return makeApiCall('/users/all');
}

export async function getAllLobbies() {
  return makeApiCall('/lobby/all');
}

