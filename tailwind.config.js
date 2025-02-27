/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    backgroundColor: theme => ({
      ...theme('colors'),
      'primary': '#3a8276',
      'secondary': '#ffed4a',
      'popup': '#e3342f',
    }),
    extend: {},
  },
  plugins: [],
}