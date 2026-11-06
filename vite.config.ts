// SPDX-License-Identifier: PolyForm-Noncommercial-1.0.0
// Copyright (C) 2026 Peter Laffey
import { defineConfig } from "vite";
import { resolve } from "path";

// Substrate-ui build config. Phase 6 closed 2026-09-22: the reveal shell
// is the only entry. The classic shell (index.html) and the Studio
// (studio.html) moved to `_deprecated/classic-tree/`; their source is
// intact and re-instatable, but not built. The Python server serves the
// built output from web/dist/ under the same origin so /api/* calls
// resolve without proxying.

// Sprint 331 (plan row E5, F321): React and ReactDOM are bundled from node_modules as modules. The
// vendored UMD copies and the plugin that served them (sprint 199) are in
// _deprecated/dc-runtime/vite-plugins.ts.

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
    port: 5173,
    proxy: {
      "/api": "http://127.0.0.1:8765",
    },
  },
});
