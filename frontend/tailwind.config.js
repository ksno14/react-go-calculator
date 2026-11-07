/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        calc: {
          bg: "#0f172a",
          card: "#1e293b",
          screen: "#090d16",
          btn: "#334155",
          btnHover: "#475569",
          op: "#f59e0b",
          opHover: "#d97706",
          accent: "#3b82f6",
          accentHover: "#2563eb",
          danger: "#ef4444",
          dangerHover: "#dc2626"
        }
      }
    },
  },
  plugins: [],
}
