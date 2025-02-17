import { API_ENDPOINTS, ENV_CONFIG } from '../../../shared/constants.js';

const handleResponse = async (response) => {
  const data = await response.json();
  if (!response.ok) throw new Error(data.message || "Request failed");
  return data;
};

const makeApiCall = async (endpoint, options = {}) => {
  const token = localStorage.getItem("token");
  const response = await fetch(`${ENV_CONFIG.API_URL}${endpoint}`, {
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
  return makeApiCall(API_ENDPOINTS.GET_LOBBY(roomId));
};

export const createLobby = (
  { playerLimit, revealCharacters, maxRounds, selectWord, selectCategory }
) => makeApiCall(API_ENDPOINTS.CREATE_LOBBY, { method: "POST",
  body: JSON.stringify({ playerLimit, revealCharacters, maxRounds, selectWord, selectCategory })
}).then(response => {
  if (response.success && response.roomId) {
  return response;
  }
  else {
    throw new Error("Failed to create lobby");
  }
});

export const login = (email, password) => 
  makeApiCall(API_ENDPOINTS.LOGIN, {
    method: "POST",
    body: JSON.stringify({ email, password })
  }).then(response => {
    if (response.token) {
      localStorage.setItem('token', response.token.replace('Bearer ', ''));
    }
    return response;
  });

export const register = (email, username, password) => 
  makeApiCall(API_ENDPOINTS.REGISTER, {
    method: "POST",
    body: JSON.stringify({ email, username, password })
  }).then(response => {
    if (response.token) {
      localStorage.setItem('token', response.token.replace('Bearer ', ''));
    }
    return response;
  });

export const checkAuth = () => 
  makeApiCall(API_ENDPOINTS.VALIDATE).catch(error => {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    return { success: false, message: error.message };
  });

export const getAllUsers = () => 
  makeApiCall(API_ENDPOINTS.GET_ALL_USERS);

export const getAllLobbies = () => 
  makeApiCall(API_ENDPOINTS.GET_ALL_LOBBIES);

