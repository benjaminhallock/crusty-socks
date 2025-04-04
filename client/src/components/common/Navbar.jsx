import { useState, useRef, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import {
  FaUser,
  FaSignOutAlt,
  FaSignInAlt,
  FaMusic,
  FaVolumeMute,
  FaVolumeUp,
  FaUserShield,
  FaSun,
  FaMoon,
  FaTrophy,
  FaCog,
  FaCaretDown,
} from "react-icons/fa";

import Button from "./ui/Button";
import MusicPlayer from "./MusicPlayer";

const Navbar = ({ isLoggedIn, onLogout, user }) => {
  const navigate = useNavigate();
  const [isDark, setIsDark] = useState(false);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const [showPlayButton, setShowPlayButton] = useState(true);
  const [animatePlayButton, setAnimatePlayButton] = useState(false);
  const [showDropdown, setShowDropdown] = useState(false);
  const dropdownRef = useRef(null);

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

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setShowDropdown(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  return (
    <nav className="bg-white/30 backdrop-blur-md dark:bg-black/30 h-12 transition-colors border-b border-gray-200 dark:border-gray-800">
      <div className="max-w-7xl mx-auto px-4 h-full flex justify-between items-center">
        <button onClick={() => navigate("/")} variant="dark" className="h-8">
          <img src="/logo.svg" alt="Logo" className="h-8" />
        </button>

        <div className="flex gap-2 items-center ml-auto">
          {isLoggedIn ? (
            <>
              {/* User Profile Link */}
              <Button
                onClick={() => navigate(`/users/profile/${user?.username}`)}
                variant="light"
                className="text-sm flex items-center gap-2 bg-white/80 dark:bg-gray-800/50"
              >
                <FaUser className="h-4 w-4" />
                <span className="hidden sm:inline">{user?.username}</span>
              </Button>

              {/* User dropdown menu */}
              <div className="relative" ref={dropdownRef}>
                <Button
                  onClick={() => setShowDropdown(!showDropdown)}
                  variant="light"
                  className="text-sm flex items-center gap-2 bg-white/80 dark:bg-gray-800/50"
                >
                  <FaCaretDown className="h-4 w-4" />
                </Button>

                {showDropdown && (
                  <div className="absolute right-0 mt-2 w-48 rounded-md shadow-lg bg-white dark:bg-gray-800 ring-1 ring-black ring-opacity-5 divide-y divide-gray-100 dark:divide-gray-700 z-50">
                    <button
                      onClick={() => {
                        navigate("/account");
                        setShowDropdown(false);
                      }}
                      className="w-full text-left px-4 py-2 text-sm text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700 flex items-center gap-2"
                    >
                      <FaCog className="h-4 w-4" />
                      Account Settings
                    </button>

                    {user?.isAdmin && (
                      <button
                        onClick={() => {
                          navigate("/admin");
                          setShowDropdown(false);
                        }}
                        className="w-full text-left px-4 py-2 text-sm text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700 flex items-center gap-2"
                      >
                        <FaUserShield className="h-4 w-4" />
                        Admin Panel
                      </button>
                    )}

                    <button
                      onClick={() => {
                        toggleTheme();
                        setShowDropdown(false);
                      }}
                      className="w-full text-left px-4 py-2 text-sm text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700 flex items-center gap-2"
                    >
                      {isDark ? (
                        <FaSun className="h-4 w-4" />
                      ) : (
                        <FaMoon className="h-4 w-4" />
                      )}
                      {isDark ? "Light" : "Dark"} Mode
                    </button>

                    <button
                      onClick={() => {
                        onLogout();
                        setShowDropdown(false);
                      }}
                      className="w-full text-left px-4 py-2 text-sm text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700 flex items-center gap-2"
                    >
                      <FaSignOutAlt className="h-4 w-4" />
                      Logout
                    </button>
                  </div>
                )}
              </div>
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

          {/* Music Controls - Keep outside dropdown */}
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
              {isMuted ? (
                <FaVolumeMute className="h-4 w-4" />
              ) : (
                <FaVolumeUp className="h-4 w-4" />
              )}
              <span className="hidden sm:inline">
                {isMuted ? "Unmute" : "Mute"}
              </span>
            </Button>
          )}

          {/* Leaderboard button - Keep outside dropdown */}
          <Button
            onClick={() => navigate("/leaderboard")}
            variant="light"
            className="text-sm flex items-center gap-2 bg-white/80 dark:bg-gray-800/50"
          >
            <FaTrophy className="h-4 w-4" />
            <span className="hidden sm:inline">Leaderboard</span>
          </Button>

          {/* Dark mode toggle for non-logged in users */}
          {!isLoggedIn && (
            <Button
              onClick={toggleTheme}
              variant="light"
              aria-label="Toggle theme"
              className="text-sm flex items-center gap-2 bg-white/80 dark:bg-gray-800/50"
            >
              {isDark ? (
                <FaSun className="h-4 w-4" />
              ) : (
                <FaMoon className="h-4 w-4" />
              )}
              <span className="hidden sm:inline">
                {isDark ? "Light" : "Dark"} Mode
              </span>
            </Button>
          )}
        </div>
      </div>
      <MusicPlayer isPlaying={isPlaying} isMuted={isMuted} />
    </nav>
  );
};

export default Navbar;
