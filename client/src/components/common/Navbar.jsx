import { Link } from "react-router-dom";
import { useState, useEffect } from "react";

const Navbar = ({ isLoggedIn, onLogout }) => {
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
        <Link to="/">
          <img src="/logo.svg" alt="Logo" className="h-6" />
        </Link>
        
        <div className="flex gap-4 items-center">
          <button
            onClick={toggleTheme}
            className="text-gray-300 hover:text-white transition"
            aria-label="Toggle theme"
          >
            {isDark ? '🌞' : '🌙'}
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
