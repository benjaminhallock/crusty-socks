import { useEffect, useState } from 'react'
import { Navigate, Route, Routes, useLocation, useNavigate } from 'react-router-dom'
import { checkAuth } from './services/api'

// Component imports
import Admin from './components/admin/Admin'
import AccountSettings from './components/auth/AccountSettings'
import LoginForm from './components/auth/LoginForm'
import Navbar from './components/common/Navbar'
import GameRoom from './components/game/GameRoom'
import Leaderboard from './components/leaderboard/Leaderboard'
import UserProfile from './components/leaderboard/UserProfile'
import CreateLobby from './components/lobby/CreateLobby'
import LobbySettings from './components/lobby/LobbySettings'
import Error from './components/common/ui/Error'
import LoadingSpinner from './components/common/ui/LoadingSpinner'

function App() {
  const [user, setUser] = useState(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState(null)
  const navigate = useNavigate()

  // Combined route protection component
  const AuthRoute = ({ requireAdmin = false, children }) => {
    const location = useLocation() 

    if (!user) {
      return (
        <Navigate
          to='/'
          replace
          state={{ from: location.pathname }}
        />
      )
    }
    if (requireAdmin && !user.isAdmin) {
      return (
        <Navigate
          to='/'
          replace
        />
      )
    }

    return children
  }

  // Authentication check
  useEffect(() => {
    const verifyAuth = async () => {
      const token = localStorage.getItem('token')
      if (!token) return setIsLoading(false)
      try {
        const response = await checkAuth()

        if (!response?.success || !response?.user) {
          throw new Error('Invalid authentication response')
        }

        const userData = { ...response.user, id: response.user._id }
        setUser(userData)
        localStorage.setItem('user', JSON.stringify(userData))
      } catch (err) {
        console.error('Auth check failed:', err)
        setError(err.message)
        // Keep cached user data on connection errors
        if (err.message === 'Connection error') {
          try {
            const cachedUser = JSON.parse(localStorage.getItem('user'))
            if (cachedUser) setUser(cachedUser)
          } catch (e) {
            localStorage.clear()
          }
        } else {
          localStorage.clear()
          setUser(null)
        }

        navigate('/')
      } finally {
        setIsLoading(false)
      }
    }

    verifyAuth()
  }, [navigate])

  // function passed to LoginForm
  const handleLogin = ({ user, token }) => {
    if (!user || !token) return

    const userInfo = { ...user, id: user._id }
    localStorage.setItem('token', token)
    localStorage.setItem('user', JSON.stringify(userInfo))
    setUser(userInfo)
  }

  // function passed to Navbar
  const handleLogout = () => {
    localStorage.clear()
    setUser(null)
    navigate('/')
  }

  if (isLoading) {
    return (
      <div className='min-h-screen grid place-items-center p-4 bg-gray-50 dark:bg-gray-900'>
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

  // Main app structure
  return (
    <div className='min-h-screen'>
      <div id='app-background' />
      <Navbar
        isLoggedIn={!!user}
        onLogout={handleLogout}
        user={user}
      />
      <main className='h-[calc(90vh-4rem)] mx-auto max-w-[1400px]'>
        <Routes>
          {/* Public routes first */}
          <Route
            path='/leaderboard'
            element={<Leaderboard />}
          />
          <Route
            path='/user/:username'
            element={<UserProfile currentUser={user} />}
          />

          {/* Auth required routes */}
          <Route
            path='/'
            element={
              user ? <CreateLobby user={user} /> : <LoginForm onLoginSuccess={handleLogin} />
            }
          />
          <Route
            path='/account'
            element={
              <AuthRoute>
                <AccountSettings user={user} />
              </AuthRoute>
            }
          />
          <Route
            path='/lobby/new'
            element={
              <AuthRoute>
                <LobbySettings user={user} />
              </AuthRoute>
            }
          />
          <Route
            path='/lobby/:roomId'
            element={
              <AuthRoute>
                <GameRoom user={user} />
              </AuthRoute>
            }
          />
          <Route
            path='/admin'
            element={
              <AuthRoute requireAdmin={true}>
                <Admin user={user} />
              </AuthRoute>
            }
          />
          <Route
            path='*'
            element={<Navigate to='/' />}
          />
        </Routes>
      </main>
    </div>
  )
}

export default App
