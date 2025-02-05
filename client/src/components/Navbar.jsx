import { useState, useEffect } from "react";
import { Link } from "react-router-dom";

const Navbar = ({ isLoggedIn, onLogout }) => {
  const [showMenu, setShowMenu] = useState(false);

  useEffect(() => {
    const closeMenu = () => setShowMenu(false);
    window.addEventListener("click", closeMenu);

    return () => window.removeEventListener("click", closeMenu);
  }, []);

  const handleLogout = () => {
    onLogout();
    setShowMenu(false);
  };

return (
        <nav className="bg-gray-800 h-16 z-50 fixed top-0 left-0 right-0 p-4">
                <div className="flex justify-between items-center">
                        <div className="font-bold text-xl">
                                <Link to="/">
                                        <img src="/logo.png" alt="Logo" className="h-8" />
                                </Link>
                        </div>
                        <div>
                                {isLoggedIn ? (
                                        <button
                                                onClick={handleLogout}
                                                className="text-white hover:text-gray-300"
                                        >
                                                Logout
                                        </button>
                                ) : (
                                        <a href="/" className="text-white hover:text-gray-300">
                                                Login
                                        </a>
                                )}
                        </div>
                </div>
        </nav>
);
};

export default Navbar;
