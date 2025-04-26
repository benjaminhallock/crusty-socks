import axios from 'axios';
import {
  API_ENDPOINTS_FRONTEND as API,
  ENV_CONFIG,
  log,
  logError,
} from '../constants.js';

const serverUrl = ENV_CONFIG.getServerApiUrl();
if (!serverUrl) {
  throw new Error('Server API URL is not configured');
}

// Create axios instance with defaults
const api = axios.create({
  baseURL: serverUrl,
  headers: {
    'Content-Type': 'application/json',
  },
  validateStatus: (status) => status >= 200 && status < 500,
});

// Add token interceptor
api.interceptors.request.use(
  (config) => {
    try {
      const token = localStorage.getItem('token');
      // Remove existing auth header
      delete config.headers.Authorization;

      if (token && typeof token === 'string' && token.length > 0) {
        // Ensure token has Bearer prefix
        const tokenWithBearer = token.startsWith('Bearer ')
          ? token
          : `Bearer ${token}`;
        config.headers.Authorization = tokenWithBearer;
      }

      return config;
    } catch (error) {
      console.error('Token interceptor error:', error);
      return config;
    }
  },
  (error) => Promise.reject(error)
);

// Generic error handler
const handleApiError = (error) => {
  // Standard error response format
  const errorResponse = {
    ok: false,
    error: 'An unexpected error occurred',
    status: error.response?.status || 500,
  };

  // Network or axios errors
  if (error.message === 'Network Error') {
    errorResponse.error =
      'Network error, please check your internet connection';
    errorResponse.code = 'NETWORK_ERROR';
    return errorResponse;
  }

  // Handle HTTP status codes
  if (error.response) {
    switch (error.response.status) {
      case 400:
        errorResponse.error = error.response.data?.message || 'Invalid request';
        errorResponse.code = 'BAD_REQUEST';
        break;
      case 401:
        errorResponse.error = 'Authentication required';
        errorResponse.code = 'UNAUTHORIZED';
        break;
      case 403:
        errorResponse.error = 'Access denied';
        errorResponse.code = 'FORBIDDEN';
        break;
      case 404:
        errorResponse.error = 'Resource not found';
        errorResponse.code = 'NOT_FOUND';
        break;
      case 429:
        errorResponse.error = 'Too many requests, please try again later';
        errorResponse.code = 'RATE_LIMIT';
        break;
      case 500:
        errorResponse.error = 'Internal server error';
        errorResponse.code = 'SERVER_ERROR';
        break;
      default:
        errorResponse.error = error.response.data?.message || 'Request failed';
        errorResponse.code = 'UNKNOWN_ERROR';
    }
  }

  // Log errors in development only
  if (ENV_CONFIG.isDevelopment()) {
    logError('API Error:', {
      status: error.response?.status,
      data: error.response?.data,
      message: error.message,
      code: errorResponse.code,
    });
  }

  return errorResponse;
};

// ----- Auth functions -----
export const fetchLobby = async (roomId) => {
  try {
    const { data } = await api.get(API.GET_LOBBY(roomId));
    if (!data || !data.lobby) {
      throw new Error('Lobby not found');
    }
    return { lobby: data.lobby };
  } catch (error) {
    return handleApiError(error);
  }
};

export const createLobby = async (lobbyData) => {
  try {
    const { data } = await api.post(API.CREATE_LOBBY, lobbyData);
    return { roomId: data.roomId, ...data };
  } catch (error) {
    return handleApiError(error);
  }
};

export const login = async (email, password) => {
  try {
    log(`Making login request to: ${API.LOGIN()}`);
    const { data } = await api.post(API.LOGIN(), { email, password });

    // Validate response
    if (!data.token || !data.user) {
      logError('Invalid login response:', data);
      throw new Error('Invalid server response');
    }

    // Store auth data
    const token = data.token.replace('Bearer ', '');
    localStorage.setItem('token', token);
    localStorage.setItem('user', JSON.stringify(data.user));

    return {
      ok: true,
      user: data.user,
      token,
    };
  } catch (error) {
    logError('Login error:', {
      status: error.response?.status,
      message: error.message,
      data: error.response?.data,
    });
    return handleApiError(error);
  }
};

export const register = async (email, username, password) => {
  try {
    const { data } = await api.post('/api/user/register', {
      email,
      username,
      password,
    });
    if (!data || !data.token || !data.user) {
      throw new Error('Invalid registration response');
    }
    const token = data?.token.replace('Bearer ', '');
    localStorage.setItem('token', token || '');
    localStorage.setItem('user', JSON.stringify(data.user));
    return { user: data.user, token };
  } catch (error) {
    return handleApiError(error);
  }
};

export const checkAuth = async () => {
  try {
    const { data } = await api.get(API.VALIDATE);
    if (!data.user) {
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      return { status: 401, message: 'Unauthorized' };
    }
    return {
      user: {
        id: data.user._id,
        username: data.user.username,
        email: data.user.email,
        role: data.user.role,
        createdAt: data.user.createdAt,
      },
    };
  } catch (error) {
    if (error.response?.status === 401 || error.response?.status === 403) {
      localStorage.removeItem('token');
      localStorage.removeItem('user');
    }
    return {
      error: error.response?.data?.message || error.message,
    };
  }
};

