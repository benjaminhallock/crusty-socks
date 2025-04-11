import { useEffect, useState, useRef, useCallback } from 'react'
import { useNavigate, useParams, useBeforeUnload } from 'react-router-dom'

import ChatBox from './ChatBox'
import HiddenWord from './HiddenWord'
import PlayerList from './PlayerList'
import PixelCanvas from './PixelCanvas'
import GameSettings from './GameSettings'
import RoundEndModal from './RoundEndModal'
import { GAME_STATE } from '../../constants'
import { fetchLobby } from '../../services/api'
import RoundSummaryModal from './RoundSummaryModal'
import { socketManager } from '../../services/socketManager.js'
import LoadingSpinner from '../common/ui/LoadingSpinner.jsx'
import SocketStatusIcon from '../common/ui/SocketStatusIcon.jsx'

const GameRoom = ({ user }) => {
  const { roomId } = useParams() // Get the room ID from the URL
  const navigate = useNavigate() // Navigation hook for redirecting users
  const [isLoading, setIsLoading] = useState(true) // State to manage loading state
  const [lobbyId, setLobbyId] = useState()
  const [error, setError] = useState('')
  const isMountedRef = useRef(false)
  const [lobby, setGameData] = useState({
    players: [],
    playerLimit: 0,
    revealCharacters: false,
    currentRound: 1,
    maxRounds: 3,
    selectWord: 3,
    selectCategory: 'random',
    gameState: GAME_STATE.WAITING,
    messages: [],
    currentWord: '',
    currentDrawer: '',
    canvasState: null,
    startTime: null,
    words: [],
    roundTime: 60,
    timeLeft: 0,
  })

  // Refs to track various states and prevent redundant actions
  const hasConnectedRef = useRef(false) // Track if the socket has connected
  const hasJoinedRef = useRef(false) // Track if the user has joined the lobby via socket
  const prevPlayerScoresRef = useRef({}) // Store previous player scores
  const lastSummaryRoundRef = useRef(0) // Track the last round summary shown
  const [socketStatus, setSocketStatus] = useState('disconnected') // Track socket connection status

  // State to manage modals
  const [showRoundEnd, setShowRoundEnd] = useState(false)
  const [showRoundSummary, setShowRoundSummary] = useState(false)

  // Add navigation warning hook
  useBeforeUnload(
    useCallback(
      (event) => {
        if (
          lobby?.gameState === GAME_STATE.DRAWING ||
          lobby?.gameState === GAME_STATE.PICKING_WORD
        ) {
          event.preventDefault()
          return (event.returnValue =
            'Are you sure you want to leave? The game is still in progress!')
        }
      },
      [lobby?.gameState]
    )
  )

  useEffect(() => {
    isMountedRef.current = true
    let mounted = true

    const setupSocket = async () => {
      try {
        // Basic validation
        if (!user?.username || !roomId) {
          throw new Error('Missing user or room information')
        }
        if (user.isBanned) {
          throw new Error('You are banned from this game')
        }

        setIsLoading(true)

        // Connect socket if needed and wait for connection
        if (!socketManager.isConnected()) {
          console.log('Connecting socket...')
          await socketManager.connect(user, roomId)
          hasJoinedRef.current = true
        } else {
          console.log('Socket already connected, ensuring CONNECT_ACK is sent')
          await socketManager.connect(user, roomId) // This will re-send CONNECT_ACK
        }

        // Setup event listeners with cleanup handlers
        const unsubscribeStatus = socketManager.onStatusChange((status) => {
          if (mounted) {
            setSocketStatus(status)
            if (status === 'disconnected') {
              console.log('Socket disconnected, attempting to reconnect...')
              socketManager.reconnect()
            }
          }
        })

        const unsubscribeGameState = socketManager.onGameStateUpdate((data) => {
          if (mounted && data.lobby) {
            console.log('Game state update received:', data.lobby.gameState)
            setGameData((prev) => ({ ...prev, ...data.lobby }))
          }
        })

        // Fetch initial lobby data
        const lobbyData = await fetchLobby(roomId)
        if (!lobbyData || lobbyData.roomId !== roomId) {
          throw new Error('Lobby not found')
        }

        if (mounted) {
          setLobbyId(lobbyData._id)
          setGameData((prev) => ({ ...prev, ...lobbyData }))
          setIsLoading(false)
        }

        return () => {
          unsubscribeStatus()
          unsubscribeGameState()
        }
      } catch (error) {
        console.error('Game room error:', error)
        if (mounted) {
          setError(error.message)
          setIsLoading(false)
          navigate('/')
        }
      }
    }

    setupSocket()

    return () => {
      mounted = false
      const isUnmounting = isMountedRef.current
      isMountedRef.current = false

      if (isUnmounting && socketManager.isConnected()) {
        console.log('Component unmounting, cleaning up socket connection...')
        socketManager.leaveLobby(roomId)
      }
    }
  }, [roomId, navigate, user])

  // Function to check if socket is ready for an action
  const isSocketReady = () => {
    if (!socketManager.isConnected()) {
      console.warn('Socket not connected, attempting reconnection...')
      try {
        socketManager.reconnect()
      } catch (e) {
        console.error('Failed to reconnect socket:', e)
      }
      return false
    }
    return true
  }

  // Function to handle game starting with socket check
  const handleStartGame = () => {
    if (isSocketReady()) {
      socketManager.startGame(roomId)
    } else {
      setError('Cannot start game - Socket not connected. Please refresh the page.')
    }
  }

  // Fix leave game functionality
  const handleLeaveGame = useCallback(() => {
    if (roomId && socketManager.isConnected()) {
      socketManager.leaveLobby(roomId)
      if (lobby?.currentDrawer === user.username) {
        socketManager.endRound(roomId) // End round if drawer leaves
      }
      navigate('/')
    } else {
      navigate('/')
    }
  }, [roomId, user, lobby?.currentDrawer, navigate])

  return (
    <div className='min-h-[calc(100vh-4rem)] w-full bg-gradient-to-br from-blue-300 via-pink-300 to-yellow-300 dark:from-gray-800 dark:via-purple-800 dark:to-indigo-800 p-4 rounded-lg shadow-2xl'>
      {error && (
        <div className='bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded relative mb-2'>
          <strong className='font-bold'>Error: </strong>
          <span className='block sm:inline'>{error}</span>
        </div>
      )}
      {isLoading && (
        <div className='flex items-center justify-center min-h-screen'>
          <LoadingSpinner />
        </div>
      )}
      <div className='h-full w-full flex flex-col gap-4 rounded-lg bg-white/90 dark:bg-gray-700/90 p-4 shadow-lg'>
        <div className='flex items-center w-full'>
          <SocketStatusIcon status={socketStatus} />
        </div>
        <div className=''>
          <HiddenWord
            lobby={lobby}
            user={user}
            onWordPick={(word) => {
              socketManager.selectWord(roomId, word)
            }}
          />
        </div>
        <div className='flex-1 flex flex-col lg:flex-row gap-4 w-full'>
          <div className='lg:w-72 flex flex-col gap-4'>
            <PlayerList
              players={lobby.players}
              drawerUsername={lobby.currentDrawer}
              roomId={roomId}
              gameState={lobby.gameState}
              currentUsername={user.username}
              isAdmin={user.isAdmin}
              onStartGame={handleStartGame}
            />
            <GameSettings
              revealCharacters={lobby.revealCharacters}
              maxRounds={lobby.maxRounds}
              selectWord={lobby.selectWord}
              selectCategory={lobby.selectCategory}
              playerLimit={lobby.playerLimit}
            />
          </div>

          <div className='flex-1 flex flex-col gap-4'>
            {lobby.gameState !== GAME_STATE.FINISHED && (
              <PixelCanvas
                isDrawer={lobby.currentDrawer === user.username}
                drawerUsername={lobby.currentDrawer}
                canvasState={lobby.canvasState}
                gameState={lobby.gameState}
                roundTime={lobby.roundTime}
                startTime={lobby.startTime}
                lobbyId={lobby._id}
              />
            )}

            {lobby.gameState === GAME_STATE.FINISHED && (
              <div className='flex-1 flex items-center justify-center'>
                <p className='text-4xl font-bold bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500 text-white px-8 py-4 rounded-lg shadow-lg text-center'>
                  Game Over! Thanks for playing!
                </p>
              </div>
            )}

            {lobby.gameState === GAME_STATE.PICKING_WORD &&
              lobby.currentDrawer !== user.username && (
                <div className='flex-1 flex flex-col items-center justify-center'>
                  <p className='text-3xl font-bold mb-6 bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500 text-white px-8 py-4 rounded-lg shadow-lg text-center'>
                    Waiting for {lobby.currentDrawer} to start drawing...
                  </p>
                </div>
              )}
          </div>

          <div className='lg:w-72 flex flex-col gap-4'>
            <ChatBox
              user={user}
              roomId={roomId}
              lobbyObjectId={lobbyId}
              gameState={lobby.gameState}
              currentDrawer={lobby.currentDrawer}
              currentWord={lobby.currentWord}
            />
          </div>
        </div>
      </div>
      {showRoundEnd && (
        <RoundEndModal
          word={lobby.currentWord}
          drawer={lobby.currentDrawer}
          players={lobby.players}
          cooldownTime={10}
          onCooldownComplete={handleRoundEndComplete}
        />
      )}

      {showRoundSummary && lobby.players.every((p) => p.hasDrawn) && (
        <RoundSummaryModal
          isOpen={true}
          players={lobby.players.map((player) => ({
            ...player,
            roundPoints: calculateRoundPoints(player),
          }))}
          onClose={() => setShowRoundSummary(false)}
          roundNumber={lobby.currentRound}
          maxRounds={lobby.maxRounds}
        />
      )}
    </div>
  )
}

export default GameRoom
