import path from 'node:path';
import { fileURLToPath } from 'node:url';

const here = path.dirname(fileURLToPath(import.meta.url));

/**
 * Content globs are absolute for the same reason the PostCSS config names this
 * file explicitly: Tailwind resolves relative globs against process.cwd(), and
 * the dev server now runs from `backend/`. Relative globs would match nothing
 * there and every class would be purged out of the stylesheet.
 */
const content = [
  path.join(here, 'app/**/*.{js,jsx}'),
  path.join(here, 'src/**/*.{js,jsx}'),
];

/** @type {import('tailwindcss').Config} */

/**
 * Design tokens: "chalkboard and bill of materials".
 *
 * The product is build guides for classrooms that have a blackboard and not much
 * else, so the palette comes from that room rather than from a generic SaaS
 * emerald-on-white. Deep board green is used as a *field* — large panels — with
 * chalk-white paper between them, and exactly one accent.
 */
export default {
  content,
  theme: {
    extend: {
      colors: {
        /**
         * The blackboard. These are surface colours, meant to be used as large
         * fields (hero, footer, callouts) with chalk text on them — not as
         * button fills. Buttons use the `brand` scale, which is tuned for
         * contrast against white text.
         */
        board: {
          DEFAULT: '#10362a',
          deep: '#0a2119', // footer, overlays, the darker end of a panel
          line: '#1d4c3c', // hairlines and dividers drawn on a board field
        },

        /**
         * Primary action colour. Anchored so that brand-600 with white text
         * clears 4.5:1, and brand-50/brand-800 clear it as a badge pairing.
         */
        brand: {
          50: '#e9f5ef',
          100: '#cfe9dc',
          200: '#a2d4bd',
          300: '#6dba9a',
          400: '#3f9d78',
          500: '#1a855e',
          600: '#0e7a54', // primary action — 5.3:1 with white text
          700: '#0b6244', // hover
          800: '#094c35', // active, and badge text on brand-50
          900: '#073827',
        },

        /**
         * Neutrals are greened rather than blue-grey. Slate next to board green
         * reads as a second, competing hue; these sit under it.
         */
        // Ratios below are measured against `surface.sunken`, the page
        // background, which is the worst case for every one of them.
        ink: {
          DEFAULT: '#0c1a14', // 16.3:1
          muted: '#4a5b52', // 6.6:1
          subtle: '#5f6f66', // 4.8:1 — the lightest text allowed anywhere
        },

        surface: {
          DEFAULT: '#ffffff',
          sunken: '#f2f5f1', // chalk: off-white with a green cast, not cream
          raised: '#ffffff',
          line: '#dfe6e0', // the default border, greened to match
        },

        /**
         * The single accent, spent on ratings, the chalk underline, and free /
         * highlighted items. Deliberately not used for status — status has its
         * own semantic colours so the two never get confused.
         */
        marigold: {
          DEFAULT: '#e9a23b',
          soft: '#fdf3e2',
          deep: '#8a5a12', // text weight — 5.1:1 on marigold-soft
        },
      },

      /**
       * The families come from next/font via CSS variables set on <html>, so
       * the faces are self-hosted and versioned with the build rather than
       * fetched from Google at runtime.
       */
      fontFamily: {
        // Headlines only. Restraint is what keeps it characterful.
        display: ['var(--font-display)', 'ui-sans-serif', 'system-ui', 'sans-serif'],
        sans: ['var(--font-sans)', 'ui-sans-serif', 'system-ui', 'sans-serif'],
        // Build data: costs, quantities, durations, class levels.
        mono: ['var(--font-mono)', 'ui-monospace', 'SFMono-Regular', 'monospace'],
      },

      borderRadius: {
        card: '0.875rem',
      },

      boxShadow: {
        card: '0 1px 2px rgba(12, 26, 20, 0.05), 0 1px 3px rgba(12, 26, 20, 0.04)',
        'card-hover': '0 12px 28px -8px rgba(12, 26, 20, 0.16), 0 4px 10px -4px rgba(12, 26, 20, 0.08)',
        panel: 'inset 0 1px 0 rgba(255, 255, 255, 0.06)',
      },

      backgroundImage: {
        /**
         * The workbench grid. Drawn once here so every surface that wants it
         * gets identical spacing rather than a hand-rolled repeating-gradient.
         */
        grid: `linear-gradient(to right, rgba(12, 26, 20, 0.045) 1px, transparent 1px),
               linear-gradient(to bottom, rgba(12, 26, 20, 0.045) 1px, transparent 1px)`,
        'grid-chalk': `linear-gradient(to right, rgba(255, 255, 255, 0.05) 1px, transparent 1px),
                       linear-gradient(to bottom, rgba(255, 255, 255, 0.05) 1px, transparent 1px)`,
      },
      backgroundSize: {
        // Named `grid-cell`, not `grid`: backgroundImage and backgroundSize both
        // generate `bg-{key}`, so reusing the key would make one silently
        // overwrite the other.
        'grid-cell': '26px 26px',
      },

      keyframes: {
        'fade-in': {
          from: { opacity: '0', transform: 'translateY(6px)' },
          to: { opacity: '1', transform: 'translateY(0)' },
        },
        // The hero's one orchestrated moment: lines settle in sequence.
        'rise-in': {
          from: { opacity: '0', transform: 'translateY(14px)' },
          to: { opacity: '1', transform: 'translateY(0)' },
        },
        // The marigold underline draws itself, once, under the headline.
        'draw-underline': {
          from: { transform: 'scaleX(0)' },
          to: { transform: 'scaleX(1)' },
        },
        shimmer: {
          '100%': { transform: 'translateX(100%)' },
        },
      },
      animation: {
        'fade-in': 'fade-in 0.35s ease-out both',
        'rise-in': 'rise-in 0.55s cubic-bezier(0.16, 0.84, 0.44, 1) both',
        'draw-underline': 'draw-underline 0.7s cubic-bezier(0.16, 0.84, 0.44, 1) 0.45s both',
        shimmer: 'shimmer 1.6s infinite',
      },
    },
  },
  plugins: [],
};
