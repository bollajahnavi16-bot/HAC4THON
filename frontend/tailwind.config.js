/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        // Enterprise surface palette
        surface: {
          base:    '#090C12',   // App background
          nav:     '#0D1119',   // Sidebar / top nav
          panel:   '#111827',   // Primary panels / cards
          raised:  '#151D2B',   // Elevated panels / dropdowns
          overlay: '#1A2332',   // Modal overlays
        },
        border: {
          DEFAULT: '#1E2D42',   // Standard border
          subtle:  '#162030',   // Very subtle separator
          strong:  '#263244',   // Emphasized border
          focus:   '#3B82F6',   // Keyboard focus ring
        },
        // Text scale
        ink: {
          primary:   '#E8EDF5', // Primary text
          secondary: '#96A3B8', // Secondary text
          muted:     '#6F7F95', // Muted / placeholder
          disabled:  '#4B5970', // Disabled elements
          inverse:   '#090C12', // Text on bright backgrounds
        },
        // Brand blue (restrained, not neon)
        brand: {
          DEFAULT:  '#3B82F6',
          subtle:   '#1D3A6B',
          dim:      '#172D55',
          text:     '#93C5FD',
        },
        // Status semantics
        ok:     { DEFAULT: '#10B981', dim: '#0A3D2B', text: '#6EE7B7' },
        warn:   { DEFAULT: '#F59E0B', dim: '#3D2E07', text: '#FCD34D' },
        danger: { DEFAULT: '#EF4444', dim: '#3D1212', text: '#FCA5A5' },
        info:   { DEFAULT: '#3B82F6', dim: '#1D3A6B', text: '#93C5FD' },
        // Legacy compatibility (keep existing pages working)
        navy: {
          950: '#070C18',
          900: '#0B132B',
          850: '#0F1A36',
          800: '#152244',
          700: '#1C2E59',
          600: '#273E75',
        },
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', '-apple-system', 'sans-serif'],
        mono: ['JetBrains Mono', 'Fira Code', 'ui-monospace', 'monospace'],
      },
      fontSize: {
        '2xs': ['0.65rem', { lineHeight: '1rem' }],
      },
      boxShadow: {
        // Semantic shadow scale
        'card':        '0 1px 3px rgba(0,0,0,0.4), 0 4px 16px rgba(0,0,0,0.3)',
        'card-hover':  '0 2px 8px rgba(0,0,0,0.5), 0 8px 24px rgba(0,0,0,0.4)',
        'panel':       'inset 0 1px 0 rgba(255,255,255,0.04)',
        'focus-ring':  '0 0 0 2px #3B82F6',
        // Legacy
        'glow-cyan':   '0 0 16px -4px rgba(59, 130, 246, 0.3)',
        'glow-violet': '0 0 16px -4px rgba(139, 92, 246, 0.25)',
        'glow-card':   '0 8px 30px rgba(0,0,0,0.5), inset 0 1px 0 rgba(255,255,255,0.04)',
      },
      animation: {
        'pulse-slow':  'pulse 3s cubic-bezier(0.4, 0, 0.6, 1) infinite',
        'fade-in':     'fadeIn 0.15s ease-out',
        'slide-up':    'slideUp 0.2s ease-out',
      },
      keyframes: {
        fadeIn:  { '0%': { opacity: '0' }, '100%': { opacity: '1' } },
        slideUp: { '0%': { opacity: '0', transform: 'translateY(6px)' }, '100%': { opacity: '1', transform: 'translateY(0)' } },
      },
    },
  },
  plugins: [],
}
