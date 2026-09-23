import { defineConfig, type Plugin } from "vite";
import { resolve } from "path";
import { buildSync } from "esbuild";

// Substrate-ui build config. Phase 6 closed 2026-09-22: the reveal shell
// is the only entry. The classic shell (index.html) and the Studio
// (studio.html) moved to `_deprecated/classic-tree/`; their source is
// intact and re-instatable, but not built. The Python server serves the
// built output from web/dist/ under the same origin so /api/* calls
// resolve without proxying.

// Sprint 058: dc-runtime consumes the reveal shell's class body via
// `<script type="text/x-dc" data-dc-script>` in reveal.html; it reads
// scriptEl.textContent and evaluates the string. To keep the class body
// on disk as reveal_component.ts (typechecked, greppable, refactorable)
// we compile that file with esbuild and inline the resulting JS into
// the script tag at HTML transform time. dev + build both go through
// transformIndexHtml.
function inlineDcScript(): Plugin {
  const componentPath = resolve(__dirname, "web/reveal_component.ts");
  const marker = /<script\s+type="text\/x-dc"\s+data-dc-script[^>]*>[\s\S]*?<\/script>/;
  return {
    name: "substrate-inline-dc-script",
    transformIndexHtml: {
      order: "pre",
      handler(html, ctx) {
        if (!ctx.filename.endsWith("reveal.html")) return html;
        // esbuild bundles reveal_component.ts's ES imports (kinds.ts,
        // future demo-data extraction, etc.) into one script body.
        // `format: "iife"` wraps in an outer function — strip it so
        // `class Component extends DCLogic` lands at top level for
        // dc-runtime's evaluator.
        const result = buildSync({
          entryPoints: [componentPath],
          bundle: true,
          write: false,
          format: "iife",
          target: "es2020",
          logLevel: "silent",
        });
        const code = result.outputFiles[0].text;
        // Peel esbuild's IIFE wrapper. Two shapes seen:
        //   `"use strict";\n(() => { ... })();`
        //   `(function () { "use strict"; ... })();`
        // In both, `class Component extends DCLogic { ... }` sits at
        // depth 1 inside the wrapper; dc-runtime needs it at top
        // level.
        const bare = code
          .replace(/^\s*"use strict";\s*/, "")
          .replace(/^\(\s*\(\)\s*=>\s*\{\s*/, "")
          .replace(/^\(\s*function\s*\(\s*\)\s*\{\s*(?:"use strict";\s*)?/, "")
          .replace(/\}\s*\)\s*\(\s*\)\s*;?\s*$/, "");
        return html.replace(marker, (match) => {
          const openMatch = match.match(/^<script[^>]*>/)![0];
          return openMatch + "\n" + bare + "\n</script>";
        });
      },
    },
  };
}

export default defineConfig({
  root: "web",
  plugins: [inlineDcScript()],
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
