const AccountSettings = ({ user }) => {
  return (
    <div className="min-h-screen py-12 px-4">
      <div className="max-w-md mx-auto bg-white/90 dark:bg-gray-800/90 backdrop-blur-[2px] p-8 rounded-lg shadow-xl">
        <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-6">
          Account Settings
        </h2>

        <div className="space-y-6">
          {/* Display username */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
              Username
            </label>
            <p className="mt-1 text-lg text-gray-900 dark:text-white">
              {user?.username || 'Not available'}
            </p>
          </div>

          {/* Display email */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
              Email
            </label>
            <p className="mt-1 text-lg text-gray-900 dark:text-white">
              {user?.email || 'Not available'}
            </p>
          </div>

          {/* Display account type */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
              Account Type
            </label>
            <p className="mt-1 text-lg text-gray-900 dark:text-white">
              {user?.isAdmin ? 'Administrator' : 'Standard User'}
            </p>
          </div>

          {/* Display member since date */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
              Member Since
            </label>
            <p className="mt-1 text-lg text-gray-900 dark:text-white">
              {user?.createdAt
                ? new Date(user.createdAt).toLocaleString('en-US', {
                    year: 'numeric',
                    month: 'long',
                    day: 'numeric',
                  })
                : 'N/A'}
            </p>
          </div>

          {/* Email Verification Status */}
          <div className="bg-gray-50 dark:bg-gray-700/50 p-4 rounded-lg">
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
              Email Verification Status
            </label>
            <div className="mt-2 flex items-center">
              <div className="flex items-center space-x-2">
                <span
                  className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                    user?.emailVerified
                      ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200'
                      : 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200'
                  }`}
                >
                  {user?.emailVerified ? 'Verified' : 'Unverified'}
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AccountSettings;
