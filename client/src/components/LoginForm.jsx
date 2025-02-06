import { useState } from "react";
import { login, register } from "../services/auth";
import { useNavigate } from "react-router-dom";

const LoginForm = ({ onLoginSuccess }) => {
  const navigate = useNavigate();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");
  const [isRegister, setIsRegister] = useState(false);
  const [field, setFormData] = useState({
    email: "",
    password: "",
    username: "",
    confirmPassword: "",
  });

  const inputStyle =
    "appearance-none relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 focus:z-10 sm:text-sm";

  const handleInputChange = (e) => {
    setFormData({ ...field, [e.target.name]: e.target.value });
  };

  const handleLogin = async (e) => {
    e.preventDefault();
    setError("");
    setIsLoading(true);

    try {
      const data = await login(field.email, field.password);
      onLoginSuccess(data);
    } catch (err) {
      setError(err.message || "Login failed. Please check your credentials.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleRegister = async (e) => {
    e.preventDefault();
    setError("");
    setIsLoading(true);

    try {
      if (field.password !== field.confirmPassword) {
        throw new Error("Passwords do not match");
      }
      const data = await register(field.email, field.username, field.password);
      onLoginSuccess(data);
    } catch (err) {
      setError(err.message || "Registration failed. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    if (isRegister) {
      handleRegister(e);
    } else {
      handleLogin(e);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center py-12 px-4">
      <div className="max-w-md w-full space-y-8 bg-white/90 backdrop-blur-[2px] p-8 rounded-lg shadow-xl">
        <img className="mx-auto h-40 w-auto" src="/logo.svg" alt="Logo" />
        <h2 className="text-center text-3xl font-bold text-gray-900">
          {isRegister ? "Create an account" : "Sign in"}
        </h2>

        {isLoading && <div className="text-center">Loading...</div>}

        {error && (
          <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <input
              type="email"
              name="email"
              required
              className={inputStyle}
              placeholder="Email address"
              value={field.email}
              onChange={handleInputChange}
            />

            {isRegister && (
              <input
                type="text"
                name="username"
                required
                className={inputStyle}
                placeholder="Username"
                value={field.username}
                onChange={handleInputChange}
              />
            )}

            <input
              type="password"
              name="password"
              required
              className={inputStyle}
              placeholder="Password"
              value={field.password}
              onChange={handleInputChange}
            />

            {isRegister && (
              <input
                type="password"
                name="confirmPassword"
                required
                className={inputStyle}
                placeholder="Confirm password"
                value={field.confirmPassword}
                onChange={handleInputChange}
              />
            )}
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
            onClick={() => setIsRegister(!isRegister)}
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
