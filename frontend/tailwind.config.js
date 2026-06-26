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
        background: '#050505',
        secondary: '#0F0F0F',
        card: '#171717',
        sidebar: '#0D0D0D',
        navigation: '#111111',
        border: '#262626',
        primaryText: '#FFFFFF',
        secondaryText: '#A3A3A3',
        mutedText: '#737373',
        accentRed: '#DC2626',
        accentRedHover: '#EF4444',
        success: '#22C55E',
        warning: '#F59E0B',
        error: '#DC2626',
        cyber: {
          bg: '#050505',
          bgSecondary: '#0F0F0F',
          card: '#171717',
          sidebar: '#0D0D0D',
          navbar: '#111111',
          border: '#262626',
          redPrimary: '#DC2626',
          redSecondary: '#EF4444',
          redHover: '#EF4444',
          textPrimary: '#FFFFFF',
          textSecondary: '#A3A3A3',
          textMuted: '#737373',
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
