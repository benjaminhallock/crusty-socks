import { useState } from 'react'

const AccountSettings = ({ user, updateUser }) => {
	const [error, setError] = useState('')
	const [success, setSuccess] = useState('')

	return (
		<div className='min-h-screen py-12 px-4'>
			<div className='max-w-md mx-auto bg-white/90 dark:bg-gray-800/90 backdrop-blur-[2px] p-8 rounded-lg shadow-xl'>
				<h2 className='text-2xl font-bold text-gray-900 dark:text-white mb-6'>Account Settings</h2>

				{error && (
					<div className='bg-red-100 dark:bg-red-900/50 border border-red-400 text-red-700 dark:text-red-200 px-4 py-3 rounded mb-4'>
						{error}
					</div>
				)}

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
				</div>
			</div>
		</div>
	)
}

export default AccountSettings
