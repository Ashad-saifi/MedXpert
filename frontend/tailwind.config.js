/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx,css}",
  ],
  theme: {
    extend: {
      colors: {
        primary: {
          DEFAULT: '#0f766e',
          light: '#14b8a6',
          dark: '#0d9488',
        },
        accent: {
          DEFAULT: '#f97316',
          light: '#fed7aa',
        }
      }
    },
  },
  plugins: [],
}
