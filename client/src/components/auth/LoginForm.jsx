import { Transition } from '@headlessui/react';
import { Fragment, useState } from 'react';
import { login, register } from '../../services/api';
import Button from '../common/ui/Button';

const LoginForm = ({ onLoginFunc }) => {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [isRegister, setIsRegister] = useState(false);
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    username: '',
  });

  // Handle form submission for login or registration
  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');

    try {
      // Validate form data
      if (
        !formData.email ||
        !formData.password ||
        (isRegister && !formData.username)
      ) {
        setError('Please fill in all required fields');
        return;
      }

      // Log attempt
      console.log('Attempting', isRegister ? 'registration' : 'login');

      const res = isRegister
        ? await register(formData.email, formData.username, formData.password)
        : await login(formData.email, formData.password);

      // Debug response
      console.log('Auth response:', { ...res, password: '[REDACTED]' });

      if (res.error) {
        setError(res.error);
        return;
      }

      if (!res.token || !res.user) {
        setError('Invalid response from server');
        return;
      }

      // Call login function
      await onLoginFunc({
        user: res.user,
        token: res.token,
      });
    } catch (err) {
      console.error('Login/Register error:', err);
      setError(err.message || 'An unexpected error occurred');
    } finally {
      setIsLoading(false);
    }
  };

  // Toggle between login and registration modes
  const toggleMode = () => {
    setIsRegister(!isRegister);
    setError('');
    setFormData({ email: '', password: '', username: '' });
  };

  return (
    <div className="min-h-screen flex items-center justify-center py-12 px-4">
      <Transition
        as={Fragment}
        enter="transition-all duration-500"
        enterFrom="opacity-0 translate-y-8"
        show={true}
        enterTo="opacity-100 translate-y-0"
        leave="transition-all duration-300"
        leaveFrom="opacity-100"
        leaveTo="opacity-0"
      >
        <div className="w-full max-w-md mx-auto">
          <div className="text-center bg-white/80 dark:bg-gray-800/90 backdrop-blur-lg p-8 rounded-2xl shadow-xl border border-gray-200/50 dark:border-gray-700/50 transform-gpu">
            <img
              className="mx-auto h-auto w-auto transform-gpu hover:scale-[1.02] transition-all duration-300 mb-10 animate-pulse-subtle"
              src="/logo.png"
              alt="Logo"
              style={{
                animation: 'scale 3s ease-in-out infinite',
              }}
            />

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
              <Button
                type="submit"
                variant="primary"
                disabled={isLoading}
                fullWidth="true"
                size="lg"
              >
                {isLoading ? 'Loading...' : isRegister ? 'Register' : 'Sign in'}
              </Button>

              <div className="relative my-4">
                <div className="absolute inset-0 flex items-center">
                  <div className="w-full border-t border-gray-200 dark:border-gray-700"></div>
                </div>
                <div className="relative flex justify-center">
                  <span className="px-4 text-sm text-gray-500 dark:text-gray-400 bg-white dark:bg-gray-800">
                    {isRegister ? 'Already registered?' : 'Need an account?'}
                  </span>
                </div>
              </div>

              <Button
                type="button"
                variant="nav"
                onClick={toggleMode}
                fullWidth="true"
              >
                {isRegister ? 'Sign in' : 'Register'}
              </Button>
            </form>
          </div>
        </div>
      </Transition>
    </div>
  );
};

export default LoginForm;
