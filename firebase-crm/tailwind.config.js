/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        primary: {
          DEFAULT: '#46B19D',
          hover: '#3b9a8a',
          light: '#e8f7f4',
        },
        accent: {
          DEFAULT: '#faba29',
          hover: '#e0a825',
          light: '#fef6e6',
        },
        danger: {
          DEFAULT: '#EF4444',
          hover: '#DC2626',
          light: '#FEE2E2',
        },
        success: {
          DEFAULT: '#10B981',
          hover: '#059669',
          light: '#D1FAE5',
        },
        warning: {
          DEFAULT: '#F59E0B',
          hover: '#D97706',
          light: '#FEF3C7',
        },
      },
      animation: {
        'fade-in': 'fadeIn 0.5s ease-in-out',
        'slide-in': 'slideIn 0.3s ease-out',
        'scale-in': 'scaleIn 0.2s ease-out',
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
        scaleIn: {
          '0%': { transform: 'scale(0.95)', opacity: '0' },
          '100%': { transform: 'scale(1)', opacity: '1' },
        },
      },
    },
  },
  plugins: [],
}
