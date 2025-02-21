import { API_ENDPOINTS, ENV_CONFIG } from '../../../shared/constants.js';

/**
 * Generic response handler for API calls
 * Parses JSON and handles error responses uniformly
 */
const handleResponse = async (response) => {
  console.log('Processing API response:', { status: response.status, ok: response.ok });
  const data = await response.json();
  if (!response.ok) throw new Error(data.message || "Request failed");
  return data;
};

/**
 * Base API call function with authentication handling
 * Automatically includes auth token and common headers
 */
const makeApiCall = async (endpoint, options = {}) => {
  console.log('Making API call to:', endpoint);
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

/**
 * Fetches lobby data by ID
 * Required for joining existing game rooms
 */
export const fetchLobby = (roomId) => {
  console.log('Fetching lobby data:', roomId);
  if (!roomId) throw new Error("Room ID is required");
  return makeApiCall(API_ENDPOINTS.GET_LOBBY(roomId));
};

/**
 * Creates a new game lobby with specified settings
 * Returns the newly created lobby's ID
 */
export const createLobby = (
  { playerLimit, revealCharacters, maxRounds, selectWord, selectCategory }
) => {
  console.log('Creating new lobby:', { playerLimit, maxRounds });
  return makeApiCall(API_ENDPOINTS.CREATE_LOBBY, {
    method: "POST",
    body: JSON.stringify({ playerLimit, revealCharacters, maxRounds, selectWord, selectCategory })
  }).then(response => {
    if (response.success && response.roomId) {
      console.log('Successfully created lobby:', response.roomId);
      return response;
    }
    throw new Error("Failed to create lobby");
  });
};

/**
 * Authenticates user and stores JWT token
 * Handles both login response and token storage
 */
export const login = (email, password) => {
  console.log('Attempting login:', { email });
  return makeApiCall(API_ENDPOINTS.LOGIN, {
    method: "POST",
    body: JSON.stringify({ email, password })
  }).then(response => {
    if (response.token) {
      console.log('Login successful, storing token');
      localStorage.setItem('token', response.token.replace('Bearer ', ''));
    }
    return response;
  });
};

/**
 * Creates new user account and handles initial authentication
 * Automatically logs user in upon successful registration
 */
export const register = (email, username, password) => {
  console.log('Registering new user:', { email, username });
  return makeApiCall(API_ENDPOINTS.REGISTER, {
    method: "POST",
    body: JSON.stringify({ email, username, password })
  }).then(response => {
    if (response.token) {
      console.log('Registration successful, storing token');
      localStorage.setItem('token', response.token.replace('Bearer ', ''));
    }
    return response;
  });
};

/**
 * Validates current authentication token
 * Cleans up invalid tokens and user data
 */
export const checkAuth = () => {
  console.log('Validating authentication token');
  return makeApiCall(API_ENDPOINTS.VALIDATE).catch(error => {
    console.log('Auth check failed, clearing credentials');
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
  console.log('Fetching all users list');
  return makeApiCall(API_ENDPOINTS.GET_ALL_USERS);
};

/**
 * Fetches list of all active game lobbies
 * Used for the lobby browser feature
 */
export const getAllLobbies = () => {
  console.log('Fetching all active lobbies');
  return makeApiCall(API_ENDPOINTS.GET_ALL_LOBBIES);
};

