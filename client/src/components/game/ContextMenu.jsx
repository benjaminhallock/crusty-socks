import { useEffect, useRef } from 'react';

// ContextMenu component renders a context menu at a specific position
// It supports options with click handlers, destructive actions, and disabled states
const ContextMenu = ({ x, y, onClose, options, children }) => {
  const menuRef = useRef(null); // Reference to the menu element

  // Close the menu if the user clicks outside of it
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (menuRef.current && !menuRef.current.contains(event.target)) {
        onClose();
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [onClose]);

  return (
    <div
      ref={menuRef} // Attach the ref to the menu element
      className="fixed bg-white dark:bg-gray-800 shadow-lg rounded-lg py-1 z-50"
      style={{ top: y, left: x }} // Position the menu based on x and y props
    >
      {/* If options are provided, render them as buttons */}
      {options && Array.isArray(options) && options.map((option, index) => (
        <button
          key={index} // Unique key for each option
          onClick={() => {
            option.onClick(); // Call the option's click handler
            onClose(); // Close the menu after an option is clicked
          }}
          className={`w-full px-4 py-2 text-left hover:bg-gray-100 dark:hover:bg-gray-700
            ${option.isDestructive ? 'text-red-600 dark:text-red-400' : 'text-gray-700 dark:text-gray-300'}
            ${option.disabled ? 'opacity-50 cursor-not-allowed' : ''}
            ${option.hidden ? 'hidden' : ''}
          `}
          disabled={option.disabled} // Disable the button if the option is disabled
        >
          {option.label} {/* Display the option's label */}
        </button>
      ))}
      
      {/* Support for custom children (used in PlayerList.jsx) */}
      {children}
    </div>
  );
};

export default ContextMenu;
