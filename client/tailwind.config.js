/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{vue,js,ts,jsx,tsx}"],
  darkMode: 'class', // Enable dark mode with class strategy
  theme: {
    extend: {
      animation: {
        'pulse': 'pulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite',
        'fadeIn': 'fadeIn 0.3s ease-in',
        'slideIn': 'slideIn 0.5s ease-out',
        'bounce-in': 'bounceIn 0.6s ease-out',
        'typing': 'typing 1.4s infinite',
        'glow-pulse': 'glow 2s ease-in-out infinite, pulse 2s infinite',
      },
      keyframes: {
        fadeIn: {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        },
        slideIn: {
          '0%': { transform: 'translateY(-10px)', opacity: '0' },
          '100%': { transform: 'translateY(0)', opacity: '1' },
        },
        bounceIn: {
          '0%': { transform: 'scale(0.3)', opacity: '0' },
          '50%': { transform: 'scale(1.05)' },
          '70%': { transform: 'scale(0.9)' },
          '100%': { transform: 'scale(1)', opacity: '1' },
        },
        typing: {
          '0%': { transform: 'translateY(0px)' },
          '28%': { transform: 'translateY(-5px)' },
          '44%': { transform: 'translateY(0px)' },
        },
        glow: {
          '0%, 100%': { 
            'box-shadow': '0 0 8px 2px rgba(129, 140, 248, 0.6)',
          },
          '50%': { 
            'box-shadow': '0 0 16px 4px rgba(129, 140, 248, 0.8)',
          },
        },
      },
    },
  },
  plugins: [],
};
