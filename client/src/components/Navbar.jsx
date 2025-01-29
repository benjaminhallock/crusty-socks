import { useState, useEffect } from "react";
import {Link} from "react-router-dom";

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
    <nav className="bg-white-800 p-4">
            <div className="flex justify-between items-center">
                    <div className="font-bold text-xl">
                            <Link to="/">
                                    <img src="/logo.png" alt="Logo" className="h-8" />
                            </Link>
                    </div>
                    {/* <Link to="/admin" className="text-white hover:text-gray-300">
                            Admin
                    </Link> */}
                    <div>
                            {isLoggedIn ? (
                                    <button
                                            onClick={handleLogout}
                                            className="text-white hover:text-gray-300"
                                    >
                                            Logout
                                    </button>
                            ) : (
                                    <a href="/login" className="text-white hover:text-gray-300">
                                            Login
                                    </a>
                            )}
                    </div>
            </div>
    </nav>
);
};

export default Navbar;
