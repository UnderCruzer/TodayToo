/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './app/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        primary: {
          50: '#EEEDFE',
          100: '#D5D3FD',
          500: '#7F77DD',
          600: '#6A62C8',
          700: '#5550B3',
        },
      },
      fontFamily: {
        serif: ['Georgia', 'Noto Serif JP', 'serif'],
      },
    },
  },
  plugins: [],
};
