/** @type {import('tailwindcss').Config} */
const colors = require('tailwindcss/colors');

module.exports = {
  content: [
    "./src/**/*.{js,jsx,ts,tsx}",
    "./public/index.html"
  ],
  theme: {
    extend: {
      colors: {
        // Brand color — single source of truth.
        // Currently mirrors Tailwind's orange palette.
        // To rebrand the entire app, change this one alias.
        primary: colors.orange,
      },
      fontFamily: {
        spartan: ['"League Spartan"', 'sans-serif'],
      },
      screens: {
        'md': '768px',
      },
    },
  },
  plugins: [],
}
