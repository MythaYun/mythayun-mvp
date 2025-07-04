/** @type {import('tailwindcss').Config} */
module.exports = {
  darkMode: 'class',
  content: [
    './app/**/*.{js,ts,jsx,tsx,mdx}',
    './pages/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      animation: {
        fadeIn: 'fadeIn 0.3s ease-out forwards',
        slideUp: 'slideUp 0.3s ease-out forwards',
      },
    },
  },
  plugins: [
    require('@tailwindcss/forms'),
  ],
}