import { useState, useEffect } from 'react'
import { Routes, Route, useLocation, Navigate, useNavigate } from 'react-router-dom'

import { checkAuth } from './services/api'
import Admin from './components/admin/Admin'
import Navbar from './components/common/Navbar'
import GameRoom from './components/game/GameRoom'
import LoginForm from './components/auth/LoginForm'
import CreateLobby from './components/lobby/CreateLobby'
import LobbySettings from './components/lobby/LobbySettings'
import UserProfile from './components/leaderboard/UserProfile'
import Leaderboard from './components/leaderboard/Leaderboard'
import AccountSettings from './components/auth/AccountSettings'

function App() {
  const [user, setUser] = useState(null)
  const [isLoading, setIsLoading] = useState(true)
  const [bgLoaded, setBgLoaded] = useState(false)
  const navigate = useNavigate()

  const ProtectedRoute = ({ children }) => {
    const location = useLocation()
    if (!user)
      return (
        <Navigate
          to='/'
          replace
          state={{ from: location.pathname }}
        />
      )
    return children
  }

  const AdminRoute = ({ children }) => {
    const location = useLocation()
    if (!user || !user.isAdmin)
      return (
        <Navigate
          to='/'
          replace
          state={{ from: location.pathname }}
        />
      )
    return children
  }

  useEffect(() => {
    const bgImage = new Image()
    bgImage.src = '/wallpaper.svg'
    bgImage.onload = () => setBgLoaded(true)
    bgImage.onerror = () => {
      console.error('Failed to load background image')
      setBgLoaded(true)
    }
  }, [])

  useEffect(() => {
    const checkUserAuth = async () => {
      const token = localStorage.getItem('token')
      if (!token) {
        setIsLoading(false)
        return
      }

      try {
        const response = await checkAuth()
        if (!response || !response.success) {
          console.log('Auth check failed - no success flag')
          throw new Error('Invalid response')
        }

        if (!response.user) {
          console.log('Auth check failed - no user data')
          throw new Error('Invalid user')
        }

        const userData = { ...response.user, id: response.user._id }
        setUser(userData)
        localStorage.setItem('user', JSON.stringify(userData))
      } catch (err) {
        console.error('Auth check failed:', err)

        // Don't clear local storage for connection errors
        if (err.message !== 'Connection error') {
          localStorage.clear()
          setUser(null)
        } else {
          // For connection errors, try to use cached user
          const cachedUser = localStorage.getItem('user')
          if (cachedUser) {
            try {
              setUser(JSON.parse(cachedUser))
            } catch (e) {
              localStorage.clear()
              setUser(null)
            }
          }
        }
        navigate('/')
      } finally {
        setIsLoading(false)
      }
    }

    checkUserAuth()
  }, [navigate])

  const handleLogin = ({ user, token }) => {
    if (!user || !token) return console.error('Invalid login data')
    const userInfo = { ...user, id: user._id }

    // Ensure token is properly saved to localStorage
    localStorage.setItem('token', token)
    localStorage.setItem('user', JSON.stringify(userInfo))

    setUser(userInfo)
  }

  const handleLogout = () => {
    localStorage.clear()
    setUser(null)
    navigate('/')
  }

  if (isLoading) {
    return (
      <div className='flex items-center justify-center h-screen'>
        <div className='animate-spin h-8 w-8 border-4 border-blue-500 rounded-full border-t-transparent' />
      </div>
    )
  }

  return (
    <div className='min-h-screen'>
      <div
        id='app-background'
        style={{
          opacity: bgLoaded ? 0.9 : 0,
          transition: 'opacity 0.5s ease-in-out',
          backgroundColor: window.matchMedia('(prefers-color-scheme: dark)').matches
            ? 'rgba(0, 0, 0, 0.8)'
            : 'rgba(255, 255, 255, 0.8)',
        }}
      />
      <Navbar
        isLoggedIn={!!user}
        onLogout={handleLogout}
        user={user}
      />
      <main className='mt-16 h-[calc(100vh-4rem)]'>
        <Routes>
          <Route
            path='/'
            element={
              user ? (
                <CreateLobby user={user} />
              ) : (
                <LoginForm onLoginSuccess={handleLogin} />
              )
            }
          />
          <Route
            path='/account'
            element={
              <ProtectedRoute>
                <AccountSettings user={user} />
              </ProtectedRoute>
            }
          />
          <Route
            path='/lobby/new'
            element={
              <ProtectedRoute>
                <LobbySettings user={user} />
              </ProtectedRoute>
            }
          />
          <Route
            path='/lobby/:roomId'
            element={
              <ProtectedRoute>
                <GameRoom user={user} />
              </ProtectedRoute>
            }
          />
          <Route
            path='/admin'
            element={
              <AdminRoute>
                <Admin user={user} />
              </AdminRoute>
            }
          />
          <Route
            path='/leaderboard'
            element={<Leaderboard />}
          />
          <Route
            path='/user/:username'
            element={<UserProfile currentUser={user} />}
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
