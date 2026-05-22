/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        'smartroom-blue': '#4F59E3',
        'smartroom-dark': '#1A1D5C',
        'neo-yellow': '#FFE600',
        'neo-pink': '#FF66B2',
      },
      fontFamily: {
        heading: ['Figtree', 'sans-serif'],
        body: ['Roboto', 'sans-serif'],
      },
      boxShadow: {
        'neo': '4px 4px 0px 0px #1A1D5C',
        'neo-sm': '2px 2px 0px 0px #1A1D5C',
        'neo-lg': '8px 8px 0px 0px #1A1D5C',
      },
      borderWidth: {
        '3': '3px',
      }
    },
  },
  plugins: [],
}
