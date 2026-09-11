import { build, context } from "esbuild";
import { fileURLToPath } from "node:url";
import { dirname, resolve } from "node:path";

const __dirname = dirname(fileURLToPath(import.meta.url));
const watch = process.argv.includes("--watch");

const opts = {
  entryPoints: [resolve(__dirname, "src/render/App.tsx")],
  bundle: true,
  format: "iife",
  globalName: "SubstrateShell",
  outfile: resolve(__dirname, "app/build.js"),
  platform: "browser",
  target: ["chrome124"],
  jsx: "automatic",
  jsxDev: false,
  sourcemap: "inline",
  loader: {".ts": "ts", ".tsx": "tsx"},
  logLevel: "info",
  define: {"process.env.NODE_ENV": '"development"'},
};

if (watch) {
  const ctx = await context(opts);
  await ctx.watch();
  console.log("[esbuild] watching src/**");
} else {
  await build(opts);
  console.log("[esbuild] built app/build.js");
}
