import { useState } from "react";

import { login, register } from "../../services/auth";

// LoginForm component handles user authentication (login and registration)
const LoginForm = ({ onLoginSuccess }) => {
  // State to manage loading status during authentication
  const [isLoading, setIsLoading] = useState(false);
  // State to store error messages
  const [error, setError] = useState("");
  // State to toggle between login and registration modes
  const [isRegister, setIsRegister] = useState(false);
  // State to store form data for email, password, and username
  const [formData, setFormData] = useState({
    email: "",
    password: "",
    username: "",
  });

  // Handle form submission for login or registration
  const handleSubmit = async (e) => {
    e.preventDefault();

    // Validate input fields
    if (
      !formData.email ||
      !formData.password ||
      (isRegister && !formData.username)
    ) {
      setError("Please fill in all required fields");
      return;
    }

    if (isRegister) {
      if (!/^[a-zA-Z0-9]{6,}$/.test(formData.username)) {
        setError(
          "Username must be at least 6 characters and contain only letters and numbers"
        );
        return;
      }
    }

    if (!/^[a-zA-Z0-9]{6,}$/.test(formData.password)) {
      setError(
        "Password must be at least 6 characters and contain only letters and numbers"
      );
      return;
    }

    setIsLoading(true);
    setError("");

    try {
      let res;
      if (isRegister) {
        // Call register service for new user registration
        res = await register(
          formData.email,
          formData.username,
          formData.password
        );
      } else {
        // Call login service for existing user authentication
        res = await login(formData.email, formData.password);
      }
      if (res?.user && res?.token) {
        console.log("Login successful, passing token to onLoginSuccess:", res.token);
        onLoginSuccess({
          user: res.user,
          token: res.token,
        });
      } else {
        setError(res?.message || "Authentication failed");
      }
    } catch (error) {
      setError(error.message || "Authentication failed");
    } finally {
      setIsLoading(false);
    }
  };

  // Toggle between login and registration modes
  const toggleMode = () => {
    setIsRegister(!isRegister);
    setError("");
    setFormData({ email: "", password: "", username: "" });
  };

  return (
    <div className="min-h-screen flex items-center justify-center py-12 px-4">
      <div className="max-w-md w-full space-y-8 bg-white/90 dark:bg-gray-800/90 backdrop-blur-[2px] p-8 rounded-lg shadow-xl">
        <img className="mx-auto h-40 w-auto" src="/logo.svg" alt="Logo" />
        <h2 className="text-center text-3xl font-bold text-gray-900 dark:text-white">
          {isRegister ? "Create an account" : "Sign in"}
        </h2>

        {/* Display error message if any */}
        {error && (
          <div className="bg-red-100 dark:bg-red-900/50 border border-red-400 text-red-700 dark:text-red-200 px-4 py-3 rounded">
            {error}
          </div>
        )}

        {/* Form for login or registration */}
        <form onSubmit={handleSubmit} className="space-y-4">
          <input
            type="email"
            name="email"
            required
            className="w-full px-3 py-2 border rounded bg-white dark:bg-gray-700 text-gray-900 dark:text-white border-gray-300 dark:border-gray-600 focus:ring-2 focus:ring-indigo-500 dark:focus:ring-indigo-400"
            placeholder="Email address"
            value={formData.email}
            onChange={(e) =>
              setFormData((prev) => ({ ...prev, email: e.target.value }))
            }
          />

          {isRegister && (
            <input
              type="text"
              name="username"
              required
              className="w-full px-3 py-2 border rounded bg-white dark:bg-gray-700 text-gray-900 dark:text-white border-gray-300 dark:border-gray-600 focus:ring-2 focus:ring-indigo-500 dark:focus:ring-indigo-400"
              placeholder="Username"
              value={formData.username}
              onChange={(e) =>
                setFormData((prev) => ({ ...prev, username: e.target.value }))
              }
            />
          )}

          <input
            type="password"
            name="password"
            required
            className="w-full px-3 py-2 border rounded bg-white dark:bg-gray-700 text-gray-900 dark:text-white border-gray-300 dark:border-gray-600 focus:ring-2 focus:ring-indigo-500 dark:focus:ring-indigo-400"
            placeholder="Password"
            value={formData.password}
            onChange={(e) =>
              setFormData((prev) => ({ ...prev, password: e.target.value }))
            }
          />

          <button
            type="submit"
            disabled={isLoading}
            className="w-full py-2 px-4 rounded text-white bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 dark:bg-indigo-500 dark:hover:bg-indigo-600"
          >
            {isLoading ? "Loading..." : isRegister ? "Register" : "Sign in"}
          </button>

          <button
            type="button"
            onClick={toggleMode}
            className="w-full text-indigo-600 dark:text-indigo-400 hover:text-indigo-500 dark:hover:text-indigo-300"
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
