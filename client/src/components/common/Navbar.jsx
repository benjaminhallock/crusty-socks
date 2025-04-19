import { useNavigate } from "react-router-dom";
import { useState, useEffect, useRef } from "react";
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
import { Menu, Transition } from "@headlessui/react";

const Navbar = ({ isLoggedIn, onLogout, user }) => {
  const navigate = useNavigate();
  const [isDark, setIsDark] = useState(() => {
    return localStorage.getItem("theme") === "dark";
  });
  const [isPlaying, setIsPlaying] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const [musicVolume, setMusicVolume] = useState(() => {
    return parseFloat(localStorage.getItem("musicVolume") || "0.5");
  });
  const [sfxVolume, setSfxVolume] = useState(() => {
    return parseFloat(localStorage.getItem("sfxVolume") || "0.5");
  });
  const [showDropdown, setShowDropdown] = useState(false);
  const musicPlayerRef = useRef(null);

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

  const toggleAudio = () => {
    if (!isPlaying) {
      setIsPlaying(true); // Start playing music
      setIsMuted(false); // Ensure music starts unmuted
    } else {
      setIsMuted((prev) => !prev); // Toggle mute/unmute
    }
  };

  // Check auth status
  useEffect(() => {
    if (!isLoggedIn && !localStorage.getItem("token")) {
      navigate("/");
    }
  }, [isLoggedIn, navigate]);

  return (
    <nav className="fixed top-0 left-0 right-0 z-50 my-auto mx-auto w-full bg-blur-sm dark:bg-gray-900/50 shadow-lg">
      <div className="bg-gradient-to-r from-purple-500/70 to-indigo-500/70 dark:from-purple-900/50 dark:via-indigo-700/50 dark:to-indigo-900/90 backdrop-blur-sm border-b border-gray-200/50 dark:border-white/5">
        <div className="max-w-7xl mx-auto px-3 py-1.5 flex justify-between items-center">
          <button
            onClick={() => navigate("/")}
            className="relative group h-7 transform hover:scale-105 transition-all duration-300 ease-out hover:brightness-110"
          >
            <img
              src="/logo.png"
              alt="Logo"
              className="h-8 drop-shadow-lg relative z-10"
            ></img>
            <div className="absolute inset-0 bg-white/10 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
          </button>

          <div className="flex items-center gap-3">
            {isLoggedIn ? (
              <>
                <Button
                  onClick={() => navigate("/leaderboard")}
                  className="text-sm flex items-center gap-2 px-2.5 py-1.5 bg-purple-100 hover:bg-purple-200 dark:bg-purple-500/10 dark:hover:bg-purple-500/20 backdrop-blur-sm text-purple-700 dark:text-purple-300 transition-all duration-200 shadow-sm hover:shadow border border-purple-200 dark:border-purple-200/10"
                >
                  <FaTrophy className="h-3.5 w-3.5 text-purple-600 dark:text-purple-400" />
                  <span className="hidden sm:inline font-medium">
                    Leaderboard
                  </span>
                </Button>

                <Button
                  onClick={() => navigate(`/user/${user?.username}`)}
                  className="text-sm flex items-center gap-2 px-2.5 py-1.5 bg-indigo-100 hover:bg-indigo-200 dark:bg-indigo-500/10 dark:hover:bg-indigo-500/20 backdrop-blur-sm text-indigo-700 dark:text-indigo-300 transition-all duration-200 shadow-sm hover:shadow border border-indigo-200 dark:border-indigo-200/10"
                >
                  <FaUser className="h-4 w-4 text-indigo-800 dark:text-indigo-400" />
                  <span className="hidden sm:inline font-medium">
                    {user?.username}
                  </span>
                </Button>

                <Menu as="div" className="relative">
                  {({ open }) => (
                    <>
                      <Menu.Button
                        as={Button}
                        className="text-sm flex items-center gap-2 px-2 py-1.5 bg-gray-100 hover:bg-gray-200 dark:bg-white/5 dark:hover:bg-white/10 backdrop-blur-sm transition-all duration-200 shadow-sm hover:shadow border border-gray-200 dark:border-white/10"
                      >
                        <FaCaretDown
                          className={`h-3.5 w-3.5 text-gray-700 dark:text-white transition-transform duration-200 ${
                            open ? "rotate-180" : ""
                          }`}
                        />
                      </Menu.Button>

                      <Transition
                        enter="transition ease-out duration-100"
                        enterFrom="transform opacity-0 scale-95"
                        enterTo="transform opacity-100 scale-100"
                        leave="transition ease-in duration-75"
                        leaveFrom="transform opacity-100 scale-100"
                        leaveTo="transform opacity-0 scale-95"
                      >
                        <Menu.Items className="absolute right-0 mt-1 w-48 rounded-lg overflow-hidden shadow-lg bg-white dark:bg-gray-800 ring-1 ring-black/5 dark:ring-white/10 divide-y divide-gray-100 dark:divide-gray-700 z-50 focus:outline-none">
                          <div className="px-1 py-1">
                            <Menu.Item>
                              {({ active }) => (
                                <button
                                  onClick={() => navigate("/account")}
                                  className={`${
                                    active
                                      ? "bg-indigo-100 dark:bg-indigo-500/20"
                                      : ""
                                  } w-full text-left px-4 py-3 text-sm text-gray-700 dark:text-gray-200 flex items-center gap-3`}
                                >
                                  <FaCog className="h-4 w-4 text-indigo-500 dark:text-indigo-400" />
                                  Account Settings
                                </button>
                              )}
                            </Menu.Item>

                            {user?.isAdmin && (
                              <Menu.Item>
                                {({ active }) => (
                                  <button
                                    onClick={() => navigate("/admin")}
                                    className={`${
                                      active
                                        ? "bg-indigo-100 dark:bg-indigo-500/20"
                                        : ""
                                    } w-full text-left px-4 py-3 text-sm text-gray-700 dark:text-gray-200 flex items-center gap-3`}
                                  >
                                    <FaUserShield className="h-4 w-4 text-indigo-500 dark:text-indigo-400" />
                                    Admin Panel
                                  </button>
                                )}
                              </Menu.Item>
                            )}

                            <Menu.Item>
                              {({ active }) => (
                                <button
                                  onClick={() => toggleTheme()}
                                  className={`${
                                    active
                                      ? "bg-indigo-100 dark:bg-indigo-500/20"
                                      : ""
                                  } w-full text-left px-4 py-3 text-sm text-gray-700 dark:text-gray-200 flex items-center gap-3`}
                                >
                                  {isDark ? (
                                    <FaSun className="h-4 w-4 text-amber-500 dark:text-amber-400" />
                                  ) : (
                                    <FaMoon className="h-4 w-4 text-indigo-500 dark:text-indigo-400" />
                                  )}
                                  {isDark ? "Light" : "Dark"} Mode
                                </button>
                              )}
                            </Menu.Item>

                            <Menu.Item>
                              {({ active }) => (
                                <button
                                  onClick={() => onLogout()}
                                  className={`${
                                    active
                                      ? "bg-red-100 dark:bg-red-500/10"
                                      : ""
                                  } w-full text-left px-4 py-3 text-sm text-red-600 dark:text-red-400 flex items-center gap-3 border-t border-red-100/20 dark:border-red-500/20`}
                                >
                                  <FaSignOutAlt className="h-4 w-4 text-red-500 dark:text-red-400" />
                                  Logout
                                </button>
                              )}
                            </Menu.Item>
                          </div>
                        </Menu.Items>
                      </Transition>
                    </>
                  )}
                </Menu>
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

            <Menu as="div" className="relative">
              {({ open }) => (
                <>
                  <Menu.Button
                    as={Button}
                    className={`text-sm flex items-center gap-2 bg-white/10 hover:bg-white/20 dark:bg-white/5 dark:hover:bg-white/10 backdrop-blur-sm transition-all duration-300 hover:scale-105 relative group ${
                      isPlaying && !isMuted ? "ring-2 ring-indigo-500" : ""
                    }`}
                  >
                    {isPlaying && !isMuted ? (
                      <FaVolumeMute className="h-3.5 w-3.5 text-gray-700 dark:text-white/90 transition-colors duration-200" />
                    ) : (
                      <FaMusic className="h-3.5 w-3.5 text-gray-700 dark:text-white/90 transition-colors duration-200" />
                    )}
                  </Menu.Button>

                  <Transition
                    show={open}
                    enter="transition ease-out duration-100"
                    enterFrom="transform opacity-0 scale-95"
                    enterTo="transform opacity-100 scale-100"
                    leave="transition ease-in duration-75"
                    leaveFrom="transform opacity-100 scale-100"
                    leaveTo="transform opacity-0 scale-95"
                  >
                    <Menu.Items className="absolute right-0 mt-2 w-64 rounded-lg overflow-hidden shadow-lg bg-white dark:bg-gray-800 ring-1 ring-black/5 dark:ring-white/10 focus:outline-none z-50">
                      <div className="p-4 space-y-4">
                        <div>
                          <div className="flex items-center justify-between mb-2">
                            <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
                              Music Volume
                            </label>
                            <button
                              onClick={toggleAudio}
                              className="text-xs text-indigo-600 dark:text-indigo-400 hover:text-indigo-700"
                            >
                              {isPlaying ? "Pause" : "Play"}
                            </button>
                          </div>
                          <input
                            type="range"
                            min="0"
                            max="1"
                            step="0.01"
                            value={musicVolume}
                            onChange={(e) => {
                              const value = e.target.value;
                              setMusicVolume(value);
                              localStorage.setItem("musicVolume", value);
                            }}
                            className="w-full accent-indigo-600 dark:accent-indigo-400"
                          />
                        </div>

                        <div>
                          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                            Sound Effects
                          </label>
                          <input
                            type="range"
                            min="0"
                            max="1"
                            step="0.01"
                            value={sfxVolume}
                            onChange={(e) => {
                              const value = e.target.value;
                              setSfxVolume(value);
                              localStorage.setItem("sfxVolume", value);
                              if (musicPlayerRef.current) {
                                musicPlayerRef.current.playTestSound();
                              }
                            }}
                            className="w-full accent-indigo-600 dark:accent-indigo-400"
                          />
                        </div>
                      </div>
                    </Menu.Items>
                  </Transition>
                </>
              )}
            </Menu>

            {!isLoggedIn && (
              <Button
                onClick={toggleTheme}
                aria-label="Toggle theme"
                className="group text-sm flex items-center gap-2 px-2 py-1.5 bg-gray-100 hover:bg-gray-200 dark:bg-white/5 dark:hover:bg-white/10 backdrop-blur-sm transition-all duration-200 shadow-sm hover:shadow border border-gray-200 dark:border-white/10"
              >
                {isDark ? (
                  <FaSun className="h-4 w-4 text-amber-500 dark:text-amber-400 group-hover:text-amber-600 dark:group-hover:text-amber-300 group-hover:rotate-90 transition-all duration-300" />
                ) : (
                  <FaMoon className="h-4 w-4 text-indigo-500 dark:text-indigo-400 group-hover:text-indigo-600 dark:group-hover:text-indigo-300 group-hover:rotate-[-90deg] transition-all duration-300" />
                )}
              </Button>
            )}
          </div>
        </div>
      </div>
      <MusicPlayer
        ref={musicPlayerRef}
        id="musicPlayer"
        isPlaying={isPlaying}
        isMuted={isMuted}
        musicVolume={musicVolume}
        sfxVolume={sfxVolume}
      />
    </nav>
  );
};

export default Navbar;
