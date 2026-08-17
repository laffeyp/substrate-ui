import { defineConfig } from "vite";
import { resolve } from "path";

// Substrate-ui build config. The Python server (substrate-ui/server.py) serves the built
// output from web/dist/ under the same origin, so /api/* calls resolve without proxying.
// Two entry points: index.html (the console) and studio.html (the Studio authoring surface).
export default defineConfig({
  root: "web",
  build: {
    target: "es2020",
    outDir: "dist",
    emptyOutDir: true,
    rollupOptions: {
      input: {
        main: resolve(__dirname, "web/index.html"),
        studio: resolve(__dirname, "web/studio.html"),
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
