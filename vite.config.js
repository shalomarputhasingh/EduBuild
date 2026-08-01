import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],

  server: {
    port: 5173,
    // Bound to localhost. Do not add `host: true` without understanding that it
    // exposes the dev server, and everything it proxies, on the local network.
    proxy: {
      '/api': {
        target: 'http://localhost:5000',
        changeOrigin: true,
      },
    },
  },

  build: {
    // The TensorFlow chunk alone is legitimately over the default 500kB warning
    // threshold. Raising it keeps the warning meaningful for everything else.
    chunkSizeWarningLimit: 900,
    rollupOptions: {
      output: {
        /**
         * Heavy, optional dependencies get their own chunks so they are fetched
         * only by the routes that use them:
         *
         *  - tensorflow: ~4MB, only on /scanner, and only after "Start scanner"
         *  - pdf:        only when a teacher downloads a guide
         *  - maps:       only on a project detail page with a store locator
         *  - markdown:   only in the AI assistant
         */
        manualChunks(id) {
          // Only TensorFlow is pinned to a chunk. jsPDF and react-markdown are
          // already reached exclusively through dynamic import() / lazy routes,
          // and naming them here created a static edge from the entry chunk —
          // which preloaded 500kB on every page visit, the opposite of the goal.
          if (id.includes('node_modules') && id.includes('@tensorflow')) return 'tensorflow';
          return undefined;
        },
      },
    },
  },
});
