import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { checkAuth } from '../../services/api'
import Button from '../common/ui/Button'
import Error from '../common/ui/Error'
import LoadingSpinner from '../common/ui/LoadingSpinner'

const CreateLobby = ({ user }) => {
  const navigate = useNavigate()
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const validateAuth = async () => {
      try {
        if (!user || !localStorage.getItem('token')) {
          throw new Error('Not authenticated')
        }
        const authResult = await checkAuth()
        if (!authResult.success) {
          throw new Error('Auth check failed')
        }
        setLoading(false)
      } catch (err) {
        localStorage.clear()
        navigate('/')
      }
    }
    validateAuth()
  }, [navigate, user])

  if (loading) {
    return (
      <div className='flex items-center justify-center min-h-screen'>
        <LoadingSpinner />
      </div>
    )
  }

  if (error) {
    return (
      <div className='flex items-center justify-center min-h-screen'>
        <Error message={error} />
      </div>
    )
  }

  const handleJoinGame = e => {
    e.preventDefault()
    const roomId = e.target.roomId.value.trim().split('/').pop()
    if (!roomId) return setError('Invalid Room ID')
    navigate(`/lobby/${roomId}`)
  }

  return (
    <div className='flex items-center justify-center min-h-[calc(100vh-5rem)]'>
      <div className='w-full max-w-md mx-auto'>
        <div className='text-center bg-white/90 dark:bg-gray-800/90 backdrop-blur-lg p-8 rounded-2xl shadow-xl border border-gray-200/50 dark:border-gray-700/50 transform-gpu'>
          <h1 className='text-3xl font-bold mb-8 bg-gradient-to-r from-purple-600 to-indigo-600 dark:from-purple-400 dark:to-indigo-400 bg-clip-text text-transparent'>
            Create or Join a Game
          </h1>

          <Button
            onClick={() => navigate('/lobby/new')}
            variant='primary'
            size='lg'
            fullWidth
            className='transform-gpu hover:scale-[1.02] transition-transform duration-200'>
            Create New Game
          </Button>

          <div className='relative my-8'>
            <div className='absolute inset-0 flex items-center'>
              <div className='w-full border-t border-gray-200 dark:border-gray-700'></div>
            </div>
            <div className='relative flex justify-center'>
              <span className='px-4 text-sm text-gray-500 dark:text-gray-400 bg-white dark:bg-gray-800'>
                or join existing game
              </span>
            </div>
          </div>

          <form
            onSubmit={handleJoinGame}
            className='space-y-4'>
            <div>
              <div className='relative'>
                <input
                  type='text'
                  name='roomId'
                  placeholder='Enter Room ID or paste invite link'
                  className='w-full pl-4 pr-12 py-3 rounded-xl border border-gray-200 dark:border-gray-700 
                    bg-white dark:bg-gray-900/50 
                    text-gray-800 dark:text-gray-200
                    placeholder-gray-400 dark:placeholder-gray-500
                    focus:outline-none focus:ring-2 focus:ring-purple-500 dark:focus:ring-purple-400
                    transition-all duration-200'
                  required
                />
                <button
                  type='button'
                  onClick={async () => {
                    try {
                      const text = await navigator.clipboard.readText()
                      const input = document.querySelector('input[name="roomId"]')
                      if (input) {
                        input.value = text.trim()
                      }
                    } catch (err) {
                      setError('Unable to access clipboard')
                    }
                  }}
                  className='absolute right-2 top-1/2 -translate-y-1/2 p-2 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 transition-colors'
                  title='Paste from clipboard'>
                  <svg
                    className='w-5 h-5'
                    fill='none'
                    stroke='currentColor'
                    viewBox='0 0 24 24'>
                    <path
                      strokeLinecap='round'
                      strokeLinejoin='round'
                      strokeWidth={2}
                      d='M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2'
                    />
                  </svg>
                </button>
              </div>
            </div>

            <Button
              type='submit'
              variant='secondary'
              size='lg'
              fullWidth
              className='transform-gpu hover:scale-[1.02] transition-transform duration-200'>
              Join Game
            </Button>
          </form>
        </div>
      </div>
    </div>
  )
}

export default CreateLobby
