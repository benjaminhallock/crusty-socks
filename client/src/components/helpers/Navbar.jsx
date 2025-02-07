import { Link } from "react-router-dom";

const Navbar = ({ isLoggedIn, onLogout }) => {
  return (
    <nav className="bg-gray-800 h-16 z-50 fixed top-0 left-0 right-0 p-4 mb-10">
      <div className="flex justify-between items-center">
        <div className="font-bold text-xl">
          <Link to="/">
            <img src="/logo.svg" alt="Logo" className="h-8" />
          </Link>
        </div>
        <div className="hidden md:flex gap-4">
          {isLoggedIn && (
            <Link to="/admin" className="text-white hover:text-gray-300">
              Admin
            </Link>
          )}
        </div>
        <div className="relative">
          {isLoggedIn ? (
            <button
              onClick={onLogout}
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
