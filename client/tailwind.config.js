/** @type {import('tailwindcss').Config} */
export default {
  darkMode: 'class',
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        darkBg: '#1a1b26',         // Tokyo Night background
        darkSurface: '#16161e',    // Darker card surface
        neonCyan: '#7aa2f7',       // Tokyo Night blue (accent)
        neonTeal: '#7dcfff',       // Tokyo Night cyan (secondary accent)
        textHeader: '#c0caf5',     // Tokyo Night foreground
        textMuted: '#a9b1d6',      // Tokyo Night foreground dark
        darkBorder: '#292e42',     // Border / highlight
        darkHover: '#24283b',      // Hover surface
        darkInput: '#14151c',      // Input backgrounds
      },
      fontFamily: {
        mono: ['JetBrains Mono', 'Fira Code', 'monospace'],
      },
    },
  },
  plugins: [],
}
