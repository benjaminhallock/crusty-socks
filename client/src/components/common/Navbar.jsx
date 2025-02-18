import { Link } from "react-router-dom";
import { useState, useEffect } from "react";

const Navbar = ({ isLoggedIn, onLogout, onMuteUnmute, isMuted }) => {
  const [isDark, setIsDark] = useState(false);

  useEffect(() => {
    // Check initial theme
    if (localStorage.theme === 'dark' || (!localStorage.theme && window.matchMedia('(prefers-color-scheme: dark)').matches)) {
      setIsDark(true);
      document.documentElement.classList.add('dark');
    }
  }, []);

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

  return (
    <nav className="bg-gray-800 h-12">
      <div className="max-w-7xl mx-auto px-4 h-full flex justify-between items-center">
        <div className="flex items-center">
          <Link to="/">
            <img src="/logo.svg" alt="Logo" className="h-6" />
          </Link>
        </div>
        <div className="flex items-center space-x-4">
          <button
            onClick={toggleTheme}
            className="text-gray-300 hover:text-white transition"
            aria-label="Toggle theme"
          >
            {isDark ? '🌞' : '🌙'}
          </button>
          <button onClick={onMuteUnmute} className="text-gray-300 hover:text-white transition">
            <img src={isMuted ? "/soundOff.png" : "/soundOn.png"} alt={isMuted ? "Unmute" : "Mute"} id="soundButton" />
          </button>
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
      </div>
    </nav>
  );
};

export default Navbar;
