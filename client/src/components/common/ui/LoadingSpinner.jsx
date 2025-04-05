// LoadingSpinner component provides a consistent loading animation
const LoadingSpinner = ({ size = 'h-12 w-12', color = 'border-indigo-500' }) => {
  return (
    <div className={`animate-spin rounded-full ${size} border-t-2 border-b-2 ${color}`}></div>
  );
};

export default LoadingSpinner;