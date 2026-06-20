/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        brand: {
          50: '#f5f7ff',
          100: '#ebf0ff',
          200: '#d6e0ff',
          300: '#b3c7ff',
          400: '#85a3ff',
          500: '#5c7aff',
          600: '#4255f2',
          700: '#3440db',
          800: '#2b33b2',
          900: '#272f8e',
          950: '#1b1e54',
        }
      }
    },
  },
  plugins: [],
}
