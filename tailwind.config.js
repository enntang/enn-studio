/** @type {import('tailwindcss').Config} */
export default {
  content: [
    './index.html',
    './src/**/*.{js,jsx}',
  ],
  theme: {
    extend: {
      fontFamily: {
        serif: ['Georgia', 'Times', '"Noto Serif TC"', 'serif'],
      },
    },
  },
  plugins: [],
}
