/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        firefly: {
          DEFAULT: '#FABA29',
          light: '#FFD666',
          dark: '#E5A820',
        },
        ocean: {
          DEFAULT: '#46B19D',
          light: '#6FDBCF',
          dark: '#3A9B8A',
        },
        forest: {
          DEFAULT: '#1D3234',
          light: '#2A4A4D',
        }
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
        display: ['Poppins', 'sans-serif'],
      },
      animation: {
        'glow': 'glow 2s ease-in-out infinite',
        'float': 'float 6s ease-in-out infinite',
        'pulse-glow': 'pulse-glow 2s ease-in-out infinite',
      },
      keyframes: {
        glow: {
          '0%, 100%': {
            filter: 'drop-shadow(0 0 5px #FABA29)',
            transform: 'scale(1)',
          },
          '50%': {
            filter: 'drop-shadow(0 0 20px #FABA29)',
            transform: 'scale(1.05)',
          },
        },
        float: {
          '0%, 100%': {
            transform: 'translateY(0) translateX(0)',
            opacity: '0',
          },
          '10%': { opacity: '1' },
          '90%': { opacity: '1' },
          '100%': {
            transform: 'translateY(-100vh) translateX(50px)',
            opacity: '0',
          },
        },
        'pulse-glow': {
          '0%, 100%': {
            boxShadow: '0 0 20px rgba(250, 186, 41, 0.8)',
          },
          '50%': {
            boxShadow: '0 0 30px rgba(250, 186, 41, 1)',
          },
        },
      },
    },
  },
  plugins: [],
}
