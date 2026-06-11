/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./src/**/*.{js,jsx,ts,tsx}",
    "./public/index.html"
  ],
  theme: {
    extend: {
      fontFamily: {
        spartan: ['"League Spartan"', 'sans-serif'],
      },
      maxWidth: {
        // Fills large-phone viewports (e.g. Pro Max) while keeping md+ breakpoints unchanged
        'mobile-shell': 'min(100%, 430px)',
      },
      screens: {
        'md': '768px',
      },
    },
  },
  plugins: [],
}

