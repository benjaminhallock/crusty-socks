import React, { useEffect, useRef } from 'react';

const ContextMenu = ({ x, y, onClose, options }) => {
  const menuRef = useRef(null);

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
      ref={menuRef}
      className="fixed bg-white dark:bg-gray-800 shadow-lg rounded-lg py-1 z-50"
      style={{ top: y, left: x }}
    >
      {options.map((option, index) => (
        <button
          key={index}
          onClick={() => {
            option.onClick();
            onClose();
          }}
          className={`w-full px-4 py-2 text-left hover:bg-gray-100 dark:hover:bg-gray-700
            ${option.isDestructive ? 'text-red-600 dark:text-red-400' : 'text-gray-700 dark:text-gray-300'}
            ${option.disabled ? 'opacity-50 cursor-not-allowed' : ''}
          `}
          disabled={option.disabled}
        >
          {option.label}
        </button>
      ))}
    </div>
  );
};

export default ContextMenu;
