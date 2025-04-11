import { useState } from 'react'
import Button from '../common/ui/Button'
import Modal from '../common/ui/Modal'
import {
  verifyEmail,
  changePassword,
  changeEmail,
  updateUserPreferences,
  deleteAccount,
} from '../../services/api'

const AccountSettings = ({ user, updateUser }) => {
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const [isLoading, setIsLoading] = useState(false)

  // Modal states
  const [showPasswordModal, setShowPasswordModal] = useState(false)
  const [showEmailModal, setShowEmailModal] = useState(false)
  const [showDeleteModal, setShowDeleteModal] = useState(false)

  // Form states
  const [passwordForm, setPasswordForm] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: '',
  })
  const [emailForm, setEmailForm] = useState({
    newEmail: '',
    password: '',
  })

  // User preferences
  const [preferences, setPreferences] = useState({
    profanityFilter: user?.preferences?.profanityFilter ?? true,
    emailNotifications: user?.preferences?.emailNotifications ?? true,
    showOnlineStatus: user?.preferences?.showOnlineStatus ?? true,
  })

  const handleVerifyEmail = async () => {
    try {
      setIsLoading(true)
      setError('')
      const result = await verifyEmail()
      if (result.success) {
        setSuccess('Verification email sent! Please check your inbox.')
      } else {
        setError(result.error || 'Failed to send verification email')
      }
    } catch (err) {
      setError('An error occurred while sending verification email')
    } finally {
      setIsLoading(false)
    }
  }

  const handlePasswordChange = async (e) => {
    e.preventDefault()
    if (passwordForm.newPassword !== passwordForm.confirmPassword) {
      setError('Passwords do not match')
      return
    }

    try {
      setIsLoading(true)
      const result = await changePassword(passwordForm)
      if (result.success) {
        setSuccess('Password updated successfully')
        setShowPasswordModal(false)
        setPasswordForm({ currentPassword: '', newPassword: '', confirmPassword: '' })
      } else {
        setError(result.error || 'Failed to update password')
      }
    } catch (err) {
      setError('An error occurred while updating password')
    } finally {
      setIsLoading(false)
    }
  }

  const handleEmailChange = async (e) => {
    e.preventDefault()
    try {
      setIsLoading(true)
      const result = await changeEmail(emailForm)
      if (result.success) {
        setSuccess('Email change verification sent to new email address')
        setShowEmailModal(false)
        setEmailForm({ newEmail: '', password: '' })
        updateUser({ ...user, pendingEmail: emailForm.newEmail })
      } else {
        setError(result.error || 'Failed to initiate email change')
      }
    } catch (err) {
      setError('An error occurred while changing email')
    } finally {
      setIsLoading(false)
    }
  }

  const handlePreferenceChange = async (key, value) => {
    try {
      setIsLoading(true)
      const newPreferences = { ...preferences, [key]: value }
      const result = await updateUserPreferences(newPreferences)
      if (result.success) {
        setPreferences(newPreferences)
        setSuccess('Preferences updated successfully')
        updateUser({ ...user, preferences: newPreferences })
      } else {
        setError(result.error || 'Failed to update preferences')
      }
    } catch (err) {
      setError('An error occurred while updating preferences')
    } finally {
      setIsLoading(false)
    }
  }

  const handleDeleteAccount = async () => {
    try {
      setIsLoading(true)
      const result = await deleteAccount()
      if (result.success) {
        // Handle successful deletion (redirect to logout)
        window.location.href = '/logout'
      } else {
        setError(result.error || 'Failed to delete account')
      }
    } catch (err) {
      setError('An error occurred while deleting account')
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className='min-h-screen py-12 px-4'>
      <div className='max-w-md mx-auto bg-white/90 dark:bg-gray-800/90 backdrop-blur-[2px] p-8 rounded-lg shadow-xl'>
        <h2 className='text-2xl font-bold text-gray-900 dark:text-white mb-6'>
          Account Settings
        </h2>

        {/* Display error message if any */}
        {error && (
          <div className='bg-red-100 dark:bg-red-900/50 border border-red-400 text-red-700 dark:text-red-200 px-4 py-3 rounded mb-4'>
            {error}
          </div>
        )}

        {/* Display success message if any */}
        {success && (
          <div className='bg-green-100 dark:bg-green-900/50 border border-green-400 text-green-700 dark:text-green-200 px-4 py-3 rounded mb-4'>
            {success}
          </div>
        )}

        <div className='space-y-6'>
          {/* Display username */}
          <div>
            <label className='block text-sm font-medium text-gray-700 dark:text-gray-300'>
              Username
            </label>
            <p className='mt-1 text-lg text-gray-900 dark:text-white'>{user?.username}</p>
          </div>

          {/* Display email */}
          <div>
            <label className='block text-sm font-medium text-gray-700 dark:text-gray-300'>
              Email
            </label>
            <p className='mt-1 text-lg text-gray-900 dark:text-white'>{user?.email}</p>
          </div>

          {/* Display account type */}
          <div>
            <label className='block text-sm font-medium text-gray-700 dark:text-gray-300'>
              Account Type
            </label>
            <p className='mt-1 text-lg text-gray-900 dark:text-white'>
              {user?.isAdmin ? 'Administrator' : 'Standard User'}
            </p>
          </div>

          {/* Display member since date */}
          <div>
            <label className='block text-sm font-medium text-gray-700 dark:text-gray-300'>
              Member Since
            </label>
            <p className='mt-1 text-lg text-gray-900 dark:text-white'>
              {user?.createdAt
                ? new Date(user.createdAt).toLocaleString('en-US', {
                    year: 'numeric',
                    month: 'long',
                    day: 'numeric',
                    hour: '2-digit',
                    minute: '2-digit',
                  })
                : 'N/A'}
            </p>
          </div>

          {/* Email Verification Status with improved visibility */}
          <div className='bg-gray-50 dark:bg-gray-700/50 p-4 rounded-lg'>
            <label className='block text-sm font-medium text-gray-700 dark:text-gray-300'>
              Email Verification Status
            </label>
            <div className='mt-2 flex items-center justify-between'>
              <div className='flex items-center space-x-2'>
                <span
                  className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                    user?.emailVerified
                      ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200'
                      : 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200'
                  }`}
                >
                  {user?.emailVerified ? 'Verified' : 'Unverified'}
                </span>
                <span className='text-sm text-gray-600 dark:text-gray-400'>
                  {user?.email}
                </span>
              </div>
              {!user?.emailVerified && (
                <Button
                  onClick={handleVerifyEmail}
                  variant='secondary'
                  size='sm'
                  disabled={isLoading}
                >
                  {isLoading ? 'Sending...' : 'Verify Now'}
                </Button>
              )}
            </div>
          </div>

          {/* Preferences Section */}
          <div className='pt-4 border-t border-gray-200 dark:border-gray-700'>
            <h3 className='text-lg font-medium text-gray-900 dark:text-white mb-4'>
              Preferences
            </h3>

            <div className='space-y-4'>
              {/* Profanity Filter Toggle */}
              <div className='flex items-center justify-between'>
                <span className='text-gray-700 dark:text-gray-300'>Profanity Filter</span>
                <button
                  onClick={() =>
                    handlePreferenceChange(
                      'profanityFilter',
                      !preferences.profanityFilter
                    )
                  }
                  className={`${
                    preferences.profanityFilter
                      ? 'bg-blue-600'
                      : 'bg-gray-200 dark:bg-gray-700'
                  } relative inline-flex h-6 w-11 flex-shrink-0 cursor-pointer rounded-full transition-colors duration-200 ease-in-out`}
                >
                  <span
                    className={`${
                      preferences.profanityFilter ? 'translate-x-6' : 'translate-x-1'
                    } inline-block h-4 w-4 transform rounded-full bg-white transition duration-200 ease-in-out mt-1`}
                  />
                </button>
              </div>

              {/* Email Notifications Toggle */}
              <div className='flex items-center justify-between'>
                <span className='text-gray-700 dark:text-gray-300'>
                  Email Notifications
                </span>
                <button
                  onClick={() =>
                    handlePreferenceChange(
                      'emailNotifications',
                      !preferences.emailNotifications
                    )
                  }
                  className={`${
                    preferences.emailNotifications
                      ? 'bg-blue-600'
                      : 'bg-gray-200 dark:bg-gray-700'
                  } relative inline-flex h-6 w-11 flex-shrink-0 cursor-pointer rounded-full transition-colors duration-200 ease-in-out`}
                >
                  <span
                    className={`${
                      preferences.emailNotifications ? 'translate-x-6' : 'translate-x-1'
                    } inline-block h-4 w-4 transform rounded-full bg-white transition duration-200 ease-in-out mt-1`}
                  />
                </button>
              </div>

              {/* Online Status Toggle */}
              <div className='flex items-center justify-between'>
                <span className='text-gray-700 dark:text-gray-300'>
                  Show Online Status
                </span>
                <button
                  onClick={() =>
                    handlePreferenceChange(
                      'showOnlineStatus',
                      !preferences.showOnlineStatus
                    )
                  }
                  className={`${
                    preferences.showOnlineStatus
                      ? 'bg-blue-600'
                      : 'bg-gray-200 dark:bg-gray-700'
                  } relative inline-flex h-6 w-11 flex-shrink-0 cursor-pointer rounded-full transition-colors duration-200 ease-in-out`}
                >
                  <span
                    className={`${
                      preferences.showOnlineStatus ? 'translate-x-6' : 'translate-x-1'
                    } inline-block h-4 w-4 transform rounded-full bg-white transition duration-200 ease-in-out mt-1`}
                  />
                </button>
              </div>
            </div>
          </div>

          {/* Account Actions */}
          <div className='pt-4 border-t border-gray-200 dark:border-gray-700'>
            <h3 className='text-lg font-medium text-gray-900 dark:text-white mb-4'>
              Account Actions
            </h3>

            <div className='space-y-3'>
              <Button
                onClick={() => setShowPasswordModal(true)}
                variant='dark'
                className='w-full'
                disabled={isLoading}
              >
                Change Password
              </Button>

              <Button
                onClick={() => setShowEmailModal(true)}
                variant='dark'
                className='w-full'
                disabled={isLoading}
              >
                Change Email
              </Button>

              <Button
                onClick={() => setShowDeleteModal(true)}
                variant='danger'
                className='w-full'
                disabled={isLoading}
              >
                Delete Account
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* Password Change Modal */}
      <Modal
        isOpen={showPasswordModal}
        onClose={() => setShowPasswordModal(false)}
        title='Change Password'
      >
        <form
          onSubmit={handlePasswordChange}
          className='space-y-4'
        >
          <div>
            <label className='block text-sm font-medium text-gray-700 dark:text-gray-300'>
              Current Password
            </label>
            <input
              type='password'
              value={passwordForm.currentPassword}
              onChange={(e) =>
                setPasswordForm({ ...passwordForm, currentPassword: e.target.value })
              }
              className='mt-1 block w-full rounded-md border-gray-300 dark:border-gray-600 dark:bg-gray-700 shadow-sm focus:border-blue-500 focus:ring-blue-500'
              required
            />
          </div>

          <div>
            <label className='block text-sm font-medium text-gray-700 dark:text-gray-300'>
              New Password
            </label>
            <input
              type='password'
              value={passwordForm.newPassword}
              onChange={(e) =>
                setPasswordForm({ ...passwordForm, newPassword: e.target.value })
              }
              className='mt-1 block w-full rounded-md border-gray-300 dark:border-gray-600 dark:bg-gray-700 shadow-sm focus:border-blue-500 focus:ring-blue-500'
              required
            />
          </div>

          <div>
            <label className='block text-sm font-medium text-gray-700 dark:text-gray-300'>
              Confirm New Password
            </label>
            <input
              type='password'
              value={passwordForm.confirmPassword}
              onChange={(e) =>
                setPasswordForm({ ...passwordForm, confirmPassword: e.target.value })
              }
              className='mt-1 block w-full rounded-md border-gray-300 dark:border-gray-600 dark:bg-gray-700 shadow-sm focus:border-blue-500 focus:ring-blue-500'
              required
            />
          </div>

          <div className='flex justify-end space-x-3'>
            <Button
              type='button'
              variant='secondary'
              onClick={() => setShowPasswordModal(false)}
            >
              Cancel
            </Button>
            <Button
              type='submit'
              variant='primary'
              disabled={isLoading}
            >
              Update Password
            </Button>
          </div>
        </form>
      </Modal>

      {/* Email Change Modal */}
      <Modal
        isOpen={showEmailModal}
        onClose={() => setShowEmailModal(false)}
        title='Change Email'
      >
        <form
          onSubmit={handleEmailChange}
          className='space-y-4'
        >
          <div>
            <label className='block text-sm font-medium text-gray-700 dark:text-gray-300'>
              New Email Address
            </label>
            <input
              type='email'
              value={emailForm.newEmail}
              onChange={(e) => setEmailForm({ ...emailForm, newEmail: e.target.value })}
              className='mt-1 block w-full rounded-md border-gray-300 dark:border-gray-600 dark:bg-gray-700 shadow-sm focus:border-blue-500 focus:ring-blue-500'
              required
            />
          </div>

          <div>
            <label className='block text-sm font-medium text-gray-700 dark:text-gray-300'>
              Current Password
            </label>
            <input
              type='password'
              value={emailForm.password}
              onChange={(e) => setEmailForm({ ...emailForm, password: e.target.value })}
              className='mt-1 block w-full rounded-md border-gray-300 dark:border-gray-600 dark:bg-gray-700 shadow-sm focus:border-blue-500 focus:ring-blue-500'
              required
            />
          </div>

          <div className='flex justify-end space-x-3'>
            <Button
              type='button'
              variant='secondary'
              onClick={() => setShowEmailModal(false)}
            >
              Cancel
            </Button>
            <Button
              type='submit'
              variant='primary'
              disabled={isLoading}
            >
              Update Email
            </Button>
          </div>
        </form>
      </Modal>

      {/* Delete Account Modal */}
      <Modal
        isOpen={showDeleteModal}
        onClose={() => setShowDeleteModal(false)}
        title='Delete Account'
      >
        <div className='space-y-4'>
          <p className='text-red-600 dark:text-red-400'>
            Warning: This action cannot be undone. All your data will be permanently
            deleted.
          </p>

          <div className='flex justify-end space-x-3'>
            <Button
              type='button'
              variant='secondary'
              onClick={() => setShowDeleteModal(false)}
            >
              Cancel
            </Button>
            <Button
              type='button'
              variant='danger'
              onClick={handleDeleteAccount}
              disabled={isLoading}
            >
              Delete Account
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  )
}

export default AccountSettings
