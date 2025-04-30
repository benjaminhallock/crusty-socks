import { cva } from 'class-variance-authority'
import { cn } from '../../../utils/tailwind-utils'

const buttonVariants = cva(
  // Base styles applied to all buttons
  'rounded-md font-medium transition-all relative overflow-hidden group disabled:opacity-50 disabled:cursor-not-allowed inline-flex items-center justify-center leading-none',
  {
    variants: {
      variant: {
        nav: 'text-sm flex items-center gap-2 px-2.5 py-1.5 bg-purple-100 hover:bg-purple-200 dark:bg-purple-500/10 dark:hover:bg-purple-500/20 backdrop-blur-sm text-purple-700 dark:text-purple-300 transition-all duration-200 shadow-sm hover:shadow border border-purple-200 dark:border-purple-200/10',
        primary:
          'bg-gradient-to-r from-purple-500 to-indigo-500 dark:from-purple-600 dark:to-indigo-600 opacity-90 backdrop-blur-md text-white hover:opacity-100 hover:from-purple-600 hover:to-indigo-600 dark:hover:from-purple-600 dark:hover:to-indigo-700 before:absolute before:inset-0 before:translate-x-[-200%] hover:before:translate-x-[200%] before:transition-transform before:duration-[800ms] before:bg-gradient-to-r before:from-transparent before:via-white/20 before:to-transparent shadow-[0_0_15px_rgba(139,92,246,0.5)] hover:shadow-[0_0_20px_rgba(139,92,246,0.7)]',
        secondary:
          'bg-gradient-to-r from-purple-500 to-indigo-500 dark:from-purple-700 dark:to-indigo-800 opacity-90 backdrop-blur-md text-white hover:opacity-100 hover:from-purple-400 hover:to-indigo-400 dark:hover:from-purple-600 dark:hover:to-indigo-700 before:absolute before:inset-0 before:translate-x-[-200%] hover:before:translate-x-[200%] before:transition-transform before:duration-[800ms] before:bg-gradient-to-r before:from-transparent before:via-white/20 before:to-transparent',
        outline:
          'border-2 border-purple-500 text-purple-600 hover:bg-purple-50 dark:border-purple-400 dark:text-purple-400 dark:hover:bg-purple-900/30 before:absolute before:inset-0 before:translate-x-[-200%] hover:before:translate-x-[200%] before:transition-transform before:duration-[800ms] before:bg-gradient-to-r before:from-transparent before:via-white/20 before:to-transparent',
        ghost:
          'text-purple-600 hover:bg-purple-50 dark:text-purple-400 dark:hover:bg-purple-900/30 before:absolute before:inset-0 before:translate-x-[-200%] hover:before:translate-x-[200%] before:transition-transform before:duration-[800ms] before:bg-gradient-to-r before:from-transparent before:via-white/20 before:to-transparent',
        danger:
          'bg-gradient-to-r from-red-500 to-red-400 dark:from-red-600 dark:to-red-500 opacity-90 backdrop-blur-md text-white hover:opacity-100 hover:from-red-600 hover:to-red-500 before:absolute before:inset-0 before:translate-x-[-200%] hover:before:translate-x-[200%] before:transition-transform before:duration-[800ms] before:bg-gradient-to-r before:from-transparent before:via-white/20 before:to-transparent',
      },
      size: {
        xs: 'h-6 px-2 text-xs gap-1',
        sm: 'h-8 px-3 text-sm gap-1.5',
        md: 'h-10 px-4 text-base gap-2',
        lg: 'h-12 px-6 text-lg gap-2.5',
        xl: 'h-14 px-8 text-xl gap-3',
        pic: 'h-8 w-10 rounded-lg',
      },
      fullWidth: {
        true: 'w-full',
      },
    },
    defaultVariants: {
      variant: 'primary',
      size: 'md',
      fullWidth: false,
    },
  },
)

const Button = ({
  children,
  variant = 'primary',
  size = 'md',
  fullWidth = false,
  disabled = false,
  type = 'button',
  onClick,
  className,
  ...props
}) => {
  return (
    <button
      type={type}
      onClick={onClick}
      disabled={disabled}
      className={cn(
        buttonVariants({ variant, size, fullWidth }),
        'disabled:before:hidden',
        disabled && 'bg-gray-400 dark:bg-gray-600 cursor-not-allowed bg-none',
        className,
      )}
      {...props}>
      <span className='relative z-10 flex items-center gap-1.5 leading-none'>{children}</span>
    </button>
  )
}

export default Button
