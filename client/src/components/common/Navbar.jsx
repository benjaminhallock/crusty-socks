import { useNavigate } from "react-router-dom";
import { useState, useRef, useEffect } from "react";
import {
  FaUser,
  FaSignOutAlt,
  FaSignInAlt,
  FaMusic,
  FaVolumeMute,
  FaUserShield,
  FaSun,
  FaMoon,
  FaTrophy,
  FaCog,
  FaCaretDown,
} from "react-icons/fa";

import Button from "./ui/Button";
import MusicPlayer from "./MusicPlayer";

// Navbar component provides navigation links, user actions, and theme/music controls
const Navbar = ({ isLoggedIn, onLogout, user }) => {
  const navigate = useNavigate();
  // State to manage dark mode
  const [isDark, setIsDark] = useState(false);
  // State to manage music playback
  const [isPlaying, setIsPlaying] = useState(false);
  // State to control the visibility of the play button animation
  const [showPlayButton, setShowPlayButton] = useState(true);
  // State to manage the visibility of the user dropdown menu
  const [showDropdown, setShowDropdown] = useState(false);
  const dropdownRef = useRef(null);
  // Added 'isMuted' state to fix the ReferenceError
  const [isMuted, setIsMuted] = useState(false);

  // Toggle between light and dark themes
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

  // Toggle mute state
  const toggleAudio = () => {
    setIsMuted((prev) => !prev);
    setIsPlaying(!isPlaying);
    if (!isPlaying && showPlayButton) setShowPlayButton(false);
  };

  // Close dropdown menu when clicking outside
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
    <nav className="p-2 mb-10 bg-gradient-to-r from-purple-800 via-purple-500 to-purple-900/50 dark:from-gray-900 dark:via-purple-500 dark:to-indigo-500/50 backdrop-blur-lg shadow-lg rounded-lg">
      <div className="max-w-7xl mx-auto px-4 h-full flex justify-between items-center">
        {/* Logo button navigates to the home page */}
        <button onClick={() => navigate("/")} className="h-8">
          <img src="/logo.svg" alt="Logo" className="h-8" />
        </button>

        <div className="flex gap-2 items-center ml-auto">
          {isLoggedIn ? (
            <>
              {/* Leaderboard button */}
              <Button
                onClick={() => navigate("/leaderboard")}
                className="text-sm flex items-center gap-2"
              >
                <FaTrophy className="h-4 w-4" />
                <span className="hidden sm:inline">Leaderboard</span>
              </Button>

              {/* User Profile button */}
              <Button
                onClick={() => navigate(`/user/${user?.username}`)}
                className="text-sm flex items-center gap-2"
              >
                <FaUser className="h-4 w-4" />
                <span className="hidden sm:inline">{user?.username}</span>
              </Button>

              {/* User dropdown menu */}
              <div className="relative" ref={dropdownRef}>
                <Button
                  onClick={() => setShowDropdown(!showDropdown)}
                  className="text-sm flex items-center gap-2"
                >
                  <FaCaretDown className="h-4 w-4" />
                </Button>

                {showDropdown && (
                  <div className="absolute right-0 mt-2 w-48 rounded-md shadow-lg bg-white dark:bg-gray-800 ring-1 ring-black ring-opacity-5 divide-y divide-gray-100 dark:divide-gray-700 z-50">
                    {/* Account Settings button */}
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

                    {/* Admin Panel button (visible only for admins) */}
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

                    {/* Theme toggle button */}
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

                    {/* Logout button */}
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
            // Login button for non-logged-in users
            <>
              <Button
                onClick={() => navigate("/login")}
                className="text-sm flex items-center gap-2"
              >
                <FaSignInAlt className="h-4 w-4" />
                <span className="hidden sm:inline">Login</span>
              </Button>
              <Button
                onClick={() => navigate("/leaderboard")}
                className="text-sm flex items-center gap-2 bg-purple-500/80 dark:bg-gray-800/50"
              >
                <FaTrophy className="h-4 w-4" />
                <span className="hidden sm:inline">Leaderboard</span>
              </Button>
            </>
          )}

          <Button
            onClick={toggleAudio}
            className="text-sm flex items-center gap-2 bg-purple/80 dark:bg-gray-800/50"
          >
            {isPlaying ? (
              <FaVolumeMute className="h-4 w-4" />
            ) : (
              <FaMusic className="h-4 w-4" />
            )}
          </Button>

          {/* Dark mode toggle for non-logged-in users */}
          {!isLoggedIn && (
            <Button
              onClick={toggleTheme}
              aria-label="Toggle theme"
              className="text-sm flex items-center gap-2 bg-purple/80 dark:bg-gray-800/50"
            >
              {isDark ? (
                <FaSun className="h-4 w-4" />
              ) : (
                <FaMoon className="h-4 w-4" />
              )}
            </Button>
          )}
        </div>
      </div>
      {/* MusicPlayer component for handling music playback */}
      <MusicPlayer isPlaying={isPlaying} isMuted={isMuted} />
    </nav>
  );
};

export default Navbar;
