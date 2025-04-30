const Error = ({ error }) => {
  return (
    <div className='min-h-screen grid place-items-center p-4 bg-gray-50 dark:bg-gray-900'>
      <div className='w-full max-w-md p-6 bg-white dark:bg-gray-800 rounded-xl shadow-lg text-center'>
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
        <p className='text-gray-700 dark:text-gray-300 mb-4'>Error: {error}</p>
        <button
          onClick={() => window.location.reload()}
          className='bg-gradient-to-r from-indigo-500 to-purple-600 text-white px-6 py-2 rounded-lg hover:from-indigo-600 hover:to-purple-700 transition-all duration-200 shadow-md hover:shadow-lg'>
          Try Again
        </button>
      </div>
    </div>
  )
}
export default Error
