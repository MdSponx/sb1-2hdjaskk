/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      fontFamily: {
        ibm: ['IBM Plex Sans Thai', 'sans-serif'],
      },
      colors: {
        'brand-navy': '#1A2B5E',
        'brand-navy-light': '#2A3B6E',
        'brand-cream': '#FFF5EB',
        'brand-violet': '#5A4BFF',
        'brand-violet-light': '#7A6BFF',
      },
    },
  },
  plugins: [],
};