export const getAllChats = async () => {
  try {
    const { data } = await api.get(API.GET_CHAT_ALL());
    if (!data || !data.data) {
      throw new Error('Invalid response format from server');
    }
    return { chats: data.data };
  } catch (error) {
    console.error('getAllChats error:', error.message);
    return handleApiError(error);
  }
};

export const getAllUsers = async () => {
  try {
    const { data } = await api.get(API.GET_ALL_USERS);
    if (!data || !data.users) {
      throw new Error('Failed to fetch users');
    }
    return { users: data.users };
  } catch (error) {
    return handleApiError(error);
  }
};

export const getAllLobbies = async () => {
  try {
    const { data } = await api.get(API.GET_ALL_LOBBIES);
    if (!data || !data.lobbies) {
      throw new Error('Failed to fetch lobbies');
    }
    return { lobbies: data.lobbies };
  } catch (error) {
    console.error('getAllLobbies error:', error.message);
    return handleApiError(error);
  }
};

export const fetchUserProfile = async (username) => {
  try {
    const { data } = await api.get(API.GET_USER_PROFILE(username));
    if (!data || !data.profile) {
      throw new Error('Profile data is missing or invalid');
    }
    return {
      profile: data.profile,
    };
  } catch (error) {
    return handleApiError(error);
  }
};

export const updateUserProfile = async (username, profileData) => {
  try {
    const res = await api.put(API.UPDATE_USER_PROFILE(username), profileData);
    if (!res.ok) {
      throw new Error(res.data.message || 'Failed to update profile');
    }
    return res;
  } catch (error) {
    return handleApiError(error);
  }
};

export const fetchLeaderboard = async () => {
  try {
    const { data } = await api.get(API.GET_LEADERBOARD);
    if (!data || !data.leaderboard) {
      throw new Error('Invalid leaderboard data format');
    }
    return { leaderboard: data.leaderboard };
  } catch (error) {
    return handleApiError(error);
  }
};

// ----- Report functions -----
export const createReport = async (reportData) => {
  try {
    const { data } = await api.post(API.CREATE_REPORT, reportData);
    if (!data || !data.report) {
      throw new Error('Invalid report response');
    }
    return { report: data.report };
  } catch (error) {
    return handleApiError(error);
  }
};

export const updateReportStatus = async (reportId, status) => {
  try {
    const { data } = await api.put(API.UPDATE_REPORT_STATUS(reportId), {
      status,
    });
    return { report: data };
  } catch (error) {
    return handleApiError(error);
  }
};

export const getAllReports = async () => {
  try {
    const { data } = await api.get(API.GET_ALL_REPORTS);
    if (!data || !data.reports) {
      throw new Error('Invalid reports response');
    }
    return { reports: data.reports };
  } catch (error) {
    return handleApiError(error);
  }
};

export const updateUser = async (userId, userData) => {
  try {
    const { data } = await api.put(API.UPDATE_USER(userId), userData);
    return { user: data.user };
  } catch (error) {
    return handleApiError(error);
  }
};

export const updateLobby = async (lobbyId, lobbyData) => {
  try {
    // Here we assume the update lobby endpoint is defined only on the backend.
    const { data } = await api.put(`/api/lobby/${lobbyId}`, lobbyData);
    return { lobby: data.lobby };
  } catch (error) {
    return handleApiError(error);
  }
};

export const updateReport = async (reportId, reportData) => {
  try {
    const { data } = await api.put(API.UPDATE_REPORT(reportId), reportData);
    return { report: data.report };
  } catch (error) {
    return handleApiError(error);
  }
};

export const changeEmail = async ({ newEmail, password }) => {
  try {
    // Using a backend endpoint since this is a static route.
    const { data } = await api.put('/api/user/change-email', {
      newEmail,
      password,
    });
    return { message: data.message };
  } catch (error) {
    return handleApiError(error);
  }
};

export const deleteAccount = async () => {
  try {
    const { data } = await api.delete('/api/user/delete');
    return { message: data.message };
  } catch (error) {
    return handleApiError(error);
  }
};

export const getReportDetails = async (reportId) => {
  try {
    const { data } = await api.get(API.GET_REPORT(reportId));
    return { report: data.report };
  } catch (error) {
    return handleApiError(error);
  }
};

export const getChatHistoryByUserId = async (userId) => {
  try {
    const { data } = await api.get(API.GET_CHAT_BY_USER(userId));
    if (!data || !data.data) {
      throw new Error('Invalid chat history response');
    }
    return { chatHistory: data.data };
  } catch (error) {
    return handleApiError(error);
  }
};

export const getReportsByUser = async (userId) => {
  try {
    // This endpoint is not defined in constants; so use a literal.
    const { data } = await api.get(`/api/report/user/${userId}`);
    return { reports: data.reports };
  } catch (error) {
    return handleApiError(error);
  }
};
