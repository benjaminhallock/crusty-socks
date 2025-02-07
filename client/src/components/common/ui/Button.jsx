const Button = ({ 
  children, 
  variant = 'primary', 
  fullWidth = false,
  disabled = false,
  type = 'button',
  onClick
}) => {
  const baseStyles = 'px-6 py-3 rounded-lg transition-colors disabled:opacity-50';
  const variants = {
    primary: 'bg-indigo-600 hover:bg-indigo-700 text-white',
    secondary: 'bg-gray-600 hover:bg-gray-700 text-white',
    text: 'text-indigo-600 hover:text-indigo-500'
  };

  return (
    <button
      type={type}
      onClick={onClick}
      disabled={disabled}
      className={`${baseStyles} ${variants[variant]} ${fullWidth ? 'w-full' : ''}`}
    >
      {children}
    </button>
  );
};

export default Button;