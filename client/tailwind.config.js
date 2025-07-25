/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        'base': '#f8f9fa',
        'accent': '#4ecdc4',
      }
    },
  },
  plugins: [],
}
