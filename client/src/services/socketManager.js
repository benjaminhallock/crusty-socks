import { io } from 'socket.io-client'

import { ENV_CONFIG, SOCKET_EVENTS } from '../constants.js'

class SocketManager {
  constructor() {
    this.socket = null
    this.messageCallbacks = new Set()
    this.chatHistoryCallbacks = new Set()
    this.playerCallbacks = new Set()
    this.gameStateCallbacks = new Set()
    this.canvasCallbacks = new Set()
    this.wordOptionsCallbacks = new Set()
    this.currentRoom = { roomId: null, lobbyId: null }
    this.connectionStatus = 'disconnected'
    this.statusCallbacks = new Set()
    this.reconnectTimer = null
    this.maxReconnectAttempts = 5
    this.reconnectAttempts = 0
    this.isReconnecting = false
  }

  async connect(userData, roomId) {
    if (!userData || !roomId) {
      throw new Error('Missing required connection data')
    }

    // Prevent multiple connection attempts
    if (this.isConnected() || this.connectionStatus === 'connecting') {
      console.log('Socket already connected or connecting')

      if (this.isConnected()) {
        this.currentRoom = { roomId, username: userData.username }
        this.socket.emit(SOCKET_EVENTS.CONNECT_ACK, userData, roomId)
      }
      return
    }

    this._disconnect()
    this.setStatus('connecting')

    try {
      console.log(`Connecting to ${ENV_CONFIG.getClientSocketUrl()}`)

      this.socket = io(ENV_CONFIG.getClientSocketUrl(), {
        withCredentials: true,
        transports: ['websocket', 'polling'],
        autoConnect: true,
        reconnection: false, // We'll handle reconnection ourselves
        timeout: 20000,
      })

      // Set up listeners before connecting
      this.socket.on('connect', () => {
        this.reconnectAttempts = 0
        this.isReconnecting = false
        this.setStatus('connected')
        this.currentRoom = { roomId, username: userData.username }

        // Set up event listeners
        this.setupEventListeners()

        // Emit connect ACK with small delay to ensure socket is fully established
        setTimeout(() => {
          if (this.socket?.connected) {
            this.socket.emit(SOCKET_EVENTS.CONNECT_ACK, userData, roomId)
          }
        }, 500)
      })

      this.socket.on('connect_error', (error) => {
        console.error('Socket connection error:', error)
        this._disconnect()
      })

      // Return a promise that resolves when connection is established
      return new Promise((resolve, reject) => {
        const timeout = setTimeout(() => {
          if (!this.isConnected()) {
            this._disconnect()
            reject(new Error('Connection timeout'))
          }
        }, 10000)

        this.socket.once('connect', () => {
          clearTimeout(timeout)
          resolve()
        })

        this.socket.once('connect_error', (error) => {
          clearTimeout(timeout)
          reject(error)
        })
      })
    } catch (error) {
      this._disconnect()
      throw error
    }
  }

