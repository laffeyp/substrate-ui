// SPDX-License-Identifier: PolyForm-Noncommercial-1.0.0
// Copyright (C) 2026 Peter Laffey
// The two Vite plugins the dc-runtime page needed, as vite.config.ts held them until sprint 329 (plan
// PLAN-2026-11-04-shell-to-react-r5.md, E4): inlineDcScript bundled reveal_component.ts into the
// template's script tag for dc-runtime to evaluate; includePartials inlined web/partials/ into the
// template. vendorReact (sprint 199) served React's UMD files for dc-runtime's window.React until
// sprint 331. Kept for the record; nothing imports this file.
import { type Plugin } from "vite";
import { resolve } from "path";
import { buildSync } from "esbuild";
import { readFileSync } from "fs";
import { createHash } from "crypto";
const __dirname = resolve(".");

export // Sprint 058: dc-runtime consumes the reveal shell's class body via
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

// The 2026-10-11 audit: reveal.html's template language has no include, so blocks the app
// shows more than once (the input bar in two views; the GUIDANCE / LENGTH / TONE lines) were
// copies. `<!-- include partials/<file>.html key=value ... -->` inlines web/partials/<file>.html,
// replacing each `%key%` with its value. A missing file or an unfilled `%key%` fails the build.
export function includePartials(): Plugin {
  const marker = /<!-- include (\S+)((?: [A-Za-z]+=\S+)*) -->/g;
  return {
    name: "substrate-include-partials",
    transformIndexHtml: {
      order: "pre",
      handler(html, ctx) {
        if (!ctx.filename.endsWith("reveal.html")) return html;
        return html.replace(marker, (_match, file: string, rawParams: string) => {
          let text = readFileSync(resolve(__dirname, "web", file), "utf8").replace(/^<!--[\s\S]*?-->\n/, "");
          for (const pair of rawParams.trim().split(/\s+/).filter(Boolean)) {
            const [key, value] = pair.split("=");
            text = text.split(`%${key}%`).join(value);
          }
          const unfilled = text.match(/%[A-Za-z]+%/);
          if (unfilled) throw new Error(`includePartials: ${file} has an unfilled ${unfilled[0]}`);
          return text.replace(/\n$/, "");
        });
      },
    },
  };
}


// Sprint 199: React and ReactDOM load from the app's own server, not cdnjs (lens findings F320, F345).
// The two UMD files are copied from node_modules into the build as vendor/<file>, served from
// node_modules under the dev server, and every `./vendor/` script tag gets a sha384 integrity hash
// of the file it names. dc-runtime (support.js) still reads window.React, so these stay classic
// scripts until the shell no longer runs on dc-runtime.
const VENDOR: Record<string, string> = {
  "react.production.min.js": resolve(__dirname, "node_modules/react/umd/react.production.min.js"),
  "react-dom.production.min.js": resolve(__dirname, "node_modules/react-dom/umd/react-dom.production.min.js"),
};
export function vendorReact(): Plugin {
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

