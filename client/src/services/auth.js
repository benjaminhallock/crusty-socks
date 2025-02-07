const API_URL = import.meta.env.VITE_SOCKET_URL || "http://localhost:3001";

const handleResponse = async (response) => {
  const data = await response.json();
  if (!response.ok) throw new Error(data.message || "Request failed");
  return data;
};

const makeApiCall = async (endpoint, options = {}) => {
  const token = localStorage.getItem("token");
  const response = await fetch(`${API_URL}${endpoint}`, {
    ...options,
    headers: {
      "Content-Type": "application/json",
      ...(token && { Authorization: `Bearer ${token}` }),
      ...options.headers
    },
  });
  return handleResponse(response);
};

export const fetchLobby = (roomId) => {
  if (!roomId) throw new Error("Room ID is required");
  return makeApiCall(`/lobby/${roomId}`);
};

export const createLobby = () => 
  makeApiCall('/lobby/create', { method: "POST" });

export const login = (email, password) => 
  makeApiCall('/users/login', {
    method: "POST",
    body: JSON.stringify({ email, password })
  }).then(response => {
    if (response.token) {
      localStorage.setItem('token', response.token.replace('Bearer ', ''));
    }
    return response;
  });

export const register = (email, username, password) => 
  makeApiCall('/users/register', {
    method: "POST",
    body: JSON.stringify({ email, username, password })
  }).then(response => {
    if (response.token) {
      localStorage.setItem('token', response.token.replace('Bearer ', ''));
    }
    return response;
  });

export const checkAuth = () => 
  makeApiCall('/users/validate').catch(error => {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    return { success: false, message: error.message };
  });

export const getAllUsers = () => 
  makeApiCall('/users/all');

export const getAllLobbies = () => 
  makeApiCall('/lobby/all');

