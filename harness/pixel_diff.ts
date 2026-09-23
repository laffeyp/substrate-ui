// Sprint 070 — pixel diff harness.
//
// Runs the same drive as pixel_baseline.ts, but instead of writing new
// baseline PNGs, compares each capture against the on-disk baseline
// using pixelmatch. Reports one line per state × viewport, plus a
// summary. Exits non-zero if any capture exceeds a 0.1% pixel-diff
// threshold.
//
// Run: `npm run pixel:diff`

import { chromium } from "playwright";
import { ServerHandle } from "./shakeout/lib/server";
import { readFileSync, writeFileSync, mkdirSync, existsSync } from "node:fs";
import { resolve } from "node:path";
import pixelmatch from "pixelmatch";
import { PNG } from "pngjs";

// Reuse the state drivers from pixel_baseline. The two files share
// intent; we import the states array so the drive logic stays in
// one place. Each state carries its own tolerance — see the type in
// pixel_baseline_states.ts.
import { STATES, VIEWPORTS, CAPTURES_DIR } from "./pixel_baseline_states";

const DIFF_DIR = "captures/pixel-diff-latest";

async function main(): Promise<void> {
  mkdirSync(resolve(process.cwd(), DIFF_DIR), { recursive: true });
  const server = new ServerHandle();
  (globalThis as any).__pixelBaselineServer = server;
  await server.start();
  await server.waitHealthy(10_000);
  const browser = await chromium.launch({ channel: "chrome", headless: true });
  const failures: string[] = [];
  let checked = 0;
  try {
    for (const state of STATES) {
      for (const vp of VIEWPORTS) {
        const baselinePath = `${CAPTURES_DIR}/${state.name}-${vp.name}.png`;
        if (!existsSync(baselinePath)) {
          failures.push(`missing baseline: ${baselinePath}`);
          continue;
        }
        const context = await browser.newContext({
          viewport: { width: vp.width, height: vp.height },
          deviceScaleFactor: 2,
        });
        const page = await context.newPage();
        page.on("pageerror", (err) => console.error(`[pixel-diff] page error ${state.name}/${vp.name}:`, err.message));
        try {
          await state.drive(page);
          const currentBuffer = await page.screenshot();
          const current = PNG.sync.read(currentBuffer);
          const baseline = PNG.sync.read(readFileSync(baselinePath));
          if (current.width !== baseline.width || current.height !== baseline.height) {
            failures.push(`size mismatch ${state.name}/${vp.name}: baseline ${baseline.width}×${baseline.height}, current ${current.width}×${current.height}`);
            continue;
          }
          const diff = new PNG({ width: current.width, height: current.height });
          const mismatched = pixelmatch(
            baseline.data, current.data, diff.data,
            current.width, current.height,
            { threshold: 0.1 },
          );
          const total = current.width * current.height;
          const fraction = mismatched / total;
          const tolerance = state.tolerance;
          const pass = fraction <= tolerance;
          console.log(`[pixel-diff] ${state.name}/${vp.name}: ${mismatched}/${total} = ${(fraction * 100).toFixed(3)}% (tol ${(tolerance * 100).toFixed(3)}%) ${pass ? "OK" : "FAIL"}`);
          if (!pass) {
            const diffPath = `${DIFF_DIR}/${state.name}-${vp.name}.png`;
            writeFileSync(diffPath, PNG.sync.write(diff));
            failures.push(`${state.name}/${vp.name}: ${(fraction * 100).toFixed(3)}% > ${(tolerance * 100).toFixed(3)}% (diff at ${diffPath})`);
          }
          checked++;
        } finally {
          await context.close().catch(() => undefined);
        }
      }
    }
    if (failures.length === 0) {
      console.log(`[pixel-diff] ${checked}/${checked} match baseline`);
    } else {
      console.log(`[pixel-diff] ${failures.length} failure(s):`);
      for (const line of failures) console.log("  - " + line);
    }
  } finally {
    await browser.close().catch(() => undefined);
    await server.stop().catch(() => undefined);
  }
  process.exit(failures.length === 0 ? 0 : 1);
}

main().catch((err) => { console.error(err); process.exit(1); });
