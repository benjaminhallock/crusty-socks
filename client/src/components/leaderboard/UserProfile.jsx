import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { Transition } from '@headlessui/react'

import LoadingSpinner from '../common/ui/LoadingSpinner'
import { fetchUserProfile, updateUserProfile } from '../../services/api'

const UserProfile = ({ currentUser }) => {
	const { username } = useParams()
	const navigate = useNavigate()
	const [profile, setProfile] = useState(null)
	const [isLoading, setIsLoading] = useState(true)
	const [error, setError] = useState(null)
	const [isEditing, setIsEditing] = useState(false)
	const [formData, setFormData] = useState({
		displayName: '',
		bio: '',
		avatarUrl: '',
	})
	const isOwnProfile = currentUser && currentUser.username === username

	useEffect(() => {
		const loadProfile = async () => {
			try {
				setIsLoading(true)
				const response = await fetchUserProfile(username)
				if (response.success && response.profile) {
					setProfile(response.profile)
					setFormData({
						displayName: response.profile.displayName || response.profile.username,
						bio: response.profile.bio || '',
						avatarUrl: response.profile.avatarUrl || '',
					})
				} else {
					throw new Error(response.error || 'Failed to fetch profile data')
				}
			} catch (error) {
				setError(error.message)
			} finally {
				setIsLoading(false)
			}
		}
		loadProfile()
	}, [username])

	const handleInputChange = e => {
		const { name, value } = e.target
		setFormData(prev => ({ ...prev, [name]: value }))
	}

	const handleSubmit = async e => {
		e.preventDefault()
		try {
			const response = await updateUserProfile(username, formData)
			if (response.success) {
				setProfile(prev => ({
					...prev,
					displayName: formData.displayName,
					bio: formData.bio,
					avatarUrl: formData.avatarUrl,
				}))
				setIsEditing(false)
			} else {
				throw new Error(response.error || 'Failed to update profile')
			}
		} catch (error) {
			alert(`Error: ${error.message}`)
		}
	}

	const formatDate = dateString => {
		const date = new Date(dateString)
		return date.toLocaleDateString('en-US', {
			year: 'numeric',
			month: 'long',
			day: 'numeric',
		})
	}

	if (isLoading) {
		return (
			<div className='min-h-screen flex justify-center items-center bg-gradient-to-br from-indigo-500/10 via-purple-500/10 to-pink-500/10 dark:from-indigo-900/10 dark:via-purple-900/10 dark:to-pink-900/10'>
				<div className='text-center'>
					<LoadingSpinner size='large' />
					<p className='mt-4 text-gray-600 dark:text-gray-400 animate-pulse'>Loading profile...</p>
				</div>
			</div>
		)
	}

	if (error) {
		return (
			<div className='min-h-screen flex justify-center items-center bg-gray-50 dark:bg-gray-900 p-4'>
				<div className='max-w-md w-full bg-gray- dark:bg-gray-800 rounded-xl shadow-lg p-6 text-center'>
					<div className='text-red-600 dark:text-red-400 mb-4'>
						<svg
							className='w-12 h-12 mx-auto'
							fill='none'
							stroke='currentColor'
							viewBox='0 0 24 24'>
							<path
								strokeLinecap='round'
								strokeLinejoin='round'
								strokeWidth={2}
								d='M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z'
							/>
						</svg>
					</div>
					<p className='text-gray-700 dark:text-gray-300 mb-4'>{error}</p>
					<button
						onClick={() => navigate(-1)}
						className='bg-gradient-to-r from-indigo-500 to-purple-600 text-white px-6 py-2 rounded-lg hover:from-indigo-600 hover:to-purple-700 transition-all duration-200 shadow-md hover:shadow-lg'>
						Go Back
					</button>
				</div>
			</div>
		)
	}

	if (!profile) return null

	return (
		<Transition
			show={true}
			appear={true}
			enter='transition-all duration-300'
			enterFrom='opacity-0 translate-y-6'
			enterTo='opacity-100 translate-y-0'
			leave='transition-all duration-300'
			leaveFrom='opacity-100'
			leaveTo='opacity-0'>
			<div className='min-h-screen bg-gradient-to-br from-indigo-500/10 via-purple-500/10 to-pink-500/10 dark:from-indigo-900/10 dark:via-purple-900/10 dark:to-pink-900/10 py-12 px-4 sm:px-6 lg:px-8'>
				<div className='max-w-4xl mx-auto'>
					{/* Profile Card */}
					<div className='bg-white dark:bg-gray-800 rounded-2xl shadow-xl overflow-hidden'>
						{/* Profile Header */}
						<div className='relative'>
							{/* Background Pattern */}
              <div className='absolute inset-0 bg-gradient-to-r from-purple-600 to-indigo-600 dark:from-purple-800 dark:to-indigo-900 backdrop-blur-sm'>
              </div>
							<div className='relative px-6 py-8'>
								<div className='flex flex-col sm:flex-row items-center gap-6'>
									{/* Avatar */}
									<div className='relative'>
										<div className='w-32 h-32 rounded-full overflow-hidden bg-white dark:bg-gray-700 shadow-2xl ring-4 ring-white dark:ring-gray-700'>
											{profile.avatarUrl ? (
												<img
													src={profile.avatarUrl}
													alt={profile.displayName}
													className='w-full h-full object-cover'
												/>
											) : (
												<div className='w-full h-full flex items-center justify-center bg-gradient-to-br from-indigo-100 to-purple-100 dark:from-indigo-900 dark:to-purple-900'>
													<span className='text-4xl font-bold text-indigo-600 dark:text-indigo-400'>
														{profile.displayName.charAt(0).toUpperCase()}
													</span>
												</div>
											)}
										</div>
									</div>

									{/* Profile Info */}
									<div className='text-center sm:text-left'>
										<h1 className='text-3xl font-bold text-white mb-2'>{profile.displayName}</h1>
										<p className='text-indigo-100 text-lg mb-4'>@{profile.username}</p>
										{isOwnProfile && (
											<button
												onClick={() => setIsEditing(true)}
												className='inline-flex items-center px-4 py-2 bg-white/10 hover:bg-white/20 text-white rounded-lg transition-colors backdrop-blur-sm'>
												<svg
													className='w-4 h-4 mr-2'
													fill='none'
													stroke='currentColor'
													viewBox='0 0 24 24'>
													<path
														strokeLinecap='round'
														strokeLinejoin='round'
														strokeWidth={2}
														d='M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z'
													/>
												</svg>
												Edit Profile
											</button>
										)}
									</div>
								</div>
							</div>
						</div>

						{/* Profile Content */}
						<div className='p-6'>
							{isEditing ? (
								<form
									onSubmit={handleSubmit}
									className='space-y-6'>
									<div>
										<label className='block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2'>
											Display Name
										</label>
										<input
											type='text'
											name='displayName'
											value={formData.displayName}
											onChange={handleInputChange}
											className='w-full px-4 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-indigo-500 dark:focus:ring-indigo-400 focus:border-transparent transition-shadow'
											required
										/>
									</div>
									<div>
										<label className='block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2'>
											Bio
										</label>
										<textarea
											name='bio'
											value={formData.bio}
											onChange={handleInputChange}
											rows='4'
											className='w-full px-4 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-indigo-500 dark:focus:ring-indigo-400 focus:border-transparent transition-shadow resize-none'></textarea>
									</div>
									<div>
										<label className='block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2'>
											Avatar URL
										</label>
										<input
											type='text'
											name='avatarUrl'
											value={formData.avatarUrl}
											onChange={handleInputChange}
											className='w-full px-4 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-indigo-500 dark:focus:ring-indigo-400 focus:border-transparent transition-shadow'
											placeholder='https://example.com/avatar.jpg'
										/>
									</div>
									<div className='flex gap-4'>
										<button
											type='submit'
											className='flex-1 px-6 py-3 bg-gradient-to-r from-green-500 to-emerald-600 text-white rounded-lg hover:from-green-600 hover:to-emerald-700 transition-all duration-200 shadow-md hover:shadow-lg font-medium'>
											Save Changes
										</button>
										<button
											type='button'
											onClick={() => setIsEditing(false)}
											className='flex-1 px-6 py-3 bg-gradient-to-r from-gray-500 to-gray-600 text-white rounded-lg hover:from-gray-600 hover:to-gray-700 transition-all duration-200 shadow-md hover:shadow-lg font-medium'>
											Cancel
										</button>
									</div>
								</form>
							) : (
								<>
									{/* Bio Section */}
									<div className='mb-8'>
										<h2 className='text-xl font-semibold text-gray-900 dark:text-gray-100 mb-4'>
											About
										</h2>
										<div className='bg-gray-50 dark:bg-gray-700/50 rounded-xl p-6'>
											{profile.bio ? (
												<p className='text-gray-700 dark:text-gray-300'>{profile.bio}</p>
											) : (
												<p className='text-gray-500 dark:text-gray-400 italic'>No bio provided</p>
											)}
										</div>
									</div>

									{/* User Info Grid */}
									<div className='grid grid-cols-1 md:grid-cols-2 gap-4 mb-8'>
										<div className='bg-indigo-50 dark:bg-indigo-900/30 p-4 rounded-xl'>
											<div className='flex items-center'>
												<svg
													className='w-5 h-5 text-indigo-500 dark:text-indigo-400 mr-2'
													fill='none'
													stroke='currentColor'
													viewBox='0 0 24 24'>
													<path
														strokeLinecap='round'
														strokeLinejoin='round'
														strokeWidth={2}
														d='M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z'
													/>
												</svg>
												<span className='text-indigo-900 dark:text-indigo-100 font-medium'>
													Joined
												</span>
											</div>
											<p className='mt-1 text-indigo-600 dark:text-indigo-300'>
												{formatDate(profile.joinedDate)}
											</p>
										</div>
										<div className='bg-purple-50 dark:bg-purple-900/30 p-4 rounded-xl'>
											<div className='flex items-center'>
												<svg
													className='w-5 h-5 text-purple-500 dark:text-purple-400 mr-2'
													fill='none'
													stroke='currentColor'
													viewBox='0 0 24 24'>
													<path
														strokeLinecap='round'
														strokeLinejoin='round'
														strokeWidth={2}
														d='M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z'
													/>
												</svg>
												<span className='text-purple-900 dark:text-purple-100 font-medium'>
													Last Active
												</span>
											</div>
											<p className='mt-1 text-purple-600 dark:text-purple-300'>
												{formatDate(profile.lastActive)}
											</p>
										</div>
									</div>

									{/* Game Stats */}
									<div>
										<h2 className='text-xl font-semibold text-gray-900 dark:text-gray-100 mb-4'>
											Game Statistics
										</h2>
										<div className='grid grid-cols-2 sm:grid-cols-4 gap-4'>
											<div className='bg-gradient-to-br from-pink-50 to-purple-50 dark:from-pink-900/30 dark:to-purple-900/30 rounded-xl p-4 text-center transform transition-transform hover:scale-105'>
												<p className='text-3xl font-bold bg-gradient-to-br from-pink-500 to-purple-500 bg-clip-text text-transparent'>
													{profile.gameStats.totalScore.toLocaleString()}
												</p>
												<p className='text-sm font-medium text-gray-600 dark:text-gray-400 mt-1'>
													Total Score
												</p>
											</div>
											<div className='bg-gradient-to-br from-purple-50 to-indigo-50 dark:from-purple-900/30 dark:to-indigo-900/30 rounded-xl p-4 text-center transform transition-transform hover:scale-105'>
												<p className='text-3xl font-bold bg-gradient-to-br from-purple-500 to-indigo-500 bg-clip-text text-transparent'>
													{profile.gameStats.gamesPlayed}
												</p>
												<p className='text-sm font-medium text-gray-600 dark:text-gray-400 mt-1'>
													Games Played
												</p>
											</div>
											<div className='bg-gradient-to-br from-indigo-50 to-blue-50 dark:from-indigo-900/30 dark:to-blue-900/30 rounded-xl p-4 text-center transform transition-transform hover:scale-105'>
												<p className='text-3xl font-bold bg-gradient-to-br from-indigo-500 to-blue-500 bg-clip-text text-transparent'>
													{profile.gameStats.gamesWon}
												</p>
												<p className='text-sm font-medium text-gray-600 dark:text-gray-400 mt-1'>
													Games Won
												</p>
											</div>
											<div className='bg-gradient-to-br from-blue-50 to-green-50 dark:from-blue-900/30 dark:to-green-900/30 rounded-xl p-4 text-center transform transition-transform hover:scale-105'>
												<p className='text-3xl font-bold bg-gradient-to-br from-blue-500 to-green-500 bg-clip-text text-transparent'>
													{profile.gameStats.gamesPlayed > 0
														? Math.round(
																(profile.gameStats.gamesWon / profile.gameStats.gamesPlayed) * 100,
														  )
														: 0}
													%
												</p>
												<p className='text-sm font-medium text-gray-600 dark:text-gray-400 mt-1'>
													Win Rate
												</p>
											</div>
										</div>
									</div>
								</>
							)}
						</div>
					</div>
				</div>
			</div>
		</Transition>
	)
}

export default UserProfile
