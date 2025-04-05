// Button component is a reusable UI element with customizable styles and behavior
const Button = ({ 
  children, // Content inside the button (e.g., text or icons)
  variant = 'primary', // Style variant of the button (e.g., primary, secondary, light, dark)
  fullWidth = false, // Whether the button should take the full width of its container
  disabled = false, // Whether the button is disabled
  type = 'button', // Button type (e.g., button, submit, reset)
  onClick, // Function to handle button clicks
  className // Additional custom classes for styling
}) => {
  // Base styles applied to all buttons
  const baseStyles = 'px-4 py-2 rounded-lg transition-colors disabled:opacity-50';
  // Update style variants for light and dark modes
  const variants = {
    primary: 'bg-purple-500 hover:bg-purple-400 text-white dark:bg-gray-700 dark:hover:bg-gray-800',
    secondary: 'bg-gray-600 hover:bg-purple-400 text-white dark:bg-gray-700 dark:hover:bg-gray-800',
    light: 'bg-purple-500 hover:bg-purple-400 text-white dark:bg-gray-700 dark:hover:bg-gray-800',
    dark: 'bg-gray-700 hover:bg-purple-400 text-white dark:bg-purple-500 dark:hover:bg-gray-800',
  };

  return (
    <button
      type={type} // Set the button type
      onClick={onClick} // Attach the click handler
      disabled={disabled} // Disable the button if needed
      className={`${baseStyles} ${variants[variant]} ${fullWidth ? 'w-full' : ''} ${className || ''}`} // Combine styles
    >
      {children}
    </button>
  );
};

export default Button;