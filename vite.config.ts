import { defineConfig } from "vite";
import { resolve } from "path";

// Substrate-ui build config. Phase 6 closed 2026-09-22: the reveal shell
// is the only entry. The classic shell (index.html) and the Studio
// (studio.html) moved to `_deprecated/classic-tree/`; their source is
// intact and re-instatable, but not built. The Python server serves the
// built output from web/dist/ under the same origin so /api/* calls
// resolve without proxying.
export default defineConfig({
  root: "web",
  build: {
    target: "es2020",
    outDir: "dist",
    emptyOutDir: true,
    rollupOptions: {
      input: {
        reveal: resolve(__dirname, "web/reveal.html"),
      },
    },
  },
  server: {
    // For npm run dev: proxy /api/* to the Python server so HMR works alongside the real backend.
    port: 5173,
    proxy: {
      "/api": "http://127.0.0.1:8765",
    },
  },
});