  setupEventListeners() {
    if (!this.socket) return

    // Clear existing listeners to avoid duplicates
    this.socket.removeAllListeners('disconnect')
    this.socket.removeAllListeners('error')
    this.socket.removeAllListeners(SOCKET_EVENTS.GAME_STATE_UPDATE)
    this.socket.removeAllListeners(SOCKET_EVENTS.CHAT_MESSAGE)
    this.socket.removeAllListeners(SOCKET_EVENTS.CHAT_HISTORY)
    this.socket.removeAllListeners(SOCKET_EVENTS.PLAYER_UPDATE)
    this.socket.removeAllListeners(SOCKET_EVENTS.CANVAS_UPDATE)

    this.socket.on('disconnect', (reason) => {
      console.log(`Socket disconnected: ${reason}`)
      // Only attempt to reconnect for certain disconnect reasons
      if (reason === 'io server disconnect' || reason === 'transport close') {
        this.setStatus('disconnected')
        if (!this.isReconnecting) {
          this.reconnect()
        }
      }
    })

    this.socket.on('error', (error) => {
      if (error?.message !== 'Lobby not found') {
        console.error('Socket error:', error)
        this.setStatus('error')
      }
    })

    // Game events
    this.socket.on(SOCKET_EVENTS.GAME_STATE_UPDATE, (data) => {
      if (data?.lobby) {
        this.gameStateCallbacks.forEach((cb) => cb(data))
      }
    })

    this.socket.on(SOCKET_EVENTS.CHAT_MESSAGE, (data) => {
      this.messageCallbacks.forEach((cb) => cb(data))
    })

    this.socket.on(SOCKET_EVENTS.CHAT_HISTORY, (data) => {
      this.chatHistoryCallbacks.forEach((cb) => cb(data))
    })

    this.socket.on(SOCKET_EVENTS.PLAYER_UPDATE, (data) => {
      this.playerCallbacks.forEach((cb) => cb(data))
    })

    this.socket.on(SOCKET_EVENTS.CANVAS_UPDATE, (data) => {
      this.canvasCallbacks.forEach((cb) => cb(data))
    })
  }

  reconnect() {
    // Prevent simultaneous reconnection attempts
    if (this.isConnected() || this.isReconnecting) return

    this.isReconnecting = true
    this.setStatus('reconnecting')

    if (this.reconnectTimer) {
      clearTimeout(this.reconnectTimer)
    }

    if (this.reconnectAttempts >= this.maxReconnectAttempts) {
      this.setStatus('connection-failed')
      this.isReconnecting = false
      return
    }

    const delay = Math.min(1000 * Math.pow(2, this.reconnectAttempts), 10000)
    console.log(
      `Attempting reconnect in ${delay}ms (attempt #${this.reconnectAttempts + 1})`
    )

    this.reconnectTimer = setTimeout(async () => {
      try {
        this.reconnectAttempts++
        if (this.currentRoom?.roomId) {
          await this.connect(
            { username: this.currentRoom.username },
            this.currentRoom.roomId
          )
        }
      } catch (error) {
        console.error(
          `Reconnection attempt #${this.reconnectAttempts} failed:`,
          error.message
        )
        // Wait before attempting next reconnect
        setTimeout(() => {
          this.isReconnecting = false
          this.reconnect()
        }, 2000)
      }
    }, delay)
  }

  _disconnect() {
    if (!this.socket) return

    try {
      this.socket.offAny() // Remove all listeners
      this.socket.disconnect()
    } catch (err) {
      console.error('Error during socket disconnect:', err)
    }

    this.socket = null
    this.setStatus('disconnected')

    if (this.reconnectTimer) {
      clearTimeout(this.reconnectTimer)
      this.reconnectTimer = null
    }

    // Don't clear callbacks as they should persist across reconnects
    this.currentRoom = null
    this.isReconnecting = false
    this.reconnectAttempts = 0
  }

  // Game controls
  startGame(roomId) {
    if (!this.isConnected())
      return console.error('Cannot start game - Socket is not connected')
    this.socket.emit(SOCKET_EVENTS.START_GAME, roomId)
  }

  selectWord(roomId, word) {
    if (!this.isConnected() || !this.currentRoom)
      throw new Error('Cannot select word - Socket is not connected')
    this.socket.emit(SOCKET_EVENTS.SELECT_WORD, { roomId, word })
  }

  checkWordGuess(roomId, guess, username) {
    if (!this.socket || !this.isConnected()) {
      console.error('Cannot check word guess: Socket disconnected')
      return
    }

    // Clean and normalize the guess for better matching
    const cleanGuess = guess.trim().toLowerCase().replace(/\s+/g, '')

    this.socket.emit(SOCKET_EVENTS.CHECK_WORD_GUESS, {
      roomId,
      guess: cleanGuess,
      username,
      timestamp: Date.now(),
    })
  }

