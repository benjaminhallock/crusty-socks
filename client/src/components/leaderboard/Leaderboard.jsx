import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { fetchLeaderboard } from '../../services/api'
import LoadingSpinner from '../common/ui/LoadingSpinner'
import Error from '../common/ui/Error'

const Leaderboard = () => {
  const [leaderboard, setLeaderboard] = useState([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState(null)

  useEffect(() => {
    const loadLeaderboard = async () => {
      try {
        setIsLoading(true)
        const response = await fetchLeaderboard()

        if (!response.success) {
          throw new Error(response.error)
        }

        setLeaderboard(response.leaderboard)
      } catch (error) {
        console.error('Error loading leaderboard:', error)
        setError(error.message)
      } finally {
        setIsLoading(false)
      }
    }

    loadLeaderboard()
  }, [])

  if (isLoading) {
    return (
      <div className='min-h-screen grid place-items-center bg-gray-50 dark:bg-gray-900'>
        <LoadingSpinner />
      </div>
    )
  }

  if (error) {
    return (
      <div className='min-h-screen grid place-items-center p-4 bg-gray-50 dark:bg-gray-900'>
        <Error error={error} />
      </div>
    )
  }

  return (
    <div className='min-h-screen p-6'>
      <div className='max-w-5xl mx-auto space-y-6'>
        {/* Header */}
        <header className='p-4 text-center rounded-lg bg-white/90 dark:bg-gray-800/90 shadow'>
          <h1 className='text-4xl font-bold text-indigo-600 dark:text-indigo-400'>
            Pixel Party Leaderboard
          </h1>
          <p className='mt-2 text-gray-600 dark:text-gray-400'>
            Top players ranked by score and performance
          </p>
        </header>

        {/* Table */}
        <div className='bg-white dark:bg-gray-800 rounded-xl shadow overflow-hidden'>
          {/* Header */}
          <div className='bg-indigo-50 dark:bg-gray-900 border-b'>
            <div className='grid grid-cols-12 p-4 text-sm font-medium'>
              <div className='col-span-1 text-center'>#</div>
              <div className='col-span-4'>Player</div>
              <div className='col-span-2 text-center'>Score</div>
              <div className='col-span-2 text-center'>Games</div>
              <div className='col-span-2 text-center'>Wins</div>
              <div className='col-span-1 text-center'>Win %</div>
            </div>
          </div>

          {/* Body */}
          <div>
            {leaderboard.length > 0 ? (
              leaderboard.map((player, index) => (
                <div
                  key={player.username || player.id || index}
                  className={`grid grid-cols-12 p-4 hover:bg-gray-50 dark:hover:bg-gray-700 ${
                    index === 0
                      ? 'bg-yellow-50 dark:bg-yellow-900/20'
                      : index === 1
                      ? 'bg-emerald-50 dark:bg-emerald-900/20'
                      : index === 2
                      ? 'bg-purple-50 dark:bg-purple-900/20'
                      : index % 2 === 0
                      ? 'bg-gray-50/50 dark:bg-gray-800/50'
                      : ''
                  }`}>
                  {/* Rank */}
                  <div className='col-span-1 text-center'>
                    {index < 3 ? ['👑', '🥈', '🥉'][index] : index + 1}
                  </div>

                  {/* Player Info */}
                  <div className='col-span-4'>
                    <Link
                      to={`/user/${player.username || player.id}`}
                      className='flex items-center'>
                      <div className='w-10 h-10 rounded-full bg-indigo-50 dark:bg-gray-700 flex items-center justify-center mr-3'>
                        {player.avatarUrl ? (
                          <img
                            src={player.avatarUrl}
                            alt=''
                            className='w-full h-full rounded-full object-cover'
                          />
                        ) : (
                          <span className='text-lg font-bold text-indigo-600 dark:text-indigo-400'>
                            {(player.displayName || player.username || '?').charAt(0).toUpperCase()}
                          </span>
                        )}
                      </div>
                      <div>
                        <div className='font-medium'>{player.displayName || player.username}</div>
                        <div className='text-xs text-gray-500'>@{player.username}</div>
                      </div>
                    </Link>
                  </div>

                  {/* Stats */}
                  <div className='col-span-2 text-center'>
                    {(player.totalScore || player.score || 0).toLocaleString()}
                  </div>
                  <div className='col-span-2 text-center'>
                    {player.gamesPlayed || player.games || 0}
                  </div>
                  <div className='col-span-2 text-center'>
                    {player.gamesWon || player.wins || 0}
                  </div>
                  <div className='col-span-1 text-center'>
                    <span className={`px-2 py-1 rounded-full text-xs ${getWinRateColor(player)}`}>
                      {player.winRate || calculateWinRate(player)}%
                    </span>
                  </div>
                </div>
              ))
            ) : (
              <div className='p-8 text-center text-gray-500'>
                <p>No players found. Be the first to play!</p>
                <Link
                  to='/'
                  className='mt-4 inline-block px-4 py-2 bg-indigo-600 text-white rounded'>
                  Start Playing
                </Link>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

// Helper function for win rate color
const getWinRateColor = player => {
  const winRate = player.winRate || calculateWinRate(player)
  return winRate >= 50
    ? 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400'
    : winRate >= 25
    ? 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400'
    : 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-400'
}

// Helper function to calculate win rate if not provided
const calculateWinRate = player => {
  const gamesPlayed = player.gamesPlayed || player.games || 0
  const gamesWon = player.gamesWon || player.wins || 0
  return gamesPlayed === 0 ? 0 : Math.round((gamesWon / gamesPlayed) * 100)
}

export default Leaderboard
