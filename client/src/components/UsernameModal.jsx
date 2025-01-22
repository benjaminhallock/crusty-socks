import { useState } from 'react';

const UsernameModal = ({ onSubmit }) => {
  const [activeTab, setActiveTab] = useState('guest');
  const [formData, setFormData] = useState({
    username: '',
    email: '',
    password: '',
  });
  const [error, setError] = useState('');

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!formData.username.trim()) {
      setError('Username is required');
      return;
    }
    // For now, just pass the username
    onSubmit(formData.username);
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4">
      <div className="bg-white dark:bg-gray-800 rounded-lg p-6 w-full max-w-md">
        <div className="text-center mb-8">
          <div className="flex items-center justify-center mb-4">
            <svg className="w-10 h-10 text-indigo-600 mr-2" viewBox="0 0 24 24" fill="currentColor">
              <path d="M8.5,3A5.5,5.5 0 0,1 14,8.5V14H8.5A5.5,5.5 0 0,1 3,8.5A5.5,5.5 0 0,1 8.5,3M8.5,5A3.5,3.5 0 0,0 5,8.5A3.5,3.5 0 0,0 8.5,12H12V8.5A3.5,3.5 0 0,0 8.5,5M21,16A3,3 0 0,1 24,19A3,3 0 0,1 21,22A3,3 0 0,1 18,19A3,3 0 0,1 21,16Z"/>
            </svg>
            <h2 className="text-2xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-indigo-600 to-purple-600">
              Welcome to Pixel Party
            </h2>
          </div>
        </div>

        <div className="flex border-b mb-6">
          <button
            className={`flex-1 py-2 text-sm font-medium ${
              activeTab === 'guest'
                ? 'text-indigo-600 border-b-2 border-indigo-600'
                : 'text-gray-500 hover:text-gray-700'
            }`}
            onClick={() => setActiveTab('guest')}
          >
            Play as Guest
          </button>
          <button
            className={`flex-1 py-2 text-sm font-medium ${
              activeTab === 'login'
                ? 'text-indigo-600 border-b-2 border-indigo-600'
                : 'text-gray-500 hover:text-gray-700'
            }`}
            onClick={() => setActiveTab('login')}
          >
            Login
          </button>
          <button
            className={`flex-1 py-2 text-sm font-medium ${
              activeTab === 'signup'
                ? 'text-indigo-600 border-b-2 border-indigo-600'
                : 'text-gray-500 hover:text-gray-700'
            }`}
            onClick={() => setActiveTab('signup')}
          >
            Sign Up
          </button>
        </div>

        {error && (
          <div className="mb-4 text-red-500 text-sm text-center bg-red-50 py-2 rounded">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              {activeTab === 'guest' ? 'Nickname' : 'Username'}
            </label>
            <input
              type="text"
              value={formData.username}
              onChange={(e) => setFormData({ ...formData, username: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
              placeholder={activeTab === 'guest' ? 'Enter a nickname' : 'Choose a username'}
              maxLength={20}
            />
          </div>

          {activeTab !== 'guest' && (
            <>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Email
                </label>
                <input
                  type="email"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                  placeholder="Enter your email"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Password
                </label>
                <input
                  type="password"
                  value={formData.password}
                  onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                  placeholder="Enter your password"
                />
              </div>
            </>
          )}

          <button
            type="submit"
            className="w-full bg-indigo-600 dark:bg-indigo-700 text-white py-2 px-4 rounded-lg hover:bg-indigo-700 dark:hover:bg-indigo-800 transition-colors duration-200"
          >
            {activeTab === 'guest' ? 'Start Playing' : activeTab === 'login' ? 'Login' : 'Sign Up'}
          </button>

          {activeTab === 'guest' && (
            <p className="text-xs text-center text-gray-500 dark:text-gray-400 mt-4">
              Note: Guest accounts are temporary and progress won't be saved
            </p>
          )}
        </form>
      </div>
    </div>
  );
};

export default UsernameModal;
