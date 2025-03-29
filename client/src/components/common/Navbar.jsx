import { useState } from "react";
import { useNavigate } from "react-router-dom";

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
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M10 9a3 3 0 100-6 3 3 0 000 6zm-7 9a7 7 0 1114 0H3z" clipRule="evenodd" />
                </svg>
                {user?.username}
              </Button>
              <Button
                onClick={() => navigate("/admin")}
                variant="light"
                className="text-sm bg-white/80 dark:bg-gray-800/50"
              >
                Admin
              </Button>
              <Button
                onClick={onLogout}
                variant="light"
                className="text-sm bg-white/80 dark:bg-gray-800/50"
              >
                Logout
              </Button>
            </>
          ) : (
            <Button
              onClick={() => navigate("/")}
              variant="light"
              className="text-sm bg-white/80 dark:bg-gray-800/50"
            >
              Login
            </Button>
          )}
          <Button
            onClick={toggleTheme}
            variant="light"
            aria-label="Toggle theme"
            className="text-sm bg-white/80 dark:bg-gray-800/50"
          >
            {isDark ? "Light Mode" : "Dark Mode"}
          </Button>
          {showPlayButton ? (
            <Button
              onClick={handlePlayMusic}
              variant="light"
              className={`text-sm play-music-button bg-white/80 dark:bg-gray-800/50 ${
                animatePlayButton ? "shoot-off-screen" : ""
              }`}
            >
              Play Music
            </Button>
          ) : (
            <Button
              onClick={handleMuteUnmute}
              variant="light"
              className="text-sm bg-white/80 dark:bg-gray-800/50"
            >
              <img 
                src={isMuted ? "/soundOff.png" : "/soundOn.png"} 
                alt={isMuted ? "Muted" : "Unmuted"}
                className="h-6 w-6 mr-1 inline"
              />
              {isMuted ? "Unmute" : "Mute"}
            </Button>
          )}
        </div>
      </div>
      <MusicPlayer isPlaying={isPlaying} isMuted={isMuted} />
    </nav>
  );
};

export default Navbar;
