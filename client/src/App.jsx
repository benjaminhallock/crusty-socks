import { useEffect, useState } from 'react';
import {
  Navigate,
  Route,
  Routes,
  useLocation,
  useNavigate,
} from 'react-router-dom';
import { checkAuth } from './services/api';

// Component imports
import Admin from './components/admin/Admin';
import AccountSettings from './components/auth/AccountSettings';
import LoginForm from './components/auth/LoginForm';
import ErrorBoundary from './components/common/ErrorBoundary';
import Navbar from './components/common/Navbar';
import GameRoom from './components/game/GameRoom';
import Leaderboard from './components/leaderboard/Leaderboard';
import UserProfile from './components/leaderboard/UserProfile';
import CreateLobby from './components/lobby/CreateLobby';
import LobbySettings from './components/lobby/LobbySettings';

function App() {
  const [user, setUser] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [bgLoaded, setBgLoaded] = useState(false);
  const navigate = useNavigate();

  // Combined route protection component
  const AuthRoute = ({ requireAdmin = false, children }) => {
    const location = useLocation();

    if (!user)
      return <Navigate to="/" replace state={{ from: location.pathname }} />;
    if (requireAdmin && !user.isAdmin) return <Navigate to="/" replace />;

    return children;
  };

  // Load background image
  useEffect(() => {
    const bgImage = new Image();
    bgImage.src = '/wallpaper.svg';
    bgImage.onload = () => setBgLoaded(true);
    bgImage.onerror = () => {
      console.error('Failed to load background image');
      setBgLoaded(true);
    };
  }, []);

  // Authentication check
  useEffect(() => {
    const verifyAuth = async () => {
      setIsLoading(true);
      try {
        const { user } = await checkAuth();
        setUser(user ? { ...user, id: user._id } : null);
      } catch (err) {
        console.error('Auth check failed:', err);
      }
      setIsLoading(false);
    };

    // Only verify if we have a token but no user
    const token = localStorage.getItem('token');
    if (token && !user) {
      verifyAuth();
    } else if (!token) {
      setIsLoading(false);
    }
  }, []);

  const handleLogin = async ({ user, token }) => {
    if (!user || !token) return;

    const userInfo = { ...user, id: user._id };
    setUser(userInfo);
    localStorage.setItem('token', token);
    localStorage.setItem('user', JSON.stringify(userInfo));
  };

  const handleLogout = () => {
    localStorage.clear();
    setUser(null);
    navigate('/');
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="animate-spin h-8 w-8 border-4 border-indigo-500 rounded-full border-t-transparent" />
      </div>
    );
  }

  return (
    <div className="min-h-screen">
      <div
        id="app-background"
        style={{
          opacity: bgLoaded ? 0.9 : 0,
          transition: 'opacity 0.5s ease-in-out',
          backgroundColor: window.matchMedia('(prefers-color-scheme: dark)')
            .matches
            ? 'rgba(0, 0, 0, 0.8)'
            : 'rgba(255, 255, 255, 0.8)',
        }}
      />
      <ErrorBoundary>
        <Navbar isLoggedIn={!!user} onLogout={handleLogout} user={user} />
      </ErrorBoundary>
      <main className="h-[calc(90vh-4rem)] mx-auto max-w-[1400px]">
        <Routes>
          <Route path="/leaderboard" element={<Leaderboard />} />
          <Route
            path="/user/:username"
            element={<UserProfile currentUser={user} />}
          />
          <Route
            path="/"
            element={
              user ? (
                <CreateLobby user={user} />
              ) : (
                <LoginForm onLoginFunc={handleLogin} />
              )
            }
          />
          <Route
            path="/account"
            element={
              <AuthRoute>
                <AccountSettings user={user} />
              </AuthRoute>
            }
          />
          <Route
            path="/lobby/new"
            element={
              <AuthRoute>
                <LobbySettings user={user} />
              </AuthRoute>
            }
          />
          <Route
            path="/lobby/:roomId"
            element={
              <AuthRoute>
                <GameRoom user={user} />
              </AuthRoute>
            }
          />
          <Route
            path="/admin"
            element={
              <AuthRoute requireAdmin={true}>
                <Admin user={user} />
              </AuthRoute>
            }
          />

          <Route path="*" element={<Navigate to="/" />} />
        </Routes>
      </main>
    </div>
  );
}

export default App;
