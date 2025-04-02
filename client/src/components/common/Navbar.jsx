import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { FaUser, FaSignOutAlt, FaSignInAlt, FaMusic, FaVolumeMute, FaVolumeUp, FaUserShield, FaSun, FaMoon } from "react-icons/fa";

import Button from "./ui/Button";
import MusicPlayer from "./MusicPlayer";

const Navbar = ({ isLoggedIn, onLogout, user }) => {
  const navigate = useNavigate();
  const [isDark, setIsDark] = useState(false);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const [showPlayButton, setShowPlayButton] = useState(true);
  const [animatePlayButton, setAnimatePlayButton] = useState(false);

  const toggleTheme = () => {
    setIsDark(!isDark);
    if (isDark) {
      document.documentElement.classList.remove("dark");
      localStorage.theme = "light";
    } else {
      document.documentElement.classList.add("dark");
      localStorage.theme = "dark";
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
    setIsMuted((prevState) => !prevState);
  };

  return (
    <nav className="bg-white/30 backdrop-blur-md dark:bg-black/30 h-12 transition-colors border-b border-gray-200 dark:border-gray-800">
      <div className="max-w-7xl mx-auto px-4 h-full flex justify-between items-center">
        
        <button onClick={() => navigate("/")} variant="dark" className="h-8">
          <img src="/logo.svg" alt="Logo" className="h-8" />
        </button>

        <div className="flex gap-2 items-center ml-auto">
          {isLoggedIn ? (
            <>
              <Button
                onClick={() => navigate("/account")}
                variant="light"
                className="text-sm flex items-center gap-2 bg-white/80 dark:bg-gray-800/50"
              >
                <FaUser className="h-4 w-4" />
                <span className="hidden sm:inline">{user?.username}</span>
              </Button>
              {user?.isAdmin && (
                <Button
                  onClick={() => navigate("/admin")}
                  variant="light"
                  className="text-sm flex items-center gap-2 bg-white/80 dark:bg-gray-800/50"
                >
                  <FaUserShield className="h-4 w-4" />
                  <span className="hidden sm:inline">Admin</span>
                </Button>
              )}
              <Button
                onClick={onLogout}
                variant="light"
                className="text-sm flex items-center gap-2 bg-white/80 dark:bg-gray-800/50"
              >
                <FaSignOutAlt className="h-4 w-4" />
                <span className="hidden sm:inline">Logout</span>
              </Button>
            </>
          ) : (
            <Button
              onClick={() => navigate("/")}
              variant="light"
              className="text-sm flex items-center gap-2 bg-white/80 dark:bg-gray-800/50"
            >
              <FaSignInAlt className="h-4 w-4" />
              <span className="hidden sm:inline">Login</span>
            </Button>
          )}
          <Button
            onClick={toggleTheme}
            variant="light"
            aria-label="Toggle theme"
            className="text-sm flex items-center gap-2 bg-white/80 dark:bg-gray-800/50"
          >
            {isDark ? <FaSun className="h-4 w-4" /> : <FaMoon className="h-4 w-4" />}
            <span className="hidden sm:inline">{isDark ? "Light Mode" : "Dark Mode"}</span>
          </Button>
          {showPlayButton ? (
            <Button
              onClick={handlePlayMusic}
              variant="light"
              className={`text-sm flex items-center gap-2 play-music-button bg-white/80 dark:bg-gray-800/50 ${
                animatePlayButton ? "shoot-off-screen" : ""
              }`}
            >
              <FaMusic className="h-4 w-4" />
              <span className="hidden sm:inline">Play Music</span>
            </Button>
          ) : (
            <Button
              onClick={handleMuteUnmute}
              variant="light"
              className="text-sm flex items-center gap-2 bg-white/80 dark:bg-gray-800/50"
            >
              {isMuted ? 
                <FaVolumeMute className="h-4 w-4" /> : 
                <FaVolumeUp className="h-4 w-4" />
              }
              <span className="hidden sm:inline">{isMuted ? "Unmute" : "Mute"}</span>
            </Button>
          )}
        </div>
      </div>
      <MusicPlayer isPlaying={isPlaying} isMuted={isMuted} />
    </nav>
  );
};

export default Navbar;
