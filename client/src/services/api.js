import axios from 'axios'

import { ENV_CONFIG, API_ENDPOINTS as x } from '../constants.js'

const api = axios.create({
  baseURL: ENV_CONFIG.getServerUrl(),
  headers: { 'Content-Type': 'application/json' },
})

api.interceptors.request.use(config => {
  const token = localStorage.getItem('token')
  if (token) {
    config.headers.Authorization = `Bearer ${token}`
  }
  return config
})

// Add a response interceptor to handle errors globally
const handleApiError = error => {
  if (error.message === 'Network Error') {
    return {
      success: false,
      error: 'Network error, please check your internet connection.',
    }
  }
  if (error.response?.status === 404) {
    return { success: false, error: 'Resource not found' }
  } else if (error.response?.status === 500) {
    return { success: false, error: 'Internal server error' }
  }
  console.error('API Error:', error.response?.data || error.message)
  return {
    success: false,
    error: error.response?.data?.message || error.message,
  }
}

// ----- Auth functions -----
export const fetchLobby = async roomId => {
  try {
    const { data } = await api.get(x.GET_LOBBY(roomId))
    if (!data || !data.lobby) {
      throw new Error('Lobby not found')
    }
    return {
      success: true,
      lobby: data.lobby,
    }
  } catch (error) {
    return handleApiError(error)
  }
}

export const createLobby = async lobbyData => {
  try {
    const { data } = await api.post(x.CREATE_LOBBY, lobbyData)
    return {
      success: true,
      roomId: data.roomId,
      ...data,
    }
  } catch (error) {
    return handleApiError(error)
  }
}

export const login = async (email, password) => {
  try {
    const { data } = await api.post('/api/user/login', { email, password })
    const token = data.token.replace('Bearer ', '')

    localStorage.setItem('token', token)
    localStorage.setItem('user', JSON.stringify(data.user))

    return {
      success: true,
      user: data.user,
      token,
    }
  } catch (error) {
    return handleApiError(error)
  }
}

export const register = async (email, username, password) => {
  try {
    const { data } = await api.post(x.REGISTER, {
      email,
      username,
      password,
    })

    const token = data.token.replace('Bearer ', '')
    localStorage.setItem('token', token)
    localStorage.setItem('user', JSON.stringify(data.user))
    return {
      success: true,
      user: data.user,
      token,
    }
  } catch (error) {
    // Return the specific error message from the server
    if (error.response?.data?.message) {
      return {
        success: false,
        error: error.response.data.message,
      }
    }
    return handleApiError(error)
  }
}

export const checkAuth = async () => {
  try {
    const { data } = await api.get(x.VALIDATE)

    if (!data.user) {
      localStorage.removeItem('token')
      localStorage.removeItem('user')
      return { success: false }
    }

    return {
      success: true,
      ...data,
    }
  } catch (error) {
    // Only clear tokens for auth-related errors
    if (error.response?.status === 401 || error.response?.status === 403) {
      localStorage.removeItem('token')
      localStorage.removeItem('user')
    }
    return {
      success: false,
      error: error.response?.data?.message || error.message,
    }
  }
}

export const getAllUsers = async (params = {}) => {
  try {
    const { data } = await api.get(x.GET_ALL_USERS, {
      params: {
        page: params.page || 1,
        limit: params.limit || 50,
      },
    })
    return {
      success: true,
      users: data.users || [],
      total: data.total || 0,
      page: data.page || 1,
      pages: data.pages || 1,
    }
  } catch (error) {
    return handleApiError(error)
  }
}

export const getAllLobbies = async (params = {}) => {
  try {
    const { data } = await api.get(x.GET_ALL_LOBBIES, {
      params: {
        page: params.page || 1,
        limit: params.limit || 50,
        search: params.search || '',
        sort: params.sort || 'newest',
      },
    })

    return {
      success: true,
      lobbies: data.lobbies || [],
      total: data.total || 0,
      page: data.page || 1,
      pages: data.pages || 1,
    }
  } catch (error) {
    return handleApiError(error)
  }
}

export const fetchUserProfile = async username => {
  try {
    const { data } = await api.get(x.GET_USER_PROFILE(username))

    if (!data.success || !data.profile) {
      throw new Error('Profile data is missing or invalid')
    }

    return {
      success: true,
      profile: data.profile,
    }
  } catch (error) {
    return handleApiError(error)
  }
}

export const updateUserProfile = async (username, profileData) => {
  try {
    const { data } = await api.put(x.UPDATE_USER_PROFILE(username), profileData)

    if (!data.success) {
      throw new Error(data.message || 'Failed to update profile')
    }
    return data
  } catch (error) {
    return handleApiError(error)
  }
}

