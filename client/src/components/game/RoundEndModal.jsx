import { useEffect, useState } from 'react'
import { socketManager } from '../../services/socketManager'

// RoundEndModal component displays the results of a drawing round
// Includes the word, points earned by players, and a countdown to the next round
const RoundEndModal = ({
  word,
  drawer,
  players,
  cooldownTime,
  onCooldownComplete,
  lobbyId,
}) => {
  const [timeLeft, setTimeLeft] = useState(cooldownTime) // State to track the remaining cooldown time

  // Effect to manage the countdown timer
  useEffect(() => {
    setTimeLeft(cooldownTime)

    const timer = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) {
          clearInterval(timer)
          return 0
        }
        return prev - 1
      })
    }, 1000)

    return () => clearInterval(timer)
  }, [cooldownTime, word, drawer])

  // Effect to trigger the callback when the cooldown ends
  useEffect(() => {
    if (timeLeft === 0) {
      onCooldownComplete?.()
    }
  }, [timeLeft, onCooldownComplete])

  const handlePlayAgain = () => {
    if (lobbyId) {
      socketManager.restartGame(lobbyId)
    }
  }

  // Filter and sort players who guessed correctly by their guess order
  const correctGuessers = players
    .filter((p) => p.hasGuessedCorrect && p.username !== drawer)
    .sort((a, b) => (a.guessTime || 0) - (b.guessTime || 0))

  const drawerPlayer = players.find((p) => p.username === drawer)

  // Calculate total points for this turn
  const totalDrawerPoints = drawerPlayer?.drawPoints || 0
  const totalGuesserPoints = correctGuessers.reduce(
    (sum, player) => sum + (player.drawPoints || 0),
    0
  )
  const totalRoundPoints = totalDrawerPoints + totalGuesserPoints

  return (
    <div className='fixed inset-0 bg-black bg-opacity-50 backdrop-blur-sm flex items-center justify-center z-50'>
      <div className='bg-white dark:bg-gray-800 rounded-lg p-6 max-w-md w-full mx-4 shadow-xl'>
        <h2 className='text-2xl font-bold mb-4 text-gray-800 dark:text-gray-200'>
          Drawing Complete!
        </h2>
        <p className='text-lg mb-4 text-gray-600 dark:text-gray-400'>
          The word was:{' '}
          <span className='font-bold text-indigo-600 dark:text-indigo-400'>{word}</span>
        </p>

        <div className='mb-6 bg-indigo-50 dark:bg-indigo-900/30 rounded-lg p-4'>
          <h3 className='font-semibold mb-2 text-indigo-800 dark:text-indigo-200'>
            {drawer}&apos;s Drawing Results:
          </h3>
          {correctGuessers.length > 0 ? (
            <div className='space-y-2'>
              {correctGuessers.map((player) => (
                <div
                  key={player.username}
                  className='flex justify-between items-center bg-white/80 dark:bg-gray-700/50 p-2 rounded'
                >
                  <span className='text-gray-700 dark:text-gray-300'>
                    {player.username}
                  </span>
                  <span className='font-medium text-green-600 dark:text-green-400'>
                    +{player.drawPoints || 0} pts
                  </span>
                </div>
              ))}
              <div className='flex justify-between items-center mt-2 pt-2 border-t border-indigo-200 dark:border-indigo-700'>
                <span className='text-gray-700 dark:text-gray-300'>Drawer Points:</span>
                <span className='font-medium text-green-600 dark:text-green-400'>
                  +{totalDrawerPoints} pts
                  {correctGuessers.length === players.length - 1 && (
                    <span className='ml-1 text-xs text-indigo-500'>
                      (includes 20pt bonus!)
                    </span>
                  )}
                </span>
              </div>

              <div className='flex justify-between items-center mt-2 pt-2 border-t border-indigo-200 dark:border-indigo-700 font-bold'>
                <span className='text-gray-800 dark:text-gray-200'>
                  Total Round Points:
                </span>
                <span className='text-green-600 dark:text-green-400'>
                  +{totalRoundPoints} pts
                </span>
              </div>
            </div>
          ) : (
            <p className='text-gray-500 dark:text-gray-400'>No one guessed the word!</p>
          )}
        </div>

        <div className='w-full bg-gray-200 dark:bg-gray-700 h-2 rounded-full overflow-hidden'>
          <div
            className='h-full bg-indigo-600 transition-all duration-1000'
            style={{ width: `${(timeLeft / cooldownTime) * 100}%` }}
          />
        </div>

        <div className='flex flex-col items-center gap-4 mt-4'>
          <p className='text-center text-gray-600 dark:text-gray-400'>
            Next drawing in {timeLeft}s
          </p>

          <button
            onClick={handlePlayAgain}
            className='bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-2 px-6 rounded-lg transition-colors'
          >
            Play Again
          </button>
        </div>
      </div>
    </div>
  )
}

export default RoundEndModal
