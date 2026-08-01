import path from 'node:path';
import { fileURLToPath } from 'node:url';

const here = path.dirname(fileURLToPath(import.meta.url));

/**
 * Tailwind is given an absolute path to its config rather than being left to
 * find one.
 *
 * With no `config` key, Tailwind resolves tailwind.config.js relative to
 * process.cwd(). That was the repository root while Vite ran the dev server,
 * but the dev server now runs inside the Express process started from
 * `backend/`, where there is no Tailwind config — so it silently fell back to
 * an empty `content` array and every custom token (`bg-surface-sunken`,
 * `font-display`, `text-marigold`) stopped existing.
 *
 * Anchoring to this file's own directory makes the build independent of where
 * the process was started from.
 */
export default {
  plugins: {
    tailwindcss: { config: path.join(here, 'tailwind.config.js') },
    autoprefixer: {},
  },
};
