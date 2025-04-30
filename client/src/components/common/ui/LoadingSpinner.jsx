// LoadingSpinner component provides a consistent loading animation
const LoadingSpinner = () => {
  return (
    <div className='flex items-center justify-center'>
      <div className='animate-spin rounded-full h-12 w-12 border-b-2 border-gray-900 dark:border-white'></div>
    </div>
  )
}

export default LoadingSpinner
