/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ["./app/**/*.{ts,tsx}", "./components/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        brand: {
          50: "#eef4fb",
          100: "#d9e6f5",
          600: "#1d4e89",
          700: "#173e6e",
          800: "#122f54",
        },
      },
    },
  },
  plugins: [],
};