export const fetchLeaderboard = async () => {
  try {
    const { data } = await api.get(x.LEADERBOARD)

    if (!data || (!data.leaderboard && !Array.isArray(data))) {
      throw new Error('Invalid response format from server')
    }

    const leaderboardData = data.leaderboard || data
    return {
      success: true,
      leaderboard: leaderboardData,
    }
  } catch (error) {
    return handleApiError(error)
  }
}

// ----- Report functions -----

export const createReport = async reportData => {
  try {
    // Enhanced validation
    if (!reportData || typeof reportData !== 'object') {
      throw new Error('Invalid report data')
    }

    // Log the incoming data for debugging
    console.log('Incoming report data:', reportData)

    // Validate roomId specifically
    if (!reportData.roomId) {
      console.error('Missing roomId in report data:', reportData)
      throw new Error('Room ID is required for reporting a player')
    }

    // Create request payload with explicit roomId assignment
    const requestPayload = {
      reportedUser: reportData.reportedUser,
      reason: reportData.reason || 'Inappropriate behavior',
      roomId: reportData.roomId, // Explicitly include roomId
      additionalComments: reportData.additionalComments || '',
      chatLogs: Array.isArray(reportData.chatLogs)
        ? reportData.chatLogs.map(log => ({
            username: log.username || 'Unknown',
            message: log.message || '',
            timestamp: log.timestamp || Date.now(),
          }))
        : [],
      canvasData: reportData.canvasState?.data || null,
    }

    // Log the final payload for verification
    console.log('Sending report payload:', requestPayload)

    const { data } = await api.post(x.CREATE_REPORT, requestPayload)

    return {
      success: true,
      report: data.report,
    }
  } catch (error) {
    console.error('Report creation error:', error)
    console.error('Original report data:', reportData)
    return handleApiError(error)
  }
}

export const updateReportStatus = async (reportId, status) => {
  try {
    const { data } = await api.put(x.UPDATE_REPORT_STATUS(reportId), {
      status,
    })
    return { success: true, report: data.report }
  } catch (error) {
    return handleApiError(error)
  }
}

export const getAllReports = async (params = {}) => {
  try {
    const { data } = await api.get(x.GET_ALL_REPORTS, {
      params: {
        page: params.page || 1,
        limit: params.limit || 50,
      },
    })
    return {
      success: true,
      reports: data.reports || [],
      total: data.total || 0,
      page: data.page || 1,
      pages: data.pages || 1,
    }
  } catch (error) {
    return handleApiError(error)
  }
}

export const updateUser = async (userId, userData) => {
  try {
    const { data } = await api.put(x.UPDATE_USER(userId), userData)
    return { success: true, user: data.user }
  } catch (error) {
    return handleApiError(error)
  }
}

export const updateLobby = async (lobbyId, lobbyData) => {
  try {
    const { data } = await api.put(x.UPDATE_LOBBY(lobbyId), lobbyData)
    return { success: true, lobby: data.lobby }
  } catch (error) {
    return handleApiError(error)
  }
}

export const updateReport = async (reportId, reportData) => {
  try {
    const { data } = await api.put(x.UPDATE_REPORT(reportId), reportData)
    return { success: true, report: data.report }
  } catch (error) {
    return handleApiError(error)
  }
}

// Add a function to fetch report details
export const getReportDetails = async reportId => {
  try {
    const { data } = await api.get(x.GET_REPORT(reportId))
    return { success: true, report: data.report }
  } catch (error) {
    return handleApiError(error)
  }
}

export const getAllChats = async (params = {}) => {
  try {
    const { data } = await api.get(x.GET_ALL_CHATS, {
      params: {
        page: params.page || 1,
        limit: params.limit || 50,
        search: params.search || '',
      },
    })

    return {
      success: true,
      chats: data.chats || [],
      total: data.total || 0,
      page: data.page || 1,
      pages: data.pages || 1,
    }
  } catch (error) {
    return handleApiError(error)
  }
}

export const getChatByLobbyId = async lobbyId => {
  try {
    const { data } = await api.get(x.GET_CHAT(lobbyId))
    return { success: true, chats: data.chats }
  } catch (error) {
    return handleApiError(error)
  }
}

export const getChatByUserInLobby = async (lobbyId, userId) => {
  try {
    const { data } = await api.get(x.GET_CHAT_BY_USER(lobbyId, userId))
    return { success: true, chats: data.chats }
  } catch (error) {
    return handleApiError(error)
  }
}

export const getReportsByUserId = async userId => {
  try {
    const { data } = await api.get(x.GET_REPORTS_BY_USER(userId))
    return { success: true, reports: data.reports || [] }
  } catch (error) {
    return handleApiError(error)
  }
}
