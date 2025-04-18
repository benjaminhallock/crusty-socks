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

const Navbar = ({ isLoggedIn, onLogout, user }) => {
  // Initialize all hooks at the top level
  const navigate = useNavigate();
  const dropdownRef = useRef(null);
  const [isDark, setIsDark] = useState(() => {
    // Initialize dark mode from localStorage
    return localStorage.theme === "dark";
  });
  const [isPlaying, setIsPlaying] = useState(false);
  const [showDropdown, setShowDropdown] = useState(false);
  const [isMuted, setIsMuted] = useState(false);

  // Toggle between light and dark themes
  const toggleTheme = () => {
    const newDarkMode = !isDark;
    setIsDark(newDarkMode);
    if (newDarkMode) {
      document.documentElement.classList.add("dark");
      localStorage.theme = "dark";
    } else {
      document.documentElement.classList.remove("dark");
      localStorage.theme = "light";
    }
  };

  // Toggle mute state
  const toggleAudio = () => {
    if (!isPlaying) {
      setIsPlaying(true); // Start playing music
    }
    setIsMuted((prev) => !prev); // Toggle mute/unmute
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

  // Check auth status
  useEffect(() => {
    if (!isLoggedIn && !localStorage.getItem("token")) {
      navigate("/");
    }
  }, [isLoggedIn, navigate]);

  return (
    <nav className="fixed top-0 left-0 right-0 z-50">
      <div className="bg-gradient-to-r from-purple-800/70 via-purple-600/70 to-purple-900/70 dark:from-gray-900 dark:via-purple-900 dark:to-indigo-900/90 backdrop-blur-lg shadow-2xl border-b border-white/5">
        <div className="max-w-7xl mx-auto px-4 py-2 flex justify-between items-center">
          <button
            onClick={() => navigate("/")}
            className="relative group h-8 transform hover:scale-105 transition-all duration-300 ease-out hover:brightness-110"
          >
            <img src="/logo.svg" alt="Logo" className="h-8 drop-shadow-lg" />
            <div className="absolute inset-0 bg-white/10 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
          </button>

          <div className="flex items-center gap-3">
            {isLoggedIn ? (
              <>
                <Button
                  onClick={() => navigate("/leaderboard")}
                  className="text-sm flex items-center gap-2.5 bg-purple-500/20 hover:bg-purple-500/30 dark:bg-purple-500/10 dark:hover:bg-purple-500/20 backdrop-blur-sm text-purple-900 dark:text-purple-300 transition-all duration-300 shadow-md hover:shadow-lg border border-purple-200/20 hover:-translate-y-0.5"
                >
                  <FaTrophy className="h-4 w-4 text-purple-700 dark:text-purple-400" />
                  <span className="hidden sm:inline font-medium">
                    Leaderboard
                  </span>
                </Button>

                <Button
                  onClick={() => navigate(`/user/${user?.username}`)}
                  className="text-sm flex items-center gap-2.5 bg-indigo-500/20 hover:bg-indigo-500/30 dark:bg-indigo-500/10 dark:hover:bg-indigo-500/20 backdrop-blur-sm text-indigo-900 dark:text-indigo-300 transition-all duration-300 shadow-md hover:shadow-lg border border-indigo-200/20 hover:-translate-y-0.4"
                >
                  <FaUser className="h-4 w-4 text-indigo-800 dark:text-indigo-400" />
                  <span className="hidden sm:inline font-medium">
                    {user?.username}
                  </span>
                </Button>

                <div className="relative" ref={dropdownRef}>
                  <Button
                    onClick={() => setShowDropdown(!showDropdown)}
                    className="text-sm flex items-center gap-2 bg-white/10 hover:bg-white/20 dark:bg-white/5 dark:hover:bg-white/10 backdrop-blur-sm transition-all duration-300 hover:scale-105"
                  >
                    <FaCaretDown
                      className={`h-4 w-4 text-gray-800 dark:text-white transition-transform duration-300 ${
                        showDropdown ? "rotate-180" : ""
                      }`}
                    />
                  </Button>

                  {showDropdown && (
                    <div className="absolute right-0 mt-2 w-48 rounded-xl overflow-hidden shadow-2xl bg-white/95 dark:bg-gray-800/95 backdrop-blur-lg ring-1 ring-black/5 dark:ring-white/10 divide-y divide-gray-100/20 dark:divide-gray-700/30 z-50 transform origin-top-right transition-all duration-200 animate-fadeIn">
                      <button
                        onClick={() => {
                          navigate("/account");
                          setShowDropdown(false);
                        }}
                        className="w-full text-left px-4 py-3 text-sm text-gray-700 dark:text-gray-200 hover:bg-indigo-50 dark:hover:bg-indigo-500/20 transition-all duration-200 flex items-center gap-3 group"
                      >
                        <FaCog className="h-4 w-4 text-indigo-500 dark:text-indigo-400 group-hover:rotate-90 transition-transform duration-300" />
                        <span className="group-hover:translate-x-0.5 transition-transform duration-150">
                          Account Settings
                        </span>
                      </button>

                      {user?.isAdmin && (
                        <button
                          onClick={() => {
                            navigate("/admin");
                            setShowDropdown(false);
                          }}
                          className="w-full text-left px-4 py-3 text-sm text-gray-700 dark:text-gray-200 hover:bg-indigo-50 dark:hover:bg-indigo-500/20 transition-all duration-200 flex items-center gap-3 group"
                        >
                          <FaUserShield className="h-4 w-4 text-indigo-500 dark:text-indigo-400 group-hover:scale-110 transition-transform duration-200" />
                          <span className="group-hover:translate-x-0.5 transition-transform duration-150">
                            Admin Panel
                          </span>
                        </button>
                      )}

                      <button
                        onClick={() => {
                          toggleTheme();
                          setShowDropdown(false);
                        }}
                        className="w-full text-left px-4 py-3 text-sm text-gray-700 dark:text-gray-200 hover:bg-indigo-50 dark:hover:bg-indigo-500/20 transition-all duration-200 flex items-center gap-3 group"
                      >
                        {isDark ? (
                          <FaSun className="h-4 w-4 text-amber-500 group-hover:rotate-90 transition-transform duration-300" />
                        ) : (
                          <FaMoon className="h-4 w-4 text-indigo-500 group-hover:rotate-90 transition-transform duration-300" />
                        )}
                        <span className="group-hover:translate-x-0.5 transition-transform duration-150">
                          {isDark ? "Light" : "Dark"} Mode
                        </span>
                      </button>

                      <button
                        onClick={() => {
                          onLogout();
                          setShowDropdown(false);
                        }}
                        className="w-full text-left px-4 py-3 text-sm text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-500/10 transition-all duration-200 flex items-center gap-3 group border-t border-red-100/20 dark:border-red-500/20"
                      >
                        <FaSignOutAlt className="h-4 w-4 text-red-500 dark:text-red-400 group-hover:-translate-x-0.5 transition-transform duration-200" />
                        <span className="group-hover:translate-x-0.5 transition-transform duration-150">
                          Logout
                        </span>
                      </button>
                    </div>
                  )}
                </div>
              </>
            ) : (
              <>
                <Button
                  onClick={() => navigate("/login")}
                  className="text-sm flex items-center gap-2.5 bg-gradient-to-r from-indigo-500 to-purple-500 hover:from-indigo-600 hover:to-purple-600 text-white shadow-md hover:shadow-lg transition-all duration-300 hover:-translate-y-0.5 border border-white/10"
                >
                  <FaSignInAlt className="h-4 w-4" />
                  <span className="hidden sm:inline font-medium">Login</span>
                </Button>
                <Button
                  onClick={() => navigate("/leaderboard")}
                  className="text-sm flex items-center gap-2.5 bg-purple-500/20 hover:bg-purple-500/30 dark:bg-purple-500/10 dark:hover:bg-purple-500/20 backdrop-blur-sm text-purple-900 dark:text-purple-300 transition-all duration-200 shadow-md hover:shadow-lg border border-purple-200/20"
                >
                  <FaTrophy className="h-4 w-4 text-purple-700 dark:text-purple-400" />
                  <span className="hidden sm:inline font-medium">
                    Leaderboard
                  </span>
                </Button>
              </>
            )}

            <Button
              onClick={toggleAudio}
              className="text-sm flex items-center gap-2 bg-white/10 hover:bg-white/20 dark:bg-white/5 dark:hover:bg-white/10 backdrop-blur-sm transition-all duration-300 hover:scale-105 relative group"
            >
              {isPlaying && !isMuted ? (
                <FaVolumeMute className="h-4 w-4 text-gray-800 dark:text-white/90 group-hover:text-gray-900 dark:group-hover:text-white transition-colors duration-200" />
              ) : (
                <FaMusic className="h-4 w-4 text-gray-800 dark:text-white/90 group-hover:text-gray-900 dark:group-hover:text-white transition-colors duration-200" />
              )}
              <div className="absolute inset-0 bg-white/5 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
            </Button>

            {!isLoggedIn && (
              <Button
                onClick={toggleTheme}
                aria-label="Toggle theme"
                className="text-sm flex items-center gap-2 bg-white/10 hover:bg-white/20 dark:bg-white/5 dark:hover:bg-white/10 backdrop-blur-sm transition-all duration-300 hover:scale-105 relative group"
              >
                {isDark ? (
                  <FaSun className="h-4 w-4 text-amber-600 dark:text-amber-300 group-hover:text-amber-700 dark:group-hover:text-amber-200 group-hover:rotate-45 transition-all duration-300" />
                ) : (
                  <FaMoon className="h-4 w-4 text-indigo-700 dark:text-indigo-300 group-hover:text-indigo-800 dark:group-hover:text-indigo-200 group-hover:-rotate-45 transition-all duration-300" />
                )}
                <div className="absolute inset-0 bg-white/5 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
              </Button>
            )}
          </div>
        </div>
      </div>
      <MusicPlayer isPlaying={isPlaying} isMuted={isMuted} />
    </nav>
  );
};

export default Navbar;
