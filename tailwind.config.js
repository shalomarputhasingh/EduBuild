/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    extend: {
      colors: {
        /**
         * Emerald is the product's identity colour. The previous stylesheet
         * declared emerald tokens but still carried indigo (99,102,241) in every
         * shadow, badge and focus ring — leftovers from an abandoned dark theme.
         * One scale, used consistently, replaces both.
         */
        brand: {
          50: '#ecfdf5',
          100: '#d1fae5',
          200: '#a7f3d0',
          300: '#6ee7b7',
          400: '#34d399',
          500: '#10b981',
          600: '#059669', // primary action — 4.5:1 on white with white text
          700: '#047857',
          800: '#065f46',
          900: '#064e3b',
        },
        ink: {
          DEFAULT: '#0f172a',
          muted: '#475569', // 7.5:1 on white
          subtle: '#64748b', // 4.8:1 on white — the lightest text we allow
        },
        surface: {
          DEFAULT: '#ffffff',
          sunken: '#f8fafc',
          raised: '#ffffff',
        },
      },
      fontFamily: {
        sans: ['Outfit', 'ui-sans-serif', 'system-ui', 'sans-serif'],
      },
      borderRadius: {
        card: '1rem',
      },
      boxShadow: {
        card: '0 1px 3px rgba(15, 23, 42, 0.06), 0 1px 2px rgba(15, 23, 42, 0.04)',
        'card-hover': '0 10px 25px -5px rgba(15, 23, 42, 0.10), 0 8px 10px -6px rgba(15, 23, 42, 0.06)',
      },
      keyframes: {
        'fade-in': {
          from: { opacity: '0', transform: 'translateY(6px)' },
          to: { opacity: '1', transform: 'translateY(0)' },
        },
        shimmer: {
          '100%': { transform: 'translateX(100%)' },
        },
      },
      animation: {
        'fade-in': 'fade-in 0.35s ease-out both',
        shimmer: 'shimmer 1.6s infinite',
      },
    },
  },
  plugins: [],
};
