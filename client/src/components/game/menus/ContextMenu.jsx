import { useEffect, useRef } from 'react'
import { FaUser, FaFlag, FaSignOutAlt, FaBan } from 'react-icons/fa'

// ContextMenu component renders a context menu at a specific position
// It supports options with click handlers, destructive actions, and disabled states
const ContextMenu = ({ x, y, onClose, options, children }) => {
  const menuRef = useRef(null) // Reference to the menu element

  // Close the menu if the user clicks outside of it
  useEffect(() => {
    const handleClickOutside = event => {
      if (menuRef.current && !menuRef.current.contains(event.target)) {
        onClose()
      }
    }

    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [onClose])

  useEffect(() => {
    // Adjust menu position to stay within viewport bounds
    if (menuRef.current) {
      const menu = menuRef.current
      const rect = menu.getBoundingClientRect()
      const viewportHeight = window.innerHeight
      const viewportWidth = window.innerWidth

      // Check if menu goes beyond viewport bounds
      if (rect.right > viewportWidth) {
        menu.style.left = `${viewportWidth - rect.width - 10}px`
      }
      if (rect.bottom > viewportHeight) {
        menu.style.top = `${viewportHeight - rect.height - 10}px`
      }
    }
  }, [x, y])

  return (
    <div
      ref={menuRef}
      className='fixed bg-white dark:bg-gray-800 shadow-lg rounded-lg py-1 z-50'
      style={{
        top: Math.max(y - window.scrollY, 10),
        left: Math.max(x - window.scrollX, 10),
      }}>
      {/* If options are provided, render them as buttons */}
      {options &&
        Array.isArray(options) &&
        options.map((option, index) => (
          <button
            key={index} // Unique key for each option
            onClick={() => {
              option.onClick() // Call the option's click handler
              onClose() // Close the menu after an option is clicked
            }}
            className={`w-full px-4 py-2 text-left hover:bg-gray-100 dark:hover:bg-gray-700 flex items-center gap-2
            ${
              option.isDestructive
                ? 'text-red-600 dark:text-red-400'
                : 'text-gray-700 dark:text-gray-300'
            }
            ${option.disabled ? 'opacity-50 cursor-not-allowed' : ''}
            ${option.hidden ? 'hidden' : ''}
          `}
            disabled={option.disabled}>
            {/* Icon based on the option label */}
            <span className='w-4 h-4 flex-shrink-0'>
              {option.label === 'View Profile' && <FaUser />}
              {option.label === 'Report Player' && <FaFlag />}
              {option.label === 'Leave Game' && <FaSignOutAlt />}
              {option.label === 'Kick Player' && <FaBan />}
            </span>
            {option.label}
          </button>
        ))}

      {/* Support for custom children (used in PlayerList.jsx) */}
      {children}
    </div>
  )
}

export default ContextMenu
