import { useNavigate } from 'react-router-dom';
import { useState, useEffect, useRef } from 'react';
import {
  FaUser,
  FaSignOutAlt,
  FaSignInAlt,
  FaMusic,
  FaUserShield,
  FaSun,
  FaMoon,
  FaTrophy,
  FaCog,
  FaCaretDown,
} from 'react-icons/fa';
import Button from './ui/Button';
import MusicPlayer from './MusicPlayer';
import { Menu, Transition } from '@headlessui/react';

const Navbar = ({ isLoggedIn, onLogout, user }) => {
  const navigate = useNavigate();
  // Combine related state into a settings object
  const [settings, setSettings] = useState({
    isDark: document.documentElement.classList.contains('dark'),
    isPlaying: false,
    musicVolume: parseFloat(localStorage.getItem("musicVolume") || "0.5"),
    sfxVolume: parseFloat(localStorage.getItem("sfxVolume") || "0.5"),
    isPopupOpen: false,
  });
  const musicPlayerRef = useRef(null);

  // Improved theme toggle that works directly with DOM
  const toggleTheme = () => {
    const isDarkMode = document.documentElement.classList.contains("dark");
    document.documentElement.classList.toggle("dark", !isDarkMode);
    localStorage.theme = isDarkMode ? "light" : "dark";

    // Update state after DOM changes
    setSettings((prev) => ({ ...prev, isDark: !isDarkMode }));
  };

 
  const updateSetting = (key, value) => {
    setSettings((prev) => ({ ...prev, [key]: value })); // spreading previous state so only the desired prop changes
    // prev is shallow copy

    // Handle side effects
    if (key.includes('Volume')) {
      localStorage.setItem(key, value);
    }
  };

  const handleMusicButtonClick = () => {
    if (!settings.isPlaying) {
      updateSetting('isPlaying', true);
    }
    updateSetting("isPopupOpen", !settings.isPopupOpen);
  };

  // Check auth status
  useEffect(() => {
    if (!isLoggedIn && !localStorage.getItem("token")) {
      navigate("/");
    }
  }, [isLoggedIn, navigate]);

  // Set initial theme based on localStorage or system preference on component mount
  useEffect(() => {
    const theme = localStorage.getItem("theme");
    const systemPrefersDark = window.matchMedia(
      "(prefers-color-scheme: dark)"
    ).matches;

    if (theme === 'dark' || (!theme && systemPrefersDark)) {
      document.documentElement.classList.add('dark');
      setSettings((prev) => ({ ...prev, isDark: true }));
    } else {
      document.documentElement.classList.remove('dark');
      setSettings((prev) => ({ ...prev, isDark: false }));
    }
  }, []);

  return (
    <div className="relative z-50">
      <nav className="w-full bg-gradient-to-r from-purple-600 to-indigo-600 dark:from-purple-800 dark:to-indigo-900 backdrop-blur-xl shadow-lg">
        <div className="border-b border-white/10 dark:border-white/5">
          <div className="max-w-7xl mx-auto px-3 py-1.5 flex justify-between items-center">
            {/* Logo */}
            <button
              onClick={() => navigate('/')}
              className="relative group h-7 transform hover:scale-105 transition-all duration-300 ease-out hover:brightness-110"
            >
              <img
                src="/logo.png"
                alt="Logo"
                className="h-8 drop-shadow-lg relative z-10"
              />
              <div className="absolute inset-0 bg-white/10 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
            </button>

            
            <div className="flex items-center gap-3">
              {isLoggedIn ? ( // are you logged in or not: display different buttons
                <>
                  <Button
                    onClick={() => navigate('/leaderboard')}
                    className="text-sm h-8 flex items-center gap-1.5 px-2.5 py-0 bg-purple-100 hover:bg-purple-200 dark:bg-purple-500/10 dark:hover:bg-purple-500/20 backdrop-blur-sm text-purple-700 dark:text-purple-300 transition-all duration-200 shadow-sm hover:shadow border border-purple-200 dark:border-purple-200/10"
                  >
                    <FaTrophy className="inline-block align-middle mr-1 h-3 w-3 text-purple-600 dark:text-purple-400" />
                    <span className="hidden sm:inline font-medium">
                      Leaderboard
                    </span>
                  </Button>

                  <Button
                    onClick={() => navigate(`/user/${user?.username}`)}
                    className="text-sm h-8 flex items-center gap-1.5 px-2.5 py-0 bg-indigo-100 hover:bg-indigo-200 dark:bg-indigo-500/10 dark:hover:bg-indigo-500/20 backdrop-blur-sm text-indigo-700 dark:text-indigo-300 transition-all duration-200 shadow-sm hover:shadow border border-indigo-200 dark:border-indigo-200/10"
                  >
                    <FaUser className="inline-block align-middle mr-1 h-3 w-3 text-indigo-800 dark:text-indigo-400" />
                    <span className="hidden sm:inline font-medium">
                      {user?.username}
                    </span>
                  </Button>

                  <div className="relative z-50">
                    <Menu as="div" className="relative">
                      {({ open }) => (
                        <>
                          <Menu.Button
                            as={Button}
                            className="text-sm h-8 flex items-center gap-1.5 px-2 py-0 bg-gray-100 hover:bg-gray-200 dark:bg-white/5 dark:hover:bg-white/10 backdrop-blur-sm transition-all duration-200 shadow-sm hover:shadow border border-gray-200 dark:border-white/10"
                          >
                            <FaCaretDown
                              className={`h-3 w-3 text-gray-700 dark:text-white transition-transform duration-200 ${open ? 'rotate-180' : ''}`}
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
                            <Menu.Items className="fixed z-[100] right-0 mt-1 w-48 rounded-lg overflow-hidden shadow-lg bg-white dark:bg-gray-800 ring-1 ring-black/5 dark:ring-white/10 divide-y divide-gray-100 dark:divide-gray-700 focus:outline-none">
                              <div className="px-1 py-1">
                                <Menu.Item>
                                  {({ active }) => (
                                    <button
                                      onClick={() => navigate('/account')}
                                      className={`${active ? 'bg-indigo-100 dark:bg-indigo-500/20' : ''} w-full text-left px-4 py-3 text-sm text-gray-700 dark:text-gray-200 flex items-center gap-3`}
                                    >
                                      <FaCog className="inline-block mr-1 h-3.5 w-3.5 text-indigo-500 dark:text-indigo-400" />
                                      Account Settings
                                    </button>
                                  )}
                                </Menu.Item>

                                {user?.isAdmin && (
                                  <Menu.Item>
                                    {({ active }) => (
                                      <button
                                        onClick={() => navigate('/admin')}
                                        className={`${active ? 'bg-indigo-100 dark:bg-indigo-500/20' : ''} w-full text-left px-4 py-3 text-sm text-gray-700 dark:text-gray-200 flex items-center gap-3`}
                                      >
                                        <FaUserShield className="inline-block mr-1 h-3.5 w-3.5 text-indigo-500 dark:text-indigo-400" />
                                        Admin Panel
                                      </button>
                                    )}
                                  </Menu.Item>
                                )}

                                <Menu.Item>
                                  {({ active }) => (
                                    <button
                                      onClick={() => toggleTheme()}
                                      className={`${active ? 'bg-indigo-100 dark:bg-indigo-500/20' : ''} w-full text-left px-4 py-3 text-sm text-gray-700 dark:text-gray-200 flex items-center gap-3`}
                                    >
                                      {settings.isDark ? (
                                        <FaSun className="inline-block mr-1 h-3.5 w-3.5 text-amber-500 dark:text-amber-400" />
                                      ) : (
                                        <FaMoon className="inline-block mr-1 h-3.5 w-3.5 text-indigo-500 dark:text-indigo-400" />
                                      )}
                                      {settings.isDark ? 'Light' : 'Dark'} Mode
                                    </button>
                                  )}
                                </Menu.Item>

                                <Menu.Item>
                                  {({ active }) => (
                                    <button
                                      onClick={() => onLogout()}
                                      className={`${active ? 'bg-red-100 dark:bg-red-500/10' : ''} w-full text-left px-4 py-3 text-sm text-red-600 dark:text-red-400 flex items-center gap-3 border-t border-red-100/20 dark:border-red-500/20`}
                                    >
                                      <FaSignOutAlt className="inline-block mr-1 h-3.5 w-3.5 text-red-500 dark:text-red-400" />
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
                  </div>
                </>
              ) : (
                <>
                  <Button
                    onClick={() => navigate('/login')}
                    className="text-sm h-8 flex items-center gap-1.5 px-3 py-0 bg-gradient-to-r from-indigo-500 to-purple-500 hover:from-indigo-600 hover:to-purple-600 text-white shadow-md hover:shadow-lg transition-all duration-300 hover:-translate-y-0.5 border border-white/10"
                  >
                    <FaSignInAlt className="inline-block mr-1 h-3 w-3" />
                    <span className="hidden sm:inline font-medium">Login</span>
                  </Button>
                  <Button
                    onClick={() => navigate('/leaderboard')}
                    className="text-sm h-8 flex items-center gap-1.5 px-3 py-0 bg-purple-500/20 hover:bg-purple-500/30 dark:bg-purple-500/10 dark:hover:bg-purple-500/20 backdrop-blur-sm text-purple-900 dark:text-purple-300 transition-all duration-200 shadow-md hover:shadow-lg border border-purple-200/20"
                  >
                    <FaTrophy className="inline-block mr-1 h-3 w-3 text-purple-700 dark:text-purple-400" />
                    <span className="hidden sm:inline font-medium">
                      Leaderboard
                    </span>
                  </Button>
                </>
              )}

              <div className="relative z-50">
                <Menu as="div" className="relative">
                  {({ open }) => ( // change music button style for when popup is open
                    <>
                      <Menu.Button
                        as={Button}
                        onClick={handleMusicButtonClick}
                        className={`text-sm h-8 flex items-center justify-center gap-1.5 px-2 py-0 bg-white/10 hover:bg-white/20 dark:bg-white/5 dark:hover:bg-white/10 backdrop-blur-sm transition-all duration-300 hover:scale-105 relative group ${
                          settings.isPlaying ? 'ring-2 ring-indigo-500' : ''
                        }`}
                      >
                        <FaMusic className="h-3 w-3 text-gray-700 dark:text-white/90 transition-colors duration-200" />
                      </Menu.Button>

                      <Transition
                        show={settings.isPopupOpen}
                        enter="transition ease-out duration-100"
                        enterFrom="transform opacity-0 scale-95"
                        enterTo="transform opacity-100 scale-100"
                        leave="transition ease-in duration-75"
                        leaveFrom="transform opacity-100 scale-100"
                        leaveTo="transform opacity-0 scale-95"
                      >
                        <Menu.Items
                          static
                          className="absolute z-[100] right-0 mt-2 w-64 rounded-lg overflow-hidden shadow-lg bg-white dark:bg-gray-800 ring-1 ring-black/5 dark:ring-white/10 focus:outline-none"
                        >
                          <div className="p-4 space-y-4">
                            <div className="flex items-center justify-between mb-2">
                              <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
                                Music Volume
                              </label>
                            </div>
                            <input
                              type="range" 
                              min="0"
                              max="1"
                              step="0.01"
                              value={settings.musicVolume}
                              onChange={(e) =>
                                updateSetting('musicVolume', e.target.value)
                              }
                              className="w-full accent-indigo-600 dark:accent-indigo-400"
                            />
                            <div>
                              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                                Sound Effects
                              </label>
                              <input 
                                type="range" 
                                min="0"
                                max="1"
                                step="0.01"
                                value={settings.sfxVolume}
                                onChange={(e) => {
                                  const value = e.target.value;
                                  updateSetting('sfxVolume', value);
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
              </div>

              {!isLoggedIn && (
                <Button
                  onClick={toggleTheme}
                  aria-label="Toggle theme"
                  className="h-8 group text-sm flex items-center justify-center gap-1.5 px-2 py-0 bg-gray-100 hover:bg-gray-200 dark:bg-white/5 dark:hover:bg-white/10 backdrop-blur-sm transition-all duration-200 shadow-sm hover:shadow border border-gray-200 dark:border-white/10"
                >
                  {document.documentElement.classList.contains('dark') ? (
                    <FaSun className="h-3 w-3 text-amber-500 dark:text-amber-400 group-hover:text-amber-600 dark:group-hover:text-amber-300 group-hover:rotate-90 transition-all duration-300" />
                  ) : (
                    <FaMoon className="h-3 w-3 text-indigo-500 dark:text-indigo-400 group-hover:text-indigo-600 dark:group-hover:text-indigo-300 group-hover:rotate-[-90deg] transition-all duration-300" />
                  )}
                </Button>
              )}
            </div>
          </div>
        </div>
        <MusicPlayer
          ref={musicPlayerRef}
          id="musicPlayer"
          isPlaying={settings.isPlaying}
          musicVolume={settings.musicVolume}
          sfxVolume={settings.sfxVolume}
          // isPlaying, musicVolume, and sfxVolume will be passed down to child (MusicPlayer)
        />
      </nav>
    </div>
  );
};

export default Navbar;
