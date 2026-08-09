/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ["./App.{js,jsx,ts,tsx}", "./src/**/*.{js,jsx,ts,tsx}"],
  presets: [require("nativewind/preset")],
  theme: {
    extend: {
      colors: {
        brand: {
          green: {
            DEFAULT: '#10b981', // emerald-500
            light: '#d1fae5',
            dark: '#065f46',
          },
          orange: {
            DEFAULT: '#f97316', // orange-500
            light: '#ffedd5',
            dark: '#7c2d12',
          },
          red: {
            DEFAULT: '#ef4444', // red-500
            light: '#fee2e2',
            dark: '#7f1d1d',
          },
          darkBg: '#0f172a', // slate-900
          darkCard: '#1e293b', // slate-800
        }
      }
    },
  },
  plugins: [],
}
