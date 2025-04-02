import { useState } from 'react';

import Button from '../common/ui/Button';

const AccountSettings = ({ user }) => {
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  return (
    <div className="min-h-screen py-12 px-4">
      <div className="max-w-md mx-auto bg-white/90 dark:bg-gray-800/90 backdrop-blur-[2px] p-8 rounded-lg shadow-xl">
        <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-6">Account Settings</h2>
        
        {error && (
          <div className="bg-red-100 dark:bg-red-900/50 border border-red-400 text-red-700 dark:text-red-200 px-4 py-3 rounded mb-4">
            {error}
          </div>
        )}
        
        {success && (
          <div className="bg-green-100 dark:bg-green-900/50 border border-green-400 text-green-700 dark:text-green-200 px-4 py-3 rounded mb-4">
            {success}
          </div>
        )}

        <div className="space-y-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
              Username
            </label>
            <p className="mt-1 text-lg text-gray-900 dark:text-white">
              {user?.username}
            </p>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
              Email
            </label>
            <p className="mt-1 text-lg text-gray-900 dark:text-white">
              {user?.email}
            </p>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
              Account Type
            </label>
            <p className="mt-1 text-lg text-gray-900 dark:text-white">
              {user?.isAdmin ? "Administrator" : "Standard User"}
            </p>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
              Member Since
            </label>
            <p className="mt-1 text-lg text-gray-900 dark:text-white">
              {user?.createdAt ? new Date(user.createdAt).toLocaleString('en-US', {
                year: 'numeric',
                month: 'long',
                day: 'numeric',
                hour: '2-digit',
                minute: '2-digit'
              }) : 'N/A'}
            </p>
          </div>

          <div className="pt-4 border-t border-gray-200 dark:border-gray-700">
            <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-4">Account Actions</h3>
            
            <div className="space-y-3">
              <Button
                onClick={() => {}} // TODO: Implement password change
                variant="dark"
                className="w-full"
                disabled={isLoading}
              >
                Change Password
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AccountSettings;