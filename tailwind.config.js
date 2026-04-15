/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        primary: "#6d28d9", // Ungu
        softBlue: "#eff6ff",
      },
    },
  },
  plugins: [],
}
