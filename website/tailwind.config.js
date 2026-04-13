/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        void: '#09090B',
        panel: '#18181B',
        divide: '#27272A',
        steel: '#71717A',
        chalk: '#FAFAF9',
        softread: '#A8A29E',
        amber: {
          500: '#F59E0B',
          600: '#D97706',
          700: '#B45309',
        },
      },
      fontFamily: {
        display: ['"Cabinet Grotesk"', 'system-ui', 'sans-serif'],
        body: ['Satoshi', 'system-ui', 'sans-serif'],
        mono: ['"JetBrains Mono"', 'monospace'],
      },
      animation: {
        'fade-up': 'fadeUp 0.7s cubic-bezier(0.22, 1, 0.36, 1) forwards',
        'pulse-amber': 'pulseAmber 3s ease-in-out infinite',
      },
      keyframes: {
        fadeUp: {
          '0%': { opacity: '0', transform: 'translateY(20px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        pulseAmber: {
          '0%, 100%': { boxShadow: '0 0 0 0 rgba(217, 119, 6, 0)' },
          '50%': { boxShadow: '0 0 20px 4px rgba(217, 119, 6, 0.12)' },
        },
      },
    },
  },
  plugins: [],
}
