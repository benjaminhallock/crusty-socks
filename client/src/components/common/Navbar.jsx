import { useState } from "react";
import { useNavigate } from "react-router-dom";

import Button from "./ui/Button";
import MusicPlayer from "./MusicPlayer";

const Navbar = ({ isLoggedIn, onLogout }) => {
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
    <nav className="bg-white/30 backdrop-blur-md dark:bg-black/30 h-12 transition-colors">
      <div className="max-w-7xl mx-auto px-4 h-full flex justify-between items-center">
        
        <button onClick={() => navigate("/")} variant="dark" className="h-8">
          <img src="/logo.svg" alt="Logo" className="h-8" />
        </button>

        <div className="flex gap-2 items-center ml-auto">
          {isLoggedIn ? (
            <>
              <Button
                onClick={() => navigate("/admin")}
                variant="dark"
                className="text-sm"
              >
                Admin
              </Button>
              <Button
                onClick={onLogout}
                variant="dark"
                className="text-sm"
              >
                Logout
              </Button>
            </>
          ) : (
            <Button
              onClick={() => navigate("/")}
              variant="dark"
              className="text-sm"
            >
              Login
            </Button>
          )}
          <Button
            onClick={toggleTheme}
            variant="dark"
            aria-label="Toggle theme"
            className="text-sm"
          >
            {isDark ? "Light Mode" : "Dark Mode"}
          </Button>
          {showPlayButton ? (
            <Button
              onClick={handlePlayMusic}
              variant="dark"
              className={`text-sm play-music-button ${
                animatePlayButton ? "shoot-off-screen" : ""
              }`}
            >
              Play Music
            </Button>
          ) : (
            <Button
              onClick={handleMuteUnmute}
              variant="dark"
              className="text-sm"
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
