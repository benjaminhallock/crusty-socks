import { Transition } from '@headlessui/react'
import { Fragment, useCallback, useEffect, useRef, useState } from 'react'
import { useBeforeUnload, useNavigate, useParams } from 'react-router-dom'

import { GAME_STATE } from '../../constants'
import { fetchLobby } from '../../services/api'
import { socketManager } from '../../services/socketManager.js'

import ChatBox from './ChatBox'
import HiddenWord from './HiddenWord'
import PixelCanvas from './PixelCanvas'
import PlayerList from './PlayerList'
import Modal from '../common/ui/Modal'
import SocketStatusIcon from '../common/ui/SocketStatusIcon.jsx'
import DrawEndModal from './menus/DrawEndModal.jsx'
import RoundSummaryModal from './menus/RoundSummaryModal.jsx'

import Error from '../common/ui/Error.jsx'
import LoadingSpinner from '../common/ui/LoadingSpinner.jsx'

const GameRoom = ({ user }) => {
  const { roomId } = useParams()
  const navigate = useNavigate()
  const [isLoading, setIsLoading] = useState(true)
  const [lobbyId, setLobbyId] = useState(null)
  const [error, setError] = useState('')
  const [socketStatus, setSocketStatus] = useState('disconnected')
  const [isShowing, setIsShowing] = useState(false)
  const correctSound = useRef(new Audio('/audio/sfx/correct.mp3'))
  const incorrectSound = useRef(new Audio('/audio/sfx/incorrect.mp3'))

  const playSound = useCallback(soundType => {
    if (soundType === 'correct') {
      correctSound.current.currentTime = 0
      correctSound.current.play().catch(console.error)
    } else if (soundType === 'incorrect') {
      incorrectSound.current.currentTime = 0
      incorrectSound.current.play().catch(console.error)
    }
  }, [])

  // Refs for managing component lifecycle and connection state
  const isMounted = useRef(false)
  const isConnected = useRef(false)
  const initializationComplete = useRef(false)

  // Initial lobby state
  const [lobby, setLobby] = useState({
    gridSize: 16,
    players: [
      {
        userId: user._id,
        username: user.username,
        score: 0,
        hasGuessedCorrect: false,
        hasDrawn: false,
        guessTime: 0,
        drawScore: 0,
        roundScore: 0,
      },
    ],
    usedWords: [],
    playerLimit: 8,
    revealCharacters: 0,
    currentRound: 1,
    maxRounds: 5,
    selectWord: 3,
    selectCategory: 'random',
    gameState: GAME_STATE.WAITING,
    currentWord: '',
    currentDrawer: '',
    canvasState: {
      data: '',
      lastUpdate: null,
    },
    startTime: null,
    words: [],
    roundTime: 60,
    kickedUsers: [],
    roomId: roomId,
    finished: false,
  })

  // Primary initialization effect
  useEffect(() => {
    isMounted.current = true
    setIsLoading(true)
    setError('')

    const initialize = async () => {
      if (initializationComplete.current) return

      // Validate required data
      if (!user || !roomId || !localStorage.getItem('token')) {
        setError('Invalid session. Please log in again.')
        return navigate('/')
      } else if (user.isBanned) {
        setError('You have been banned from this game.')
        return navigate('/')
      }

      try {
        // Attempt to connect to the socket server
        await setupSocketConnection()
        socketManager.setNavigate(navigate)

        // Then fetch lobby data
        const lobbyData = await fetchLobbyData()
        if (lobbyData) {
          setLobbyId(lobbyData._id)
          setLobby(prev => ({ ...prev, ...lobbyData }))
          console.log('[GameRoom] Lobby data:', lobbyData)
          initializationComplete.current = true
          setIsShowing(true)
          setIsLoading(false)
        }
      } catch (error) {
        console.error('Initialization error:', error)
        setError('Failed to initialize game room.')
      } finally {
        if (isMounted.current) {
          setIsLoading(false)
        }
      }
    }

    initialize()

    // Cleanup on unmount
    return () => {
      isMounted.current = false
      isConnected.current = false
      initializationComplete.current = false
      setIsShowing(false)
    }
  }, [roomId, navigate, user])

  const fetchLobbyData = async () => {
    try {
      const data = await fetchLobby(roomId)
      if (!data.success || !data.lobby) {
        throw new Error(data.error || 'Failed to fetch lobby data')
      }

      const lobby = data.lobby

      if (lobby.kickedUsers?.includes(user._id)) {
        setError('You have been kicked from this lobby.')
        navigate('/')
        return null
      }

      return lobby
    } catch (error) {
      console.error('Error fetching lobby data:', error)
      setError('Failed to fetch lobby data')
      navigate('/')
      return null
    }
  }

  const setupSocketConnection = async () => {
    try {
      await socketManager.connect(user, roomId)
      isConnected.current = true

      const unsubscribeStatus = socketManager.onStatusChange(status => {
        if (isMounted.current) {
          setSocketStatus(status)
          isConnected.current = status === 'connected'
        }
      })

      const unsubscribeGameState = socketManager.onGameStateUpdate(data => {
        if (isMounted.current && data?.lobby) {
          // Deep compare relevant fields before updating
          setLobby(prevLobby => {
            if (!prevLobby) return data.lobby

            // Check if players array has changed
            const playersChanged =
              JSON.stringify(prevLobby.players) !== JSON.stringify(data.lobby.players)

            // If players haven't changed and no other important fields changed, keep current state
            if (
              !playersChanged &&
              prevLobby.gameState === data.lobby.gameState &&
              prevLobby.currentDrawer === data.lobby.currentDrawer &&
              prevLobby.currentWord === data.lobby.currentWord
            ) {
              return prevLobby
            }

            return { ...prevLobby, ...data.lobby }
          })
        }
      })

      const unsubscribeSound = socketManager.onSoundNotification(data => {
        if (isMounted.current && data.sound) {
          playSound(data.sound)
        }
      })

      return () => {
        unsubscribeStatus()
        unsubscribeGameState()
        unsubscribeSound()
      }
    } catch (error) {
      console.error('Socket connection error:', error)
      throw new Error('Failed to connect to game server')
    }
  }

  // Enhanced reconnection effect with presence verification
  useEffect(() => {
    if (!isMounted.current || !lobbyId) return

    const verifyPresence = async () => {
      const lobbyData = await fetchLobbyData()
      if (!lobbyData) return

      const playerExists = lobbyData.players.some(p => p.username === user.username)
      if (!playerExists || !socketManager.isConnected()) {
        console.log('[GameRoom] Restoring player connection...')
        await setupSocketConnection()
      }
    }

    verifyPresence()
    const presenceInterval = setInterval(verifyPresence, 5000)

    return () => clearInterval(presenceInterval)
  }, [socketStatus, lobbyId, user.username])

  // View Logic starts here
  if (error) {
    return (
      <div className='min-h-screen flex items-center justify-center'>
        <Error message={error} />
      </div>
    )
  }
  // Show loading spinner if still loading
  if (isLoading) {
    return (
      <div className='min-h-screen flex items-center justify-center'>
        <LoadingSpinner />
      </div>
    )
  }

  // Show game UI
  return (
    <Transition
      as={Fragment}
      show={isShowing}
      enter='transition duration-300'
      enterFrom='opacity-0'
      enterTo='opacity-100'
      leave='transition duration-200'
      leaveFrom='opacity-100'
      leaveTo='opacity-0'>
      <div className='w-full bg-gradient-to-r from-purple-100/50 to-indigo-100/50 dark:from-purple-900/20 dark:to-indigo-900/20 p-4'>
        <div className='flex flex-col gap-4 bg-white/80 dark:bg-gray-800/80 p-4 rounded shadow-lg'>
          <SocketStatusIcon status={socketStatus} />

          <HiddenWord
            lobby={lobby}
            user={user}
            onWordPick={word => socketManager.selectWord(roomId, word)}
          />

          <div className='flex flex-col lg:flex-row gap-4'>
            <div className='lg:w-64'>
              <PlayerList
                lobby={lobby}
                user={user}
                onStartGame={() => socketManager.startGame(roomId)}
              />
            </div>

            <div className='flex-1 min-h-[400px]'>
              <PixelCanvas
                lobby={lobby}
                isDrawer={lobby.currentDrawer === user.username}
              />
            </div>

            <div className='lg:w-72'>
              {lobbyId && (
                <ChatBox
                  user={user}
                  roomId={roomId}
                  lobbyId={lobbyId}
                  lobbyObjectId={lobbyId}
                  gameState={lobby.gameState}
                  currentDrawer={lobby.currentDrawer}
                  currentWord={lobby.currentWord}
                />
              )}
            </div>
          </div>
        </div>

        {/* Game state modals */}
        {lobby.gameState === GAME_STATE.DRAW_END && (
          <DrawEndModal
            lobby={lobby}
            word={lobby.currentWord}
            drawer={lobby.currentDrawer}
            players={lobby.players}
            onClose={() => {}} // Server controls state
          />
        )}

        {lobby.gameState === GAME_STATE.ROUND_END && (
          <RoundSummaryModal
            lobby={lobby}
            isOpen={true}
            players={lobby.players}
            onClose={() => {}} // Server controls state
            roundNumber={lobby.currentRound}
            maxRounds={lobby.maxRounds}
            gameState={lobby.gameState}
          />
        )}

        {lobby.gameState === GAME_STATE.FINISHED && (
          <Modal
            isOpen={true}
            title='Game Complete!'
            size='md'
            position='center'
            onClose={() => {}}>
            <div className='text-center'>
              <div className='mb-6'>
                <h3 className='text-xl font-bold text-gray-800 dark:text-gray-200 mb-2'>
                  Final Scores
                </h3>
                <div className='space-y-2'>
                  {lobby.players
                    .sort((a, b) => b.score - a.score)
                    .map((player, index) => (
                      <div
                        key={player.username}
                        className={`flex justify-between items-center px-4 py-2 rounded transform transition-all duration-200 hover:scale-[1.02] ${
                          index === 0
                            ? 'bg-yellow-100 dark:bg-yellow-900'
                            : 'bg-gray-50 dark:bg-gray-800'
                        }`}>
                        <span className='font-medium'>
                          {index === 0 ? '👑 ' : `#${index + 1} `}
                          {player.username}
                        </span>
                        <span className='font-bold'>{player.score} pts</span>
                      </div>
                    ))}
                </div>
              </div>
              <p className='text-green-600 dark:text-green-400 font-medium mb-4 transform transition-all duration-500 hover:scale-[1.05]'>
                Game Complete! All scores have been saved to your profile!
              </p>
              <div className='flex justify-center gap-4'>
                {user && (
                  <button
                    onClick={() => socketManager.startGame(roomId)}
                    className='bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-2 px-6 rounded-lg transition-all duration-200 transform hover:scale-105 hover:shadow-lg'>
                    Play Again
                  </button>
                )}
                <button
                  onClick={() => navigate('/')}
                  className='bg-gray-600 hover:bg-gray-700 text-white font-bold py-2 px-6 rounded-lg transition-all duration-200 transform hover:scale-105 hover:shadow-lg'>
                  Return to Create Lobby
                </button>
              </div>
            </div>
          </Modal>
        )}
      </div>
    </Transition>
  )
}

export default GameRoom
