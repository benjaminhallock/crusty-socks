import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { login, register } from "../services/auth";

const LoginForm = ({ onLoginSuccess }) => {
  const navigate = useNavigate();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");
  const [isRegister, setIsRegister] = useState(false);
  const [formData, setFormData] = useState({
    email: "",
    password: "",
    username: "",
  });

  const inputStyle =
    "appearance-none relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 focus:z-10 sm:text-sm";

  const handleInputChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
    setError(""); // Clear error when user types
  };

  const validateForm = () => {
    if (!formData.email || !formData.password) {
      setError("Please fill in all required fields");
      return false;
    }
    
    if (isRegister && !formData.username) {
      setError("Username is required for registration");
      return false;
    }

    return true;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validateForm()) return;

    setIsLoading(true);
    setError("");

    try {
      const response = isRegister
        ? await register(formData.email, formData.username, formData.password)
        : await login(formData.email, formData.password);

      if (response.success) {
        await onLoginSuccess(response);
        // Let the parent component handle navigation via route changes
      } else {
        setError(response.message || "Something went wrong. Please try again.");
      }
    } catch (error) {
      setError(error.message || "Something went wrong. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center py-12 px-4">
      <div className="max-w-md w-full space-y-8 bg-white/90 backdrop-blur-[2px] p-8 rounded-lg shadow-xl">
        <img className="mx-auto h-40 w-auto" src="/logo.svg" alt="Logo" />
        <h2 className="text-center text-3xl font-bold text-gray-900">
          {isRegister ? "Create an account" : "Sign in"}
        </h2>

        {error && (
          <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-4">
            <input
              type="email"
              name="email"
              required
              className={inputStyle}
              placeholder="Email address"
              value={formData.email}
              onChange={handleInputChange}
            />
            
            {isRegister && (
              <input
                type="text"
                name="username"
                required
                className={inputStyle}
                placeholder="Username"
                value={formData.username}
                onChange={handleInputChange}
              />
            )}

            <input
              type="password"
              name="password"
              required
              className={inputStyle}
              placeholder="Password"
              value={formData.password}
              onChange={handleInputChange}
            />
          </div>

          <button
            type="submit"
            disabled={isLoading}
            className="w-full py-2 px-4 border border-transparent rounded-md text-white bg-indigo-600 hover:bg-indigo-700 focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
          >
            {isLoading ? "Loading..." : isRegister ? "Register" : "Sign in"}
          </button>

          <button
            type="button"
            onClick={() => {
              setIsRegister(!isRegister);
              setError("");
              setFormData({ email: "", password: "", username: "" });
            }}
            className="w-full text-indigo-600 hover:text-indigo-500"
          >
            {isRegister
              ? "Already have an account? Sign in"
              : "Need an account? Register"}
          </button>
        </form>
      </div>
    </div>
  );
};

export default LoginForm;
