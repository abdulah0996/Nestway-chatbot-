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
          deepNavy: '#071A33',    // Primary Deep Navy
          dark: '#071A33',
          navy: '#071A33',
          navyGradEnd: '#0F3B73', // Background Gradient End
          royal: '#2563EB',       // Royal Blue
          blue: '#2563EB',
          electric: '#3B82F6',    // Electric Blue
          blueLight: '#3B82F6',
          gold: '#F59E0B',        // Accent Gold
          goldLight: '#FEF3C7',
          surface: '#F8FAFC',
          card: '#FFFFFF',
          border: '#E5E7EB'
        },
        whatsapp: {
          green: '#25D366',
          darkGreen: '#128C7E',
          deep: '#075E54',
          teal: '#054740',
          lightGreen: '#DCF8C6'
        }
      },
      fontFamily: {
        sans: ['"Plus Jakarta Sans"', 'Inter', 'ui-sans-serif', 'system-ui', '-apple-system', 'BlinkMacSystemFont', 'Segoe UI', 'Roboto', 'sans-serif'],
        display: ['"Plus Jakarta Sans"', 'Inter', 'sans-serif'],
        mono: ['ui-monospace', 'SFMono-Regular', 'Menlo', 'Monaco', 'Consolas', 'monospace']
      },
      boxShadow: {
        'glass': '0 20px 40px rgba(0, 0, 0, 0.25)',
        'glass-hover': '0 25px 50px rgba(37, 99, 235, 0.25)',
        'glow-blue': '0 0 25px rgba(59, 130, 246, 0.4)',
        'glow-green': '0 0 25px rgba(37, 211, 102, 0.4)',
        'glow-gold': '0 0 25px rgba(245, 158, 11, 0.35)',
        'card': '0 1px 3px 0 rgba(7, 26, 51, 0.05)',
        'card-hover': '0 12px 30px -5px rgba(7, 26, 51, 0.12)'
      }
    },
  },
  plugins: [],
}
