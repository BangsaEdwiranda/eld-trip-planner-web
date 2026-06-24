/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        // Brand: a confident logistics blue/teal
        brand: {
          50: '#eef6ff',
          100: '#d9eaff',
          200: '#bcd9ff',
          300: '#8ec0ff',
          400: '#599cff',
          500: '#3477f5',
          600: '#1f57e0',
          700: '#1b44b8',
          800: '#1c3b94',
          900: '#1d3675',
          950: '#152247',
        },
        // Duty-status palette — shared by map, timeline, and ELD grid
        duty: {
          off: '#64748b', // slate-500  — Off Duty
          sb: '#7c3aed',  // violet-600 — Sleeper Berth
          d: '#059669',   // emerald-600 — Driving
          on: '#ea580c',  // orange-600 — On Duty (not driving)
        },
        // Warm paper tone for the log sheet
        paper: '#fbfaf5',
        ink: '#1c2433',
      },
      fontFamily: {
        sans: ['"Inter"', 'system-ui', '-apple-system', 'Segoe UI', 'sans-serif'],
        mono: ['"JetBrains Mono"', 'ui-monospace', 'SFMono-Regular', 'Menlo', 'monospace'],
      },
      boxShadow: {
        card: '0 1px 2px rgba(16,24,40,0.04), 0 4px 16px rgba(16,24,40,0.06)',
      },
    },
  },
  plugins: [],
}
