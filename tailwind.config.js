/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './app/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}',
    './lib/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        darkBg: '#131314',        // Gemini / ChatGPT deep dark main canvas
        darkSidebar: '#1e1f20',   // Gemini dark sidebar background
        darkSurface: '#212121',   // Dark card & message surface
        darkBubble: '#2f2f2f',    // ChatGPT user prompt bubble
        darkInput: '#1e1e1e',     // Neutral rounded input field
        darkBorder: '#2e2f31',    // Subtle neutral border
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
        mono: ['JetBrains Mono', 'Fira Code', 'monospace'],
      },
    },
  },
  plugins: [],
}
