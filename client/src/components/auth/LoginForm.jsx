import { useState, Fragment } from "react";
import { Transition } from "@headlessui/react";
import { login, register } from "../../services/api";

const LoginForm = ({ onLoginSuccess }) => {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");
  const [isRegister, setIsRegister] = useState(false);
  const [isShowing, setIsShowing] = useState(false);
  const [formData, setFormData] = useState({
    email: "",
    password: "",
    username: "",
  });

  // Show transition on mount
  useState(() => {
    setIsShowing(true);
  }, []);

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
        // Passes a username or email to the login function
        res = await login(formData.email, formData.password);
      }
      if (res?.user && res?.token) {
        console.log(
          "Login successful, passing token to onLoginSuccess:",
          res.token
        );
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
      <Transition
        as={Fragment}
        show={isShowing}
        enter="transition-all duration-500"
        enterFrom="opacity-0 translate-y-8"
        enterTo="opacity-100 translate-y-0"
        leave="transition-all duration-300"
        leaveFrom="opacity-100"
        leaveTo="opacity-0"
      >
        <div className="w-full max-w-md mx-auto">
          <div className="text-center bg-white/90 dark:bg-gray-800/90 backdrop-blur-lg p-8 rounded-2xl shadow-xl border border-gray-200/50 dark:border-gray-700/50 transform-gpu">
            <img
              className="mx-auto h-40 w-auto transform-gpu hover:scale-[1.02] transition-all duration-300"
              src="/logo.svg"
              alt="Logo"
            />
            <h2 className="text-3xl font-bold mb-8 bg-gradient-to-r from-purple-600 to-indigo-600 dark:from-purple-400 dark:to-indigo-400 bg-clip-text text-transparent">
              {isRegister ? "Create an account" : "Sign in"}
            </h2>

            <Transition
              show={!!error}
              enter="transition-opacity duration-300"
              enterFrom="opacity-0"
              enterTo="opacity-100"
              leave="transition-opacity duration-200"
              leaveFrom="opacity-100"
              leaveTo="opacity-0"
              className="mt-6"
            >
              <div className="bg-red-100/80 dark:bg-red-900/30 border border-red-200 dark:border-red-800/50 text-red-600 dark:text-red-400 px-4 py-3 rounded-lg backdrop-blur-sm">
                {error}
              </div>
            </Transition>

            <form onSubmit={handleSubmit} className="space-y-4 mt-8">
              {isRegister ? (
                <>
                  <input
                    type="email"
                    name="email"
                    required
                    className="w-full px-4 py-3 rounded-xl border border-gray-200 dark:border-gray-700 
                      bg-white dark:bg-gray-900/50 
                      text-gray-800 dark:text-gray-200
                      placeholder-gray-400 dark:placeholder-gray-500
                      focus:outline-none focus:ring-2 focus:ring-purple-500 dark:focus:ring-purple-400
                      transition-all duration-200"
                    placeholder="Email address"
                    value={formData.email}
                    onChange={(e) =>
                      setFormData((prev) => ({
                        ...prev,
                        email: e.target.value,
                      }))
                    }
                  />
                  <input
                    type="text"
                    name="username"
                    required
                    className="w-full px-4 py-3 rounded-xl border border-gray-200 dark:border-gray-700 
                      bg-white dark:bg-gray-900/50 
                      text-gray-800 dark:text-gray-200
                      placeholder-gray-400 dark:placeholder-gray-500
                      focus:outline-none focus:ring-2 focus:ring-purple-500 dark:focus:ring-purple-400
                      transition-all duration-200"
                    placeholder="Username"
                    value={formData.username}
                    onChange={(e) =>
                      setFormData((prev) => ({
                        ...prev,
                        username: e.target.value,
                      }))
                    }
                  />
                </>
              ) : (
                <input
                  type="text"
                  name="emailOrUsername"
                  required
                  className="w-full px-4 py-3 rounded-xl border border-gray-200 dark:border-gray-700 
                    bg-white dark:bg-gray-900/50 
                    text-gray-800 dark:text-gray-200
                    placeholder-gray-400 dark:placeholder-gray-500
                    focus:outline-none focus:ring-2 focus:ring-purple-500 dark:focus:ring-purple-400
                    transition-all duration-200"
                  placeholder="Email or Username"
                  value={formData.email}
                  onChange={(e) =>
                    setFormData((prev) => ({ ...prev, email: e.target.value }))
                  }
                />
              )}
              <input
                type="password"
                name="password"
                required
                className="w-full px-4 py-3 rounded-xl border border-gray-200 dark:border-gray-700 
                  bg-white dark:bg-gray-900/50 
                  text-gray-800 dark:text-gray-200
                  placeholder-gray-400 dark:placeholder-gray-500
                  focus:outline-none focus:ring-2 focus:ring-purple-500 dark:focus:ring-purple-400
                  transition-all duration-200"
                placeholder="Password"
                value={formData.password}
                onChange={(e) =>
                  setFormData((prev) => ({ ...prev, password: e.target.value }))
                }
              />
              <button
                type="submit"
                disabled={isLoading}
                className={`w-full py-3 rounded-xl text-white transition-all duration-200 transform-gpu hover:scale-[1.02] ${
                  isLoading
                    ? "bg-gray-400 dark:bg-gray-600 cursor-not-allowed"
                    : "bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 dark:from-purple-500 dark:to-indigo-500"
                }`}
              >
                {isLoading ? "Loading..." : isRegister ? "Register" : "Sign in"}
              </button>

              <div className="relative my-4">
                <div className="absolute inset-0 flex items-center">
                  <div className="w-full border-t border-gray-200 dark:border-gray-700"></div>
                </div>
                <div className="relative flex justify-center">
                  <span className="px-4 text-sm text-gray-500 dark:text-gray-400 bg-white dark:bg-gray-800">
                    {isRegister ? "Already registered?" : "Need an account?"}
                  </span>
                </div>
              </div>

              <button
                type="button"
                onClick={toggleMode}
                className="w-full py-3 px-4 rounded-xl text-gray-700 dark:text-gray-300 bg-gray-100 dark:bg-gray-700/50 hover:bg-gray-200 dark:hover:bg-gray-600/50 transition-all duration-200 transform-gpu hover:scale-[1.02]"
              >
                {isRegister ? "Sign in instead" : "Register instead"}
              </button>
            </form>
          </div>
        </div>
      </Transition>
    </div>
  );
};

export default LoginForm;
