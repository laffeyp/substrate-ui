// SPDX-License-Identifier: PolyForm-Noncommercial-1.0.0
// Copyright (C) 2026 Peter Laffey
// Pixel comparison for the move off dc-runtime (sprint 194; plan PLAN-2026-11-04-shell-to-react-r4.md, "Gates").
//
// Compares every PNG in captures/pixel/<baseline>/ with the file of the same name in
// captures/pixel/<candidate>/. A file fails when it is missing, when its size differs, or when any
// pixel differs (pixelmatch, threshold 0.1, anti-aliased pixels ignored). Two clean launches differ by
// 0 pixels, so no share of differing pixels is allowed: at 0.1%, a 60x60 block changed in a
// 2880x1800 capture passed (sprint 194). Each failing file's diff image goes to
// captures/pixel/<candidate>/diff/. Exit 0 when every file passes.
//
// Usage: npx tsx harness/pixel/diff.ts <baseline> <candidate>

import pixelmatch from "pixelmatch";
import { existsSync, mkdirSync, readFileSync, readdirSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { decodePng, encodePng } from "./png";

const REPO_ROOT = join(__dirname, "..", "..");
const THRESHOLD = 0.1;

function main(): void {
  const [baseline, candidate] = process.argv.slice(2);
  if (!baseline || !candidate) throw new Error("usage: npx tsx harness/pixel/diff.ts <baseline> <candidate>");
  const a = join(REPO_ROOT, "captures", "pixel", baseline);
  const b = join(REPO_ROOT, "captures", "pixel", candidate);
  const names = readdirSync(a).filter((f) => f.endsWith(".png")).sort();
  if (!names.length) throw new Error(`no PNG files in ${a}`);
  const extra = readdirSync(b).filter((f) => f.endsWith(".png") && !names.includes(f));
  const failed: string[] = [];
  for (const name of names) {
    const there = join(b, name);
    if (!existsSync(there)) { failed.push(name); console.log(`FAIL ${name}: missing from ${candidate}`); continue; }
    const x = decodePng(readFileSync(join(a, name)));
    const y = decodePng(readFileSync(there));
    if (x.width !== y.width || x.height !== y.height) {
      failed.push(name);
      console.log(`FAIL ${name}: ${x.width}x${x.height} in ${baseline}, ${y.width}x${y.height} in ${candidate}`);
      continue;
    }
    const out = new Uint8Array(x.width * x.height * 4);
    const differing = pixelmatch(x.data, y.data, out, x.width, x.height, { threshold: THRESHOLD });
    const share = differing / (x.width * x.height);
    if (differing > 0) {
      failed.push(name);
      mkdirSync(join(b, "diff"), { recursive: true });
      writeFileSync(join(b, "diff", name), encodePng(x.width, x.height, out));
      console.log(`FAIL ${name}: ${differing} pixels differ (${(share * 100).toFixed(3)}%); diff image in ${candidate}/diff/`);
    } else {
      console.log(`ok   ${name}: ${differing} pixels differ`);
    }
  }
  for (const name of extra) console.log(`note ${name}: in ${candidate} only`);
  console.log(`[pixel] ${names.length - failed.length} of ${names.length} pass`);
  process.exit(failed.length ? 1 : 0);
}

main();
