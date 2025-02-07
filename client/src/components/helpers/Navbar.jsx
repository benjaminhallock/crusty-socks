import { Link } from "react-router-dom";

const Navbar = ({ isLoggedIn, onLogout }) => (
  <nav className="bg-gray-800 h-16 z-50 fixed top-0 left-0 right-0">
    <div className="max-w-7xl mx-auto px-4 h-full flex justify-between items-center">
      <Link to="/">
        <img src="/logo.svg" alt="Logo" className="h-8" />
      </Link>
      
      <div className="flex gap-4 items-center">
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

export default Navbar;