  endRound(roomId) {
    if (!this.isConnected()) console.warn('Socket not connected')
    this.socket.emit(SOCKET_EVENTS.END_ROUND, roomId)
  }

  leaveLobby(roomId) {
    // Only emit if connected and roomId exists
    if (this.isConnected() && roomId) {
      console.log(`Leaving lobby for roomId: ${roomId}`)
      this.socket.emit(SOCKET_EVENTS.LEAVE_LOBBY, { roomId })
    }
    // Always clear room and callbacks regardless of connection state
    this.currentRoom = null
    this.gameStateCallbacks.clear()
  }

  kickPlayer(roomId, username) {
    if (!this.isConnected())
      return console.error('Cannot kick player - Socket is not connected')
    console.log(`Kicking player: ${username} from room: ${roomId}`)
    this.socket.emit(SOCKET_EVENTS.KICK_PLAYER, { roomId, username })
  }

  reportPlayer(roomId, username) {
    if (!this.isConnected())
      throw new Error('Cannot report player - Socket is not connected')
    console.log(`Reporting player: ${username} in room: ${roomId}`)
    this.socket.emit(SOCKET_EVENTS.REPORT_PLAYER, { roomId, username })
  }

  // Messaging and drawing
  sendMessage(lobbyObjectId, message, username) {
    if (!this.isConnected())
      throw new Error('Cannot send message - Socket is not connected')
    console.log('Sending chat message:', { lobbyObjectId, message, username })
    this.socket.emit(SOCKET_EVENTS.CHAT_MESSAGE, {
      lobbyObjectId,
      message,
      username,
    })
  }

  updateCanvas({ canvasState, lobbyId }) {
    if (!this.socket?.connected) {
      console.warn('Socket not connected, attempting to reconnect...')
      this.reconnect()
      return
    }
    lobbyId = lobbyId || this.currentRoom?.lobbyId

    this.socket.volatile.emit(SOCKET_EVENTS.CANVAS_UPDATE, {
      lobbyId,
      canvasState: {
        data: canvasState.data,
        timestamp: canvasState.timestamp,
      },
    })
  }

  // Add a method to request chat history
  requestChatHistory(lobbyObjectId, username) {
    if (!this.isConnected()) {
      console.warn('Cannot request chat history - Socket not connected')
      return
    }

    console.log('Requesting chat history for lobby:', lobbyObjectId)
    this.socket.emit(SOCKET_EVENTS.REQUEST_CHAT_HISTORY, {
      lobbyObjectId,
      username,
    })
  }

  // Connection status management
  getStatus() {
    return this.connectionStatus
  }

  setStatus(status) {
    this.connectionStatus = status
    this.statusCallbacks.forEach((callback) => callback(status))
  }

  onStatusChange(callback) {
    this.statusCallbacks.add(callback)
    callback(this.connectionStatus)
    return () => this.statusCallbacks.delete(callback)
  }

  isConnected() {
    return this.socket?.connected
  }

  // Event subscriptions
  onMessage(callback) {
    this.messageCallbacks.add(callback)
    return () => this.messageCallbacks.delete(callback)
  }

  onPlayerUpdate(callback) {
    this.playerCallbacks.add(callback)
    return () => this.playerCallbacks.delete(callback)
  }

  onGameStateUpdate(callback) {
    this.gameStateCallbacks.add(callback)
    return () => this.gameStateCallbacks.delete(callback)
  }

  onCanvasUpdate(callback) {
    this.canvasCallbacks.add(callback)
    return () => this.canvasCallbacks.delete(callback)
  }

  onWordOptions(callback) {
    this.wordOptionsCallbacks.add(callback)
    return () => this.wordOptionsCallbacks.delete(callback)
  }

  // Add subscription method for chat history
  onChatHistory(callback) {
    this.chatHistoryCallbacks.add(callback)
    return () => this.chatHistoryCallbacks.delete(callback)
  }
}
// Export a singleton instance
export const socketManager = new SocketManager()
