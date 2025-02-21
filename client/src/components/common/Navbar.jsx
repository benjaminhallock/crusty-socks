import { Link } from "react-router-dom";
import { useState } from "react";
import MusicPlayer from "./MusicPlayer";

const Navbar = ({ isLoggedIn, onLogout }) => {
  const [isDark, setIsDark] = useState(false);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const [showPlayButton, setShowPlayButton] = useState(true);
  const [animatePlayButton, setAnimatePlayButton] = useState(false);

  const toggleTheme = () => {
    setIsDark(!isDark);
    if (isDark) {
      document.documentElement.classList.remove('dark');
      localStorage.theme = 'light';
    } else {
      document.documentElement.classList.add('dark');
      localStorage.theme = 'dark';
    }
  };

  const handlePlayMusic = () => {
    setIsPlaying(true);
    setAnimatePlayButton(true);
    setTimeout(() => {
      setShowPlayButton(false);
      setAnimatePlayButton(false);
    }, 500); 
  };

  const handleMuteUnmute = () => {
    setIsMuted(prevState => !prevState);
  };

  return (
    <nav className="bg-gray-800 h-12">
      <div className="max-w-7xl mx-auto px-4 h-full flex justify-between items-center">
        <Link to="/">
          <img src="/logo.svg" alt="Logo" className="h-6" />
        </Link>
        
        <div className="flex gap-4 items-center">
          {isLoggedIn ? (
            <>
              <Link 
                to="/admin" 
                className="text-gray-300 hover:text-white transition"
              >
                Admin
              </Link>
              <button
                onClick={onLogout}
                className="text-gray-300 hover:text-white transition"
              >
                Logout
              </button>
            </>
          ) : (
            <Link 
              to="/" 
              className="text-gray-300 hover:text-white transition"
            >
              Login
            </Link>
          )}
        </div>
        <div className="navbar-actions">
          <button
            onClick={toggleTheme}
            className="text-gray-300 hover:text-white transition"
            aria-label="Toggle theme"
          >
            {isDark ? '🌞' : '🌙'}
          </button>
          {showPlayButton ? (
            <button 
              onClick={handlePlayMusic} 
              className={`play-music-button ${animatePlayButton ? 'shoot-off-screen' : ''}`}
              style={{ fontSize: '0.875rem' }} 
            >
              Play Music
            </button>
          ) : (
            <button 
              onClick={handleMuteUnmute} 
              className="text-gray-300 hover:text-white transition"
            >
              <img src={isMuted ? "/soundOff.png" : "/soundOn.png"} alt={isMuted ? "Unmute" : "Mute"} id="soundButton" />
            </button>
          )}
        </div>
      </div>
      <MusicPlayer isPlaying={isPlaying} isMuted={isMuted} />
    </nav>
  );
};

export default Navbar;
