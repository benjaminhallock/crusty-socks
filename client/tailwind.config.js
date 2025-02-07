/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{jsx,js}"
  ],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        primary: {
          DEFAULT: '#4f46e5',
          dark: '#4338ca'
        }
      },
      spacing: {
        '18': '4.5rem',
        '112': '28rem',
        '128': '32rem'
      }
    }
  },
  plugins: [],
  future: {
    hoverOnlyWhenSupported: true
  }
}
