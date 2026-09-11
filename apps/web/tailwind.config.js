/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        brand: {
          50: '#EEF2FF',
          100: '#E0E7FF',
          500: '#6366F1',
          600: '#4F46E5',
          700: '#4338CA',
        },
        surface: {
          card: '#FFFFFF',
          bg: '#F8FAFC',
          border: '#E2E8F0',
        },
        priority: {
          p1: '#EF4444', // Red / Must Win
          p2: '#F59E0B', // Amber / High
          p3: '#3B82F6', // Blue / Medium
          p4: '#6B7280', // Gray / Low
        }
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', '-apple-system', 'BlinkMacSystemFont', 'Segoe UI', 'Roboto', 'sans-serif'],
        mono: ['JetBrains Mono', 'Fira Code', 'monospace'],
      },
    },
  },
  plugins: [],
};
