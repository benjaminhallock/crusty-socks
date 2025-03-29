const Button = ({ 
  children, 
  variant = 'primary', 
  fullWidth = false,
  disabled = false,
  type = 'button',
  onClick,
  className
}) => {
  const baseStyles = 'px-4 py-2 rounded-lg transition-colors disabled:opacity-50';
  const variants = {
    primary: 'bg-indigo-600 dark:bg-indigo-500 hover:bg-indigo-700 dark:hover:bg-indigo-600 text-white',
    secondary: 'bg-gray-600 dark:bg-gray-500 hover:bg-gray-700 dark:hover:bg-gray-600 text-white',
    light: 'bg-white/70 text-gray-700 hover:bg-white/90 dark:bg-gray-800/30 dark:text-gray-300 dark:hover:bg-gray-700/40',
    dark: 'bg-gray-800 text-white hover:bg-gray-700 dark:bg-purple-700 dark:hover:bg-purple-600',
  };

  return (
    <button
      type={type}
      onClick={onClick}
      disabled={disabled}
      className={`${baseStyles} ${variants[variant]} ${fullWidth ? 'w-full' : ''} ${className || ''}`}
    >
      {children}
    </button>
  );
};

export default Button;