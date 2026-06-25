/** @type {import('tailwindcss').Config} */
module.exports = {
  darkMode: 'class',
  content: [
    "./src/**/*.{js,jsx,ts,tsx}",
    "./index.html"
  ],
  theme: {
    extend: {
      colors: {
        cyber: {
          bg: '#050505',
          bgSecondary: '#0F0F0F',
          card: '#171717',
          sidebar: '#101010',
          navbar: '#0D0D0D',
          border: '#2B2B2B',
          redPrimary: '#DC2626',
          redSecondary: '#EF4444',
          redHover: '#F87171',
          textPrimary: '#FFFFFF',
          textSecondary: '#B3B3B3',
          textMuted: '#808080',
          success: '#22C55E',
          warning: '#F59E0B',
          error: '#DC2626',
        }
      },
      fontFamily: {
        sans: ['Inter', 'sans-serif'],
      },
      animation: {
        'pulse-slow': 'pulse 3s cubic-bezier(0.4, 0, 0.6, 1) infinite',
      }
    },
  },
  plugins: [],
}
