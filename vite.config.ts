// SPDX-License-Identifier: PolyForm-Noncommercial-1.0.0
// Copyright (C) 2026 Peter Laffey
import { defineConfig, type Plugin } from "vite";
import { resolve } from "path";
import { readFileSync } from "fs";
import { createHash } from "crypto";

// Substrate-ui build config. Phase 6 closed 2026-09-22: the reveal shell
// is the only entry. The classic shell (index.html) and the Studio
// (studio.html) moved to `_deprecated/classic-tree/`; their source is
// intact and re-instatable, but not built. The Python server serves the
// built output from web/dist/ under the same origin so /api/* calls
// resolve without proxying.

// Sprint 199: React and ReactDOM load from the app's own server, not cdnjs (lens findings F320, F345).
// The two UMD files are copied from node_modules into the build as vendor/<file>, served from
// node_modules under the dev server, and every `./vendor/` script tag gets a sha384 integrity hash
// of the file it names. dc-runtime (support.js) still reads window.React, so these stay classic
// scripts until the shell no longer runs on dc-runtime.
const VENDOR: Record<string, string> = {
  "react.production.min.js": resolve(__dirname, "node_modules/react/umd/react.production.min.js"),
  "react-dom.production.min.js": resolve(__dirname, "node_modules/react-dom/umd/react-dom.production.min.js"),
};
function vendorReact(): Plugin {
  const integrity = (file: string) => "sha384-" + createHash("sha384").update(readFileSync(VENDOR[file])).digest("base64");
  return {
    name: "substrate-vendor-react",
    configureServer(server) {
      server.middlewares.use((req, res, next) => {
        const m = (req.url || "").match(/^\/vendor\/([^?]+)/);
        if (!m || !VENDOR[m[1]]) return next();
        res.setHeader("Content-Type", "text/javascript");
        res.end(readFileSync(VENDOR[m[1]]));
      });
    },
    transformIndexHtml: {
      order: "pre",
      handler(html, ctx) {
        if (!ctx.filename.endsWith("reveal.html")) return html;
        return html.replace(/<script src="\.\/vendor\/([^"]+)"><\/script>/g, (match, file: string) => {
          if (!VENDOR[file]) throw new Error(`vendorReact: no vendored file ${file}`);
          return `<script src="./vendor/${file}" integrity="${integrity(file)}"></script>`;
        });
      },
    },
    generateBundle() {
      for (const [file, path] of Object.entries(VENDOR)) {
        this.emitFile({ type: "asset", fileName: `vendor/${file}`, source: readFileSync(path) });
      }
    },
  };
}

export default defineConfig({
  root: "web",
  plugins: [vendorReact()],
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
